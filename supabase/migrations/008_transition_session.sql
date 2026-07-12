-- Chapter 4's sole authenticated write boundary for lifecycle state changes.
--
-- IMPORTANT: Keep the allowed-edge list below in sync with
-- shared/src/sessionLifecycle.ts `sessionTransitions`. The exhaustive pgTAP
-- matrix in supabase/tests/session_lifecycle.test.sql fails if SQL accepts or
-- rejects any edge differently from that canonical TypeScript graph.
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

  -- Audit metadata is intentionally not a free-text field. Both participants
  -- can read lifecycle events, so raw notes and private rejection/safety
  -- reasons must never enter this general audit trail.
  if p_metadata is null or jsonb_typeof(p_metadata) <> 'object'
    or p_metadata - array['source', 'trigger'] <> '{}'::jsonb
    or (p_metadata ? 'source' and p_metadata->>'source' not in ('mobile', 'web', 'api', 'test'))
    or (p_metadata ? 'trigger' and p_metadata->>'trigger' not in ('user_action', 'retry'))
  then
    raise exception using
      errcode = '22023',
      message = 'session transition metadata contains unsupported fields or values';
  end if;

  -- Lock first so two callers cannot both validate against the same prior
  -- state. The generic error intentionally does not distinguish a missing
  -- session from a session owned by somebody else.
  select s.status
    into v_prior_state
    from public.sessions as s
   where s.id = p_session_id
     and v_actor_id in (s.user_a, s.user_b)
   for update;

  if not found then
    raise exception using
      errcode = '42501',
      message = 'session not found or access denied';
  end if;

  -- Because the session row is locked, this lookup and the later insert are
  -- serialized for every transition on this session. A retry returns the
  -- original stable result even when the caller now asks for another state.
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

  -- Terminal states reject every request, including a same-state retry that
  -- has no matching idempotency key. This mirrors transition() in the domain.
  if v_prior_state in (
    'completed', 'declined', 'cancelled', 'expired', 'soft_signaled', 'safety_ended'
  ) then
    raise exception using
      errcode = '55000',
      message = 'session is already terminal';
  end if;

  -- A same-state retry without an idempotency key is the domain model's
  -- idempotent no-op. It writes no duplicate event.
  if v_prior_state = p_to_state then
    return v_prior_state;
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

revoke all on function public.transition_session(uuid, text, text, jsonb) from public;
revoke all on function public.transition_session(uuid, text, text, jsonb) from anon;
grant execute on function public.transition_session(uuid, text, text, jsonb) to authenticated;

comment on function public.transition_session(uuid, text, text, jsonb) is
  'Atomically validates and records one participant-authorized session lifecycle transition. Keep its graph synchronized with shared/src/sessionLifecycle.ts.';
