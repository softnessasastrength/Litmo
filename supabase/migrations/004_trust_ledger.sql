create table if not exists public.trust_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  session_id uuid not null references public.sessions(id) on delete cascade,
  outcome text not null check (outcome in ('safe','neutral','uncomfortable')),
  created_at timestamptz not null default now(),
  unique (user_id, session_id)
);

alter table public.trust_ledger enable row level security;
create policy "users read own trust ledger" on public.trust_ledger for select using (auth.uid() = user_id);

create or replace function public.prevent_trust_ledger_mutation()
returns trigger language plpgsql as $$
begin
  raise exception 'trust_ledger records are append-only';
end;
$$;

create trigger trust_ledger_no_update
before update or delete on public.trust_ledger
for each row execute function public.prevent_trust_ledger_mutation();
