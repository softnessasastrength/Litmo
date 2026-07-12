-- Chapter 4 "Requests" (docs/roadmap/CHAPTER_4_SESSION_LIFECYCLE.md): create,
-- send, and idempotently avoid duplicating a session request, plus
-- recipient-only authorization for accepting or declining one.
--
-- Convention established here and required by every future caller: the
-- participant who calls request_session(...) becomes `user_a` (the
-- requester); the person they request becomes `user_b` (the recipient).
-- `sessions.user_a`/`user_b` had no requester/recipient semantic before this
-- migration -- transition_session() treated both participants identically.
-- This migration also narrows that: only the recipient (`user_b`) may accept
-- or decline a `requested` session, closing the gap noted in
-- docs/KNOWN_LIMITATIONS.md ("transition_session(...) currently authorizes
-- either participant for every graph-valid edge").
--
-- Out of scope, deliberately: expiration timestamps/jobs (still unscoped
-- per docs/CHAPTER_4_NEXT_STEPS.md) and blocking/eligibility checks (no
-- blocking system exists anywhere in this codebase yet). Both are recorded
-- as explicit follow-ups in docs/KNOWN_LIMITATIONS.md rather than invented
-- here.

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
  'Creates a session request (draft -> requested in one atomic step) or returns an existing non-terminal session between the same two people. The caller becomes user_a (requester); the recipient becomes user_b.';

-- Narrow transition_session(...): only the recipient (user_b) may accept or
-- decline a request. Every other transition keeps its prior authorization
-- (either participant), unchanged. Based on migration 011's current body
-- (not 008's superseded one) so the `ready -> consent_pending` edge and the
-- `material_profile_change` metadata trigger value it added are preserved.
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
     set status = p_to_state
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
  'Atomically validates and records one participant-authorized session lifecycle transition. Only the recipient (user_b) may accept or decline a requested session. Keep its graph synchronized with shared/src/sessionLifecycle.ts.';
