-- SAFETY-OPS-001 recommended private-alpha foundation (founder decision 2026-07-13).
-- Implements founder/staff-issued single-use 7-day invitations, membership gates,
-- a scoped matching kill-switch, minimal 90-day unblock tombstones, and a
-- self-only structured data export. Legal/privacy-dependent destructive
-- retention and account deletion remain blocked and are deliberately not
-- invented here.

create table public.private_alpha_invites (
  id uuid primary key default gen_random_uuid(),
  code_hash bytea not null unique,
  issued_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '7 days'),
  revoked_at timestamptz,
  redeemed_at timestamptz,
  redeemed_by uuid unique references auth.users(id) on delete set null,
  check (expires_at > created_at),
  check (
    (redeemed_at is null and redeemed_by is null)
    or (redeemed_at is not null and redeemed_by is not null)
  )
);

create table public.private_alpha_memberships (
  user_id uuid primary key references auth.users(id) on delete cascade,
  invite_id uuid unique references public.private_alpha_invites(id) on delete set null,
  enrolled_by uuid references auth.users(id) on delete set null,
  enrolled_at timestamptz not null default now(),
  revoked_at timestamptz
);

comment on table public.private_alpha_invites is
  'Hashed, single-use, staff-issued private-alpha invitations. Plaintext codes are returned once and never stored.';
comment on table public.private_alpha_memberships is
  'Private-alpha admission gate. Membership is not identity verification, proof of safety, or consent.';

alter table public.private_alpha_invites enable row level security;
alter table public.private_alpha_memberships enable row level security;
revoke all on public.private_alpha_invites from authenticated, anon, public;
revoke all on public.private_alpha_memberships from authenticated, anon, public;
grant select, insert, update, delete on public.private_alpha_invites to service_role;
grant select, insert, update, delete on public.private_alpha_memberships to service_role;

-- Preserve existing founder/dev accounts as the initial named cohort. New
-- accounts created after this migration must redeem an invitation.
insert into public.private_alpha_memberships (user_id, enrolled_by)
select u.id, null
from auth.users as u
on conflict (user_id) do nothing;

