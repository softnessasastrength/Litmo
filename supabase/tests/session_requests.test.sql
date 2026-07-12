begin;
select plan(12);

set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000001', true);

select throws_ok(
  $$ select public.request_session('10000000-0000-4000-8000-000000000001') $$,
  '22023',
  'you cannot request a session with yourself',
  'a self-request is rejected'
);

select throws_ok(
  $$ select public.request_session('10000000-0000-4000-8000-000000000098') $$,
  '42501',
  'that person is not available to request a session with',
  'requesting a nonexistent recipient is rejected'
);

select public.request_session('10000000-0000-4000-8000-000000000002', 'req-1') as session_id \gset

select is(
  (select status from public.sessions where id = :'session_id'),
  'requested',
  'a request creates a session in the requested state'
);
select is(
  (select user_a::text from public.sessions where id = :'session_id'),
  '10000000-0000-4000-8000-000000000001',
  'the caller becomes user_a (the requester)'
);

select public.request_session('10000000-0000-4000-8000-000000000002', 'req-2') as duplicate_session_id \gset

select is(
  :'duplicate_session_id'::uuid,
  :'session_id'::uuid,
  'a duplicate request returns the existing pending session id'
);
select is(
  (select count(*)::integer from public.sessions where user_a = '10000000-0000-4000-8000-000000000001' and user_b = '10000000-0000-4000-8000-000000000002'),
  1,
  'requesting the same pending recipient again does not create a second session'
);
select is(
  (select count(*)::integer from public.session_events where event_type = 'session_requested'),
  1,
  'only one session_requested event exists despite the duplicate call'
);

-- The other direction should also be treated as a duplicate of the same pair.
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000002', true);
select public.request_session('10000000-0000-4000-8000-000000000001', 'req-3') as reverse_session_id \gset
select is(
  :'reverse_session_id'::uuid,
  :'session_id'::uuid,
  'a reverse-direction request to the same pending pair is treated as the same duplicate'
);

-- Recipient-only authorization on requested -> accepted/declined.
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000001', true);
select throws_ok(
  format($$ select public.transition_session(%L, 'accepted', 'recipient-check-requester') $$, :'session_id'),
  '42501',
  'only the recipient may respond to a session request',
  'the requester cannot accept their own request'
);

select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000002', true);
select is(
  public.transition_session(:'session_id'::uuid, 'accepted', 'recipient-accepts'),
  'accepted',
  'the recipient can accept the request'
);

reset role;
set local role anon;
select throws_ok(
  $$ select public.request_session('10000000-0000-4000-8000-000000000002') $$,
  '42501',
  'permission denied for function request_session',
  'anonymous callers cannot create session requests'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000099', true);
select throws_ok(
  format($$ select public.transition_session(%L, 'declined', 'stranger-decline') $$, :'session_id'),
  '42501',
  'session not found or access denied',
  'a non-participant cannot respond to the request'
);

select * from finish();
rollback;
