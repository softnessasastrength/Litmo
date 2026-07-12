begin;
select plan(12);

set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000001', true);

select lives_ok(
  $$ select public.submit_report(
       '10000000-0000-4000-8000-000000000002',
       'harassment',
       null,
       null,
       'report-1'
     ) $$,
  'a user can submit a structured report'
);

select is(
  (select count(*)::integer from public.list_my_reports()),
  1,
  'reporter sees their own report in list_my_reports'
);

select is(
  (select status from public.list_my_reports() limit 1),
  'submitted',
  'new reports start as submitted'
);

select is(
  public.submit_report(
    '10000000-0000-4000-8000-000000000002',
    'spam_scam',
    null,
    null,
    'report-1'
  ),
  (select id from public.list_my_reports() limit 1),
  'idempotent resubmit returns the original report id'
);

select is(
  (select count(*)::integer from public.list_my_reports()),
  1,
  'idempotent resubmit does not create a second report'
);

select throws_ok(
  $$ select public.submit_report(
       '10000000-0000-4000-8000-000000000002',
       'not_a_category',
       null,
       null,
       'report-bad-cat'
     ) $$,
  '22023',
  'invalid report category',
  'unknown categories are rejected'
);

select throws_ok(
  $$ select public.submit_report(
       '10000000-0000-4000-8000-000000000001',
       'other',
       null,
       null,
       'report-self'
     ) $$,
  '22023',
  'invalid report target',
  'a user cannot report themselves'
);

select throws_ok(
  $$ select public.submit_report(
       '10000000-0000-4000-8000-000000000002',
       'other',
       null,
       'plaintext note',
       'report-plain'
     ) $$,
  '22023',
  'invalid private note',
  'plaintext private notes are rejected'
);

select lives_ok(
  $$ select public.submit_report(
       '10000000-0000-4000-8000-000000000002',
       'boundary_violation',
       null,
       'litmo:encrypted:v1:{"format":1,"keyVersion":1,"ciphertext":"opaque"}',
       'report-enc'
     ) $$,
  'encrypted private notes are accepted'
);

-- Reported party cannot list the reporter's reports and has no rows of their own.
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000002', true);
select is(
  (select count(*)::integer from public.list_my_reports()),
  0,
  'reported party does not see reports about them'
);

-- Direct table select as reported party must not expose rows (RLS).
select is(
  (
    select count(*)::integer
    from public.user_reports
    where reported_id = '10000000-0000-4000-8000-000000000002'
  ),
  0,
  'RLS hides report rows from the reported party'
);

-- Session reference must involve both parties.
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000001', true);
select throws_ok(
  $$ select public.submit_report(
       '10000000-0000-4000-8000-000000000002',
       'unsafe_behavior',
       '00000000-0000-4000-8000-000000000099',
       null,
       'report-bad-session'
     ) $$,
  '42501',
  'session not found or access denied',
  'unknown session ids are denied'
);

select * from finish();
rollback;
