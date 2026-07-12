-- Chapter 5 abuse rate limits (ADR 0028).
-- Soft limits on session requests, reports, and block/unblock thrash.
-- Fail closed with a non-revealing message. Not automatic punishment.

create table public.rate_limit_events (
  id bigint generated always as identity primary key,
  actor_id uuid not null references auth.users(id) on delete cascade,
  action text not null
    check (
      action in (
        'session_request',
        'report',
        'block',
        'unblock'
      )
    ),
  created_at timestamptz not null default now()
);

create index rate_limit_events_actor_action_created_idx
  on public.rate_limit_events (actor_id, action, created_at desc);

comment on table public.rate_limit_events is
  'Append-only counters for abuse rate limits. Not user-visible trust data.';

alter table public.rate_limit_events enable row level security;
revoke all on public.rate_limit_events from authenticated, anon, public;
grant select, insert on public.rate_limit_events to service_role;

-- Returns true after recording the action when under the limit.
-- Raises when the actor has met/exceeded the window budget.
create or replace function public.assert_under_rate_limit(
  p_actor_id uuid,
  p_action text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_window interval;
  v_max integer;
  v_count integer;
begin
  if p_actor_id is null then
    raise exception using errcode = '42501', message = 'authentication required';
  end if;

  case p_action
    when 'session_request' then
      v_window := interval '1 hour';
      v_max := 20;
    when 'report' then
      v_window := interval '24 hours';
      v_max := 15;
    when 'block' then
      v_window := interval '24 hours';
      v_max := 40;
    when 'unblock' then
      v_window := interval '24 hours';
      v_max := 40;
    else
      raise exception using errcode = '22023', message = 'invalid rate limit action';
  end case;

  select count(*)::integer into v_count
    from public.rate_limit_events as e
   where e.actor_id = p_actor_id
     and e.action = p_action
     and e.created_at > now() - v_window;

  if v_count >= v_max then
    raise exception using
      errcode = 'P0001',
      message = 'you''re doing that too often — try again later';
  end if;

  insert into public.rate_limit_events (actor_id, action)
  values (p_actor_id, p_action);
end;
$$;

revoke all on function public.assert_under_rate_limit(uuid, text) from public, anon, authenticated;
-- Only security-definer callers use this; not exposed to clients.

-- ---------------------------------------------------------------------------
-- request_session: rate-limit only when creating a NEW request.
-- Body matches migration 023 + rate limit before insert.
-- ---------------------------------------------------------------------------
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

  if not public.is_adult_eligible(v_actor_id) then
    raise exception using
      errcode = '42501',
      message = 'adult age confirmation is required before requesting a session';
  end if;

  if not exists (select 1 from public.profiles where user_id = p_recipient_id)
    or not public.is_adult_eligible(p_recipient_id)
    or public.pair_is_blocked(v_actor_id, p_recipient_id)
  then
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

  perform public.assert_under_rate_limit(v_actor_id, 'session_request');

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
  'Creates a session request or returns an existing non-terminal pair session. Adult + block gates (ADR 0024/0025). New requests are rate-limited (ADR 0028).';

-- ---------------------------------------------------------------------------
-- block_user / unblock_user with rate limits
-- ---------------------------------------------------------------------------
create or replace function public.block_user(p_blocked_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  r record;
begin
  if v_actor is null then
    raise exception using errcode = '42501', message = 'authentication required';
  end if;
  if p_blocked_id is null or p_blocked_id = v_actor then
    raise exception using errcode = '22023', message = 'invalid block target';
  end if;
  if not exists (select 1 from public.profiles where user_id = p_blocked_id) then
    raise exception using
      errcode = '42501',
      message = 'that person is not available';
  end if;

  perform public.assert_under_rate_limit(v_actor, 'block');

  insert into public.user_blocks (blocker_id, blocked_id)
  values (v_actor, p_blocked_id)
  on conflict do nothing;

  for r in
    select s.id, s.status
      from public.sessions as s
     where s.status = 'requested'
       and (
             (s.user_a = v_actor and s.user_b = p_blocked_id)
          or (s.user_a = p_blocked_id and s.user_b = v_actor)
           )
     for update of s
  loop
    update public.sessions set status = 'cancelled' where id = r.id;
    insert into public.session_events (
      session_id, actor_id, event_type, prior_state, resulting_state, metadata
    ) values (
      r.id, v_actor, 'session_transition', 'requested', 'cancelled',
      '{"source":"api","trigger":"user_action"}'::jsonb
    );
  end loop;
end;
$$;

revoke all on function public.block_user(uuid) from public, anon;
grant execute on function public.block_user(uuid) to authenticated;

create or replace function public.unblock_user(p_blocked_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
begin
  if v_actor is null then
    raise exception using errcode = '42501', message = 'authentication required';
  end if;

  perform public.assert_under_rate_limit(v_actor, 'unblock');

  delete from public.user_blocks
   where blocker_id = v_actor and blocked_id = p_blocked_id;
end;
$$;

revoke all on function public.unblock_user(uuid) from public, anon;
grant execute on function public.unblock_user(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- submit_report: rate-limit only on NEW reports (not idempotent returns)
-- ---------------------------------------------------------------------------
create or replace function public.submit_report(
  p_reported_id uuid,
  p_category text,
  p_session_id uuid default null,
  p_private_note text default null,
  p_idempotency_key text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_existing uuid;
  v_id uuid;
  v_session public.sessions%rowtype;
begin
  if v_actor is null then
    raise exception using errcode = '42501', message = 'authentication required';
  end if;

  if p_reported_id is null or p_reported_id = v_actor then
    raise exception using errcode = '22023', message = 'invalid report target';
  end if;

  if p_category is null or p_category not in (
    'harassment',
    'coercion_pressure',
    'boundary_violation',
    'unsafe_behavior',
    'impersonation',
    'underage_concern',
    'spam_scam',
    'other'
  ) then
    raise exception using errcode = '22023', message = 'invalid report category';
  end if;

  if p_idempotency_key is not null and (
    char_length(p_idempotency_key) < 1 or char_length(p_idempotency_key) > 128
  ) then
    raise exception using errcode = '22023', message = 'invalid idempotency key';
  end if;

  if p_private_note is not null and (
    char_length(p_private_note) > 8192
    or p_private_note not like 'litmo:encrypted:v1:%'
  ) then
    raise exception using errcode = '22023', message = 'invalid private note';
  end if;

  if p_idempotency_key is not null then
    select r.id into v_existing
      from public.user_reports as r
     where r.reporter_id = v_actor
       and r.idempotency_key = p_idempotency_key;
    if found then
      return v_existing;
    end if;
  end if;

  if not exists (select 1 from public.profiles where user_id = p_reported_id) then
    raise exception using
      errcode = '42501',
      message = 'that person is not available';
  end if;

  if p_session_id is not null then
    select * into v_session
      from public.sessions as s
     where s.id = p_session_id
       and v_actor in (s.user_a, s.user_b)
     for share;
    if not found then
      raise exception using
        errcode = '42501',
        message = 'session not found or access denied';
    end if;
    if p_reported_id not in (v_session.user_a, v_session.user_b) then
      raise exception using
        errcode = '22023',
        message = 'session does not involve that person';
    end if;
  end if;

  perform public.assert_under_rate_limit(v_actor, 'report');

  insert into public.user_reports (
    reporter_id,
    reported_id,
    session_id,
    category,
    private_note,
    status,
    idempotency_key
  ) values (
    v_actor,
    p_reported_id,
    p_session_id,
    p_category,
    nullif(trim(p_private_note), ''),
    'submitted',
    p_idempotency_key
  )
  returning id into v_id;

  return v_id;
end;
$$;

revoke all on function public.submit_report(uuid, text, uuid, text, text) from public, anon;
grant execute on function public.submit_report(uuid, text, uuid, text, text) to authenticated;

comment on function public.submit_report(uuid, text, uuid, text, text) is
  'Submits a structured safety report (ADR 0026). New reports are rate-limited (ADR 0028). Idempotent keys do not consume the budget again.';
