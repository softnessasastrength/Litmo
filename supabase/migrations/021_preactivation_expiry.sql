-- Chapter 4 pre-activation expiry (ADR 0023).
-- After a session leaves `requested` into mutual review (accepted /
-- consent_pending / ready), participants have 24 hours from the first
-- entry into accepted or consent_pending (else session.created_at) to
-- reach active or a terminal state. Same check-on-read/write pattern as
-- ADR 0018 — no cron. Active sessions are not auto-expired here.

create or replace function public.preactivation_deadline(p_session_id uuid)
returns timestamptz
language sql
stable
set search_path = ''
as $$
  select coalesce(
    (
      select min(e.created_at)
      from public.session_events as e
      where e.session_id = p_session_id
        and e.resulting_state in ('accepted', 'consent_pending')
    ),
    (select s.created_at from public.sessions as s where s.id = p_session_id)
  ) + interval '24 hours'
$$;

revoke all on function public.preactivation_deadline(uuid) from public, anon;
grant execute on function public.preactivation_deadline(uuid) to authenticated;

comment on function public.preactivation_deadline(uuid) is
  'Returns the pre-activation review deadline: 24 hours after the first accepted or consent_pending event, else 24 hours after session creation.';

-- Return type gains expires_at; CREATE OR REPLACE cannot change OUT columns.
drop function if exists public.list_open_sessions();

