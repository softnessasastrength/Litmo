-- Nuclear session lifecycle + Consent Snapshot hardening (ADR 0062).
-- Immutable snapshot body, append-only revocation ledger, offline intent
-- queue with Soft Signal priority, wrap-up skip path, seal integrity view.
-- Does not invent continuous-consent UI clocks (app continuousConsentCore).

-- ---------------------------------------------------------------------------
-- Immutable snapshot body: fingerprint / profiles / compatibility never mutate
-- ---------------------------------------------------------------------------
create or replace function public.tg_consent_snapshots_immutable_body()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' then
    if new.session_id is distinct from old.session_id
      or new.profile_a_id is distinct from old.profile_a_id
      or new.profile_a_version is distinct from old.profile_a_version
      or new.profile_b_id is distinct from old.profile_b_id
      or new.profile_b_version is distinct from old.profile_b_version
      or new.fingerprint is distinct from old.fingerprint
      or new.compatibility is distinct from old.compatibility
      or new.created_at is distinct from old.created_at
    then
      raise exception using
        errcode = '55000',
        message = 'consent snapshot body is immutable after create';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists consent_snapshots_immutable_body on public.consent_snapshots;
create trigger consent_snapshots_immutable_body
before update on public.consent_snapshots
for each row execute function public.tg_consent_snapshots_immutable_body();

comment on function public.tg_consent_snapshots_immutable_body() is
  'Nuclear immutability: seal identity fields cannot change in place (ADR 0062). Withdraw/invalidate columns may still update.';

-- ---------------------------------------------------------------------------
-- Append-only revocation / seal integrity ledger
-- ---------------------------------------------------------------------------
create table if not exists public.consent_revocation_events (
  id bigint generated always as identity primary key,
  session_id uuid not null references public.sessions(id) on delete cascade,
  snapshot_id uuid references public.consent_snapshots(id) on delete set null,
  actor_id uuid not null references auth.users(id) on delete restrict,
  cause text not null
    check (cause in (
      'soft_signal',
      'unilateral_withdraw',
      'material_invalidation',
      'peer_block',
      'account_restriction',
      'offline_reconcile',
      'safety_end'
    )),
  prior_lifecycle text,
  resulting_lifecycle text,
  fingerprint text,
  idempotency_key text
    check (idempotency_key is null or char_length(idempotency_key) between 1 and 128),
  metadata jsonb not null default '{}'::jsonb
    check (jsonb_typeof(metadata) = 'object'),
  created_at timestamptz not null default now()
);

create unique index if not exists consent_revocation_events_idem_uidx
  on public.consent_revocation_events (session_id, idempotency_key)
  where idempotency_key is not null;

create index consent_revocation_events_session_idx
  on public.consent_revocation_events (session_id, created_at desc);

comment on table public.consent_revocation_events is
  'Append-only consent revocation propagation log. Soft Signal / withdraw never require peer permission.';

alter table public.consent_revocation_events enable row level security;
revoke all on public.consent_revocation_events from authenticated, anon, public;
grant select, insert on public.consent_revocation_events to service_role;

-- Participants may read revocation events for their own sessions (no private notes).
create policy "participants read session revocations"
  on public.consent_revocation_events
  for select to authenticated
  using (
    exists (
      select 1 from public.sessions s
      where s.id = session_id and auth.uid() in (s.user_a, s.user_b)
    )
  );
grant select on public.consent_revocation_events to authenticated;

