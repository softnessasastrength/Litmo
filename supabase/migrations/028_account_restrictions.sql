-- Chapter 5 account restrictions (ADR 0030).
-- Human staff action only. No automatic bans from reports or rate limits.
-- Matching holds and bans fail closed on discovery and session requests.

create table public.account_restrictions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null
    check (kind in ('matching_hold', 'permanent_ban')),
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
  -- Staff-only note; never shown to the restricted user.
  internal_note text
    check (
      internal_note is null
      or char_length(internal_note) between 1 and 4000
    ),
  starts_at timestamptz not null default now(),
  -- null ends_at = indefinite (required for permanent_ban).
  ends_at timestamptz,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  lifted_at timestamptz,
  lifted_by uuid references auth.users(id) on delete set null,
  check (ends_at is null or ends_at > starts_at),
  check (
    (kind = 'permanent_ban' and ends_at is null)
    or kind = 'matching_hold'
  ),
  check (
    (lifted_at is null and lifted_by is null)
    or (lifted_at is not null and lifted_by is not null)
  )
);

create index account_restrictions_user_active_idx
  on public.account_restrictions (user_id, created_at desc)
  where lifted_at is null;

comment on table public.account_restrictions is
  'Staff-applied matching holds and bans. Human action only; auditable; not automatic.';

alter table public.account_restrictions enable row level security;
revoke all on public.account_restrictions from authenticated, anon, public;
grant select, insert, update on public.account_restrictions to service_role;

create or replace function public.is_matching_restricted(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.account_restrictions as r
    where r.user_id = p_user_id
      and r.lifted_at is null
      and r.starts_at <= now()
      and (r.ends_at is null or r.ends_at > now())
  );
$$;

revoke all on function public.is_matching_restricted(uuid) from public, anon;
grant execute on function public.is_matching_restricted(uuid) to authenticated;

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

create or replace function public.lift_account_restriction(p_restriction_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_user uuid;
  v_id uuid;
begin
  if v_actor is null or not public.is_staff_moderator(v_actor) then
    raise exception using errcode = '42501', message = 'moderator access required';
  end if;
  if p_restriction_id is null then
    raise exception using errcode = '22023', message = 'restriction id required';
  end if;

  update public.account_restrictions as r
     set lifted_at = now(),
         lifted_by = v_actor
   where r.id = p_restriction_id
     and r.lifted_at is null
  returning r.id, r.user_id into v_id, v_user;

  if v_id is null then
    raise exception using errcode = 'P0002', message = 'restriction not found or already lifted';
  end if;

  perform public.append_trust_event(
    v_user,
    'account_restriction_lifted',
    v_actor,
    null,
    null,
    jsonb_build_object('restriction_id', v_id)
  );

  return v_id;
end;
$$;

revoke all on function public.lift_account_restriction(uuid) from public, anon;
grant execute on function public.lift_account_restriction(uuid) to authenticated;

-- Self-only coarse status (no internal notes / reason codes that shame).
create or replace function public.my_matching_access()
returns table (
  matching_allowed boolean,
  restriction_kind text,
  ends_at timestamptz
)
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

  return query
  select
    not public.is_matching_restricted(v_actor) as matching_allowed,
    (
      select r.kind
      from public.account_restrictions as r
      where r.user_id = v_actor
        and r.lifted_at is null
        and r.starts_at <= now()
        and (r.ends_at is null or r.ends_at > now())
      order by
        case r.kind when 'permanent_ban' then 0 else 1 end,
        r.created_at desc
      limit 1
    ) as restriction_kind,
    (
      select r.ends_at
      from public.account_restrictions as r
      where r.user_id = v_actor
        and r.lifted_at is null
        and r.starts_at <= now()
        and (r.ends_at is null or r.ends_at > now())
      order by
        case r.kind when 'permanent_ban' then 0 else 1 end,
        r.created_at desc
      limit 1
    ) as ends_at;
end;
$$;

revoke all on function public.my_matching_access() from public, anon;
grant execute on function public.my_matching_access() to authenticated;

comment on function public.my_matching_access() is
  'Self-only coarse matching access. Does not expose staff notes or detailed reason codes.';

-- Extend trust_events event_type check for restriction events.
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
      'account_restriction_lifted'
    )
  );

-- Discovery: hide restricted accounts; empty list if viewer is restricted.
create or replace function public.discovery_profiles()
returns table (
  user_id uuid,
  display_name text,
  pronouns text,
  bio text,
  vibe_archetype text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    p.user_id,
    p.display_name,
    p.pronouns,
    p.bio,
    p.vibe_archetype
  from public.profiles as p
  where p.onboarding_completed_at is not null
    and p.user_id <> auth.uid()
    and p.age_signal_status = 'adult'
    and public.is_adult_eligible(auth.uid())
    and not public.pair_is_blocked(auth.uid(), p.user_id)
    and not public.is_matching_restricted(auth.uid())
    and not public.is_matching_restricted(p.user_id);
$$;

revoke all on function public.discovery_profiles() from public, anon;
grant execute on function public.discovery_profiles() to authenticated;

-- request_session: reject restricted actors and recipients (opaque for recipient).
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

  if public.is_matching_restricted(v_actor_id) then
    raise exception using
      errcode = '42501',
      message = 'matching is paused on your account';
  end if;

  if not public.is_adult_eligible(v_actor_id) then
    raise exception using
      errcode = '42501',
      message = 'adult age confirmation is required before requesting a session';
  end if;

  if not exists (select 1 from public.profiles where user_id = p_recipient_id)
    or not public.is_adult_eligible(p_recipient_id)
    or public.pair_is_blocked(v_actor_id, p_recipient_id)
    or public.is_matching_restricted(p_recipient_id)
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
  'Creates a session request or returns an existing non-terminal pair session. Gates: adult, blocks, rate limits, account restrictions (ADR 0024–0030).';
