begin;
select plan(11);

set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000001', true);

select lives_ok(
  $$ select public.block_user('10000000-0000-4000-8000-000000000002') $$,
  'a user can block another account'
);

select is(
  (select count(*)::integer from public.list_blocked_users()),
  1,
  'blocker sees the blocked account in their list'
);

select is(
  public.pair_is_blocked(
    '10000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000002'
  ),
  true,
  'pair_is_blocked is true in either argument order'
);

select throws_ok(
  $$ select public.request_session('10000000-0000-4000-8000-000000000002', 'blocked-req') $$,
  '42501',
  'that person is not available to request a session with',
  'requesting a blocked account fails with the opaque availability message'
);

select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000002', true);
select is(
  (select count(*)::integer from public.list_blocked_users()),
  0,
  'the blocked user does not see who blocked them'
);

select throws_ok(
  $$ select public.request_session('10000000-0000-4000-8000-000000000001', 'blocked-rev') $$,
  '42501',
  'that person is not available to request a session with',
  'blocked user also cannot request the blocker (opaque)'
);

select is(
  (
    select count(*)::integer
    from public.discovery_profiles()
    where user_id = '10000000-0000-4000-8000-000000000001'
  ),
  0,
  'discovery hides the blocker from the blocked user'
);

select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000001', true);

-- Request then block cancels the pending request.
select lives_ok(
  $$ select public.unblock_user('10000000-0000-4000-8000-000000000002') $$,
  'blocker can unblock'
);
select public.request_session('10000000-0000-4000-8000-000000000002', 'then-block') as sid \gset
select lives_ok(
  $$ select public.block_user('10000000-0000-4000-8000-000000000002') $$,
  'block after request succeeds'
);
select is(
  (select status from public.sessions where id = :'sid'::uuid),
  'cancelled',
  'blocking cancels a pending requested session between the pair'
);

select throws_ok(
  $$ select public.block_user('10000000-0000-4000-8000-000000000001') $$,
  '22023',
  'invalid block target',
  'a user cannot block themselves'
);

select * from finish();
rollback;