create or replace function public.append_consent_revocation_event(
  p_session_id uuid,
  p_snapshot_id uuid,
  p_actor_id uuid,
  p_cause text,
  p_prior_lifecycle text,
  p_resulting_lifecycle text,
  p_fingerprint text default null,
  p_idempotency_key text default null,
  p_metadata jsonb default '{}'::jsonb
)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id bigint;
begin
  if p_session_id is null or p_actor_id is null or p_cause is null then
    raise exception using errcode = '22023', message = 'invalid revocation event';
  end if;

  if p_idempotency_key is not null then
    select id into v_id
      from public.consent_revocation_events
     where session_id = p_session_id
       and idempotency_key = p_idempotency_key;
    if found then return v_id; end if;
  end if;

  insert into public.consent_revocation_events (
    session_id, snapshot_id, actor_id, cause,
    prior_lifecycle, resulting_lifecycle, fingerprint,
    idempotency_key, metadata
  ) values (
    p_session_id, p_snapshot_id, p_actor_id, p_cause,
    p_prior_lifecycle, p_resulting_lifecycle, p_fingerprint,
    p_idempotency_key, coalesce(p_metadata, '{}'::jsonb)
  )
  returning id into v_id;
  return v_id;
end;
$$;

revoke all on function public.append_consent_revocation_event(
  uuid, uuid, uuid, text, text, text, text, text, jsonb
) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Offline intent queue (durable reconcile; Soft Signal priority in app/domain)
-- ---------------------------------------------------------------------------
create table if not exists public.session_offline_intents (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions(id) on delete cascade,
  actor_id uuid not null references auth.users(id) on delete cascade,
  kind text not null
    check (kind in (
      'soft_signal',
      'withdraw',
      'complete',
      'confirm_snapshot',
      'wrap_up_submit',
      'wrap_up_skip',
      'activate'
    )),
  idempotency_key text not null
    check (char_length(idempotency_key) between 1 and 128),
  fingerprint text
    check (fingerprint is null or fingerprint ~ '^[0-9a-f]{64}$'),
  payload jsonb not null default '{}'::jsonb
    check (jsonb_typeof(payload) = 'object'),
  status text not null default 'pending'
    check (status in ('pending', 'applied', 'rejected', 'noop')),
  resolve_reason text,
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  unique (session_id, actor_id, idempotency_key)
);

create index session_offline_intents_pending_idx
  on public.session_offline_intents (session_id, created_at)
  where status = 'pending';

comment on table public.session_offline_intents is
  'Durable offline lifecycle intents. Reconcile must prefer Soft Signal over complete (ADR 0062).';

alter table public.session_offline_intents enable row level security;
revoke all on public.session_offline_intents from authenticated, anon, public;
grant select, insert, update on public.session_offline_intents to service_role;

create policy "actors read own offline intents"
  on public.session_offline_intents
  for select to authenticated
  using (auth.uid() = actor_id);
grant select on public.session_offline_intents to authenticated;

