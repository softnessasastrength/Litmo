begin;
select plan(4);

reset role;
insert into public.staff_roles (user_id, role)
values ('10000000-0000-4000-8000-000000000003', 'moderator')
on conflict (user_id) do update set role = excluded.role;

-- Active session between 0001 and 0002.
insert into public.sessions (id, user_a, user_b, status, started_at)
values (
  'c1000000-0000-4000-8000-000000000070',
  '10000000-0000-4000-8000-000000000001',
  '10000000-0000-4000-8000-000000000002',
  'active',
  now()
);

-- Ready pre-activation session with 0004.
insert into public.sessions (id, user_a, user_b, status)
values (
  'c1000000-0000-4000-8000-000000000071',
  '10000000-0000-4000-8000-000000000001',
  '10000000-0000-4000-8000-000000000004',
  'ready'
);

-- ADR 0061: permanent ban is dual-HITL by default. This test isolates the
-- session-ending side effect, so disable two-person for a synthetic apply.
reset role;
select public.set_platform_safety_setting('two_person_permanent_ban_required', false);

set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000003', true);

select lives_ok(
  $$ select public.apply_account_restriction(
       '10000000-0000-4000-8000-000000000001',
       'permanent_ban',
       'policy_violation',
       null,
       'ban ends open work'
     ) $$,
  'staff can apply permanent ban when two-person policy is off (synthetic)'
);

reset role;
select is(
  (select status from public.sessions where id = 'c1000000-0000-4000-8000-000000000070'),
  'safety_ended',
  'permanent ban safety-ends active sessions'
);

select is(
  (select status from public.sessions where id = 'c1000000-0000-4000-8000-000000000071'),
  'cancelled',
  'permanent ban cancels pre-activation sessions'
);

-- matching_hold ends open work (ADR 0038); covered in matching_hold_sessions.test.sql.
-- Keep one permanent-ban-only residual check: second pair remains active when
-- ban targets a different user (already safety-ended 0001's sessions above).
insert into public.sessions (id, user_a, user_b, status, started_at)
values (
  'c1000000-0000-4000-8000-000000000072',
  '10000000-0000-4000-8000-000000000002',
  '10000000-0000-4000-8000-000000000004',
  'active',
  now()
);

reset role;
select is(
  (select status from public.sessions where id = 'c1000000-0000-4000-8000-000000000072'),
  'active',
  'sessions not involving the banned account remain active'
);

select * from finish();
rollback;
