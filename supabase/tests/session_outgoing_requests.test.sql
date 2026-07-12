begin;
select plan(7);

set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000001', true);

select public.request_session('10000000-0000-4000-8000-000000000002', 'out-req-1') as session_id \gset

select is(
  (select count(*)::integer from public.list_outgoing_requests()),
  1,
  'the requester sees one outgoing pending request'
);

select is(
  (select recipient_id::text from public.list_outgoing_requests() limit 1),
  '10000000-0000-4000-8000-000000000002',
  'outgoing list exposes the recipient id'
);

select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000002', true);
select is(
  (select count(*)::integer from public.list_outgoing_requests()),
  0,
  'the recipient does not see the same request as outgoing'
);

select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000001', true);
select is(
  public.transition_session(:'session_id'::uuid, 'cancelled', 'requester-cancels'),
  'cancelled',
  'the requester can cancel their own pending request'
);

select is(
  (select count(*)::integer from public.list_outgoing_requests()),
  0,
  'cancelled requests leave the outgoing list'
);

select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000002', true);
select is(
  (select count(*)::integer from public.list_incoming_requests()),
  0,
  'cancelled requests leave the incoming list'
);

reset role;
set local role anon;
select throws_ok(
  $$ select public.list_outgoing_requests() $$,
  '42501',
  'permission denied for function list_outgoing_requests',
  'anonymous callers cannot list outgoing requests'
);

select * from finish();
rollback;
