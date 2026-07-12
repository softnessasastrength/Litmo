-- Chapter 5: peer-visible specific indicators (ADR 0033) + restriction appeals
-- (ADR 0034). Never a universal safety score. Appeals are human-reviewed.

-- ---------------------------------------------------------------------------
-- discovery_profiles: add explainable, non-score fields
-- Return type change requires drop first.
-- ---------------------------------------------------------------------------
drop function if exists public.discovery_profiles();

create or replace function public.discovery_profiles()
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
    greatest(
      0,
      floor(
        extract(epoch from (now() - u.created_at)) / 86400.0
      )::integer
    ) as account_age_days,
    (
      select count(*)::integer
      from public.trust_events as te
      where te.subject_user_id = p.user_id
        and te.event_type = 'session_completed'
    ) as completed_sessions
  from public.profiles as p
  join auth.users as u on u.id = p.user_id
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

comment on function public.discovery_profiles() is
  'Discovery candidates with specific peer-visible facts (account age days, completed session count). Not a safety score (ADR 0033).';

-- Single-profile peer signals for match detail (same fields, fail closed).
create or replace function public.peer_public_signals(p_user_id uuid)
returns table (
  user_id uuid,
  account_age_days integer,
  completed_sessions integer,
  profile_complete boolean
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
  if p_user_id is null then
    raise exception using errcode = '22023', message = 'user id required';
  end if;
  -- Opaque unavailable when blocked, restricted, or missing/non-adult.
  if not exists (
    select 1
    from public.profiles as p
    where p.user_id = p_user_id
      and p.onboarding_completed_at is not null
      and p.age_signal_status = 'adult'
  )
    or public.pair_is_blocked(v_actor, p_user_id)
    or public.is_matching_restricted(p_user_id)
    or public.is_matching_restricted(v_actor)
  then
    raise exception using
      errcode = '42501',
      message = 'that person is not available';
  end if;

  return query
  select
    p.user_id,
    greatest(
      0,
      floor(
        extract(epoch from (now() - u.created_at)) / 86400.0
      )::integer
    ),
    (
      select count(*)::integer
      from public.trust_events as te
      where te.subject_user_id = p.user_id
        and te.event_type = 'session_completed'
    ),
    (p.onboarding_completed_at is not null)
  from public.profiles as p
  join auth.users as u on u.id = p.user_id
  where p.user_id = p_user_id;
end;
$$;

revoke all on function public.peer_public_signals(uuid) from public, anon;
grant execute on function public.peer_public_signals(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Restriction appeals
-- ---------------------------------------------------------------------------
create table public.restriction_appeals (
  id uuid primary key default gen_random_uuid(),
  restriction_id uuid not null
    references public.account_restrictions(id) on delete cascade,
  appellant_id uuid not null references auth.users(id) on delete cascade,
  statement text not null
    check (char_length(trim(statement)) between 1 and 2000),
  status text not null default 'submitted'
    check (
      status in (
        'submitted',
        'under_review',
        'upheld',
        'lifted',
        'withdrawn'
      )
    ),
  staff_note text
    check (
      staff_note is null
      or char_length(staff_note) between 1 and 4000
    ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  resolved_at timestamptz,
  resolved_by uuid references auth.users(id) on delete set null
);

create unique index restriction_appeals_one_open_uidx
  on public.restriction_appeals (restriction_id)
  where status in ('submitted', 'under_review');

create index restriction_appeals_appellant_idx
  on public.restriction_appeals (appellant_id, created_at desc);

comment on table public.restriction_appeals is
  'Human-reviewed appeals of staff restrictions. Statement is staff-readable platform text, not public.';

alter table public.restriction_appeals enable row level security;
-- Appellant may read own appeals only; writes via security-definer RPCs.
create policy "appellants read own appeals"
  on public.restriction_appeals
  for select
  to authenticated
  using (appellant_id = auth.uid());

grant select on public.restriction_appeals to authenticated;
revoke insert, update, delete on public.restriction_appeals
  from authenticated, anon, public;
grant select, insert, update on public.restriction_appeals to service_role;

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
     or char_length(p_statement) > 2000
  then
    raise exception using errcode = '22023', message = 'invalid appeal statement';
  end if;

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

  return v_id;
exception
  when unique_violation then
    raise exception using
      errcode = '55000',
      message = 'an open appeal already exists for that restriction';
end;
$$;

revoke all on function public.submit_restriction_appeal(uuid, text) from public, anon;
grant execute on function public.submit_restriction_appeal(uuid, text) to authenticated;

create or replace function public.list_my_appeals()
returns table (
  id uuid,
  restriction_id uuid,
  restriction_kind text,
  status text,
  created_at timestamptz,
  resolved_at timestamptz
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
    a.id,
    a.restriction_id,
    r.kind,
    a.status,
    a.created_at,
    a.resolved_at
  from public.restriction_appeals as a
  join public.account_restrictions as r on r.id = a.restriction_id
  where a.appellant_id = v_actor
  order by a.created_at desc;
end;
$$;

revoke all on function public.list_my_appeals() from public, anon;
grant execute on function public.list_my_appeals() to authenticated;

create or replace function public.list_open_appeals()
returns table (
  id uuid,
  restriction_id uuid,
  appellant_id uuid,
  restriction_kind text,
  statement text,
  status text,
  created_at timestamptz
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
    a.id,
    a.restriction_id,
    a.appellant_id,
    r.kind,
    a.statement,
    a.status,
    a.created_at
  from public.restriction_appeals as a
  join public.account_restrictions as r on r.id = a.restriction_id
  where a.status in ('submitted', 'under_review')
  order by a.created_at asc;
end;
$$;

revoke all on function public.list_open_appeals() from public, anon;
grant execute on function public.list_open_appeals() to authenticated;

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

  return v_id;
end;
$$;

revoke all on function public.resolve_restriction_appeal(uuid, text, text)
  from public, anon;
grant execute on function public.resolve_restriction_appeal(uuid, text, text)
  to authenticated;

-- Active restriction for the current user (for appeal entry).
create or replace function public.list_my_active_restrictions()
returns table (
  id uuid,
  kind text,
  starts_at timestamptz,
  ends_at timestamptz,
  has_open_appeal boolean
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
    r.id,
    r.kind,
    r.starts_at,
    r.ends_at,
    exists (
      select 1
      from public.restriction_appeals as a
      where a.restriction_id = r.id
        and a.status in ('submitted', 'under_review')
    ) as has_open_appeal
  from public.account_restrictions as r
  where r.user_id = v_actor
    and r.lifted_at is null
    and r.starts_at <= now()
    and (r.ends_at is null or r.ends_at > now())
  order by r.created_at desc;
end;
$$;

revoke all on function public.list_my_active_restrictions() from public, anon;
grant execute on function public.list_my_active_restrictions() to authenticated;
