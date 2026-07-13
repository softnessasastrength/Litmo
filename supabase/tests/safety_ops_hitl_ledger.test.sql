begin;
select plan(12);

-- Default fail-closed: two-person required, named second owner false.
reset role;
select is(
  public.permanent_ban_policy_allows_completion(),
  false,
  'default permanent ban completion is blocked until dual HITL is configured'
);

-- Promote two staff accounts.
insert into public.staff_roles (user_id, role)
values
  ('10000000-0000-4000-8000-000000000003', 'moderator'),
  ('10000000-0000-4000-8000-000000000004', 'moderator')
on conflict (user_id) do update set role = excluded.role;

-- Still blocked without named_second_owner_configured.
select is(
  public.permanent_ban_policy_allows_completion(),
  false,
  'two staff alone is not enough without named second owner flag'
);

-- Direct permanent ban fails closed while two-person required.
set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000003', true);

select throws_ok(
  $$ select public.apply_account_restriction(
       '10000000-0000-4000-8000-000000000001',
       'permanent_ban',
       'policy_violation',
       null,
       'should fail closed'
     ) $$,
  'P0001',
  'permanent ban requires two-person confirmation — use request_permanent_ban',
  'direct permanent ban blocked under two-person policy'
);

-- Matching hold still works for single staff.
select lives_ok(
  $$ select public.apply_account_restriction(
       '10000000-0000-4000-8000-000000000002',
       'matching_hold',
       'safety_review',
       now() + interval '7 days',
       'hold still single-staff'
     ) $$,
  'matching hold remains single-staff human action'
);

-- Enable dual HITL via service_role only.
reset role;
select public.set_platform_safety_setting('named_second_owner_configured', true);

select is(
  public.permanent_ban_policy_allows_completion(),
  true,
  'named second owner + two staff allows completion path'
);

-- Request + confirm with distinct staff.
set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000003', true);

select public.request_permanent_ban(
  '10000000-0000-4000-8000-000000000001',
  'policy_violation',
  'dual confirm request',
  null
) as ban_req \gset

-- Same staff cannot confirm.
select throws_ok(
  format(
    $$ select public.confirm_permanent_ban(%L::uuid) $$,
    :'ban_req'
  ),
  'P0001',
  'permanent ban requires a second distinct staff confirmer',
  'requester cannot self-confirm permanent ban'
);

-- Second staff confirms.
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000004', true);

select lives_ok(
  format(
    $$ select public.confirm_permanent_ban(%L::uuid) $$,
    :'ban_req'
  ),
  'second staff can confirm permanent ban'
);

select is(
  public.is_matching_restricted('10000000-0000-4000-8000-000000000001'),
  true,
  'confirmed permanent ban restricts matching'
);

-- Trust ledger records ban request/confirm events.
reset role;
select ok(
  exists (
    select 1 from public.trust_events
    where subject_user_id = '10000000-0000-4000-8000-000000000001'
      and event_type = 'permanent_ban_requested'
  ),
  'permanent_ban_requested trust event appended'
);

select ok(
  exists (
    select 1 from public.trust_events
    where subject_user_id = '10000000-0000-4000-8000-000000000001'
      and event_type = 'permanent_ban_confirmed'
  ),
  'permanent_ban_confirmed trust event appended'
);

select ok(
  exists (
    select 1 from public.staff_action_audit
    where action = 'confirm_permanent_ban'
      and target_user_id = '10000000-0000-4000-8000-000000000001'
  ),
  'staff action audit records confirm'
);

-- Authenticated cannot flip named second owner.
set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000003', true);
select throws_ok(
  $$ select public.set_platform_safety_setting('named_second_owner_configured', false) $$,
  '42501',
  null,
  'authenticated staff cannot flip platform safety settings'
);

select * from finish();
rollback;
