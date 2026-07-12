-- Chapter 4 request expiration (docs/roadmap/CHAPTER_4_SESSION_LIFECYCLE.md):
-- define a visible expiration timestamp for unanswered requests and enforce
-- that stale requests cannot remain requestable or be accepted/declined.
--
-- This intentionally scopes expiration to the `requested` state only. The
-- canonical graph still permits `expired` from later pre-activation states,
-- but those later deadlines remain a separate Chapter 4 follow-up once the
-- product has a designed consent-review timeout policy. See ADR 0018.

create or replace function public.request_expires_at(
  p_created_at timestamptz
)
returns timestamptz
language sql
immutable
set search_path = ''
as $$
  select p_created_at + interval '24 hours'
$$;

revoke all on function public.request_expires_at(timestamptz) from public, anon;
grant execute on function public.request_expires_at(timestamptz) to authenticated;

comment on function public.request_expires_at(timestamptz) is
  'Returns the conservative Chapter 4 request-expiration deadline for a session request: 24 hours after creation.';

create or replace function public.list_incoming_requests()
returns table (
  id uuid,
  requester_id uuid,
  created_at timestamptz,
  expires_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_id uuid := auth.uid();
begin
  if v_actor_id is null then
    raise exception using
      errcode = '42501',
      message = 'authentication required';
  end if;

  with expired as (
    update public.sessions as s
       set status = 'expired'
     where s.status = 'requested'
       and s.user_b = v_actor_id
       and public.request_expires_at(s.created_at) <= now()
    returning s.id
  )
  insert into public.session_events (
    session_id,
    actor_id,
    event_type,
    prior_state,
    resulting_state,
    metadata
  )
  select
    expired.id,
    null,
    'session_transition',
    'requested',
    'expired',
    '{"source":"api","trigger":"system_expiration"}'::jsonb
  from expired;

  return query
  select
    s.id,
    s.user_a,
    s.created_at,
    public.request_expires_at(s.created_at) as expires_at
  from public.sessions as s
  where s.user_b = v_actor_id
    and s.status = 'requested'
  order by s.created_at desc;
end;
$$;

revoke all on function public.list_incoming_requests() from public, anon;
grant execute on function public.list_incoming_requests() to authenticated;

comment on function public.list_incoming_requests() is
  'Returns incoming requested sessions for the authenticated recipient, auto-expiring any stale 24-hour requests before listing them.';

create or replace function public.request_session(
  p_recipient_id uuid,
  p_idempotency_key text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_id uuid := auth.uid();
  v_existing_id uuid;
  v_new_id uuid;
begin
  if v_actor_id is null then
    raise exception using
      errcode = '42501',
      message = 'authentication required';
  end if;

  if p_recipient_id is null then
    raise exception using
      errcode = '22023',
      message = 'a recipient is required';
  end if;

  if p_recipient_id = v_actor_id then
    raise exception using
      errcode = '22023',
      message = 'you cannot request a session with yourself';
  end if;

  if p_idempotency_key is not null and (
    length(p_idempotency_key) < 1 or length(p_idempotency_key) > 128
  ) then
    raise exception using
      errcode = '22023',
      message = 'idempotency key must contain between 1 and 128 characters';
  end if;

  if not exists (select 1 from public.profiles where user_id = p_recipient_id) then
    raise exception using
      errcode = '42501',
      message = 'that person is not available to request a session with';
  end if;

  with expired as (
    update public.sessions as s
       set status = 'expired'
     where s.status = 'requested'
       and (
             (s.user_a = v_actor_id and s.user_b = p_recipient_id)
          or (s.user_a = p_recipient_id and s.user_b = v_actor_id)
           )
       and public.request_expires_at(s.created_at) <= now()
    returning s.id
  )
  insert into public.session_events (
    session_id,
    actor_id,
    event_type,
    prior_state,
    resulting_state,
    metadata
  )
  select
    expired.id,
    null,
    'session_transition',
    'requested',
    'expired',
    '{"source":"api","trigger":"system_expiration"}'::jsonb
  from expired;

  -- Idempotent duplicate prevention: if these two people already have a
  -- non-terminal session in either direction, return it instead of creating
  -- a second, parallel one. This also naturally prevents request spam.
  select s.id
    into v_existing_id
    from public.sessions as s
   where s.status not in (
           'completed', 'declined', 'cancelled', 'expired',
           'soft_signaled', 'safety_ended'
         )
     and (
           (s.user_a = v_actor_id and s.user_b = p_recipient_id)
        or (s.user_a = p_recipient_id and s.user_b = v_actor_id)
         )
   limit 1;

  if found then
    return v_existing_id;
  end if;

  insert into public.sessions (user_a, user_b, status)
  values (v_actor_id, p_recipient_id, 'requested')
  returning id into v_new_id;

  insert into public.session_events (
    session_id, actor_id, event_type, prior_state, resulting_state, idempotency_key, metadata
  ) values (
    v_new_id, v_actor_id, 'session_requested', 'draft', 'requested', p_idempotency_key, '{}'::jsonb
  );

  return v_new_id;
end;
$$;

revoke all on function public.request_session(uuid, text) from public, anon;
grant execute on function public.request_session(uuid, text) to authenticated;

comment on function public.request_session(uuid, text) is
  'Creates a session request (draft -> requested in one atomic step) or returns an existing non-terminal session between the same two people. Before duplicate detection, stale 24-hour requested sessions for that pair are auto-expired.';

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
      session_id,
      actor_id,
      event_type,
      prior_state,
      resulting_state,
      metadata
    ) values (
      p_session_id,
      null,
      'session_transition',
      'requested',
      'expired',
      '{"source":"api","trigger":"system_expiration"}'::jsonb
    );

    return 'expired';
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

  -- Only the recipient may respond to a request. The requester withdraws
  -- their own pending request through withdraw_session_consent(...)
  -- instead, which already permits either participant to cancel.
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
  'Atomically validates and applies one canonical session lifecycle transition. Stale 24-hour requested sessions auto-expire before any attempted response.';
