begin;
select plan(15);

-- Existing accounts are the initial named cohort.
set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000001', true);
select is(public.is_private_alpha_member(), true, 'existing account is grandfathered');

select throws_ok(
  $$ select public.issue_private_alpha_invite() $$,
  '42501',
  'staff access required',
  'non-staff cannot issue invitations'
);

select throws_ok(
  $$ select public.set_matching_paused(true) $$,
  '42501',
  'staff access required',
  'non-staff cannot operate the kill-switch'
);

reset role;
insert into public.staff_roles (user_id, role)
values ('10000000-0000-4000-8000-000000000003', 'admin')
on conflict (user_id) do update set role = excluded.role;

set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000003', true);
select public.issue_private_alpha_invite() as invite_code \gset
select is(char_length(:'invite_code'), 48, 'staff receives a one-time 48-character code');

reset role;
update public.private_alpha_memberships
set revoked_at = now()
where user_id = '10000000-0000-4000-8000-000000000004';

set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000004', true);
select is(public.is_private_alpha_member(), false, 'revoked account is not admitted');
select is(
  public.redeem_private_alpha_invite(:'invite_code'),
  true,
  'single-use invitation can restore admission'
);
select is(public.is_private_alpha_member(), true, 'redeemed account is admitted');

select is(
  (public.export_my_data() ? 'profile'),
  true,
  'self export contains profile category'
);
select is(
  (public.export_my_data() ? 'reports_submitted'),
  true,
  'self export contains report category'
);

reset role;
select is(
  (select count(*)::integer
   from public.private_alpha_invites
   where redeemed_by = '10000000-0000-4000-8000-000000000004'),
  1,
  'invitation records exactly one redeemer'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000003', true);
select is(public.set_matching_paused(true), true, 'staff can pause matching');

set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000001', true);
select is(
  (select count(*)::integer from public.discovery_profiles()),
  0,
  'paused matching hides discovery'
);
select throws_ok(
  $$ select public.request_session(
       '10000000-0000-4000-8000-000000000002',
       'paused-request-test'
     ) $$,
  '42501',
  'matching is temporarily paused',
  'paused matching rejects new requests'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000003', true);
select is(public.set_matching_paused(false), false, 'staff can resume matching');

set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000001', true);
select lives_ok(
  $$ select public.block_user('10000000-0000-4000-8000-000000000002') $$,
  'block succeeds'
);
select lives_ok(
  $$ select public.unblock_user('10000000-0000-4000-8000-000000000002') $$,
  'unblock succeeds'
);

reset role;
select is(
  (select count(*)::integer
   from public.user_block_tombstones
   where blocker_id = '10000000-0000-4000-8000-000000000001'
     and blocked_id = '10000000-0000-4000-8000-000000000002'),
  1,
  'unblock creates one minimal tombstone'
);

select * from finish();
rollback;
