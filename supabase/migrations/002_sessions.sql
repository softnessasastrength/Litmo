create table if not exists public.sessions (
  id uuid primary key default gen_random_uuid(),
  user_a uuid not null references public.users(id) on delete cascade,
  user_b uuid not null references public.users(id) on delete cascade,
  status text not null check (status in ('requested','consent_pending','consented','active','completed','exited','cancelled')),
  consent_record_id uuid,
  started_at timestamptz,
  ended_at timestamptz,
  exit_reason text check (exit_reason is null or exit_reason in ('soft_signal','timer','mutual','cancelled')),
  created_at timestamptz not null default now(),
  check (user_a <> user_b)
);

create index if not exists sessions_user_a_idx on public.sessions(user_a);
create index if not exists sessions_user_b_idx on public.sessions(user_b);

alter table public.sessions enable row level security;
create policy "participants read sessions" on public.sessions for select using (auth.uid() in (user_a, user_b));
