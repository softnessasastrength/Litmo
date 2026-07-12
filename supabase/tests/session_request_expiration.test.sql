begin;
select plan(10);

insert into public.sessions (id, user_a, user_b, status, created_at) values
  (
    '38000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000002',
    'requested',
    now() - interval '25 hours'
  ),
  (
    '38000000-0000-4000-8000-000000000002',
    '10000000-0000-4000-8000-000000000003',
    '10000000-0000-4000-8000-000000000002',
    'requested',
    now() - interval '1 hour'
  );

set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000002', true);

select is(
  public.request_expires_at(now() - interval '24 hours') <= now(),
  true,
  'request_expires_at marks a 24-hour-old request as expired'
);

select is(
  (select count(*)::integer from public.list_incoming_requests()),
  1,
  'listing incoming requests auto-expires stale requests and returns only current ones'
);

select is(
  (select status from public.sessions where id = '38000000-0000-4000-8000-000000000001'),
  'expired',
  'a stale incoming request is materialized to the expired terminal state on read'
);

select is(
  (
    select count(*)::integer
    from public.session_events
    where session_id = '38000000-0000-4000-8000-000000000001'
      and prior_state = 'requested'
      and resulting_state = 'expired'
      and metadata = '{"source":"api","trigger":"system_expiration"}'::jsonb
  ),
  1,
  'auto-expiration writes one safe audit event'
);

select is(
  (
    select expires_at > created_at
    from public.list_incoming_requests()
    where id = '38000000-0000-4000-8000-000000000002'
  ),
  true,
  'incoming requests expose a visible expiration timestamp'
);

select throws_ok(
  $$ select public.transition_session('38000000-0000-4000-8000-000000000001', 'accepted', 'late-accept') $$,
  '55000',
  'session is already terminal',
  'once a stale request has been materialized as expired, it cannot be accepted'
);

select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000001', true);

select public.request_session('10000000-0000-4000-8000-000000000002', 'fresh-after-expiry') as fresh_request_id \gset
select is(
  :'fresh_request_id'::uuid,
  (select id from public.sessions where id = :'fresh_request_id'::uuid),
  'request_session creates a new request after expiring an older stale pair'
);

select is(
  (
    select count(*)::integer
    from public.sessions
    where user_a = '10000000-0000-4000-8000-000000000001'
      and user_b = '10000000-0000-4000-8000-000000000002'
      and status = 'requested'
  ),
  1,
  'only one fresh requested session remains after recreating the expired pair'
);

select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000002', true);
reset role;
insert into public.sessions (id, user_a, user_b, status, created_at)
values (
  '38000000-0000-4000-8000-000000000003',
  '10000000-0000-4000-8000-000000000004',
  '10000000-0000-4000-8000-000000000002',
  'requested',
  now() - interval '26 hours'
);
set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000002', true);

select is(
  public.transition_session('38000000-0000-4000-8000-000000000003', 'accepted', 'expire-on-response'),
  'expired',
  'responding to a stale request returns the persisted expired state'
);

select is(
  (select status from public.sessions where id = '38000000-0000-4000-8000-000000000003'),
  'expired',
  'a stale request transitions to expired when someone tries to respond after the deadline'
);

select * from finish();
rollback;
