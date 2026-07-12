-- Chapter 5 human-review queue (ADR 0027).
-- No public punishment automation. Moderator-only RPCs; no consumer UI yet.
-- Internal notes are staff-only (platform/RLS protected), not end-user encrypted,
-- so multiple reviewers can collaborate without device keys.

create table public.staff_roles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('moderator', 'admin')),
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null
);

comment on table public.staff_roles is
  'Trusted operators. Grants are not self-service; write via service role / ops only.';

alter table public.staff_roles enable row level security;
-- No authenticated policies: staff cannot enumerate the staff roster via PostgREST.
revoke all on public.staff_roles from authenticated, anon, public;
grant select on public.staff_roles to service_role;
grant insert, update, delete on public.staff_roles to service_role;

create or replace function public.is_staff_moderator(p_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.staff_roles as s
    where s.user_id = p_user_id
      and s.role in ('moderator', 'admin')
  );
$$;

revoke all on function public.is_staff_moderator(uuid) from public, anon;
-- Callable so the client can hide/show staff tools later; returns only boolean for self.
grant execute on function public.is_staff_moderator(uuid) to authenticated;

create table public.moderation_cases (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null unique references public.user_reports(id) on delete cascade,
  priority text not null default 'normal'
    check (priority in ('low', 'normal', 'high', 'urgent')),
  queue_status text not null default 'open'
    check (
      queue_status in (
        'open',
        'in_progress',
        'escalated',
        'resolved'
      )
    ),
  assigned_to uuid references auth.users(id) on delete set null,
  assigned_at timestamptz,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index moderation_cases_queue_idx
  on public.moderation_cases (queue_status, priority, created_at);

create index moderation_cases_assigned_to_idx
  on public.moderation_cases (assigned_to)
  where assigned_to is not null;

comment on table public.moderation_cases is
  'Human-review work items linked 1:1 to user_reports. Not visible to reporters or reported parties.';

alter table public.moderation_cases enable row level security;
revoke all on public.moderation_cases from authenticated, anon, public;
grant select, insert, update on public.moderation_cases to service_role;

create table public.moderation_case_notes (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.moderation_cases(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete restrict,
  body text not null
    check (char_length(body) between 1 and 4000),
  created_at timestamptz not null default now()
);

create index moderation_case_notes_case_id_idx
  on public.moderation_case_notes (case_id, created_at);

comment on table public.moderation_case_notes is
  'Append-only internal moderator notes. Never exposed to app users.';

alter table public.moderation_case_notes enable row level security;
revoke all on public.moderation_case_notes from authenticated, anon, public;
grant select, insert on public.moderation_case_notes to service_role;

-- Priority heuristic from category at intake time.
create or replace function public.moderation_priority_for_category(p_category text)
returns text
language sql
immutable
set search_path = ''
as $$
  select case p_category
    when 'underage_concern' then 'urgent'
    when 'unsafe_behavior' then 'high'
    when 'coercion_pressure' then 'high'
    when 'boundary_violation' then 'high'
    when 'harassment' then 'normal'
    when 'impersonation' then 'normal'
    when 'spam_scam' then 'low'
    else 'normal'
  end;
$$;

revoke all on function public.moderation_priority_for_category(text) from public, anon;
grant execute on function public.moderation_priority_for_category(text) to authenticated, service_role;

create or replace function public.tg_user_reports_open_case()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.moderation_cases (report_id, priority, queue_status)
  values (
    new.id,
    public.moderation_priority_for_category(new.category),
    'open'
  );
  return new;
end;
$$;

create trigger user_reports_open_case
  after insert on public.user_reports
  for each row
  execute function public.tg_user_reports_open_case();

create or replace function public.list_moderation_queue(
  p_queue_status text default null
)
returns table (
  case_id uuid,
  report_id uuid,
  priority text,
  queue_status text,
  assigned_to uuid,
  category text,
  reported_id uuid,
  session_id uuid,
  report_status text,
  report_created_at timestamptz,
  case_created_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
begin
  if v_actor is null or not public.is_staff_moderator(v_actor) then
    raise exception using errcode = '42501', message = 'moderator access required';
  end if;
  if p_queue_status is not null and p_queue_status not in (
    'open', 'in_progress', 'escalated', 'resolved'
  ) then
    raise exception using errcode = '22023', message = 'invalid queue status filter';
  end if;

  return query
  select
    c.id,
    c.report_id,
    c.priority,
    c.queue_status,
    c.assigned_to,
    r.category,
    r.reported_id,
    r.session_id,
    r.status,
    r.created_at,
    c.created_at
  from public.moderation_cases as c
  join public.user_reports as r on r.id = c.report_id
  where (p_queue_status is null or c.queue_status = p_queue_status)
  order by
    case c.priority
      when 'urgent' then 1
      when 'high' then 2
      when 'normal' then 3
      else 4
    end,
    c.created_at asc;
end;
$$;

revoke all on function public.list_moderation_queue(text) from public, anon;
grant execute on function public.list_moderation_queue(text) to authenticated;

create or replace function public.claim_moderation_case(p_case_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_id uuid;
begin
  if v_actor is null or not public.is_staff_moderator(v_actor) then
    raise exception using errcode = '42501', message = 'moderator access required';
  end if;
  if p_case_id is null then
    raise exception using errcode = '22023', message = 'case id required';
  end if;

  update public.moderation_cases as c
     set assigned_to = v_actor,
         assigned_at = now(),
         queue_status = case
           when c.queue_status = 'open' then 'in_progress'
           else c.queue_status
         end,
         updated_at = now()
   where c.id = p_case_id
     and c.queue_status in ('open', 'in_progress', 'escalated')
  returning c.id into v_id;

  if v_id is null then
    raise exception using errcode = 'P0002', message = 'case not claimable';
  end if;

  -- Coarse reporter-visible status moves to under_review once claimed.
  update public.user_reports as r
     set status = 'under_review',
         updated_at = now()
   where r.id = (select report_id from public.moderation_cases where id = v_id)
     and r.status = 'submitted';

  return v_id;
end;
$$;

revoke all on function public.claim_moderation_case(uuid) from public, anon;
grant execute on function public.claim_moderation_case(uuid) to authenticated;

create or replace function public.add_moderation_note(
  p_case_id uuid,
  p_body text
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
  if v_actor is null or not public.is_staff_moderator(v_actor) then
    raise exception using errcode = '42501', message = 'moderator access required';
  end if;
  if p_case_id is null or p_body is null or char_length(trim(p_body)) < 1
     or char_length(p_body) > 4000 then
    raise exception using errcode = '22023', message = 'invalid moderation note';
  end if;
  if not exists (select 1 from public.moderation_cases where id = p_case_id) then
    raise exception using errcode = 'P0002', message = 'case not found';
  end if;

  insert into public.moderation_case_notes (case_id, author_id, body)
  values (p_case_id, v_actor, trim(p_body))
  returning id into v_id;
  return v_id;
end;
$$;

revoke all on function public.add_moderation_note(uuid, text) from public, anon;
grant execute on function public.add_moderation_note(uuid, text) to authenticated;

create or replace function public.resolve_moderation_case(
  p_case_id uuid,
  p_closed_outcome text,
  p_queue_status text default 'resolved'
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_report_id uuid;
  v_id uuid;
begin
  if v_actor is null or not public.is_staff_moderator(v_actor) then
    raise exception using errcode = '42501', message = 'moderator access required';
  end if;
  if p_closed_outcome is null or p_closed_outcome not in (
    'no_action', 'action_taken', 'info_needed'
  ) then
    raise exception using errcode = '22023', message = 'invalid closed outcome';
  end if;
  if p_queue_status is null or p_queue_status not in ('resolved', 'escalated') then
    raise exception using errcode = '22023', message = 'invalid resolve queue status';
  end if;

  select c.report_id into v_report_id
    from public.moderation_cases as c
   where c.id = p_case_id
   for update;
  if not found then
    raise exception using errcode = 'P0002', message = 'case not found';
  end if;

  update public.moderation_cases as c
     set queue_status = p_queue_status,
         assigned_to = coalesce(c.assigned_to, v_actor),
         assigned_at = coalesce(c.assigned_at, now()),
         resolved_at = case when p_queue_status = 'resolved' then now() else null end,
         updated_at = now()
   where c.id = p_case_id
  returning c.id into v_id;

  if p_queue_status = 'resolved' then
    update public.user_reports as r
       set status = 'closed',
           closed_outcome = p_closed_outcome,
           updated_at = now()
     where r.id = v_report_id;
  end if;

  return v_id;
end;
$$;

revoke all on function public.resolve_moderation_case(uuid, text, text) from public, anon;
grant execute on function public.resolve_moderation_case(uuid, text, text) to authenticated;

comment on function public.list_moderation_queue(text) is
  'Staff-only queue of report cases ordered by priority. Never callable meaningfully by non-staff.';
comment on function public.claim_moderation_case(uuid) is
  'Assigns a case to the moderator and may move reporter-visible status to under_review.';
comment on function public.resolve_moderation_case(uuid, text, text) is
  'Closes or escalates a case. On resolve, sets reporter-visible closed outcome only (no public punishment).';
