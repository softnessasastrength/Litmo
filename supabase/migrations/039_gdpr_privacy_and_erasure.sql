-- GDPR-oriented privacy notice acceptance + erasure request queue.
-- Does NOT automatically delete auth.users or cascade destructive account wipe.
-- Destructive retention remains blocked until qualified legal/ops ownership.

create table if not exists public.privacy_notice_acceptances (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  notice_version text not null
    check (char_length(notice_version) between 4 and 64),
  accepted_at timestamptz not null default now(),
  unique (user_id, notice_version)
);

comment on table public.privacy_notice_acceptances is
  'Records that a signed-in user acknowledged a privacy notice version. Not marketing consent.';

create index if not exists privacy_notice_acceptances_user_idx
  on public.privacy_notice_acceptances (user_id, accepted_at desc);

alter table public.privacy_notice_acceptances enable row level security;

create policy "privacy notice own select"
  on public.privacy_notice_acceptances
  for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "privacy notice own insert"
  on public.privacy_notice_acceptances
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

revoke all on public.privacy_notice_acceptances from public, anon;
grant select, insert on public.privacy_notice_acceptances to authenticated;
grant select, insert, update, delete on public.privacy_notice_acceptances to service_role;

create or replace function public.accept_privacy_notice(p_notice_version text)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_id uuid;
begin
  if v_uid is null then
    raise exception 'not_authenticated';
  end if;
  if p_notice_version is null
     or char_length(trim(p_notice_version)) < 4
     or char_length(p_notice_version) > 64 then
    raise exception 'invalid_notice_version';
  end if;

  insert into public.privacy_notice_acceptances (user_id, notice_version)
  values (v_uid, trim(p_notice_version))
  on conflict (user_id, notice_version)
  do update set accepted_at = now()
  returning id into v_id;

  return v_id;
end;
$$;

revoke all on function public.accept_privacy_notice(text) from public, anon;
grant execute on function public.accept_privacy_notice(text) to authenticated;

-- Erasure requests: accountability queue only — no auto hard-delete.
create table if not exists public.account_erasure_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pending'
    check (status in ('pending', 'in_progress', 'completed', 'rejected')),
  requested_at timestamptz not null default now(),
  -- Optional short reason from user; never required for session Soft Signal.
  subject_note text
    check (subject_note is null or char_length(subject_note) <= 500),
  staff_note text
    check (staff_note is null or char_length(staff_note) <= 2000),
  resolved_at timestamptz,
  resolved_by uuid references auth.users(id) on delete set null
);

comment on table public.account_erasure_requests is
  'User-initiated erasure requests for human fulfillment. No automatic auth.users deletion.';

create index if not exists account_erasure_requests_user_idx
  on public.account_erasure_requests (user_id, requested_at desc);

create index if not exists account_erasure_requests_pending_idx
  on public.account_erasure_requests (status, requested_at)
  where status = 'pending';

alter table public.account_erasure_requests enable row level security;

create policy "erasure request own select"
  on public.account_erasure_requests
  for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "erasure request own insert"
  on public.account_erasure_requests
  for insert to authenticated
  with check (
    (select auth.uid()) = user_id
    and status = 'pending'
  );

-- Users must not self-resolve or edit staff fields.
revoke update, delete on public.account_erasure_requests from authenticated;
revoke all on public.account_erasure_requests from public, anon;
grant select, insert on public.account_erasure_requests to authenticated;
grant select, insert, update, delete on public.account_erasure_requests to service_role;

create or replace function public.request_account_erasure(p_subject_note text default null)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_id uuid;
  v_note text := nullif(trim(coalesce(p_subject_note, '')), '');
begin
  if v_uid is null then
    raise exception 'not_authenticated';
  end if;
  if v_note is not null and char_length(v_note) > 500 then
    raise exception 'note_too_long';
  end if;

  -- One open pending request at a time
  if exists (
    select 1 from public.account_erasure_requests
    where user_id = v_uid and status in ('pending', 'in_progress')
  ) then
    raise exception 'erasure_already_pending';
  end if;

  insert into public.account_erasure_requests (user_id, subject_note)
  values (v_uid, v_note)
  returning id into v_id;

  return v_id;
end;
$$;

comment on function public.request_account_erasure is
  'Queues GDPR-style erasure for ops; does not delete the account automatically.';

revoke all on function public.request_account_erasure(text) from public, anon;
grant execute on function public.request_account_erasure(text) to authenticated;
