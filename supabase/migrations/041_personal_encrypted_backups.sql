-- Optional owner-only encrypted personal backups (local-first architecture).
-- Server stores opaque ciphertext only. Never partner E2E keys, never plaintext
-- Touch Language / Consent Snapshots / Soft Signal notes / history.
-- Client seals with device-held master key; recovery code for restore.

create table public.personal_encrypted_backups (
  user_id uuid not null references auth.users(id) on delete cascade,
  domain text not null check (
    domain in (
      'touch_language',
      'consent_declaration',
      'consent_mutual',
      'soft_signal_log',
      'private_history',
      'learning_progress',
      'quiz_results'
    )
  ),
  -- Opaque client envelope JSON string (AES-GCM sealed). Server never parses payload meaning.
  ciphertext text not null check (
    char_length(ciphertext) between 32 and 512000
  ),
  -- Non-secret hint only (e.g. recovery-code-v1). Never a key or passphrase.
  key_hint text check (key_hint is null or char_length(key_hint) <= 64),
  updated_at timestamptz not null default now(),
  primary key (user_id, domain)
);

comment on table public.personal_encrypted_backups is
  'Owner-only opaque encrypted personal vault backups. Local-first; optional; never plaintext; never peer-readable.';

create index personal_encrypted_backups_user_updated_idx
  on public.personal_encrypted_backups (user_id, updated_at desc);

alter table public.personal_encrypted_backups enable row level security;

create policy "personal backups own select"
  on public.personal_encrypted_backups
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "personal backups own insert"
  on public.personal_encrypted_backups
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "personal backups own update"
  on public.personal_encrypted_backups
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "personal backups own delete"
  on public.personal_encrypted_backups
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);

revoke all on public.personal_encrypted_backups from public, anon;
grant select, insert, update, delete on public.personal_encrypted_backups to authenticated;
grant select, insert, update, delete on public.personal_encrypted_backups to service_role;

create or replace function public.upsert_own_encrypted_backup(
  p_domain text,
  p_ciphertext text,
  p_key_hint text default null
) returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
begin
  if v_actor is null then
    raise exception using errcode = '42501', message = 'authentication required';
  end if;

  if p_domain is null
    or p_domain not in (
      'touch_language',
      'consent_declaration',
      'consent_mutual',
      'soft_signal_log',
      'private_history',
      'learning_progress',
      'quiz_results'
    )
  then
    raise exception using errcode = '22023', message = 'invalid backup domain';
  end if;

  if p_ciphertext is null
    or char_length(p_ciphertext) not between 32 and 512000
  then
    raise exception using errcode = '22023', message = 'invalid ciphertext';
  end if;

  if p_key_hint is not null and char_length(p_key_hint) > 64 then
    raise exception using errcode = '22023', message = 'invalid key_hint';
  end if;

  insert into public.personal_encrypted_backups as b (
    user_id,
    domain,
    ciphertext,
    key_hint,
    updated_at
  ) values (
    v_actor,
    p_domain,
    p_ciphertext,
    p_key_hint,
    now()
  )
  on conflict (user_id, domain) do update
    set ciphertext = excluded.ciphertext,
        key_hint = excluded.key_hint,
        updated_at = now();
end;
$$;

revoke all on function public.upsert_own_encrypted_backup(text, text, text) from public, anon;
grant execute on function public.upsert_own_encrypted_backup(text, text, text) to authenticated;
grant execute on function public.upsert_own_encrypted_backup(text, text, text) to service_role;

comment on function public.upsert_own_encrypted_backup is
  'Owner-only upsert of opaque personal backup ciphertext. Never decrypts. Local vault remains authoritative.';