create or replace function public.list_open_sessions()
returns table (
  id uuid,
  counterpart_id uuid,
  status text,
  started_at timestamptz,
  created_at timestamptz,
  expires_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_id uuid := auth.uid();
  r record;
begin
  if v_actor_id is null then
    raise exception using
      errcode = '42501',
      message = 'authentication required';
  end if;

  for r in
    select s.id, s.status
      from public.sessions as s
     where v_actor_id in (s.user_a, s.user_b)
       and s.status in ('accepted', 'consent_pending', 'ready')
       and public.preactivation_deadline(s.id) <= now()
     for update of s
  loop
    update public.sessions
       set status = 'expired'
     where public.sessions.id = r.id;

    insert into public.session_events (
      session_id,
      actor_id,
      event_type,
      prior_state,
      resulting_state,
      metadata
    ) values (
      r.id,
      null,
      'session_transition',
      r.status,
      'expired',
      '{"source":"api","trigger":"system_expiration"}'::jsonb
    );
  end loop;

  return query
  select
    s.id,
    case
      when s.user_a = v_actor_id then s.user_b
      else s.user_a
    end as counterpart_id,
    s.status,
    s.started_at,
    s.created_at,
    case
      when s.status in ('accepted', 'consent_pending', 'ready')
        then public.preactivation_deadline(s.id)
      else null
    end as expires_at
  from public.sessions as s
  where v_actor_id in (s.user_a, s.user_b)
    and s.status in ('accepted', 'consent_pending', 'ready', 'active')
  order by s.created_at desc;
end;
$$;

revoke all on function public.list_open_sessions() from public, anon;
grant execute on function public.list_open_sessions() to authenticated;

comment on function public.list_open_sessions() is
  'Returns mid-lifecycle sessions for the authenticated participant, auto-expiring stale pre-activation review (accepted/consent_pending/ready) after 24 hours per ADR 0023.';

create or replace function public.transition_session(
  p_session_id uuid,
  p_to_state text,
  p_idempotency_key text default null,
  p_metadata jsonb default '{}'::jsonb
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_id uuid := auth.uid();
  v_prior_state text;
  v_recipient_id uuid;
  v_request_created_at timestamptz;
  v_replayed_state text;
  v_allowed boolean := false;
  v_deadline timestamptz;
begin
  if v_actor_id is null then
    raise exception using
      errcode = '42501',
      message = 'authentication required';
  end if;

  if p_to_state is null or p_to_state not in (
    'draft', 'requested', 'accepted', 'consent_pending', 'ready', 'active',
    'completed', 'declined', 'cancelled', 'expired', 'soft_signaled', 'safety_ended'
  ) then
    raise exception using
      errcode = '22023',
      message = 'invalid session lifecycle state';
  end if;

  if p_idempotency_key is not null and (
    length(p_idempotency_key) < 1 or length(p_idempotency_key) > 128
  ) then
    raise exception using
      errcode = '22023',
      message = 'idempotency key must contain between 1 and 128 characters';
  end if;

  if p_metadata is null or jsonb_typeof(p_metadata) <> 'object'
    or p_metadata - array['source', 'trigger'] <> '{}'::jsonb
    or (p_metadata ? 'source' and p_metadata->>'source' not in ('mobile', 'web', 'api', 'test'))
    or (p_metadata ? 'trigger' and p_metadata->>'trigger' not in ('user_action', 'retry', 'material_profile_change', 'system_expiration'))
  then
    raise exception using
      errcode = '22023',
      message = 'session transition metadata contains unsupported fields or values';
  end if;

  select s.status, s.user_b, s.created_at
    into v_prior_state, v_recipient_id, v_request_created_at
    from public.sessions as s
   where s.id = p_session_id
     and v_actor_id in (s.user_a, s.user_b)
   for update;

  if not found then
    raise exception using
      errcode = '42501',
      message = 'session not found or access denied';
  end if;

  if p_idempotency_key is not null then
    select e.resulting_state
      into v_replayed_state
      from public.session_events as e
     where e.session_id = p_session_id
       and e.idempotency_key = p_idempotency_key;

    if found then
      return v_replayed_state;
    end if;
  end if;

  if v_prior_state = 'requested'
    and public.request_expires_at(v_request_created_at) <= now()
  then
    update public.sessions
       set status = 'expired'
     where id = p_session_id;

    insert into public.session_events (
      session_id, actor_id, event_type, prior_state, resulting_state, metadata
    ) values (
      p_session_id, null, 'session_transition', 'requested', 'expired',
      '{"source":"api","trigger":"system_expiration"}'::jsonb
    );

    return 'expired';
  end if;

  if v_prior_state in ('accepted', 'consent_pending', 'ready') then
    v_deadline := public.preactivation_deadline(p_session_id);
    if v_deadline is not null and v_deadline <= now() then
      update public.sessions
         set status = 'expired'
       where id = p_session_id;

      insert into public.session_events (
        session_id, actor_id, event_type, prior_state, resulting_state, metadata
      ) values (
        p_session_id, null, 'session_transition', v_prior_state, 'expired',
        '{"source":"api","trigger":"system_expiration"}'::jsonb
      );

      return 'expired';
    end if;
  end if;

  if v_prior_state in (
    'completed', 'declined', 'cancelled', 'expired', 'soft_signaled', 'safety_ended'
  ) then
    raise exception using
      errcode = '55000',
      message = 'session is already terminal';
  end if;

  if v_prior_state = p_to_state then
    return v_prior_state;
  end if;

  if v_prior_state = 'requested' and p_to_state in ('accepted', 'declined')
    and v_actor_id <> v_recipient_id
  then
    raise exception using
      errcode = '42501',
      message = 'only the recipient may respond to a session request';
  end if;

  v_allowed := (v_prior_state, p_to_state) in (
    ('draft', 'requested'),
    ('requested', 'accepted'),
    ('requested', 'declined'),
    ('requested', 'cancelled'),
    ('requested', 'expired'),
    ('accepted', 'consent_pending'),
    ('consent_pending', 'ready'),
    ('consent_pending', 'cancelled'),
    ('consent_pending', 'expired'),
    ('ready', 'consent_pending'),
    ('ready', 'active'),
    ('ready', 'cancelled'),
    ('ready', 'expired'),
    ('active', 'completed'),
    ('active', 'soft_signaled'),
    ('active', 'safety_ended')
  );

  if not v_allowed then
    raise exception using
      errcode = '55000',
      message = 'invalid session lifecycle transition';
  end if;

  update public.sessions
     set status = p_to_state,
         started_at = case when p_to_state = 'active' then now() else started_at end
   where id = p_session_id;

  insert into public.session_events (
    session_id,
    actor_id,
    event_type,
    prior_state,
    resulting_state,
    idempotency_key,
    metadata
  ) values (
    p_session_id,
    v_actor_id,
    'session_transition',
    v_prior_state,
    p_to_state,
    p_idempotency_key,
    p_metadata
  );

  return p_to_state;
end;
$$;

revoke all on function public.transition_session(uuid, text, text, jsonb) from public, anon;
grant execute on function public.transition_session(uuid, text, text, jsonb) to authenticated;

comment on function public.transition_session(uuid, text, text, jsonb) is
  'Canonical session lifecycle transition. Auto-expires stale requested (24h) and stale pre-activation review (accepted/consent_pending/ready, 24h from review start) before applying user transitions. Keep graph in sync with shared/src/sessionLifecycle.ts.';
