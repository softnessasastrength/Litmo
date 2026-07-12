-- Chapter 5 follow-up (ADR 0031): account restrictions gate lifecycle
-- transitions that advance matching, and applying a restriction cancels
-- pending requested sessions for that account. Safety exits always allowed.

-- ---------------------------------------------------------------------------
-- apply_account_restriction: also cancel open requests involving the user
-- ---------------------------------------------------------------------------
create or replace function public.apply_account_restriction(
  p_user_id uuid,
  p_kind text,
  p_reason_code text,
  p_ends_at timestamptz default null,
  p_internal_note text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_id uuid;
  r record;
begin
  if v_actor is null or not public.is_staff_moderator(v_actor) then
    raise exception using errcode = '42501', message = 'moderator access required';
  end if;
  if p_user_id is null or p_user_id = v_actor then
    raise exception using errcode = '22023', message = 'invalid restriction target';
  end if;
  if p_kind is null or p_kind not in ('matching_hold', 'permanent_ban') then
    raise exception using errcode = '22023', message = 'invalid restriction kind';
  end if;
  if p_reason_code is null or p_reason_code not in (
    'policy_violation',
    'safety_review',
    'underage_concern',
    'harassment',
    'impersonation',
    'spam_abuse',
    'legal_request',
    'other'
  ) then
    raise exception using errcode = '22023', message = 'invalid restriction reason';
  end if;
  if p_kind = 'permanent_ban' and p_ends_at is not null then
    raise exception using errcode = '22023', message = 'permanent bans cannot have an end time';
  end if;
  if p_kind = 'matching_hold' and p_ends_at is not null and p_ends_at <= now() then
    raise exception using errcode = '22023', message = 'hold end time must be in the future';
  end if;
  if not exists (select 1 from public.profiles where user_id = p_user_id) then
    raise exception using errcode = 'P0002', message = 'user not found';
  end if;

  insert into public.account_restrictions (
    user_id,
    kind,
    reason_code,
    internal_note,
    ends_at,
    created_by
  ) values (
    p_user_id,
    p_kind,
    p_reason_code,
    nullif(trim(p_internal_note), ''),
    p_ends_at,
    v_actor
  )
  returning id into v_id;

  -- Cancel pending requests involving the restricted account (either side).
  for r in
    select s.id
      from public.sessions as s
     where s.status = 'requested'
       and (s.user_a = p_user_id or s.user_b = p_user_id)
     for update of s
  loop
    update public.sessions set status = 'cancelled' where id = r.id;
    insert into public.session_events (
      session_id, actor_id, event_type, prior_state, resulting_state, metadata
    ) values (
      r.id, v_actor, 'session_transition', 'requested', 'cancelled',
      jsonb_build_object(
        'source', 'api',
        'trigger', 'user_action',
        'reason', 'account_restriction'
      )
    );
  end loop;

  perform public.append_trust_event(
    p_user_id,
    'account_restricted',
    v_actor,
    null,
    null,
    jsonb_build_object(
      'kind', p_kind,
      'reason_code', p_reason_code,
      'restriction_id', v_id
    )
  );

  return v_id;
end;
$$;

revoke all on function public.apply_account_restriction(uuid, text, text, timestamptz, text)
  from public, anon;
grant execute on function public.apply_account_restriction(uuid, text, text, timestamptz, text)
  to authenticated;

comment on function public.apply_account_restriction(uuid, text, text, timestamptz, text) is
  'Staff-only restriction. Cancels pending requested sessions for the account and appends a trust event (ADR 0030/0031).';

-- ---------------------------------------------------------------------------
-- transition_session: block forward matching while restricted
-- Body based on migration 021 + restriction gate (ADR 0031).
-- ---------------------------------------------------------------------------
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
  v_user_a uuid;
  v_user_b uuid;
  v_recipient_id uuid;
  v_request_created_at timestamptz;
  v_replayed_state text;
  v_allowed boolean := false;
  v_deadline timestamptz;
  v_forward boolean := false;
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
    or p_metadata - array['source', 'trigger', 'reason'] <> '{}'::jsonb
    or (p_metadata ? 'source' and p_metadata->>'source' not in ('mobile', 'web', 'api', 'test'))
    or (p_metadata ? 'trigger' and p_metadata->>'trigger' not in ('user_action', 'retry', 'material_profile_change', 'system_expiration'))
  then
    raise exception using
      errcode = '22023',
      message = 'session transition metadata contains unsupported fields or values';
  end if;

  select s.status, s.user_a, s.user_b, s.user_b, s.created_at
    into v_prior_state, v_user_a, v_user_b, v_recipient_id, v_request_created_at
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

  -- Forward matching transitions require both parties unrestricted.
  -- Decline, cancel, and safety/end states remain available.
  v_forward := p_to_state in (
    'requested', 'accepted', 'consent_pending', 'ready', 'active'
  );
  if v_forward
    and (
      public.is_matching_restricted(v_user_a)
      or public.is_matching_restricted(v_user_b)
    )
  then
    if public.is_matching_restricted(v_actor_id) then
      raise exception using
        errcode = '42501',
        message = 'matching is paused on your account';
    end if;
    raise exception using
      errcode = '42501',
      message = 'that person is not available';
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
  'Canonical session lifecycle transition. Auto-expires stale requested/pre-activation windows. Blocks forward matching when either party is account-restricted (ADR 0031); decline/cancel/safety exits remain available.';
