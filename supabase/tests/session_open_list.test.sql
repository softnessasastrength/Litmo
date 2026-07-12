begin;
select plan(7);

set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000001', true);

select is(
  (select count(*)::integer from public.list_open_sessions()),
  0,
  'no open mid-lifecycle sessions initially'
);

select public.request_session('10000000-0000-4000-8000-000000000002', 'open-1') as session_id \gset

select is(
  (select count(*)::integer from public.list_open_sessions()),
  0,
  'requested sessions are not listed as open mid-lifecycle'
);

select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000002', true);
select public.transition_session(:'session_id'::uuid, 'accepted', 'open-accept');
select public.transition_session(:'session_id'::uuid, 'consent_pending', 'open-pending');

select is(
  (select count(*)::integer from public.list_open_sessions()),
  1,
  'recipient sees consent_pending as an open session'
);

select is(
  (select counterpart_id::text from public.list_open_sessions() limit 1),
  '10000000-0000-4000-8000-000000000001',
  'counterpart id is the other participant'
);

select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000001', true);
select is(
  (select count(*)::integer from public.list_open_sessions()),
  1,
  'requester also sees the same open session'
);

select ok(
  (select expires_at is not null from public.list_open_sessions() limit 1),
  'open pre-activation sessions expose a review expiration timestamp'
);

reset role;
set local role anon;
select throws_ok(
  $$ select public.list_open_sessions() $$,
  '42501',
  'permission denied for function list_open_sessions',
  'anonymous callers cannot list open sessions'
);

select * from finish();
rollback;