create or replace function public.is_private_alpha_member(
  p_user_id uuid default auth.uid()
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select p_user_id is not null and exists (
    select 1
    from public.private_alpha_memberships as m
    where m.user_id = p_user_id
      and m.revoked_at is null
  );
$$;

revoke all on function public.is_private_alpha_member(uuid) from public, anon;
grant execute on function public.is_private_alpha_member(uuid) to authenticated;

create or replace function public.issue_private_alpha_invite()
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_code text;
begin
  if v_actor is null or not public.is_staff_moderator(v_actor) then
    raise exception using errcode = '42501', message = 'staff access required';
  end if;

  v_code := encode(gen_random_bytes(24), 'hex');

  insert into public.private_alpha_invites (code_hash, issued_by)
  values (digest(v_code, 'sha256'), v_actor);

  return v_code;
end;
$$;

revoke all on function public.issue_private_alpha_invite() from public, anon;
grant execute on function public.issue_private_alpha_invite() to authenticated;

create or replace function public.redeem_private_alpha_invite(p_code text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_invite_id uuid;
  v_issuer uuid;
  v_attempts integer;
begin
  if v_actor is null then
    raise exception using errcode = '42501', message = 'authentication required';
  end if;
  if p_code is null or char_length(trim(p_code)) <> 48 then
    raise exception using errcode = '42501', message = 'invitation is unavailable';
  end if;
  if public.is_private_alpha_member(v_actor) then
    return true;
  end if;

  select count(*)::integer into v_attempts
  from public.rate_limit_events as e
  where e.actor_id = v_actor
    and e.action = 'invite_redeem'
    and e.created_at > now() - interval '1 hour';

  if v_attempts >= 10 then
    raise exception using errcode = 'P0001', message = 'try again later';
  end if;

  insert into public.rate_limit_events (actor_id, action)
  values (v_actor, 'invite_redeem');

  update public.private_alpha_invites as i
     set redeemed_at = now(),
         redeemed_by = v_actor
   where i.code_hash = digest(lower(trim(p_code)), 'sha256')
     and i.revoked_at is null
     and i.redeemed_at is null
     and i.expires_at > now()
  returning i.id, i.issued_by into v_invite_id, v_issuer;

  if v_invite_id is null then
    raise exception using errcode = '42501', message = 'invitation is unavailable';
  end if;

  insert into public.private_alpha_memberships (
    user_id, invite_id, enrolled_by, revoked_at
  ) values (
    v_actor, v_invite_id, v_issuer, null
  )
  on conflict (user_id) do update
    set invite_id = excluded.invite_id,
        enrolled_by = excluded.enrolled_by,
        enrolled_at = now(),
        revoked_at = null;

  return true;
end;
$$;

revoke all on function public.redeem_private_alpha_invite(text) from public, anon;
grant execute on function public.redeem_private_alpha_invite(text) to authenticated;

create or replace function public.revoke_private_alpha_membership(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
begin
  if v_actor is null or not public.is_staff_moderator(v_actor) then
    raise exception using errcode = '42501', message = 'staff access required';
  end if;
  if p_user_id is null or p_user_id = v_actor then
    raise exception using errcode = '22023', message = 'invalid membership target';
  end if;

  update public.private_alpha_memberships
     set revoked_at = coalesce(revoked_at, now())
   where user_id = p_user_id;
end;
$$;

revoke all on function public.revoke_private_alpha_membership(uuid) from public, anon;
grant execute on function public.revoke_private_alpha_membership(uuid) to authenticated;

-- Extend the existing enumerated rate-limit actions for invite redemption.
alter table public.rate_limit_events
  drop constraint rate_limit_events_action_check;
alter table public.rate_limit_events
  add constraint rate_limit_events_action_check
  check (action in ('session_request', 'report', 'block', 'unblock', 'invite_redeem'));

create table public.platform_flags (
  key text primary key check (key in ('matching_paused')),
  enabled boolean not null default false,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null
);

insert into public.platform_flags (key, enabled)
values ('matching_paused', false);

comment on table public.platform_flags is
  'Staff-controlled fail-closed operational flags. Changes are staff-attributed; safety controls remain available.';

alter table public.platform_flags enable row level security;
revoke all on public.platform_flags from authenticated, anon, public;
grant select, insert, update on public.platform_flags to service_role;

create or replace function public.is_matching_paused()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((
    select f.enabled from public.platform_flags as f
    where f.key = 'matching_paused'
  ), true);
$$;

revoke all on function public.is_matching_paused() from public, anon;
grant execute on function public.is_matching_paused() to authenticated;

create or replace function public.set_matching_paused(p_enabled boolean)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
begin
  if v_actor is null or not public.is_staff_moderator(v_actor) then
    raise exception using errcode = '42501', message = 'staff access required';
  end if;
  if p_enabled is null then
    raise exception using errcode = '22023', message = 'enabled state required';
  end if;

  update public.platform_flags
     set enabled = p_enabled,
         updated_at = now(),
         updated_by = v_actor
   where key = 'matching_paused';

  return p_enabled;
end;
$$;

revoke all on function public.set_matching_paused(boolean) from public, anon;
grant execute on function public.set_matching_paused(boolean) to authenticated;

-- A minimal tombstone supports review of block/unblock abuse cycles without a
-- reason field or user visibility.
create table public.user_block_tombstones (
  id bigint generated always as identity primary key,
  blocker_id uuid not null references auth.users(id) on delete cascade,
  blocked_id uuid not null references auth.users(id) on delete cascade,
  blocked_at timestamptz not null,
  unblocked_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '90 days'),
  check (blocker_id <> blocked_id),
  check (expires_at > unblocked_at)
);

create index user_block_tombstones_expiry_idx
  on public.user_block_tombstones (expires_at);

alter table public.user_block_tombstones enable row level security;
revoke all on public.user_block_tombstones from authenticated, anon, public;
grant select, insert, delete on public.user_block_tombstones to service_role;

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

  with removed as (
    delete from public.user_blocks
    where blocker_id = v_actor and blocked_id = p_blocked_id
    returning blocker_id, blocked_id, created_at
  )
  insert into public.user_block_tombstones (
    blocker_id, blocked_id, blocked_at
  )
  select blocker_id, blocked_id, created_at
  from removed;
end;
$$;

revoke all on function public.unblock_user(uuid) from public, anon;
grant execute on function public.unblock_user(uuid) to authenticated;

create or replace function public.purge_expired_safety_ops_data()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_rate_limits integer;
  v_tombstones integer;
  v_invites integer;
begin
  if current_user not in ('postgres', 'service_role') then
    raise exception using errcode = '42501', message = 'service role required';
  end if;

  delete from public.rate_limit_events where created_at < now() - interval '30 days';
  get diagnostics v_rate_limits = row_count;

  delete from public.user_block_tombstones where expires_at <= now();
  get diagnostics v_tombstones = row_count;

  delete from public.private_alpha_invites
   where redeemed_at is null
     and coalesce(revoked_at, expires_at) < now() - interval '30 days';
  get diagnostics v_invites = row_count;

  return jsonb_build_object(
    'rate_limit_events', v_rate_limits,
    'block_tombstones', v_tombstones,
    'unused_invites', v_invites
  );
end;
$$;

revoke all on function public.purge_expired_safety_ops_data() from public, anon, authenticated;
grant execute on function public.purge_expired_safety_ops_data() to service_role;

-- Self-only export of categories already available to the participant. This is
-- a structured portability primitive, not a representation of legal completeness.
create or replace function public.export_my_data()
returns jsonb
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

  return jsonb_build_object(
    'generated_at', now(),
    'profile', (
      select to_jsonb(p) from public.profiles as p where p.user_id = v_actor
    ),
    'touch_profile_versions', coalesce((
      select jsonb_agg(to_jsonb(t) order by t.created_at)
      from public.touch_profile_versions as t where t.user_id = v_actor
    ), '[]'::jsonb),
    'consent_preference_versions', coalesce((
      select jsonb_agg(to_jsonb(c) order by c.created_at)
      from public.consent_preference_versions as c where c.user_id = v_actor
    ), '[]'::jsonb),
    'sessions', coalesce((
      select jsonb_agg(to_jsonb(s) order by s.created_at)
      from public.sessions as s where v_actor in (s.user_a, s.user_b)
    ), '[]'::jsonb),
    'reports_submitted', coalesce((
      select jsonb_agg(
        to_jsonb(r) - 'private_note'
        order by r.created_at
      )
      from public.user_reports as r where r.reporter_id = v_actor
    ), '[]'::jsonb),
    'trust_events', coalesce((
      select jsonb_agg(to_jsonb(t) order by t.created_at)
      from public.trust_events as t where t.subject_user_id = v_actor
    ), '[]'::jsonb)
  );
end;
$$;

revoke all on function public.export_my_data() from public, anon;
grant execute on function public.export_my_data() to authenticated;

-- Discovery fails closed while paused and requires both people to be admitted.
drop function if exists public.discovery_profiles();

create function public.discovery_profiles()
returns table (
  user_id uuid,
  display_name text,
  pronouns text,
  bio text,
  vibe_archetype text,
  account_age_days integer,
  completed_sessions integer
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
    p.vibe_archetype,
    greatest(0, floor(extract(epoch from (now() - u.created_at)) / 86400.0)::integer),
    (
      select count(*)::integer
      from public.trust_events as te
      where te.subject_user_id = p.user_id
        and te.event_type = 'session_completed'
    )
  from public.profiles as p
  join auth.users as u on u.id = p.user_id
  where not public.is_matching_paused()
    and public.is_private_alpha_member(auth.uid())
    and public.is_private_alpha_member(p.user_id)
    and p.onboarding_completed_at is not null
    and p.user_id <> auth.uid()
    and p.age_signal_status = 'adult'
    and public.is_adult_eligible(auth.uid())
    and not public.pair_is_blocked(auth.uid(), p.user_id)
    and not public.is_matching_restricted(auth.uid())
    and not public.is_matching_restricted(p.user_id);
$$;

revoke all on function public.discovery_profiles() from public, anon;
grant execute on function public.discovery_profiles() to authenticated;

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
    raise exception using errcode = '42501', message = 'authentication required';
  end if;
  if p_recipient_id is null then
    raise exception using errcode = '22023', message = 'a recipient is required';
  end if;
  if p_recipient_id = v_actor_id then
    raise exception using errcode = '22023', message = 'you cannot request a session with yourself';
  end if;
  if p_idempotency_key is not null and (
    length(p_idempotency_key) < 1 or length(p_idempotency_key) > 128
  ) then
    raise exception using errcode = '22023', message = 'idempotency key must contain between 1 and 128 characters';
  end if;
  if public.is_matching_paused() then
    raise exception using errcode = '42501', message = 'matching is temporarily paused';
  end if;
  if not public.is_private_alpha_member(v_actor_id) then
    raise exception using errcode = '42501', message = 'private alpha invitation required';
  end if;
  if public.is_matching_restricted(v_actor_id) then
    raise exception using errcode = '42501', message = 'matching is paused on your account';
  end if;
  if not public.is_adult_eligible(v_actor_id) then
    raise exception using errcode = '42501', message = 'adult age confirmation is required before requesting a session';
  end if;

  if not exists (select 1 from public.profiles where user_id = p_recipient_id)
    or not public.is_private_alpha_member(p_recipient_id)
    or not public.is_adult_eligible(p_recipient_id)
    or public.pair_is_blocked(v_actor_id, p_recipient_id)
    or public.is_matching_restricted(p_recipient_id)
  then
    raise exception using errcode = '42501', message = 'that person is not available to request a session with';
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
    session_id, actor_id, event_type, prior_state, resulting_state, metadata
  )
  select expired.id, null, 'session_transition', 'requested', 'expired',
         '{"source":"api","trigger":"system_expiration"}'::jsonb
  from expired;

  select s.id into v_existing_id
  from public.sessions as s
  where s.status not in (
    'completed', 'declined', 'cancelled', 'expired', 'soft_signaled', 'safety_ended'
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
    session_id, actor_id, event_type, prior_state, resulting_state,
    idempotency_key, metadata
  ) values (
    v_new_id, v_actor_id, 'session_requested', 'draft', 'requested',
    p_idempotency_key, '{}'::jsonb
  );

  return v_new_id;
end;
$$;

revoke all on function public.request_session(uuid, text) from public, anon;
grant execute on function public.request_session(uuid, text) to authenticated;
