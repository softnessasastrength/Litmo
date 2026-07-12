begin;
select plan(3);

reset role;
insert into public.staff_roles (user_id, role)
values ('10000000-0000-4000-8000-000000000003', 'moderator')
on conflict (user_id) do update set role = excluded.role;

insert into public.sessions (id, user_a, user_b, status, started_at)
values (
  'c1000000-0000-4000-8000-000000000080',
  '10000000-0000-4000-8000-000000000001',
  '10000000-0000-4000-8000-000000000002',
  'active',
  now()
);

insert into public.sessions (id, user_a, user_b, status)
values (
  'c1000000-0000-4000-8000-000000000081',
  '10000000-0000-4000-8000-000000000001',
  '10000000-0000-4000-8000-000000000004',
  'ready'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000003', true);

select lives_ok(
  $$ select public.apply_account_restriction(
       '10000000-0000-4000-8000-000000000001',
       'matching_hold',
       'safety_review',
       now() + interval '7 days',
       'hold ends open work'
     ) $$,
  'staff can apply matching hold'
);

reset role;
select is(
  (select status from public.sessions where id = 'c1000000-0000-4000-8000-000000000080'),
  'safety_ended',
  'matching hold safety-ends active sessions'
);

select is(
  (select status from public.sessions where id = 'c1000000-0000-4000-8000-000000000081'),
  'cancelled',
  'matching hold cancels pre-activation sessions'
);

select * from finish();
rollback;
