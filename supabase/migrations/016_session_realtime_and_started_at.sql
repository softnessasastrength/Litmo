-- Chapter 4 Deliverable 3's remaining piece: replace app/app/session/active.tsx's
-- fake local timer with a real one, and let a participant see the other
-- participant's actions (soft signal, completion) without manually
-- refreshing. Two changes:
--
-- 1. transition_session(...) now records sessions.started_at when a session
--    reaches `active` (the `ready -> active` edge specifically), so the
--    mobile client can compute a real elapsed time from an actual moment in
--    time instead of counting up from an arbitrary local zero. Based
--    directly on migration 015's current body (not an earlier one) --
--    migration 015 itself documents exactly this mistake happening once
--    already; copy precisely and diff before applying again if this
--    function is ever touched a third time.
-- 2. sessions and session_events are added to the supabase_realtime
--    publication so a subscribed client receives postgres_changes events
--    for rows it's already allowed to read under RLS.
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
    or (p_metadata ? 'trigger' and p_metadata->>'trigger' not in ('user_action', 'retry', 'material_profile_change'))
  then
    raise exception using
      errcode = '22023',
      message = 'session transition metadata contains unsupported fields or values';
  end if;

  select s.status, s.user_b
    into v_prior_state, v_recipient_id
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
  'Atomically validates and records one participant-authorized session lifecycle transition, recording started_at when a session becomes active. Only the recipient (user_b) may accept or decline a requested session. Keep its graph synchronized with shared/src/sessionLifecycle.ts.';

alter publication supabase_realtime add table public.sessions;
alter publication supabase_realtime add table public.session_events;
