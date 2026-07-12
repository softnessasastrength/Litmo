-- Chapter 5 append-only trust events (ADR 0029).
-- Specific, legible signals — never a universal safety score.
-- Users may read only their own coarse self-summary via my_trust_signals.

create table public.trust_events (
  id uuid primary key default gen_random_uuid(),
  subject_user_id uuid not null references auth.users(id) on delete cascade,
  event_type text not null
    check (
      event_type in (
        'profile_completed',
        'age_adult_confirmed',
        'session_completed',
        'session_soft_signaled',
        'session_safety_ended',
        'report_submitted',
        'moderation_closed'
      )
    ),
  actor_id uuid references auth.users(id) on delete set null,
  session_id uuid references public.sessions(id) on delete set null,
  report_id uuid references public.user_reports(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb
    check (jsonb_typeof(metadata) = 'object'),
  created_at timestamptz not null default now()
);

create index trust_events_subject_created_idx
  on public.trust_events (subject_user_id, created_at desc);

create index trust_events_type_created_idx
  on public.trust_events (event_type, created_at desc);

comment on table public.trust_events is
  'Append-only provenance for specific trust signals. Not a ranking score. No public negative reviews.';

alter table public.trust_events enable row level security;
-- No direct authenticated access; expose only via my_trust_signals.
revoke all on public.trust_events from authenticated, anon, public;
grant select, insert on public.trust_events to service_role;

create or replace function public.append_trust_event(
  p_subject_user_id uuid,
  p_event_type text,
  p_actor_id uuid default null,
  p_session_id uuid default null,
  p_report_id uuid default null,
  p_metadata jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
begin
  if p_subject_user_id is null or p_event_type is null then
    raise exception using errcode = '22023', message = 'invalid trust event';
  end if;

  insert into public.trust_events (
    subject_user_id,
    event_type,
    actor_id,
    session_id,
    report_id,
    metadata
  ) values (
    p_subject_user_id,
    p_event_type,
    p_actor_id,
    p_session_id,
    p_report_id,
    coalesce(p_metadata, '{}'::jsonb)
  )
  returning id into v_id;
  return v_id;
end;
$$;

revoke all on function public.append_trust_event(uuid, text, uuid, uuid, uuid, jsonb)
  from public, anon, authenticated;

-- Self-only coarse signals. No score, no other-user data.
create or replace function public.my_trust_signals()
returns table (
  account_age_days integer,
  profile_complete boolean,
  adult_eligible boolean,
  completed_sessions integer,
  soft_signaled_sessions integer,
  safety_ended_sessions integer
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
begin
  if v_actor is null then
    raise exception using errcode = '42501', message = 'authentication required';
  end if;

  return query
  select
    greatest(
      0,
      floor(
        extract(
          epoch from (now() - u.created_at)
        ) / 86400.0
      )::integer
    ) as account_age_days,
    (p.onboarding_completed_at is not null) as profile_complete,
    (p.age_signal_status = 'adult') as adult_eligible,
    (
      select count(*)::integer
      from public.trust_events as te
      where te.subject_user_id = v_actor
        and te.event_type = 'session_completed'
    ) as completed_sessions,
    (
      select count(*)::integer
      from public.trust_events as te
      where te.subject_user_id = v_actor
        and te.event_type = 'session_soft_signaled'
    ) as soft_signaled_sessions,
    (
      select count(*)::integer
      from public.trust_events as te
      where te.subject_user_id = v_actor
        and te.event_type = 'session_safety_ended'
    ) as safety_ended_sessions
  from auth.users as u
  left join public.profiles as p on p.user_id = u.id
  where u.id = v_actor;
end;
$$;

revoke all on function public.my_trust_signals() from public, anon;
grant execute on function public.my_trust_signals() to authenticated;

comment on function public.my_trust_signals() is
  'Self-only specific trust signals (account age, profile complete, adult flag, terminal session counts). Never a universal safety score (ADR 0029).';

-- Profile onboarding completion → profile_completed (once when first set).
create or replace function public.tg_trust_profile_completed()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.onboarding_completed_at is not null
     and (old.onboarding_completed_at is null)
  then
    perform public.append_trust_event(
      new.user_id,
      'profile_completed',
      new.user_id,
      null,
      null,
      '{}'::jsonb
    );
  end if;
  return new;
end;
$$;

create trigger trust_profile_completed
  after update of onboarding_completed_at on public.profiles
  for each row
  execute function public.tg_trust_profile_completed();

-- Adult age signal.
create or replace function public.tg_trust_age_adult()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.age_signal_status = 'adult'
     and (old.age_signal_status is distinct from 'adult')
  then
    perform public.append_trust_event(
      new.user_id,
      'age_adult_confirmed',
      new.user_id,
      null,
      null,
      jsonb_build_object(
        'source', coalesce(new.age_signal_source, 'unknown')
      )
    );
  end if;
  return new;
end;
$$;

create trigger trust_age_adult
  after update of age_signal_status on public.profiles
  for each row
  execute function public.tg_trust_age_adult();

-- Terminal session outcomes for both participants.
create or replace function public.tg_trust_session_terminal()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_type text;
begin
  if new.status is not distinct from old.status then
    return new;
  end if;

  v_type := case new.status
    when 'completed' then 'session_completed'
    when 'soft_signaled' then 'session_soft_signaled'
    when 'safety_ended' then 'session_safety_ended'
    else null
  end;

  if v_type is null then
    return new;
  end if;

  perform public.append_trust_event(
    new.user_a, v_type, null, new.id, null,
    jsonb_build_object('peer_role', 'user_a')
  );
  perform public.append_trust_event(
    new.user_b, v_type, null, new.id, null,
    jsonb_build_object('peer_role', 'user_b')
  );
  return new;
end;
$$;

create trigger trust_session_terminal
  after update of status on public.sessions
  for each row
  execute function public.tg_trust_session_terminal();

-- Report intake (subject = reported party; actor = reporter). Staff-only later.
create or replace function public.tg_trust_report_submitted()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.append_trust_event(
    new.reported_id,
    'report_submitted',
    new.reporter_id,
    new.session_id,
    new.id,
    jsonb_build_object('category', new.category)
  );
  return new;
end;
$$;

create trigger trust_report_submitted
  after insert on public.user_reports
  for each row
  execute function public.tg_trust_report_submitted();

-- Moderation close (subject = reported party).
create or replace function public.tg_trust_moderation_closed()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status = 'closed'
     and (old.status is distinct from 'closed')
  then
    perform public.append_trust_event(
      new.reported_id,
      'moderation_closed',
      null,
      new.session_id,
      new.id,
      jsonb_build_object(
        'closed_outcome', coalesce(new.closed_outcome, 'unknown')
      )
    );
  end if;
  return new;
end;
$$;

create trigger trust_moderation_closed
  after update of status on public.user_reports
  for each row
  execute function public.tg_trust_moderation_closed();
