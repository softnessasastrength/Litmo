-- Optional owner-only backup of OWN quiz result summaries.
-- Partner comparison payloads, seal keys, and invite packages never live here.
-- Quiz weather is never consent, a public score, or a safety rating.

create table public.quiz_result_summaries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  quiz_id text not null check (char_length(quiz_id) between 1 and 64),
  primary_archetype text not null check (
    primary_archetype in ('hearth', 'lantern', 'tidepool')
  ),
  secondary_archetype text check (
    secondary_archetype is null
    or secondary_archetype in ('hearth', 'lantern', 'tidepool')
  ),
  mix_hearth integer not null check (mix_hearth between 0 and 100),
  mix_lantern integer not null check (mix_lantern between 0 and 100),
  mix_tidepool integer not null check (mix_tidepool between 0 and 100),
  -- Soft model insight lines only — not free-form private diary, not partner data.
  insight_notes jsonb not null default '[]'::jsonb
    check (
      jsonb_typeof(insight_notes) = 'array'
      and jsonb_array_length(insight_notes) <= 12
    ),
  mode_label text check (mode_label is null or char_length(mode_label) <= 120),
  completed_at timestamptz not null,
  updated_at timestamptz not null default now(),
  unique (user_id, quiz_id)
);

comment on table public.quiz_result_summaries is
  'Owner-only self-understanding quiz summaries. Not discovery-visible, not partner comparison, never consent.';

create index quiz_result_summaries_user_completed_idx
  on public.quiz_result_summaries (user_id, completed_at desc);

alter table public.quiz_result_summaries enable row level security;

create policy "quiz summaries own select"
  on public.quiz_result_summaries
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "quiz summaries own insert"
  on public.quiz_result_summaries
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "quiz summaries own update"
  on public.quiz_result_summaries
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "quiz summaries own delete"
  on public.quiz_result_summaries
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);

revoke all on public.quiz_result_summaries from public, anon;
grant select, insert, update, delete on public.quiz_result_summaries to authenticated;
grant select, insert, update, delete on public.quiz_result_summaries to service_role;

create or replace function public.upsert_own_quiz_result_summary(
  p_quiz_id text,
  p_primary_archetype text,
  p_secondary_archetype text,
  p_mix_hearth integer,
  p_mix_lantern integer,
  p_mix_tidepool integer,
  p_insight_notes jsonb,
  p_mode_label text,
  p_completed_at timestamptz
) returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_id uuid;
  v_note text;
  v_notes jsonb := coalesce(p_insight_notes, '[]'::jsonb);
begin
  if v_actor is null then
    raise exception using errcode = '42501', message = 'authentication required';
  end if;

  if p_quiz_id is null
    or char_length(p_quiz_id) not between 1 and 64
    or p_primary_archetype is null
    or p_primary_archetype not in ('hearth', 'lantern', 'tidepool')
    or (
      p_secondary_archetype is not null
      and p_secondary_archetype not in ('hearth', 'lantern', 'tidepool')
    )
    or p_mix_hearth is null or p_mix_hearth not between 0 and 100
    or p_mix_lantern is null or p_mix_lantern not between 0 and 100
    or p_mix_tidepool is null or p_mix_tidepool not between 0 and 100
    or p_completed_at is null
    or jsonb_typeof(v_notes) <> 'array'
    or jsonb_array_length(v_notes) > 12
    or char_length(coalesce(p_mode_label, '')) > 120
  then
    raise exception using errcode = '22023', message = 'invalid quiz result summary';
  end if;

  for v_note in
    select value
    from jsonb_array_elements_text(v_notes) as t(value)
  loop
    if char_length(v_note) > 280 then
      raise exception using errcode = '22023', message = 'invalid quiz result summary';
    end if;
  end loop;

  insert into public.quiz_result_summaries (
    user_id,
    quiz_id,
    primary_archetype,
    secondary_archetype,
    mix_hearth,
    mix_lantern,
    mix_tidepool,
    insight_notes,
    mode_label,
    completed_at,
    updated_at
  ) values (
    v_actor,
    p_quiz_id,
    p_primary_archetype,
    p_secondary_archetype,
    p_mix_hearth,
    p_mix_lantern,
    p_mix_tidepool,
    v_notes,
    nullif(trim(coalesce(p_mode_label, '')), ''),
    p_completed_at,
    now()
  )
  on conflict (user_id, quiz_id) do update set
    primary_archetype = excluded.primary_archetype,
    secondary_archetype = excluded.secondary_archetype,
    mix_hearth = excluded.mix_hearth,
    mix_lantern = excluded.mix_lantern,
    mix_tidepool = excluded.mix_tidepool,
    insight_notes = excluded.insight_notes,
    mode_label = excluded.mode_label,
    completed_at = excluded.completed_at,
    updated_at = now()
  returning id into v_id;

  return v_id;
end;
$$;

revoke all on function public.upsert_own_quiz_result_summary(
  text, text, text, integer, integer, integer, jsonb, text, timestamptz
) from public, anon;
grant execute on function public.upsert_own_quiz_result_summary(
  text, text, text, integer, integer, integer, jsonb, text, timestamptz
) to authenticated;

-- Extend self-only export with owner quiz summaries (still not partner compare).
create or replace function public.export_my_data()
returns jsonb
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

  return jsonb_build_object(
    'generated_at', now(),
    'profile', (
      select to_jsonb(p) from public.profiles as p where p.user_id = v_actor
    ),
    'touch_profile_versions', coalesce((
      select jsonb_agg(to_jsonb(t) order by t.created_at)
      from public.touch_profile_versions as t where t.user_id = v_actor
    ), '[]'::jsonb),
    'consent_preference_versions', coalesce((
      select jsonb_agg(to_jsonb(c) order by c.created_at)
      from public.consent_preference_versions as c where c.user_id = v_actor
    ), '[]'::jsonb),
    'sessions', coalesce((
      select jsonb_agg(to_jsonb(s) order by s.created_at)
      from public.sessions as s where v_actor in (s.user_a, s.user_b)
    ), '[]'::jsonb),
    'reports_submitted', coalesce((
      select jsonb_agg(
        to_jsonb(r) - 'private_note'
        order by r.created_at
      )
      from public.user_reports as r where r.reporter_id = v_actor
    ), '[]'::jsonb),
    'trust_events', coalesce((
      select jsonb_agg(to_jsonb(t) order by t.created_at)
      from public.trust_events as t where t.subject_user_id = v_actor
    ), '[]'::jsonb),
    'quiz_result_summaries', coalesce((
      select jsonb_agg(to_jsonb(q) order by q.completed_at)
      from public.quiz_result_summaries as q where q.user_id = v_actor
    ), '[]'::jsonb)
  );
end;
$$;

revoke all on function public.export_my_data() from public, anon;
grant execute on function public.export_my_data() to authenticated;
