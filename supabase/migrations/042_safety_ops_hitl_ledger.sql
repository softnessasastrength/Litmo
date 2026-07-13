-- SAFETY-OPS-001 deep foundation: HITL permanent-ban dual confirmation,
-- appeal rate limits, expanded append-only trust ledger types, staff action
-- audit log, and fail-closed two-person ban policy (founder S10 / ADR 0061).
--
-- Does NOT invent named backup reviewers, legal approval, or destructive
-- retention. Permanent ban completion fails closed until the dual path
-- succeeds (or two_person_required is explicitly false for synthetic tests).

-- ---------------------------------------------------------------------------
-- Platform safety settings (fail-closed defaults for irreversible actions)
-- ---------------------------------------------------------------------------
create table if not exists public.platform_safety_settings (
  key text primary key
    check (key in (
      'two_person_permanent_ban_required',
      'named_second_owner_configured'
    )),
  value_bool boolean not null,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null
);

comment on table public.platform_safety_settings is
  'Fail-closed ops switches. named_second_owner_configured must stay false until a real human owner is documented in-repo.';

alter table public.platform_safety_settings enable row level security;
revoke all on public.platform_safety_settings from authenticated, anon, public;
grant select, insert, update on public.platform_safety_settings to service_role;

insert into public.platform_safety_settings (key, value_bool)
values
  ('two_person_permanent_ban_required', true),
  ('named_second_owner_configured', false)
on conflict (key) do nothing;

-- Staff-only read of boolean settings (no write from clients).
create or replace function public.get_platform_safety_setting(p_key text)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_val boolean;
begin
  if v_actor is null or not public.is_staff_moderator(v_actor) then
    raise exception using errcode = '42501', message = 'moderator access required';
  end if;
  if p_key is null then
    raise exception using errcode = '22023', message = 'setting key required';
  end if;
  select s.value_bool into v_val
    from public.platform_safety_settings as s
   where s.key = p_key;
  return coalesce(v_val, false);
end;
$$;

revoke all on function public.get_platform_safety_setting(text) from public, anon;
grant execute on function public.get_platform_safety_setting(text) to authenticated;

