begin;
select plan(8);

-- Seed users are adult-eligible for other suites. Clear 0001 to test the gate.
reset role;
update public.profiles
   set age_signal_status = 'unverified',
       age_signal_source = null,
       age_signal_at = null
 where user_id = '10000000-0000-4000-8000-000000000001';

set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000001', true);

select is(
  public.is_adult_eligible('10000000-0000-4000-8000-000000000001'),
  false,
  'cleared seed user is not adult-eligible'
);

select throws_ok(
  $$ select public.request_session('10000000-0000-4000-8000-000000000002', 'age-1') $$,
  '42501',
  'adult age confirmation is required before requesting a session',
  'request_session fails closed without an adult signal'
);

select is(
  public.record_age_signal('adult', 'apple_declared_age_range', 18, null),
  'adult',
  'recording an Apple adult signal succeeds'
);

select is(
  public.is_adult_eligible('10000000-0000-4000-8000-000000000001'),
  true,
  'adult signal makes the caller eligible'
);

-- Recipient 0002 is adult in seed; temporarily clear for opaque unavailable.
reset role;
update public.profiles
   set age_signal_status = 'unverified'
 where user_id = '10000000-0000-4000-8000-000000000002';

set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000001', true);

select throws_ok(
  $$ select public.request_session('10000000-0000-4000-8000-000000000002', 'age-2') $$,
  '42501',
  'that person is not available to request a session with',
  'request fails when the recipient is not adult-eligible'
);

select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000002', true);
-- Local test harness only: allow development_self_attest (migration 044).
select set_config('app.litmo_allow_dev_age_attest', 'true', true);
select public.record_age_signal('adult', 'development_self_attest', null, null);

select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000001', true);
select lives_ok(
  $$ select public.request_session('10000000-0000-4000-8000-000000000002', 'age-3') $$,
  'request succeeds when both parties are adult-eligible'
);

select throws_ok(
  $$ select public.record_age_signal('adult', 'not_a_source', null, null) $$,
  '22023',
  'unsupported age signal source',
  'unsupported sources are rejected'
);

select is(
  (
    select count(*)::integer
    from public.discovery_profiles()
    where user_id = '10000000-0000-4000-8000-000000000002'
  ),
  1,
  'adult-eligible completed profiles appear in discovery for an adult viewer'
);

select * from finish();
rollback;
