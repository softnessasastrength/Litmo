begin;
select plan(8);

set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000001', true);

select ok(
  (select profile_complete from public.my_trust_signals()),
  'seed user has profile_complete true'
);

select ok(
  (select adult_eligible from public.my_trust_signals()),
  'seed user has adult_eligible true'
);

select cmp_ok(
  (select account_age_days from public.my_trust_signals()),
  '>=',
  0,
  'account_age_days is non-negative'
);

-- Clear age signal then re-attest → appends another age_adult_confirmed.
-- Seed already wrote one when marking demos adult (migration 027 trigger).
reset role;
select count(*)::integer as age_before
  from public.trust_events
 where subject_user_id = '10000000-0000-4000-8000-000000000001'
   and event_type = 'age_adult_confirmed' \gset

update public.profiles
   set age_signal_status = 'unverified',
       age_signal_source = null,
       age_signal_at = null
 where user_id = '10000000-0000-4000-8000-000000000001';

set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000001', true);
select set_config('app.litmo_allow_dev_age_attest', 'true', true);
select public.record_age_signal('adult', 'development_self_attest', null, null);

reset role;
select is(
  (
    select count(*)::integer
    from public.trust_events
    where subject_user_id = '10000000-0000-4000-8000-000000000001'
      and event_type = 'age_adult_confirmed'
  ),
  :'age_before'::integer + 1,
  'recording adult age appends age_adult_confirmed'
);

-- Report → report_submitted on reported party.
set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000001', true);
select public.submit_report(
  '10000000-0000-4000-8000-000000000002',
  'other',
  null,
  null,
  'trust-report-1'
) as rid \gset

reset role;
select is(
  (
    select count(*)::integer
    from public.trust_events
    where subject_user_id = '10000000-0000-4000-8000-000000000002'
      and event_type = 'report_submitted'
      and report_id = :'rid'::uuid
  ),
  1,
  'report intake appends report_submitted for the reported party'
);

-- Terminal session → session_completed for both participants.
insert into public.sessions (id, user_a, user_b, status)
values (
  'a1000000-0000-4000-8000-000000000099',
  '10000000-0000-4000-8000-000000000001',
  '10000000-0000-4000-8000-000000000002',
  'active'
);

update public.sessions
   set status = 'completed'
 where id = 'a1000000-0000-4000-8000-000000000099';

select is(
  (
    select count(*)::integer
    from public.trust_events
    where session_id = 'a1000000-0000-4000-8000-000000000099'
      and event_type = 'session_completed'
  ),
  2,
  'completing a session appends session_completed for both participants'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000001', true);
select is(
  (select completed_sessions from public.my_trust_signals()),
  1,
  'my_trust_signals counts completed sessions for self'
);

-- Authenticated cannot dump trust_events for others / raw table.
select throws_ok(
  $$ select count(*) from public.trust_events $$,
  '42501',
  'permission denied for table trust_events',
  'trust_events is not readable by authenticated clients'
);

select * from finish();
rollback;
