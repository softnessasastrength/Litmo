begin;
select plan(8);

set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000001', true);

select lives_ok(
  $$ select public.register_auth_device(
       '61000000-0000-4000-8000-000000000099',
       'dddddddddddddddddddddddddddddddd',
       'Auth ops test phone'
     ) $$,
  'device registration succeeds for consent binding'
);

select lives_ok(
  $$ select public.require_bound_auth_device() $$,
  'bound device satisfies consent gate'
);

select lives_ok(
  $$ select count(*) from public.list_my_auth_audit_events(10) $$,
  'owner can list own auth audit events'
);

select throws_ok(
  $$ insert into public.auth_audit_events(event_type, outcome)
     values ('passkey_auth_start', 'started') $$,
  '42501',
  'permission denied for table auth_audit_events',
  'authenticated cannot write auth audit rows directly'
);

select throws_ok(
  $$ select public.assert_auth_ceremony_rate_limit('abcdabcdabcdabcd', 'passkey_auth_start') $$,
  '42501',
  null,
  'authenticated cannot call ceremony rate limit directly'
);

select throws_ok(
  $$ select public.log_auth_audit_event(
       null, null, 'passkey_auth_start', 'started', '{}'::jsonb
     ) $$,
  '42501',
  null,
  'authenticated cannot call audit logger directly'
);

reset role;
select set_config('request.jwt.claim.sub', '', true);

select throws_ok(
  $$ select public.require_bound_auth_device() $$,
  '42501',
  'authentication required',
  'anon cannot claim a bound device'
);

select throws_ok(
  $$ select * from public.list_my_auth_audit_events(5) $$,
  '42501',
  'authentication required',
  'anon cannot list auth audit'
);

select * from finish();
rollback;
