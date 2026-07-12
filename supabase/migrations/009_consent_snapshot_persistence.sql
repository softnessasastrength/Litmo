-- Canonical Chapter 3 Consent Snapshot persistence for Chapter 4 sessions.
-- The legacy consent_records table remains untouched for migration history;
-- all new work uses these exact-version, independently confirmed records.
create table public.consent_snapshots (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions(id) on delete cascade,
  profile_a_id uuid not null references public.touch_profile_versions(id),
  profile_a_version integer not null check (profile_a_version > 0),
  profile_b_id uuid not null references public.touch_profile_versions(id),
  profile_b_version integer not null check (profile_b_version > 0),
  fingerprint text not null check (fingerprint ~ '^[0-9a-f]{64}$'),
  compatibility jsonb not null check (jsonb_typeof(compatibility) = 'object'),
  withdrawn_by uuid references auth.users(id) on delete set null,
  withdrawn_at timestamptz,
  created_at timestamptz not null default now(),
  unique (session_id, fingerprint),
  check ((withdrawn_by is null) = (withdrawn_at is null))
);

create table public.consent_snapshot_confirmations (
  snapshot_id uuid not null references public.consent_snapshots(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  fingerprint text not null,
  confirmed_at timestamptz not null default now(),
  primary key (snapshot_id, user_id)
);

alter table public.consent_snapshots enable row level security;
alter table public.consent_snapshot_confirmations enable row level security;

create policy "participants read session snapshots" on public.consent_snapshots
  for select to authenticated using (
    exists (
      select 1 from public.sessions s
      where s.id = session_id and auth.uid() in (s.user_a, s.user_b)
    )
  );
create policy "participants read own snapshot confirmation" on public.consent_snapshot_confirmations
  for select to authenticated using (auth.uid() = user_id);

grant select on public.consent_snapshots to authenticated;
grant select on public.consent_snapshot_confirmations to authenticated;

-- Snapshot creation is server-owned because the canonical compatibility and
-- fingerprint must be computed by @litmo/domain, never trusted from a mobile
-- client. The function verifies exact immutable profile ownership/version.
create function public.create_session_snapshot(
  p_session_id uuid,
  p_profile_a_id uuid,
  p_profile_a_version integer,
  p_profile_b_id uuid,
  p_profile_b_version integer,
  p_fingerprint text,
  p_compatibility jsonb
) returns uuid
language plpgsql security definer set search_path = ''
as $$
declare
  v_session public.sessions%rowtype;
  v_id uuid;
begin
  select * into v_session from public.sessions where id = p_session_id for update;
  if not found or v_session.status <> 'consent_pending' then
    raise exception using errcode = '55000', message = 'session is not awaiting consent';
  end if;
  if not exists (
    select 1 from public.touch_profile_versions t
    where t.id = p_profile_a_id and t.user_id = v_session.user_a and t.version = p_profile_a_version
  ) or not exists (
    select 1 from public.consent_preference_versions c
    where c.user_id = v_session.user_a and c.version = p_profile_a_version
  ) or not exists (
    select 1 from public.touch_profile_versions t
    where t.id = p_profile_b_id and t.user_id = v_session.user_b and t.version = p_profile_b_version
  ) or not exists (
    select 1 from public.consent_preference_versions c
    where c.user_id = v_session.user_b and c.version = p_profile_b_version
  ) then
    raise exception using errcode = '22023', message = 'exact participant profile versions are required';
  end if;
  if p_fingerprint is null or p_fingerprint !~ '^[0-9a-f]{64}$'
    or p_compatibility is null or jsonb_typeof(p_compatibility) <> 'object'
    or coalesce((p_compatibility->>'consentGranted')::boolean, true)
  then
    raise exception using errcode = '22023', message = 'invalid canonical snapshot payload';
  end if;
  insert into public.consent_snapshots (
    session_id, profile_a_id, profile_a_version, profile_b_id,
    profile_b_version, fingerprint, compatibility
  ) values (
    p_session_id, p_profile_a_id, p_profile_a_version, p_profile_b_id,
    p_profile_b_version, p_fingerprint, p_compatibility
  ) returning id into v_id;
  return v_id;
end;
$$;
revoke all on function public.create_session_snapshot(uuid,uuid,integer,uuid,integer,text,jsonb) from public, anon, authenticated;
grant execute on function public.create_session_snapshot(uuid,uuid,integer,uuid,integer,text,jsonb) to service_role;

create function public.confirm_session_snapshot(p_snapshot_id uuid, p_fingerprint text)
returns text
language plpgsql security definer set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_snapshot public.consent_snapshots%rowtype;
  v_session public.sessions%rowtype;
  v_count integer;
begin
  select * into v_snapshot from public.consent_snapshots where id = p_snapshot_id for update;
  if not found then raise exception using errcode = '42501', message = 'snapshot not found or access denied'; end if;
  select * into v_session from public.sessions where id = v_snapshot.session_id for update;
  if v_actor is null or v_actor not in (v_session.user_a, v_session.user_b) then
    raise exception using errcode = '42501', message = 'snapshot not found or access denied';
  end if;
  if v_session.status <> 'consent_pending' or v_snapshot.withdrawn_at is not null or p_fingerprint <> v_snapshot.fingerprint then
    raise exception using errcode = '55000', message = 'snapshot confirmation rejected';
  end if;
  insert into public.consent_snapshot_confirmations (snapshot_id, user_id, fingerprint)
  values (p_snapshot_id, v_actor, p_fingerprint)
  on conflict (snapshot_id, user_id) do update
    set fingerprint = excluded.fingerprint, confirmed_at = now();
  select count(*) into v_count from public.consent_snapshot_confirmations
    where snapshot_id = p_snapshot_id and fingerprint = v_snapshot.fingerprint;
  if v_count = 2 then
    perform public.transition_session(v_snapshot.session_id, 'ready', 'snapshot-ready-' || p_snapshot_id::text,
      '{"source":"api","trigger":"user_action"}'::jsonb);
    return 'ready';
  end if;
  return 'consent_pending';
end;
$$;
revoke all on function public.confirm_session_snapshot(uuid,text) from public, anon;
grant execute on function public.confirm_session_snapshot(uuid,text) to authenticated;

create function public.withdraw_session_consent(p_snapshot_id uuid)
returns text
language plpgsql security definer set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_snapshot public.consent_snapshots%rowtype;
  v_session public.sessions%rowtype;
begin
  select * into v_snapshot from public.consent_snapshots where id = p_snapshot_id for update;
  if not found then raise exception using errcode = '42501', message = 'snapshot not found or access denied'; end if;
  select * into v_session from public.sessions where id = v_snapshot.session_id for update;
  if v_actor is null or v_actor not in (v_session.user_a, v_session.user_b) then
    raise exception using errcode = '42501', message = 'snapshot not found or access denied';
  end if;
  if v_session.status not in ('consent_pending', 'ready') then
    raise exception using errcode = '55000', message = 'session consent cannot be withdrawn in this state';
  end if;
  update public.consent_snapshots set withdrawn_by = v_actor, withdrawn_at = now() where id = p_snapshot_id;
  delete from public.consent_snapshot_confirmations where snapshot_id = p_snapshot_id;
  return public.transition_session(v_snapshot.session_id, 'cancelled', 'snapshot-withdraw-' || p_snapshot_id::text,
    '{"source":"api","trigger":"user_action"}'::jsonb);
end;
$$;
revoke all on function public.withdraw_session_consent(uuid) from public, anon;
grant execute on function public.withdraw_session_consent(uuid) to authenticated;

-- Defense in depth: no write path, including service-role SQL, can activate a
-- session without one unwithdrawn snapshot confirmed by both participants.
create function public.enforce_active_snapshot() returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if new.status = 'active' and old.status is distinct from 'active' and not exists (
    select 1 from public.consent_snapshots cs
    where cs.session_id = new.id and cs.withdrawn_at is null
      and (select count(*) from public.consent_snapshot_confirmations c
           where c.snapshot_id = cs.id and c.fingerprint = cs.fingerprint
             and c.user_id in (new.user_a, new.user_b)) = 2
  ) then
    raise exception using errcode = '55000', message = 'both participants must confirm the current snapshot before activation';
  end if;
  return new;
end;
$$;
create trigger enforce_active_snapshot_before_update
before update of status on public.sessions
for each row execute function public.enforce_active_snapshot();