-- Service-role / trusted ops only — never self-service flip of named owner.
create or replace function public.set_platform_safety_setting(
  p_key text,
  p_value boolean
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- EXECUTE granted only to service_role. Authenticated clients cannot flip
  -- named_second_owner_configured or invent dual-HITL readiness.
  if p_key not in (
    'two_person_permanent_ban_required',
    'named_second_owner_configured'
  ) then
    raise exception using errcode = '22023', message = 'invalid setting key';
  end if;

  insert into public.platform_safety_settings (key, value_bool, updated_at, updated_by)
  values (p_key, p_value, now(), null)
  on conflict (key) do update
    set value_bool = excluded.value_bool,
        updated_at = now(),
        updated_by = excluded.updated_by;

  return p_value;
end;
$$;

revoke all on function public.set_platform_safety_setting(text, boolean)
  from public, anon, authenticated;
grant execute on function public.set_platform_safety_setting(text, boolean)
  to service_role;

-- ---------------------------------------------------------------------------
-- Append-only staff action audit (HITL evidence, not user-visible)
-- ---------------------------------------------------------------------------
create table if not exists public.staff_action_audit (
  id bigint generated always as identity primary key,
  actor_id uuid not null references auth.users(id) on delete restrict,
  action text not null
    check (action in (
      'claim_case',
      'resolve_case',
      'add_note',
      'apply_matching_hold',
      'request_permanent_ban',
      'confirm_permanent_ban',
      'cancel_permanent_ban',
      'lift_restriction',
      'resolve_appeal',
      'set_matching_paused',
      'issue_invite'
    )),
  target_user_id uuid references auth.users(id) on delete set null,
  case_id uuid,
  restriction_id uuid,
  appeal_id uuid,
  ban_request_id uuid,
  metadata jsonb not null default '{}'::jsonb
    check (jsonb_typeof(metadata) = 'object'),
  created_at timestamptz not null default now()
);

create index staff_action_audit_actor_created_idx
  on public.staff_action_audit (actor_id, created_at desc);

create index staff_action_audit_target_created_idx
  on public.staff_action_audit (target_user_id, created_at desc)
  where target_user_id is not null;

comment on table public.staff_action_audit is
  'Append-only staff HITL evidence. Never user-visible. Not a public score.';

alter table public.staff_action_audit enable row level security;
revoke all on public.staff_action_audit from authenticated, anon, public;
grant select, insert on public.staff_action_audit to service_role;

create or replace function public.append_staff_action_audit(
  p_actor_id uuid,
  p_action text,
  p_target_user_id uuid default null,
  p_case_id uuid default null,
  p_restriction_id uuid default null,
  p_appeal_id uuid default null,
  p_ban_request_id uuid default null,
  p_metadata jsonb default '{}'::jsonb
)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id bigint;
begin
  if p_actor_id is null or p_action is null then
    raise exception using errcode = '22023', message = 'invalid staff audit event';
  end if;
  insert into public.staff_action_audit (
    actor_id, action, target_user_id, case_id, restriction_id,
    appeal_id, ban_request_id, metadata
  ) values (
    p_actor_id, p_action, p_target_user_id, p_case_id, p_restriction_id,
    p_appeal_id, p_ban_request_id, coalesce(p_metadata, '{}'::jsonb)
  )
  returning id into v_id;
  return v_id;
end;
$$;

revoke all on function public.append_staff_action_audit(
  uuid, text, uuid, uuid, uuid, uuid, uuid, jsonb
) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Trust event type expansion (append-only ledger)
-- ---------------------------------------------------------------------------
alter table public.trust_events
  drop constraint if exists trust_events_event_type_check;

alter table public.trust_events
  add constraint trust_events_event_type_check check (
    event_type in (
      'profile_completed',
      'age_adult_confirmed',
      'session_completed',
      'session_soft_signaled',
      'session_safety_ended',
      'report_submitted',
      'moderation_closed',
      'account_restricted',
      'account_restriction_lifted',
      'appeal_submitted',
      'appeal_resolved',
      'permanent_ban_requested',
      'permanent_ban_confirmed',
      'matching_pause_changed',
      'private_alpha_enrolled'
    )
  );

-- ---------------------------------------------------------------------------
-- Rate limit: appeal + keep invite_redeem
-- ---------------------------------------------------------------------------
alter table public.rate_limit_events
  drop constraint if exists rate_limit_events_action_check;

alter table public.rate_limit_events
  add constraint rate_limit_events_action_check
  check (action in (
    'session_request',
    'report',
    'block',
    'unblock',
    'invite_redeem',
    'appeal'
  ));

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
    when 'invite_redeem' then
      v_window := interval '1 hour';
      v_max := 10;
    when 'appeal' then
      v_window := interval '24 hours';
      v_max := 5;
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

revoke all on function public.assert_under_rate_limit(uuid, text)
  from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Permanent ban dual-confirm request table (HITL)
-- ---------------------------------------------------------------------------
create table if not exists public.permanent_ban_requests (
  id uuid primary key default gen_random_uuid(),
  target_user_id uuid not null references auth.users(id) on delete cascade,
  reason_code text not null
    check (
      reason_code in (
        'policy_violation',
        'safety_review',
        'underage_concern',
        'harassment',
        'impersonation',
        'spam_abuse',
        'legal_request',
        'other'
      )
    ),
  internal_note text
    check (
      internal_note is null
      or char_length(internal_note) between 1 and 4000
    ),
  case_id uuid references public.moderation_cases(id) on delete set null,
  requested_by uuid not null references auth.users(id) on delete restrict,
  requested_at timestamptz not null default now(),
  confirmed_by uuid references auth.users(id) on delete set null,
  confirmed_at timestamptz,
  cancelled_by uuid references auth.users(id) on delete set null,
  cancelled_at timestamptz,
  restriction_id uuid references public.account_restrictions(id) on delete set null,
  status text not null default 'pending'
    check (status in ('pending', 'confirmed', 'cancelled', 'expired')),
  expires_at timestamptz not null default (now() + interval '72 hours'),
  check (
    (status = 'pending' and confirmed_at is null and cancelled_at is null)
    or (status = 'confirmed' and confirmed_at is not null and confirmed_by is not null)
    or (status = 'cancelled' and cancelled_at is not null)
    or (status = 'expired')
  )
);

create index permanent_ban_requests_pending_idx
  on public.permanent_ban_requests (target_user_id, requested_at desc)
  where status = 'pending';

comment on table public.permanent_ban_requests is
  'HITL dual-confirm permanent ban workflow. First staff requests; distinct second staff confirms. Never auto-applied.';

alter table public.permanent_ban_requests enable row level security;
revoke all on public.permanent_ban_requests from authenticated, anon, public;
grant select, insert, update on public.permanent_ban_requests to service_role;

create or replace function public.permanent_ban_policy_allows_completion()
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_two_person boolean;
  v_named boolean;
  v_staff_count integer;
begin
  select coalesce(
    (select value_bool from public.platform_safety_settings
      where key = 'two_person_permanent_ban_required'),
    true
  ) into v_two_person;

  if not v_two_person then
    return true;
  end if;

  select coalesce(
    (select value_bool from public.platform_safety_settings
      where key = 'named_second_owner_configured'),
    false
  ) into v_named;

  if not v_named then
    return false;
  end if;

  select count(*)::integer into v_staff_count
    from public.staff_roles as s
   where s.role in ('moderator', 'admin');

  return v_staff_count >= 2;
end;
$$;

revoke all on function public.permanent_ban_policy_allows_completion()
  from public, anon;
grant execute on function public.permanent_ban_policy_allows_completion()
  to authenticated;

-- Direct permanent_ban via apply_account_restriction fails closed when
-- two-person is required. Matching holds remain single-staff. Session end
-- semantics match ADR 0035 / 0038 (session_events + safety_ended).
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
  v_two_person boolean;
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

  if p_kind = 'permanent_ban' then
    select coalesce(
      (select value_bool from public.platform_safety_settings
        where key = 'two_person_permanent_ban_required'),
      true
    ) into v_two_person;
    if v_two_person then
      raise exception using
        errcode = 'P0001',
        message = 'permanent ban requires two-person confirmation — use request_permanent_ban';
    end if;
  end if;

  insert into public.account_restrictions (
    user_id, kind, reason_code, internal_note, ends_at, created_by
  ) values (
    p_user_id, p_kind, p_reason_code,
    nullif(trim(p_internal_note), ''), p_ends_at, v_actor
  )
  returning id into v_id;

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

  perform public.append_staff_action_audit(
    v_actor,
    case when p_kind = 'matching_hold' then 'apply_matching_hold' else 'confirm_permanent_ban' end,
    p_user_id,
    null,
    v_id,
    null,
    null,
    jsonb_build_object('kind', p_kind, 'reason_code', p_reason_code)
  );

  return v_id;
end;
$$;

revoke all on function public.apply_account_restriction(uuid, text, text, timestamptz, text)
  from public, anon;
grant execute on function public.apply_account_restriction(uuid, text, text, timestamptz, text)
  to authenticated;

comment on function public.apply_account_restriction(uuid, text, text, timestamptz, text) is
  'Staff restriction. Matching hold: single staff. Permanent ban: blocked when two_person_permanent_ban_required; use dual-confirm RPCs (ADR 0061). Session end semantics ADR 0035/0038.';

-- Internal apply used only after dual confirm (bypasses two-person gate).
create or replace function public._apply_permanent_ban_after_confirm(
  p_user_id uuid,
  p_reason_code text,
  p_internal_note text,
  p_actor_id uuid,
  p_ban_request_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
  r record;
  v_prior text;
  v_to text;
begin
  if p_actor_id is null or p_user_id is null then
    raise exception using errcode = '22023', message = 'invalid ban apply';
  end if;

  insert into public.account_restrictions (
    user_id, kind, reason_code, internal_note, ends_at, created_by
  ) values (
    p_user_id, 'permanent_ban', p_reason_code,
    nullif(trim(p_internal_note), ''), null, p_actor_id
  )
  returning id into v_id;

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
      r.id, p_actor_id, 'session_transition', 'requested', 'cancelled',
      jsonb_build_object(
        'source', 'api',
        'trigger', 'user_action',
        'reason', 'account_restriction'
      )
    );
  end loop;

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
      r.id, p_actor_id, 'session_transition', v_prior, v_to,
      jsonb_build_object(
        'source', 'api',
        'trigger', 'user_action',
        'reason', 'permanent_ban'
      )
    );
  end loop;

  perform public.append_trust_event(
    p_user_id,
    'account_restricted',
    p_actor_id,
    null,
    null,
    jsonb_build_object(
      'kind', 'permanent_ban',
      'reason_code', p_reason_code,
      'restriction_id', v_id,
      'ban_request_id', p_ban_request_id,
      'via', 'two_person_confirm'
    )
  );

  perform public.append_trust_event(
    p_user_id,
    'permanent_ban_confirmed',
    p_actor_id,
    null,
    null,
    jsonb_build_object(
      'restriction_id', v_id,
      'ban_request_id', p_ban_request_id
    )
  );

  return v_id;
