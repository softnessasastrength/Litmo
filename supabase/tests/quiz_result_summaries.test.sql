begin;
select plan(10);

set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000001', true);

select lives_ok(
  $$select public.upsert_own_quiz_result_summary(
    'vibe-short',
    'hearth',
    'lantern',
    50,
    30,
    20,
    '["Soft presence"]'::jsonb,
    'Vibe Quiz — Short',
    '2026-07-13T12:00:00Z'::timestamptz
  )$$,
  'owner can upsert their own quiz result summary'
);

select is(
  (select count(*)::integer from public.quiz_result_summaries),
  1,
  'owner can read their own quiz result summary'
);

select is(
  (select primary_archetype from public.quiz_result_summaries where quiz_id = 'vibe-short'),
  'hearth',
  'stored primary archetype matches the upsert'
);

select lives_ok(
  $$select public.upsert_own_quiz_result_summary(
    'vibe-short',
    'tidepool',
    null,
    20,
    20,
    60,
    '[]'::jsonb,
    'Vibe Quiz — Short',
    '2026-07-13T18:00:00Z'::timestamptz
  )$$,
  'owner can replace their own summary for the same quiz'
);

select is(
  (select primary_archetype from public.quiz_result_summaries where quiz_id = 'vibe-short'),
  'tidepool',
  'upsert replaces prior own summary rather than creating public scores'
);

select throws_ok(
  $$select public.upsert_own_quiz_result_summary(
    'vibe-short',
    'not-an-archetype',
    null,
    10,
    10,
    10,
    '[]'::jsonb,
    null,
    now()
  )$$,
  '22023',
  'invalid quiz result summary',
  'invalid archetypes fail closed'
);

select ok(
  (public.export_my_data() ? 'quiz_result_summaries'),
  'self-only export includes quiz result summaries key'
);

select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000002', true);

select is(
  (select count(*)::integer from public.quiz_result_summaries),
  0,
  'another authenticated user cannot read owner quiz summaries'
);

select throws_ok(
  $$insert into public.quiz_result_summaries (
    user_id, quiz_id, primary_archetype, mix_hearth, mix_lantern, mix_tidepool, completed_at
  ) values (
    '10000000-0000-4000-8000-000000000001',
    'vibe-deep',
    'hearth',
    40,
    30,
    30,
    now()
  )$$,
  '42501',
  'new row violates row-level security policy for table "quiz_result_summaries"',
  'cannot write a summary as another user'
);
-- Note: message text is Postgres RLS default; errcode 42501 is the contract.

select lives_ok(
  $$select public.upsert_own_quiz_result_summary(
    'boundary-voice',
    'lantern',
    null,
    15,
    70,
    15,
    '["Clear and warm"]'::jsonb,
    null,
    now()
  )$$,
  'second user can store only their own independent summary'
);

select * from finish();
rollback;
