-- A material profile edit invalidates every pre-activation snapshot that
-- references the participant's older exact version. It never alters active or
-- terminal sessions and never silently carries confirmations forward.
alter table public.consent_snapshots
  add column invalidated_at timestamptz,
  add column invalidated_by uuid references auth.users(id) on delete set null,
  add constraint consent_snapshots_invalidation_pair
    check ((invalidated_at is null) = (invalidated_by is null));

-- Keep synchronized with shared/src/sessionLifecycle.ts. Profile invalidation
-- is the only reason a ready session can return to consent_pending.
create or replace function public.transition_session(
  p_session_id uuid,
  p_to_state text,
  p_idempotency_key text default null,
  p_metadata jsonb default '{}'::jsonb
)
returns text language plpgsql security definer set search_path = '' as $$
declare
  v_actor_id uuid := auth.uid();
  v_prior_state text;
  v_replayed_state text;
  v_allowed boolean := false;
begin
  if v_actor_id is null then raise exception using errcode='42501', message='authentication required'; end if;
  if p_to_state is null or p_to_state not in (
    'draft','requested','accepted','consent_pending','ready','active',
    'completed','declined','cancelled','expired','soft_signaled','safety_ended'
  ) then raise exception using errcode='22023', message='invalid session lifecycle state'; end if;
  if p_idempotency_key is not null and (length(p_idempotency_key) < 1 or length(p_idempotency_key) > 128)
  then raise exception using errcode='22023', message='idempotency key must contain between 1 and 128 characters'; end if;
  if p_metadata is null or jsonb_typeof(p_metadata) <> 'object'
    or p_metadata - array['source','trigger'] <> '{}'::jsonb
    or (p_metadata ? 'source' and p_metadata->>'source' not in ('mobile','web','api','test'))
    or (p_metadata ? 'trigger' and p_metadata->>'trigger' not in ('user_action','retry','material_profile_change'))
  then raise exception using errcode='22023', message='session transition metadata contains unsupported fields or values'; end if;

  select status into v_prior_state from public.sessions
   where id=p_session_id and v_actor_id in (user_a,user_b) for update;
  if not found then raise exception using errcode='42501', message='session not found or access denied'; end if;
  if p_idempotency_key is not null then
    select resulting_state into v_replayed_state from public.session_events
     where session_id=p_session_id and idempotency_key=p_idempotency_key;
    if found then return v_replayed_state; end if;
  end if;
  if v_prior_state in ('completed','declined','cancelled','expired','soft_signaled','safety_ended')
  then raise exception using errcode='55000', message='session is already terminal'; end if;
  if v_prior_state=p_to_state then return v_prior_state; end if;
  v_allowed := (v_prior_state,p_to_state) in (
    ('draft','requested'),('requested','accepted'),('requested','declined'),
    ('requested','cancelled'),('requested','expired'),('accepted','consent_pending'),
    ('consent_pending','ready'),('consent_pending','cancelled'),('consent_pending','expired'),
    ('ready','consent_pending'),('ready','active'),('ready','cancelled'),('ready','expired'),
    ('active','completed'),('active','soft_signaled'),('active','safety_ended')
  );
  if not v_allowed then raise exception using errcode='55000', message='invalid session lifecycle transition'; end if;
  update public.sessions set status=p_to_state where id=p_session_id;
  insert into public.session_events(session_id,actor_id,event_type,prior_state,resulting_state,idempotency_key,metadata)
  values(p_session_id,v_actor_id,'session_transition',v_prior_state,p_to_state,p_idempotency_key,p_metadata);
  return p_to_state;
end; $$;

create or replace function public.save_profile_versions(
  touch_profile jsonb,
  consent_preferences jsonb,
  touch_private_notes text default null,
  consent_private_notes text default null
)
returns table (touch_version integer, consent_version integer)
language plpgsql security definer set search_path = '' as $$
declare
  actor uuid := auth.uid();
  next_touch integer;
  next_consent integer;
  affected record;
