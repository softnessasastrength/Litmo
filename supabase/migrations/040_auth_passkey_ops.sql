-- AUTH-003: Passkey ceremony rate limits, audit log, and device-bound consent.
-- WebAuthn crypto remains Supabase Auth; this layer adds abuse controls,
-- non-sensitive audit, and fail-closed device binding for consent confirmation.
-- Never store biometrics, challenges, secrets, or private consent content here.

-- ---------------------------------------------------------------------------
-- Pre-auth / ceremony rate limits (subject is a hash, not raw IP/email)
-- ---------------------------------------------------------------------------
create table public.auth_ceremony_rate_limits (
  id bigint generated always as identity primary key,
  subject_hash text not null
    check (char_length(subject_hash) between 16 and 128),
  action text not null
    check (
      action in (
        'passkey_register_start',
        'passkey_auth_start',
        'passkey_register_complete',
        'passkey_auth_complete',
        'otp_request',
        'device_register'
      )
    ),
  created_at timestamptz not null default now()
);

create index auth_ceremony_rate_limits_subject_action_created_idx
  on public.auth_ceremony_rate_limits (subject_hash, action, created_at desc);

comment on table public.auth_ceremony_rate_limits is
  'Append-only pre-auth and auth ceremony counters. subject_hash is never raw PII.';

alter table public.auth_ceremony_rate_limits enable row level security;
revoke all on public.auth_ceremony_rate_limits from authenticated, anon, public;
grant select, insert on public.auth_ceremony_rate_limits to service_role;

-- ---------------------------------------------------------------------------
-- Auth audit events (non-sensitive metadata only)
-- ---------------------------------------------------------------------------
create table public.auth_audit_events (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users (id) on delete set null,
  device_id uuid,
  event_type text not null
    check (
      event_type in (
        'passkey_register_start',
        'passkey_register_complete',
        'passkey_auth_start',
        'passkey_auth_complete',
        'passkey_cancelled',
        'passkey_failed',
        'otp_request',
        'device_register',
        'device_verify',
        'device_revoke',
        'rate_limited',
        'consent_device_gate'
      )
    ),
  outcome text not null
    check (
      outcome in (
        'started',
        'succeeded',
        'failed',
        'cancelled',
        'rate_limited',
        'denied'
      )
    ),
  -- Non-sensitive only: platform labels, error codes, ceremony names.
  -- Forbidden: secrets, OTPs, challenges, biometric material, consent rows.
  metadata jsonb not null default '{}'::jsonb
    check (jsonb_typeof(metadata) = 'object'),
  created_at timestamptz not null default now()
);

create index auth_audit_events_user_created_idx
  on public.auth_audit_events (user_id, created_at desc);

create index auth_audit_events_type_created_idx
  on public.auth_audit_events (event_type, created_at desc);

comment on table public.auth_audit_events is
  'Append-only authentication audit. No secrets or consent content. Staff/service write; owners may read own rows.';

alter table public.auth_audit_events enable row level security;

create policy "owners read own auth audit"
  on public.auth_audit_events
  for select
  to authenticated
  using (user_id = auth.uid());

grant select on public.auth_audit_events to authenticated;
revoke insert, update, delete on public.auth_audit_events from authenticated, anon, public;
grant select, insert on public.auth_audit_events to service_role;

