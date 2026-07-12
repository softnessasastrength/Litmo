-- Chapter 5 staff case evidence (ADR 0037).
-- Reporter free text for moderators is server-readable (staff RPC only).
-- Device-encrypted private_note remains optional/legacy and is never decrypted
-- server-side. Staff also get linked session metadata + pattern counts (not a score).

alter table public.user_reports
  add column if not exists staff_shared_message text
    check (
      staff_shared_message is null
      or (
        char_length(staff_shared_message) between 1 and 2000
      )
    );

comment on column public.user_reports.staff_shared_message is
  'Optional plain text the reporter chose to share with human reviewers. Staff-only via RPC; never shown to the reported party. Not device-encrypted.';

-- Replace submit_report so new reports can carry staff-shared text.
-- Signature adds p_staff_shared_message; drop prior 5-arg overload.
drop function if exists public.submit_report(uuid, text, uuid, text, text);

create function public.submit_report(
  p_reported_id uuid,
  p_category text,
  p_session_id uuid default null,
  p_private_note text default null,
  p_idempotency_key text default null,
  p_staff_shared_message text default null
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
  v_staff_msg text := nullif(trim(coalesce(p_staff_shared_message, '')), '');
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

  if v_staff_msg is not null and char_length(v_staff_msg) > 2000 then
    raise exception using errcode = '22023', message = 'invalid staff shared message';
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
    if p_reported_id not in (v_session.user_a, v_session.user_b) then
      raise exception using
        errcode = '22023',
        message = 'session does not involve that person';
    end if;
  end if;

  perform public.assert_under_rate_limit(v_actor, 'report');

  insert into public.user_reports (
    reporter_id,
    reported_id,
    session_id,
    category,
    private_note,
    staff_shared_message,
    status,
    idempotency_key
  ) values (
    v_actor,
    p_reported_id,
    p_session_id,
    p_category,
    nullif(trim(p_private_note), ''),
    v_staff_msg,
    'submitted',
    p_idempotency_key
  )
  returning id into v_id;

  return v_id;
end;
$$;

revoke all on function public.submit_report(uuid, text, uuid, text, text, text) from public, anon;
grant execute on function public.submit_report(uuid, text, uuid, text, text, text) to authenticated;

comment on function public.submit_report(uuid, text, uuid, text, text, text) is
  'Structured safety report. Optional staff_shared_message is human-reviewer readable. Optional private_note remains device-encrypted envelope only. Rate-limited; idempotent keys do not re-consume budget.';

-- Staff-only case evidence pack (not a universal safety score).
create or replace function public.get_moderation_case_evidence(p_case_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_case public.moderation_cases%rowtype;
  v_report public.user_reports%rowtype;
  v_session public.sessions%rowtype;
  v_has_session boolean := false;
  v_restriction_kind text := null;
  v_prior_open integer := 0;
  v_prior_total integer := 0;
begin
  if v_actor is null or not public.is_staff_moderator(v_actor) then
    raise exception using errcode = '42501', message = 'moderator access required';
  end if;
  if p_case_id is null then
    raise exception using errcode = '22023', message = 'case id required';
  end if;

  select * into v_case
    from public.moderation_cases as c
   where c.id = p_case_id;
  if not found then
    raise exception using errcode = 'P0002', message = 'case not found';
  end if;

  select * into v_report
    from public.user_reports as r
   where r.id = v_case.report_id;
  if not found then
    raise exception using errcode = 'P0002', message = 'report not found';
  end if;

  if v_report.session_id is not null then
    select * into v_session
      from public.sessions as s
     where s.id = v_report.session_id;
    v_has_session := found;
  end if;

  select r.kind into v_restriction_kind
    from public.account_restrictions as r
   where r.user_id = v_report.reported_id
     and r.lifted_at is null
     and r.starts_at <= now()
     and (r.ends_at is null or r.ends_at > now())
   order by r.created_at desc
   limit 1;

  select count(*)::integer into v_prior_total
    from public.user_reports as r
   where r.reported_id = v_report.reported_id
     and r.id <> v_report.id;

  select count(*)::integer into v_prior_open
    from public.user_reports as r
    join public.moderation_cases as c on c.report_id = r.id
   where r.reported_id = v_report.reported_id
     and r.id <> v_report.id
     and c.queue_status in ('open', 'in_progress', 'escalated');

  return jsonb_build_object(
    'case_id', v_case.id,
    'report_id', v_report.id,
    'priority', v_case.priority,
    'queue_status', v_case.queue_status,
    'assigned_to', v_case.assigned_to,
    'category', v_report.category,
    'report_status', v_report.status,
    'report_created_at', v_report.created_at,
    'reporter_id', v_report.reporter_id,
    'reported_id', v_report.reported_id,
    'session_id', v_report.session_id,
    'staff_shared_message', v_report.staff_shared_message,
    'has_device_private_note', (v_report.private_note is not null),
    'reported_active_restriction_kind', v_restriction_kind,
    'prior_open_cases_for_reported', v_prior_open,
    'prior_other_reports_for_reported', v_prior_total,
    'session', case
      when v_has_session then jsonb_build_object(
        'id', v_session.id,
        'status', v_session.status,
        'user_a', v_session.user_a,
        'user_b', v_session.user_b,
        'created_at', v_session.created_at,
        'started_at', v_session.started_at,
        'ended_at', v_session.ended_at
      )
      else null
    end
  );
end;
$$;

revoke all on function public.get_moderation_case_evidence(uuid) from public, anon;
grant execute on function public.get_moderation_case_evidence(uuid) to authenticated;

comment on function public.get_moderation_case_evidence(uuid) is
  'Staff-only case evidence: staff-shared reporter message, session metadata, active restriction, prior case counts. Never decrypts device-bound private_note. Counts are facts, not a safety score.';
