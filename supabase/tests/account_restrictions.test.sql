begin;
select plan(10);

-- Non-staff cannot apply restrictions.
set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000001', true);

select throws_ok(
  $$ select public.apply_account_restriction(
       '10000000-0000-4000-8000-000000000002',
       'matching_hold',
       'safety_review',
       now() + interval '7 days',
       'should fail'
     ) $$,
  '42501',
  'moderator access required',
  'non-staff cannot apply restrictions'
);

-- Promote 0003 to moderator.
reset role;
insert into public.staff_roles (user_id, role)
values ('10000000-0000-4000-8000-000000000003', 'moderator')
on conflict (user_id) do update set role = excluded.role;

set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000003', true);

select public.apply_account_restriction(
  '10000000-0000-4000-8000-000000000002',
  'matching_hold',
  'safety_review',
  now() + interval '7 days',
  'internal review only'
) as hold_id \gset

select is(
  public.is_matching_restricted('10000000-0000-4000-8000-000000000002'),
  true,
  'held account is matching-restricted'
);

-- Restricted user cannot request sessions.
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000002', true);
select throws_ok(
  $$ select public.request_session(
       '10000000-0000-4000-8000-000000000001',
       'restr-req-1'
     ) $$,
  '42501',
  'matching is paused on your account',
  'restricted actor cannot create session requests'
);

select is(
  (select matching_allowed from public.my_matching_access()),
  false,
  'restricted user sees matching_allowed false'
);

-- Other party cannot request the restricted user (opaque).
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000001', true);
select throws_ok(
  $$ select public.request_session(
       '10000000-0000-4000-8000-000000000002',
       'restr-req-2'
     ) $$,
  '42501',
  'that person is not available to request a session with',
  'requesting a restricted account fails opaquely'
);

select is(
  (
    select count(*)::integer
    from public.discovery_profiles()
    where user_id = '10000000-0000-4000-8000-000000000002'
  ),
  0,
  'discovery hides restricted accounts'
);

-- Lift restores access.
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000003', true);
select lives_ok(
  'select public.lift_account_restriction(''' || :'hold_id' || '''::uuid)',
  'moderator can lift a restriction'
);

select is(
  public.is_matching_restricted('10000000-0000-4000-8000-000000000002'),
  false,
  'lifted account is no longer restricted'
);

select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000002', true);
select is(
  (select matching_allowed from public.my_matching_access()),
  true,
  'lifted user sees matching_allowed true'
);

-- Permanent ban rejects ends_at.
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000003', true);
select throws_ok(
  $$ select public.apply_account_restriction(
       '10000000-0000-4000-8000-000000000001',
       'permanent_ban',
       'policy_violation',
       now() + interval '1 day',
       null
     ) $$,
  '22023',
  'permanent bans cannot have an end time',
  'permanent bans must be indefinite'
);

select * from finish();
rollback;
