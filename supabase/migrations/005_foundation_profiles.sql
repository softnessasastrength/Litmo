create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 80),
  pronouns text check (pronouns is null or char_length(pronouns) <= 40),
  bio text check (bio is null or char_length(bio) <= 280),
  vibe_archetype text check (vibe_archetype is null or char_length(vibe_archetype) <= 60),
  onboarding_completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.onboarding_progress (
  user_id uuid primary key references auth.users(id) on delete cascade,
  current_step text not null default 'welcome' check (current_step in ('welcome','vibe_quiz','vibe_result','touch_language','complete')),
  draft_profile jsonb not null default '{}'::jsonb check (jsonb_typeof(draft_profile) = 'object'),
  updated_at timestamptz not null default now()
);

create table if not exists public.touch_profile_versions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  version integer not null check (version > 0),
  profile jsonb not null check (jsonb_typeof(profile) = 'object'),
  private_nervous_system_notes text check (private_nervous_system_notes is null or char_length(private_nervous_system_notes) <= 1000),
  created_at timestamptz not null default now(),
  unique (user_id, version)
);

create table if not exists public.consent_preference_versions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  version integer not null check (version > 0),
  preferences jsonb not null check (jsonb_typeof(preferences) = 'object'),
  private_nervous_system_notes text check (private_nervous_system_notes is null or char_length(private_nervous_system_notes) <= 1000),
  created_at timestamptz not null default now(),
  unique (user_id, version)
);

create index if not exists touch_profile_versions_user_created_idx on public.touch_profile_versions(user_id, created_at desc);
create index if not exists consent_preference_versions_user_created_idx on public.consent_preference_versions(user_id, created_at desc);

alter table public.profiles enable row level security;
alter table public.onboarding_progress enable row level security;
alter table public.touch_profile_versions enable row level security;
alter table public.consent_preference_versions enable row level security;

create policy "profiles own select" on public.profiles for select to authenticated using ((select auth.uid()) = user_id);
create policy "profiles own update" on public.profiles for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "onboarding own select" on public.onboarding_progress for select to authenticated using ((select auth.uid()) = user_id);
create policy "onboarding own insert" on public.onboarding_progress for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "onboarding own update" on public.onboarding_progress for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "touch versions own select" on public.touch_profile_versions for select to authenticated using ((select auth.uid()) = user_id);
create policy "touch versions own insert" on public.touch_profile_versions for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "consent versions own select" on public.consent_preference_versions for select to authenticated using ((select auth.uid()) = user_id);
create policy "consent versions own insert" on public.consent_preference_versions for insert to authenticated with check ((select auth.uid()) = user_id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.users (id, display_name) values (new.id, coalesce(nullif(new.raw_user_meta_data ->> 'display_name', ''), 'New neighbor')) on conflict (id) do nothing;
  insert into public.profiles (user_id, display_name) values (new.id, coalesce(nullif(new.raw_user_meta_data ->> 'display_name', ''), 'New neighbor')) on conflict (user_id) do nothing;
  insert into public.onboarding_progress (user_id) values (new.id) on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

create or replace function public.save_profile_versions(touch_profile jsonb, consent_preferences jsonb, touch_private_notes text default null, consent_private_notes text default null)
returns table (touch_version integer, consent_version integer)
language plpgsql
security invoker
set search_path = public
as $$
declare
  actor uuid := auth.uid();
  next_touch integer;
  next_consent integer;
begin
  if actor is null then raise exception using errcode = '42501', message = 'authentication_required'; end if;
  if jsonb_typeof(touch_profile) <> 'object' or jsonb_typeof(consent_preferences) <> 'object' then raise exception using errcode = '22023', message = 'invalid_profile_payload'; end if;
  if char_length(coalesce(touch_private_notes, '')) > 1000 or char_length(coalesce(consent_private_notes, '')) > 1000 then raise exception using errcode = '22023', message = 'private_note_too_long'; end if;
  perform pg_advisory_xact_lock(hashtextextended(actor::text, 0));
  select coalesce(max(version), 0) + 1 into next_touch from public.touch_profile_versions where user_id = actor;
  select coalesce(max(version), 0) + 1 into next_consent from public.consent_preference_versions where user_id = actor;
  insert into public.touch_profile_versions (user_id, version, profile, private_nervous_system_notes) values (actor, next_touch, touch_profile - 'privateNervousSystemNotes', touch_private_notes);
  insert into public.consent_preference_versions (user_id, version, preferences, private_nervous_system_notes) values (actor, next_consent, consent_preferences - 'privateNervousSystemNotes', consent_private_notes);
  return query select next_touch, next_consent;
end;
$$;

grant execute on function public.save_profile_versions(jsonb, jsonb, text, text) to authenticated;

create or replace function public.discovery_profiles()
returns table (user_id uuid, display_name text, pronouns text, bio text, vibe_archetype text)
language sql
stable
security definer
set search_path = public
as $$
  select p.user_id, p.display_name, p.pronouns, p.bio, p.vibe_archetype from public.profiles p where p.onboarding_completed_at is not null and p.user_id <> auth.uid();
$$;

revoke all on function public.discovery_profiles() from public, anon;
grant execute on function public.discovery_profiles() to authenticated;

create or replace function public.prevent_version_mutation()
returns trigger language plpgsql as $$ begin raise exception 'profile versions are immutable'; end; $$;
create trigger touch_profile_versions_immutable before update or delete on public.touch_profile_versions for each row execute function public.prevent_version_mutation();
create trigger consent_preference_versions_immutable before update or delete on public.consent_preference_versions for each row execute function public.prevent_version_mutation();
