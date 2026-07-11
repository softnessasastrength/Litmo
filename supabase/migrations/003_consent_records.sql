create table if not exists public.consent_records (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null unique references public.sessions(id) on delete cascade,
  user_a_consent jsonb not null,
  user_b_consent jsonb not null,
  overlap_snapshot jsonb not null,
  user_a_confirmed_at timestamptz,
  user_b_confirmed_at timestamptz,
  both_confirmed boolean generated always as (user_a_confirmed_at is not null and user_b_confirmed_at is not null) stored,
  hash text not null unique,
  created_at timestamptz not null default now()
);

alter table public.sessions
  add constraint sessions_consent_record_fk
  foreign key (consent_record_id) references public.consent_records(id);

alter table public.consent_records enable row level security;
create policy "participants read consent records" on public.consent_records for select using (
  exists (
    select 1 from public.sessions s
    where s.id = session_id and auth.uid() in (s.user_a, s.user_b)
  )
);