end;
$$;

revoke all on function public._apply_permanent_ban_after_confirm(
  uuid, text, text, uuid, uuid
) from public, anon, authenticated;

create or replace function public.request_permanent_ban(
  p_user_id uuid,
  p_reason_code text,
  p_internal_note text default null,
  p_case_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_id uuid;
begin
  if v_actor is null or not public.is_staff_moderator(v_actor) then
    raise exception using errcode = '42501', message = 'moderator access required';
  end if;
  if p_user_id is null or p_user_id = v_actor then
    raise exception using errcode = '22023', message = 'invalid restriction target';
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
  if not exists (select 1 from public.profiles where user_id = p_user_id) then
    raise exception using errcode = 'P0002', message = 'user not found';
  end if;
  if not public.permanent_ban_policy_allows_completion() then
    raise exception using
      errcode = 'P0001',
      message = 'permanent ban blocked until named second reviewer and dual staffing are configured';
  end if;
  if exists (
    select 1 from public.permanent_ban_requests as r
     where r.target_user_id = p_user_id
       and r.status = 'pending'
       and r.expires_at > now()
  ) then
    raise exception using
      errcode = 'P0001',
      message = 'a pending permanent ban request already exists for this account';
  end if;

  insert into public.permanent_ban_requests (
    target_user_id, reason_code, internal_note, case_id, requested_by
  ) values (
    p_user_id, p_reason_code, nullif(trim(p_internal_note), ''), p_case_id, v_actor
  )
  returning id into v_id;

  perform public.append_trust_event(
    p_user_id,
    'permanent_ban_requested',
    v_actor,
    null,
    null,
    jsonb_build_object('ban_request_id', v_id, 'reason_code', p_reason_code)
  );

  perform public.append_staff_action_audit(
    v_actor,
    'request_permanent_ban',
    p_user_id,
    p_case_id,
    null,
    null,
    v_id,
    jsonb_build_object('reason_code', p_reason_code)
  );

  return v_id;
end;
$$;

revoke all on function public.request_permanent_ban(uuid, text, text, uuid)
  from public, anon;
grant execute on function public.request_permanent_ban(uuid, text, text, uuid)
  to authenticated;

create or replace function public.confirm_permanent_ban(p_request_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_req public.permanent_ban_requests%rowtype;
  v_restriction_id uuid;
begin
  if v_actor is null or not public.is_staff_moderator(v_actor) then
    raise exception using errcode = '42501', message = 'moderator access required';
  end if;
  if p_request_id is null then
    raise exception using errcode = '22023', message = 'ban request id required';
  end if;
  if not public.permanent_ban_policy_allows_completion() then
    raise exception using
      errcode = 'P0001',
      message = 'permanent ban blocked until named second reviewer and dual staffing are configured';
  end if;

  select * into v_req
    from public.permanent_ban_requests as r
   where r.id = p_request_id
   for update;

  if not found then
    raise exception using errcode = 'P0002', message = 'ban request not found';
  end if;
  if v_req.status <> 'pending' or v_req.expires_at <= now() then
    if v_req.status = 'pending' and v_req.expires_at <= now() then
      update public.permanent_ban_requests
         set status = 'expired'
       where id = p_request_id;
    end if;
    raise exception using errcode = 'P0001', message = 'ban request is not pending';
  end if;
  if v_req.requested_by = v_actor then
    raise exception using
      errcode = 'P0001',
      message = 'permanent ban requires a second distinct staff confirmer';
  end if;

  v_restriction_id := public._apply_permanent_ban_after_confirm(
    v_req.target_user_id,
    v_req.reason_code,
    v_req.internal_note,
    v_actor,
    p_request_id
  );

  update public.permanent_ban_requests
     set status = 'confirmed',
         confirmed_by = v_actor,
         confirmed_at = now(),
         restriction_id = v_restriction_id
   where id = p_request_id;

  perform public.append_staff_action_audit(
    v_actor,
    'confirm_permanent_ban',
    v_req.target_user_id,
    v_req.case_id,
    v_restriction_id,
    null,
    p_request_id,
    jsonb_build_object('requested_by', v_req.requested_by)
  );

  return v_restriction_id;
end;
$$;

revoke all on function public.confirm_permanent_ban(uuid) from public, anon;
grant execute on function public.confirm_permanent_ban(uuid) to authenticated;

create or replace function public.cancel_permanent_ban_request(p_request_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_req public.permanent_ban_requests%rowtype;
begin
  if v_actor is null or not public.is_staff_moderator(v_actor) then
    raise exception using errcode = '42501', message = 'moderator access required';
  end if;

  select * into v_req
    from public.permanent_ban_requests as r
   where r.id = p_request_id
   for update;

  if not found then
    raise exception using errcode = 'P0002', message = 'ban request not found';
  end if;
  if v_req.status <> 'pending' then
    raise exception using errcode = 'P0001', message = 'ban request is not pending';
  end if;

  update public.permanent_ban_requests
     set status = 'cancelled',
         cancelled_by = v_actor,
         cancelled_at = now()
   where id = p_request_id;

  perform public.append_staff_action_audit(
    v_actor,
    'cancel_permanent_ban',
    v_req.target_user_id,
    v_req.case_id,
    null,
    null,
    p_request_id,
    '{}'::jsonb
  );
end;
$$;

revoke all on function public.cancel_permanent_ban_request(uuid) from public, anon;
grant execute on function public.cancel_permanent_ban_request(uuid) to authenticated;

create or replace function public.list_pending_permanent_ban_requests()
returns table (
  id uuid,
  target_user_id uuid,
  reason_code text,
  case_id uuid,
  requested_by uuid,
  requested_at timestamptz,
  expires_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
begin
  if v_actor is null or not public.is_staff_moderator(v_actor) then
    raise exception using errcode = '42501', message = 'moderator access required';
  end if;

  return query
  select
    r.id,
    r.target_user_id,
    r.reason_code,
    r.case_id,
    r.requested_by,
    r.requested_at,
    r.expires_at
  from public.permanent_ban_requests as r
  where r.status = 'pending'
    and r.expires_at > now()
  order by r.requested_at asc;
end;
$$;

revoke all on function public.list_pending_permanent_ban_requests()
  from public, anon;
grant execute on function public.list_pending_permanent_ban_requests()
  to authenticated;

-- ---------------------------------------------------------------------------
-- Appeals: rate limit + trust events
-- ---------------------------------------------------------------------------
create or replace function public.submit_restriction_appeal(
  p_restriction_id uuid,
  p_statement text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_restriction public.account_restrictions%rowtype;
  v_id uuid;
begin
  if v_actor is null then
    raise exception using errcode = '42501', message = 'authentication required';
  end if;
  if p_restriction_id is null then
    raise exception using errcode = '22023', message = 'restriction id required';
  end if;
  if p_statement is null
     or char_length(trim(p_statement)) < 1
     or char_length(p_statement) > 2000 then
    raise exception using errcode = '22023', message = 'invalid appeal statement';
  end if;

  perform public.assert_under_rate_limit(v_actor, 'appeal');

  select * into v_restriction
    from public.account_restrictions as r
   where r.id = p_restriction_id
   for share;

  if not found then
    raise exception using errcode = 'P0002', message = 'restriction not found';
  end if;
  if v_restriction.user_id <> v_actor then
    raise exception using errcode = '42501', message = 'you can only appeal your own restrictions';
  end if;
  if v_restriction.lifted_at is not null then
    raise exception using errcode = '55000', message = 'that restriction is already lifted';
  end if;
  if v_restriction.ends_at is not null and v_restriction.ends_at <= now() then
    raise exception using errcode = '55000', message = 'that restriction has already ended';
  end if;

  insert into public.restriction_appeals (
    restriction_id, appellant_id, statement, status
  ) values (
    p_restriction_id, v_actor, trim(p_statement), 'submitted'
  )
  returning id into v_id;

  perform public.append_trust_event(
    v_actor,
    'appeal_submitted',
    v_actor,
    null,
    null,
    jsonb_build_object(
      'appeal_id', v_id,
      'restriction_id', p_restriction_id
    )
  );

  return v_id;
exception
  when unique_violation then
    raise exception using
      errcode = '55000',
      message = 'an open appeal already exists for that restriction';
end;
$$;

revoke all on function public.submit_restriction_appeal(uuid, text)
  from public, anon;
grant execute on function public.submit_restriction_appeal(uuid, text)
  to authenticated;

-- resolve_restriction_appeal: preserve ADR 0034 return uuid + add ledger/audit.
create or replace function public.resolve_restriction_appeal(
  p_appeal_id uuid,
  p_outcome text,
  p_staff_note text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_appeal public.restriction_appeals%rowtype;
  v_id uuid;
begin
  if v_actor is null or not public.is_staff_moderator(v_actor) then
    raise exception using errcode = '42501', message = 'moderator access required';
  end if;
  if p_outcome is null or p_outcome not in ('upheld', 'lifted') then
    raise exception using errcode = '22023', message = 'invalid appeal outcome';
  end if;
  if p_staff_note is not null and (
    char_length(trim(p_staff_note)) < 1 or char_length(p_staff_note) > 4000
  ) then
    raise exception using errcode = '22023', message = 'invalid staff note';
  end if;

  select * into v_appeal
    from public.restriction_appeals as a
   where a.id = p_appeal_id
   for update;
  if not found then
    raise exception using errcode = 'P0002', message = 'appeal not found';
  end if;
  if v_appeal.status not in ('submitted', 'under_review') then
    raise exception using errcode = '55000', message = 'appeal is already resolved';
  end if;

  update public.restriction_appeals as a
     set status = p_outcome,
         staff_note = nullif(trim(p_staff_note), ''),
         resolved_at = now(),
         resolved_by = v_actor,
         updated_at = now()
   where a.id = p_appeal_id
  returning a.id into v_id;

  if p_outcome = 'lifted' then
    update public.account_restrictions as r
       set lifted_at = coalesce(r.lifted_at, now()),
           lifted_by = coalesce(r.lifted_by, v_actor)
     where r.id = v_appeal.restriction_id
       and r.lifted_at is null;

    perform public.append_trust_event(
      v_appeal.appellant_id,
      'account_restriction_lifted',
      v_actor,
      null,
      null,
      jsonb_build_object(
        'restriction_id', v_appeal.restriction_id,
        'via', 'appeal',
        'appeal_id', v_id
      )
    );
  end if;

  perform public.append_trust_event(
    v_appeal.appellant_id,
    'appeal_resolved',
    v_actor,
    null,
    null,
    jsonb_build_object(
      'appeal_id', v_id,
      'outcome', p_outcome
    )
  );

  perform public.append_staff_action_audit(
    v_actor,
    'resolve_appeal',
    v_appeal.appellant_id,
    null,
    v_appeal.restriction_id,
    v_id,
    null,
    jsonb_build_object('outcome', p_outcome)
  );

  return v_id;
end;
$$;

revoke all on function public.resolve_restriction_appeal(uuid, text, text)
  from public, anon;
grant execute on function public.resolve_restriction_appeal(uuid, text, text)
  to authenticated;


-- Coarse staff policy read for console UI.
create or replace function public.my_permanent_ban_policy()
returns table (
  two_person_required boolean,
  named_second_owner_configured boolean,
  completion_allowed boolean,
  distinct_staff_count integer
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_two boolean;
  v_named boolean;
  v_count integer;
begin
  if v_actor is null or not public.is_staff_moderator(v_actor) then
    raise exception using errcode = '42501', message = 'moderator access required';
  end if;

  select coalesce(
    (select value_bool from public.platform_safety_settings
      where key = 'two_person_permanent_ban_required'), true
  ) into v_two;
  select coalesce(
    (select value_bool from public.platform_safety_settings
      where key = 'named_second_owner_configured'), false
  ) into v_named;
  select count(*)::integer into v_count
    from public.staff_roles where role in ('moderator', 'admin');

  return query
  select
    v_two,
    v_named,
    public.permanent_ban_policy_allows_completion(),
    v_count;
end;
$$;

revoke all on function public.my_permanent_ban_policy() from public, anon;
grant execute on function public.my_permanent_ban_policy() to authenticated;
