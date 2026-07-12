-- Chapter 5 structured reports (ADR 0026).
-- Intake only: reporter submits category + optional encrypted note + optional
-- session reference. Reporter-visible status is coarse. Internal moderator
-- notes and triage live in a later migration (human-review queue).
-- The reported party never sees who reported them or the report content.

create table public.user_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references auth.users(id) on delete cascade,
  reported_id uuid not null references auth.users(id) on delete cascade,
  session_id uuid references public.sessions(id) on delete set null,
  category text not null
    check (
      category in (
        'harassment',
        'coercion_pressure',
        'boundary_violation',
        'unsafe_behavior',
        'impersonation',
        'underage_concern',
        'spam_scam',
        'other'
      )
    ),
  private_note text
    check (
      private_note is null or (
        char_length(private_note) <= 8192
        and private_note like 'litmo:encrypted:v1:%'
      )
    ),
  -- Reporter-visible only. Never expose internal triage fields here.
  status text not null default 'submitted'
    check (status in ('submitted', 'under_review', 'closed')),
  -- Coarse outcome for the reporter when closed; no operational detail.
  closed_outcome text
    check (
      closed_outcome is null
      or closed_outcome in ('no_action', 'action_taken', 'info_needed')
    ),
  idempotency_key text
    check (
      idempotency_key is null
      or char_length(idempotency_key) between 1 and 128
    ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (reporter_id <> reported_id),
  check (
    (status = 'closed' and closed_outcome is not null)
    or (status <> 'closed' and closed_outcome is null)
  )
);

create unique index user_reports_reporter_idempotency_uidx
  on public.user_reports (reporter_id, idempotency_key)
  where idempotency_key is not null;

create index user_reports_reporter_id_idx
  on public.user_reports (reporter_id, created_at desc);

create index user_reports_reported_id_idx
  on public.user_reports (reported_id, created_at desc);

create index user_reports_session_id_idx
  on public.user_reports (session_id)
  where session_id is not null;

comment on table public.user_reports is
  'Structured safety reports. Reporter reads coarse status only; reported party has no access. Private notes are application-encrypted envelopes.';

comment on column public.user_reports.private_note is
  'Optional reporter-private encrypted envelope; plaintext rejected. Not readable by the reported party.';

alter table public.user_reports enable row level security;

-- Direct table access is intentionally narrow: reporters may select their own
-- rows (status + non-sensitive columns). Writes only via security-definer RPCs.
create policy "reporters read own reports"
  on public.user_reports
  for select
  to authenticated
  using (reporter_id = auth.uid());

grant select on public.user_reports to authenticated;
revoke insert, update, delete on public.user_reports from authenticated, anon, public;

create or replace function public.submit_report(
  p_reported_id uuid,
  p_category text,
  p_session_id uuid default null,
  p_private_note text default null,
  p_idempotency_key text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_existing uuid;
  v_id uuid;
  v_session public.sessions%rowtype;
begin
  if v_actor is null then
    raise exception using errcode = '42501', message = 'authentication required';
  end if;

  if p_reported_id is null or p_reported_id = v_actor then
    raise exception using errcode = '22023', message = 'invalid report target';
  end if;

  if p_category is null or p_category not in (
    'harassment',
    'coercion_pressure',
    'boundary_violation',
    'unsafe_behavior',
    'impersonation',
    'underage_concern',
    'spam_scam',
    'other'
  ) then
    raise exception using errcode = '22023', message = 'invalid report category';
  end if;

  if p_idempotency_key is not null and (
    char_length(p_idempotency_key) < 1 or char_length(p_idempotency_key) > 128
  ) then
    raise exception using errcode = '22023', message = 'invalid idempotency key';
  end if;

  if p_private_note is not null and (
    char_length(p_private_note) > 8192
    or p_private_note not like 'litmo:encrypted:v1:%'
  ) then
    raise exception using errcode = '22023', message = 'invalid private note';
  end if;

  if p_idempotency_key is not null then
    select r.id into v_existing
      from public.user_reports as r
     where r.reporter_id = v_actor
       and r.idempotency_key = p_idempotency_key;
    if found then
      return v_existing;
    end if;
  end if;

  -- Opaque: do not reveal whether the account exists if the profile is missing.
  if not exists (select 1 from public.profiles where user_id = p_reported_id) then
    raise exception using
      errcode = '42501',
      message = 'that person is not available';
  end if;

  if p_session_id is not null then
    select * into v_session
      from public.sessions as s
     where s.id = p_session_id
       and v_actor in (s.user_a, s.user_b)
     for share;
    if not found then
      raise exception using
        errcode = '42501',
        message = 'session not found or access denied';
    end if;
    -- Session must involve the reported party.
    if p_reported_id not in (v_session.user_a, v_session.user_b) then
      raise exception using
        errcode = '22023',
        message = 'session does not involve that person';
    end if;
  end if;

  insert into public.user_reports (
    reporter_id,
    reported_id,
    session_id,
    category,
    private_note,
    status,
    idempotency_key
  ) values (
    v_actor,
    p_reported_id,
    p_session_id,
    p_category,
    nullif(trim(p_private_note), ''),
    'submitted',
    p_idempotency_key
  )
  returning id into v_id;

  return v_id;
end;
$$;

revoke all on function public.submit_report(uuid, text, uuid, text, text) from public, anon;
grant execute on function public.submit_report(uuid, text, uuid, text, text) to authenticated;

comment on function public.submit_report(uuid, text, uuid, text, text) is
  'Submits a structured safety report. Returns existing id for the same reporter idempotency key. Reported party has no visibility.';

create or replace function public.list_my_reports()
returns table (
  id uuid,
  reported_id uuid,
  session_id uuid,
  category text,
  status text,
  closed_outcome text,
  created_at timestamptz
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
    r.id,
    r.reported_id,
    r.session_id,
    r.category,
    r.status,
    r.closed_outcome,
    r.created_at
  from public.user_reports as r
  where r.reporter_id = v_actor
  order by r.created_at desc;
end;
$$;

revoke all on function public.list_my_reports() from public, anon;
grant execute on function public.list_my_reports() to authenticated;

comment on function public.list_my_reports() is
  'Reporter-visible report history: category, coarse status, optional closed outcome. Never returns private notes or internal triage.';