begin
  if actor is null then raise exception using errcode='42501', message='authentication_required'; end if;
  if jsonb_typeof(touch_profile) <> 'object' or jsonb_typeof(consent_preferences) <> 'object'
  then raise exception using errcode='22023', message='invalid_profile_payload'; end if;
  if char_length(coalesce(touch_private_notes,'')) > 1000 or char_length(coalesce(consent_private_notes,'')) > 1000
  then raise exception using errcode='22023', message='private_note_too_long'; end if;
  perform pg_advisory_xact_lock(hashtextextended(actor::text,0));
  select coalesce(max(version),0)+1 into next_touch from public.touch_profile_versions where user_id=actor;
  select coalesce(max(version),0)+1 into next_consent from public.consent_preference_versions where user_id=actor;
  insert into public.touch_profile_versions(user_id,version,profile,private_nervous_system_notes)
    values(actor,next_touch,touch_profile-'privateNervousSystemNotes',touch_private_notes);
  insert into public.consent_preference_versions(user_id,version,preferences,private_nervous_system_notes)
    values(actor,next_consent,consent_preferences-'privateNervousSystemNotes',consent_private_notes);

  for affected in
    select cs.id snapshot_id, cs.session_id, s.status
      from public.consent_snapshots cs
      join public.sessions s on s.id=cs.session_id
     where cs.invalidated_at is null and cs.withdrawn_at is null
       and s.status in ('consent_pending','ready')
       and ((s.user_a=actor and cs.profile_a_version<>next_touch)
         or (s.user_b=actor and cs.profile_b_version<>next_touch))
     for update of cs, s
  loop
    update public.consent_snapshots set invalidated_at=now(), invalidated_by=actor
     where id=affected.snapshot_id;
    delete from public.consent_snapshot_confirmations where snapshot_id=affected.snapshot_id;
    if affected.status='ready' then
      perform public.transition_session(
        affected.session_id,'consent_pending',
        'profile-change-'||affected.snapshot_id::text||'-v'||next_touch::text,
        '{"source":"api","trigger":"material_profile_change"}'::jsonb
      );
    else
      insert into public.session_events(
        session_id,actor_id,event_type,prior_state,resulting_state,snapshot_version,idempotency_key,metadata
      ) values(
        affected.session_id,actor,'snapshot_invalidated','consent_pending','consent_pending',next_touch,
        'profile-change-'||affected.snapshot_id::text||'-v'||next_touch::text,
        '{"source":"api","trigger":"material_profile_change"}'::jsonb
      );
    end if;
  end loop;
  return query select next_touch,next_consent;
end; $$;

create or replace function public.enforce_active_snapshot() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.status='active' and old.status is distinct from 'active' and not exists (
    select 1 from public.consent_snapshots cs where cs.session_id=new.id
      and cs.withdrawn_at is null and cs.invalidated_at is null
      and (select count(*) from public.consent_snapshot_confirmations c
           where c.snapshot_id=cs.id and c.fingerprint=cs.fingerprint
             and c.user_id in (new.user_a,new.user_b))=2
  ) then raise exception using errcode='55000', message='both participants must confirm the current snapshot before activation'; end if;
  return new;
end; $$;

create or replace function public.confirm_session_snapshot(p_snapshot_id uuid,p_fingerprint text)
returns text language plpgsql security definer set search_path = '' as $$
declare
  v_actor uuid:=auth.uid(); v_snapshot public.consent_snapshots%rowtype;
  v_session public.sessions%rowtype; v_count integer;
begin
  select * into v_snapshot from public.consent_snapshots where id=p_snapshot_id for update;
  if not found then raise exception using errcode='42501', message='snapshot not found or access denied'; end if;
  select * into v_session from public.sessions where id=v_snapshot.session_id for update;
  if v_actor is null or v_actor not in (v_session.user_a,v_session.user_b)
  then raise exception using errcode='42501', message='snapshot not found or access denied'; end if;
  if v_session.status<>'consent_pending' or v_snapshot.withdrawn_at is not null
    or v_snapshot.invalidated_at is not null or p_fingerprint<>v_snapshot.fingerprint
  then raise exception using errcode='55000', message='snapshot confirmation rejected'; end if;
  insert into public.consent_snapshot_confirmations(snapshot_id,user_id,fingerprint)
    values(p_snapshot_id,v_actor,p_fingerprint)
    on conflict(snapshot_id,user_id) do update set fingerprint=excluded.fingerprint,confirmed_at=now();
  select count(*) into v_count from public.consent_snapshot_confirmations
    where snapshot_id=p_snapshot_id and fingerprint=v_snapshot.fingerprint;
  if v_count=2 then
    perform public.transition_session(v_snapshot.session_id,'ready','snapshot-ready-'||p_snapshot_id::text,
      '{"source":"api","trigger":"user_action"}'::jsonb);
    return 'ready';
  end if;
  return 'consent_pending';
end; $$;