-- ---------------------------------------------------------------------------
-- Rate limit for ceremony subjects (service_role / edge only)
-- ---------------------------------------------------------------------------
create or replace function public.assert_auth_ceremony_rate_limit(
  p_subject_hash text,
  p_action text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_window interval;
  v_max integer;
  v_count integer;
begin
  if p_subject_hash is null
    or char_length(p_subject_hash) < 16
    or char_length(p_subject_hash) > 128
  then
    raise exception using errcode = '22023', message = 'invalid rate limit subject';
  end if;

  case p_action
    when 'passkey_register_start' then
      v_window := interval '15 minutes';
      v_max := 8;
    when 'passkey_auth_start' then
      v_window := interval '15 minutes';
      v_max := 20;
    when 'passkey_register_complete' then
      v_window := interval '15 minutes';
      v_max := 8;
    when 'passkey_auth_complete' then
      v_window := interval '15 minutes';
      v_max := 20;
    when 'otp_request' then
      v_window := interval '1 hour';
      v_max := 6;
    when 'device_register' then
      v_window := interval '1 hour';
      v_max := 12;
    else
      raise exception using errcode = '22023', message = 'invalid auth rate limit action';
  end case;

  select count(*)::integer into v_count
    from public.auth_ceremony_rate_limits as e
   where e.subject_hash = p_subject_hash
     and e.action = p_action
     and e.created_at > now() - v_window;

  if v_count >= v_max then
    raise exception using
      errcode = 'P0001',
      message = 'you''re doing that too often — try again later';
  end if;

  insert into public.auth_ceremony_rate_limits (subject_hash, action)
  values (p_subject_hash, p_action);
end;
$$;

revoke all on function public.assert_auth_ceremony_rate_limit(text, text)
  from public, anon, authenticated;
grant execute on function public.assert_auth_ceremony_rate_limit(text, text)
  to service_role;

-- ---------------------------------------------------------------------------
-- Audit logger (service_role / edge). Strips forbidden metadata keys.
-- ---------------------------------------------------------------------------
create or replace function public.log_auth_audit_event(
  p_user_id uuid,
  p_device_id uuid,
  p_event_type text,
  p_outcome text,
  p_metadata jsonb default '{}'::jsonb
)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_meta jsonb := coalesce(p_metadata, '{}'::jsonb);
  v_id bigint;
begin
  if jsonb_typeof(v_meta) is distinct from 'object' then
    v_meta := '{}'::jsonb;
  end if;

  -- Strip keys that must never land in audit (defense in depth).
  v_meta := v_meta
    - 'secret'
    - 'password'
    - 'otp'
    - 'token'
    - 'challenge'
    - 'credential'
    - 'private_key'
    - 'biometric'
    - 'ciphertext'
    - 'refresh_token'
    - 'access_token'
    - 'email';

  insert into public.auth_audit_events (
    user_id, device_id, event_type, outcome, metadata
  ) values (
    p_user_id, p_device_id, p_event_type, p_outcome, v_meta
  )
  returning id into v_id;

  return v_id;
end;
$$;

revoke all on function public.log_auth_audit_event(uuid, uuid, text, text, jsonb)
  from public, anon, authenticated;
grant execute on function public.log_auth_audit_event(uuid, uuid, text, text, jsonb)
  to service_role;

-- Authenticated self-service audit read helper (bounded).
create or replace function public.list_my_auth_audit_events(p_limit integer default 50)
returns setof public.auth_audit_events
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_limit integer := least(greatest(coalesce(p_limit, 50), 1), 100);
begin
  if auth.uid() is null then
    raise exception using errcode = '42501', message = 'authentication required';
  end if;

  return query
    select e.*
      from public.auth_audit_events as e
     where e.user_id = auth.uid()
     order by e.created_at desc
     limit v_limit;
end;
$$;

revoke all on function public.list_my_auth_audit_events(integer) from public, anon;
grant execute on function public.list_my_auth_audit_events(integer) to authenticated;

-- ---------------------------------------------------------------------------
-- Device binding gate for consent confirmation (real accounts)
-- ---------------------------------------------------------------------------
create or replace function public.require_bound_auth_device()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception using errcode = '42501', message = 'authentication required';
  end if;

  if not exists (
    select 1
      from public.auth_devices as d
     where d.user_id = v_uid
       and d.revoked_at is null
  ) then
    raise exception using
      errcode = '42501',
      message = 'a registered device is required before confirming consent — sign in with a passkey on this phone first';
  end if;
end;
$$;

revoke all on function public.require_bound_auth_device() from public, anon;
grant execute on function public.require_bound_auth_device() to authenticated;

-- Wrap confirm_session_snapshot to require a bound device (passkey + device reg).
-- Body mirrors migration 011 with the gate at the start.
create or replace function public.confirm_session_snapshot(
  p_snapshot_id uuid,
  p_fingerprint text
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_snapshot public.consent_snapshots%rowtype;
  v_session public.sessions%rowtype;
  v_count integer;
begin
  perform public.require_bound_auth_device();

  select * into v_snapshot
    from public.consent_snapshots
   where id = p_snapshot_id
   for update;
  if not found then
    raise exception using
      errcode = '42501',
      message = 'snapshot not found or access denied';
  end if;

  select * into v_session
    from public.sessions
   where id = v_snapshot.session_id
   for update;
  if v_actor is null or v_actor not in (v_session.user_a, v_session.user_b) then
    raise exception using
      errcode = '42501',
      message = 'snapshot not found or access denied';
  end if;

  if v_session.status <> 'consent_pending'
    or v_snapshot.withdrawn_at is not null
    or v_snapshot.invalidated_at is not null
    or p_fingerprint <> v_snapshot.fingerprint
  then
    raise exception using
      errcode = '55000',
      message = 'snapshot confirmation rejected';
  end if;

  insert into public.consent_snapshot_confirmations (snapshot_id, user_id, fingerprint)
  values (p_snapshot_id, v_actor, p_fingerprint)
  on conflict (snapshot_id, user_id) do update
    set fingerprint = excluded.fingerprint,
        confirmed_at = now();

  select count(*) into v_count
    from public.consent_snapshot_confirmations
   where snapshot_id = p_snapshot_id
     and fingerprint = v_snapshot.fingerprint;

  if v_count = 2 then
    perform public.transition_session(
      v_snapshot.session_id,
      'ready',
      'snapshot-ready-' || p_snapshot_id::text,
      '{"source":"api","trigger":"user_action"}'::jsonb
    );
    return 'ready';
  end if;

  return 'consent_pending';
end;
$$;

revoke all on function public.confirm_session_snapshot(uuid, text) from public, anon;
grant execute on function public.confirm_session_snapshot(uuid, text) to authenticated;

comment on function public.confirm_session_snapshot(uuid, text) is
  'Records one participant consent confirmation. Requires a non-revoked auth_devices registration (passkey-bound installation). Never grants touch by itself.';

comment on function public.require_bound_auth_device() is
  'Fail-closed gate: real consent confirmation requires a passkey-authenticated, registered device.';
