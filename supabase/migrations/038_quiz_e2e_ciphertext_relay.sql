-- Opaque ciphertext-only relay for partner quiz E2E packages.
-- Server MUST NOT decrypt, parse quiz weather, or store private keys / seal keys.
-- Primary exchange remains out-of-band paste; this is an optional convenience.

create table public.quiz_e2e_relay (
  id uuid primary key default gen_random_uuid(),
  invite_public_id text not null
    check (char_length(invite_public_id) between 8 and 96),
  claim_code text not null unique
    check (char_length(claim_code) between 12 and 64),
  -- Opaque package JSON (ciphertext envelopes only). App validates before insert.
  ciphertext text not null
    check (
      char_length(ciphertext) between 32 and 32000
      and ciphertext not ilike '%sealKey%'
      and ciphertext not ilike '%"privateKey"%'
      and ciphertext not ilike '%dhsPrivate%'
      and ciphertext not ilike '%chainKeySend%'
      and ciphertext not ilike '%rootKey%'
    ),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '7 days'),
  claimed_at timestamptz,
  claimed_by uuid references auth.users(id) on delete set null
);

comment on table public.quiz_e2e_relay is
  'Opaque E2E package relay for partner quizzes. Ciphertext only — no server decryption, never consent authority.';

create index quiz_e2e_relay_claim_code_idx
  on public.quiz_e2e_relay (claim_code)
  where claimed_at is null;

create index quiz_e2e_relay_expires_idx
  on public.quiz_e2e_relay (expires_at);

alter table public.quiz_e2e_relay enable row level security;

-- No direct table access for clients — use SECURITY DEFINER RPCs only.
revoke all on public.quiz_e2e_relay from public, anon, authenticated;
grant all on public.quiz_e2e_relay to service_role;

create or replace function public.publish_quiz_e2e_relay(
  p_invite_public_id text,
  p_ciphertext text
) returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_code text;
  v_id uuid;
begin
  if v_uid is null then
    raise exception 'not_authenticated';
  end if;
  if p_invite_public_id is null
     or char_length(p_invite_public_id) < 8
     or char_length(p_invite_public_id) > 96 then
    raise exception 'invalid_invite_id';
  end if;
  if p_ciphertext is null
     or char_length(p_ciphertext) < 32
     or char_length(p_ciphertext) > 32000 then
    raise exception 'invalid_ciphertext';
  end if;
  -- Hard refuse obvious secrets even if app misbehaves
  if p_ciphertext ilike '%sealKey%'
     or p_ciphertext ilike '%"privateKey"%'
     or p_ciphertext ilike '%dhsPrivate%'
     or p_ciphertext ilike '%chainKeySend%'
     or p_ciphertext ilike '%rootKey%' then
    raise exception 'refused_sensitive_payload';
  end if;
  -- Must look like a v3 E2E package envelope
  if p_ciphertext not like '%"v":3%' and p_ciphertext not like '%"v": 3%' then
    raise exception 'refused_non_e2e_package';
  end if;

  -- Short claim code (not a secret key — package still needs device private keys)
  v_code := encode(gen_random_bytes(9), 'hex');

  insert into public.quiz_e2e_relay (
    invite_public_id,
    claim_code,
    ciphertext,
    created_by
  ) values (
    p_invite_public_id,
    v_code,
    p_ciphertext,
    v_uid
  )
  returning id into v_id;

  return v_code;
end;
$$;

comment on function public.publish_quiz_e2e_relay is
  'Store opaque quiz E2E package; returns claim code. No decryption.';

create or replace function public.claim_quiz_e2e_relay(
  p_claim_code text
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_row public.quiz_e2e_relay%rowtype;
begin
  if v_uid is null then
    raise exception 'not_authenticated';
  end if;
  if p_claim_code is null
     or char_length(p_claim_code) < 12
     or char_length(p_claim_code) > 64 then
    raise exception 'invalid_claim_code';
  end if;

  select * into v_row
  from public.quiz_e2e_relay
  where claim_code = p_claim_code
    and claimed_at is null
    and expires_at > now()
  for update;

  if not found then
    return null;
  end if;

  update public.quiz_e2e_relay
  set claimed_at = now(),
      claimed_by = v_uid
  where id = v_row.id;

  return jsonb_build_object(
    'invite_public_id', v_row.invite_public_id,
    'ciphertext', v_row.ciphertext
  );
end;
$$;

comment on function public.claim_quiz_e2e_relay is
  'One-time claim of opaque quiz E2E package. Returns ciphertext only.';

revoke all on function public.publish_quiz_e2e_relay(text, text) from public, anon;
revoke all on function public.claim_quiz_e2e_relay(text) from public, anon;
grant execute on function public.publish_quiz_e2e_relay(text, text) to authenticated;
grant execute on function public.claim_quiz_e2e_relay(text) to authenticated;
grant execute on function public.publish_quiz_e2e_relay(text, text) to service_role;
grant execute on function public.claim_quiz_e2e_relay(text) to service_role;

-- Best-effort cleanup helper (ops / cron may call)
create or replace function public.purge_expired_quiz_e2e_relay()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  n integer;
begin
  delete from public.quiz_e2e_relay
  where expires_at < now()
     or (claimed_at is not null and claimed_at < now() - interval '1 day');
  get diagnostics n = row_count;
  return n;
end;
$$;

revoke all on function public.purge_expired_quiz_e2e_relay() from public, anon, authenticated;
grant execute on function public.purge_expired_quiz_e2e_relay() to service_role;