create or replace function public.enqueue_session_offline_intent(
  p_session_id uuid,
  p_kind text,
  p_idempotency_key text,
  p_fingerprint text default null,
  p_payload jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_id uuid;
begin
  if v_actor is null then
    raise exception using errcode = '42501', message = 'authentication required';
  end if;
  if p_session_id is null or p_kind is null or p_idempotency_key is null then
    raise exception using errcode = '22023', message = 'invalid offline intent';
  end if;
  if p_kind not in (
    'soft_signal', 'withdraw', 'complete', 'confirm_snapshot',
    'wrap_up_submit', 'wrap_up_skip', 'activate'
  ) then
    raise exception using errcode = '22023', message = 'invalid offline intent kind';
  end if;
  if not exists (
    select 1 from public.sessions s
    where s.id = p_session_id and v_actor in (s.user_a, s.user_b)
  ) then
    raise exception using errcode = '42501', message = 'session not found or access denied';
  end if;

  insert into public.session_offline_intents (
    session_id, actor_id, kind, idempotency_key, fingerprint, payload
  ) values (
    p_session_id, v_actor, p_kind, p_idempotency_key,
    p_fingerprint, coalesce(p_payload, '{}'::jsonb)
  )
  on conflict (session_id, actor_id, idempotency_key) do update
    set payload = excluded.payload
  returning id into v_id;

  return v_id;
end;
$$;

revoke all on function public.enqueue_session_offline_intent(
  uuid, text, text, text, jsonb
) from public, anon;
grant execute on function public.enqueue_session_offline_intent(
  uuid, text, text, text, jsonb
) to authenticated;

-- ---------------------------------------------------------------------------
-- Seal authority view (dual confirm + withdraw/invalid; no peer leak of times)
-- ---------------------------------------------------------------------------
create or replace function public.session_seal_authority(p_session_id uuid)
returns table (
  has_snapshot boolean,
  snapshot_id uuid,
  fingerprint text,
  withdrawn boolean,
  invalidated boolean,
  confirmed_by_self boolean,
  confirmed_by_peer boolean,
  mutually_confirmed boolean,
  lifecycle text
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_session public.sessions%rowtype;
  v_snap public.consent_snapshots%rowtype;
  v_self boolean := false;
  v_peer boolean := false;
  v_peer_id uuid;
begin
  if v_actor is null then
    raise exception using errcode = '42501', message = 'authentication required';
  end if;

  select * into v_session
    from public.sessions s
   where s.id = p_session_id
     and v_actor in (s.user_a, s.user_b);
  if not found then
    raise exception using errcode = '42501', message = 'session not found or access denied';
  end if;

  v_peer_id := case
    when v_actor = v_session.user_a then v_session.user_b
    else v_session.user_a
  end;

  select * into v_snap
    from public.consent_snapshots cs
   where cs.session_id = p_session_id
     and cs.withdrawn_at is null
     and cs.invalidated_at is null
   order by cs.created_at desc
   limit 1;

  if found then
    select exists (
      select 1 from public.consent_snapshot_confirmations c
      where c.snapshot_id = v_snap.id
        and c.user_id = v_actor
        and c.fingerprint = v_snap.fingerprint
    ) into v_self;
    select exists (
      select 1 from public.consent_snapshot_confirmations c
      where c.snapshot_id = v_snap.id
        and c.user_id = v_peer_id
        and c.fingerprint = v_snap.fingerprint
    ) into v_peer;
  end if;

  return query
  select
    found,
    v_snap.id,
    v_snap.fingerprint,
    coalesce(v_snap.withdrawn_at is not null, false),
    coalesce(v_snap.invalidated_at is not null, false),
    v_self,
    v_peer,
    (found and v_self and v_peer and v_snap.withdrawn_at is null and v_snap.invalidated_at is null),
    v_session.status;
end;
$$;

revoke all on function public.session_seal_authority(uuid) from public, anon;
grant execute on function public.session_seal_authority(uuid) to authenticated;

comment on function public.session_seal_authority(uuid) is
  'Self+peer confirmation booleans for dual seal without exposing peer confirmation timestamps.';

-- ---------------------------------------------------------------------------
-- Wire revocation ledger into withdraw_session_consent (session-id form, 014)
-- ---------------------------------------------------------------------------
create or replace function public.withdraw_session_consent(
  p_session_id uuid,
  p_idempotency_key text
) returns text language plpgsql security definer set search_path = '' as $$
declare
  v_actor uuid:=auth.uid();
  v_status text;
  v_target text;
  v_replayed text;
  v_snapshot_id uuid;
  v_fingerprint text;
begin
  if v_actor is null then raise exception using errcode='42501',message='authentication required'; end if;
  if p_idempotency_key is null or char_length(p_idempotency_key) not between 1 and 128
  then raise exception using errcode='22023',message='invalid withdrawal request'; end if;

  perform cs.id from public.consent_snapshots cs join public.sessions s on s.id=cs.session_id
   where cs.session_id=p_session_id and v_actor in (s.user_a,s.user_b) for update of cs;
  select status into v_status from public.sessions
   where id=p_session_id and v_actor in (user_a,user_b) for update;
  if not found then raise exception using errcode='42501',message='session not found or access denied'; end if;

  select resulting_state into v_replayed from public.session_events
   where session_id=p_session_id and idempotency_key=p_idempotency_key;
  if found then return v_replayed; end if;
  if v_status in ('completed','declined','cancelled','expired','soft_signaled','safety_ended')
  then return v_status; end if;
  if v_status in ('requested','consent_pending','ready') then v_target:='cancelled';
  elsif v_status='active' then v_target:='soft_signaled';
  else raise exception using errcode='55000',message='session cannot be withdrawn in this state'; end if;

  select cs.id, cs.fingerprint into v_snapshot_id, v_fingerprint
    from public.consent_snapshots cs
   where cs.session_id=p_session_id
     and cs.invalidated_at is null
   order by cs.created_at desc
   limit 1;

  update public.consent_snapshots set
    withdrawn_by=v_actor,withdrawn_at=coalesce(withdrawn_at,now())
   where session_id=p_session_id and invalidated_at is null;
  delete from public.consent_snapshot_confirmations c using public.consent_snapshots cs
   where c.snapshot_id=cs.id and cs.session_id=p_session_id;
  update public.sessions set status=v_target,
    ended_at=case when v_target='soft_signaled' then now() else ended_at end,
    exit_reason=case when v_target='soft_signaled' then 'soft_signal' else 'cancelled' end
   where id=p_session_id;
  insert into public.session_events(
    session_id,actor_id,event_type,prior_state,resulting_state,idempotency_key,metadata
  ) values(p_session_id,v_actor,'consent_withdrawal',v_status,v_target,p_idempotency_key,'{}');

  perform public.append_consent_revocation_event(
    p_session_id,
    v_snapshot_id,
    v_actor,
    case when v_target = 'soft_signaled' then 'soft_signal' else 'unilateral_withdraw' end,
    v_status,
    v_target,
    v_fingerprint,
    p_idempotency_key,
    jsonb_build_object('source', 'withdraw_session_consent')
  );

  return v_target;
end; $$;

revoke all on function public.withdraw_session_consent(uuid,text) from public,anon;
grant execute on function public.withdraw_session_consent(uuid,text) to authenticated;

-- ---------------------------------------------------------------------------
-- Wrap-up: allow skipped outcome (private, independent)
-- ---------------------------------------------------------------------------
alter table public.session_wrapups
  drop constraint if exists session_wrapups_outcome_check;

alter table public.session_wrapups
  add constraint session_wrapups_outcome_check check (outcome in (
    'completed_comfortably',
    'ended_normally',
    'soft_signal_used',
    'felt_uncomfortable',
    'safety_concern',
    'skipped'
  ));

create or replace function public.submit_session_wrapup(
  p_session_id uuid,
  p_outcome text,
  p_private_note text,
  p_idempotency_key text
) returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_actor uuid:=auth.uid();
  v_session public.sessions%rowtype;
  v_existing uuid;
  v_id uuid;
begin
  if v_actor is null then raise exception using errcode='42501',message='authentication required'; end if;
  if p_outcome is null or p_outcome not in (
    'completed_comfortably','ended_normally','soft_signal_used','felt_uncomfortable','safety_concern','skipped'
  ) or p_idempotency_key is null or char_length(p_idempotency_key) not between 1 and 128
    or char_length(coalesce(p_private_note,''))>2000
  then raise exception using errcode='22023',message='invalid private wrap-up'; end if;

  select * into v_session from public.sessions
   where id=p_session_id and v_actor in (user_a,user_b) for share;
  if not found then raise exception using errcode='42501',message='session not found or access denied'; end if;
  if v_session.status not in ('completed','soft_signaled','safety_ended')
  then raise exception using errcode='55000',message='session is not ready for wrap-up'; end if;

  select id into v_existing from public.session_wrapups
   where session_id=p_session_id and user_id=v_actor;
  if found then return v_existing; end if;

  insert into public.session_wrapups(session_id,user_id,outcome,private_note,idempotency_key)
  values(p_session_id,v_actor,p_outcome,nullif(trim(p_private_note),''),p_idempotency_key)
  returning id into v_id;
  return v_id;
end; $$;

revoke all on function public.submit_session_wrapup(uuid,text,text,text) from public,anon;
grant execute on function public.submit_session_wrapup(uuid,text,text,text) to authenticated;

comment on function public.submit_session_wrapup(uuid,text,text,text) is
  'Private per-participant wrap-up after terminal session. Includes skipped. Peer cannot read.';
