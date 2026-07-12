begin;
select plan(6);

set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000001', true);

-- Under budget: first block succeeds.
select lives_ok(
  $$ select public.block_user('10000000-0000-4000-8000-000000000002') $$,
  'block succeeds under the rate limit'
);

select lives_ok(
  $$ select public.unblock_user('10000000-0000-4000-8000-000000000002') $$,
  'unblock succeeds under the rate limit'
);

-- Saturate block budget (40 / 24h). One already recorded above → insert 39 more.
reset role;
insert into public.rate_limit_events (actor_id, action)
select
  '10000000-0000-4000-8000-000000000001',
  'block'
from generate_series(1, 39);

set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000001', true);

select throws_ok(
  $$ select public.block_user('10000000-0000-4000-8000-000000000003') $$,
  'P0001',
  'you''re doing that too often — try again later',
  'block fails closed when the daily budget is exhausted'
);

-- Report budget: seed 15 events then new report fails.
reset role;
insert into public.rate_limit_events (actor_id, action)
select
  '10000000-0000-4000-8000-000000000001',
  'report'
from generate_series(1, 15);

set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000001', true);

select throws_ok(
  $$ select public.submit_report(
       '10000000-0000-4000-8000-000000000002',
       'spam_scam',
       null,
       null,
       'rate-report-1'
     ) $$,
  'P0001',
  'you''re doing that too often — try again later',
  'report fails closed when the daily budget is exhausted'
);

-- Session request budget: 20 events → next new request fails.
-- Use recipient 0004; ensure no open pair session.
reset role;
insert into public.rate_limit_events (actor_id, action)
select
  '10000000-0000-4000-8000-000000000001',
  'session_request'
from generate_series(1, 20);

set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000001', true);

select throws_ok(
  $$ select public.request_session(
       '10000000-0000-4000-8000-000000000004',
       'rate-req-1'
     ) $$,
  'P0001',
  'you''re doing that too often — try again later',
  'session request fails closed when the hourly budget is exhausted'
);

-- Authenticated cannot read rate_limit_events directly.
select throws_ok(
  $$ select count(*) from public.rate_limit_events $$,
  '42501',
  'permission denied for table rate_limit_events',
  'rate_limit_events is not readable by authenticated clients'
);

select * from finish();
rollback;
