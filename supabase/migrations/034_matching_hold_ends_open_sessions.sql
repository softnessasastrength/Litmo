-- ADR 0038: matching_hold ends open matching work the same way permanent ban
-- does for pre-activation and active sessions (requested already cancelled).
-- Temporary holds previously left active sessions running (ADR 0035 deferred).

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
  v_prior text;
  v_to text;
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

  -- Always cancel pending requests involving the restricted account.
  for r in
    select s.id, s.status
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

  -- matching_hold and permanent_ban: close pre-activation and active work.
  for r in
    select s.id, s.status
      from public.sessions as s
     where s.status in (
             'accepted', 'consent_pending', 'ready', 'active'
           )
       and (s.user_a = p_user_id or s.user_b = p_user_id)
     for update of s
  loop
    v_prior := r.status;
    v_to := case
      when r.status = 'active' then 'safety_ended'
      else 'cancelled'
    end;
    update public.sessions set status = v_to where id = r.id;
    insert into public.session_events (
      session_id, actor_id, event_type, prior_state, resulting_state, metadata
    ) values (
      r.id, v_actor, 'session_transition', v_prior, v_to,
      jsonb_build_object(
        'source', 'api',
        'trigger', 'user_action',
        'reason', p_kind
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
  'Staff restriction. Cancels requested. matching_hold and permanent_ban also cancel pre-activation and safety-end active sessions (ADR 0035 / 0038).';
