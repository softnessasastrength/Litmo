begin;
select plan(4);

-- Active session between 0001 and 0002.
insert into public.sessions (id, user_a, user_b, status, started_at)
values (
  'c1000000-0000-4000-8000-000000000090',
  '10000000-0000-4000-8000-000000000001',
  '10000000-0000-4000-8000-000000000002',
  'active',
  now()
);

-- Ready pre-activation between same pair is not realistic concurrently, so
-- use a separate ready session between 0001 and 0004 for pre-activation.
insert into public.sessions (id, user_a, user_b, status)
values (
  'c1000000-0000-4000-8000-000000000091',
  '10000000-0000-4000-8000-000000000001',
  '10000000-0000-4000-8000-000000000004',
  'ready'
);

-- Unrelated active session (0002–0004) must stay active when 0001 blocks 0002.
insert into public.sessions (id, user_a, user_b, status, started_at)
values (
  'c1000000-0000-4000-8000-000000000092',
  '10000000-0000-4000-8000-000000000002',
  '10000000-0000-4000-8000-000000000004',
  'active',
  now()
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000001', true);

select lives_ok(
  $$ select public.block_user('10000000-0000-4000-8000-000000000002') $$,
  'user can block mid-session peer'
);

reset role;
select is(
  (select status from public.sessions where id = 'c1000000-0000-4000-8000-000000000090'),
  'safety_ended',
  'block safety-ends active session with the blocked person'
);

select is(
  (select status from public.sessions where id = 'c1000000-0000-4000-8000-000000000092'),
  'active',
  'unrelated sessions not involving both parties stay active'
);

-- Block 0004 ends the ready pre-activation with 0001.
set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000001', true);
select public.block_user('10000000-0000-4000-8000-000000000004');

reset role;
select is(
  (select status from public.sessions where id = 'c1000000-0000-4000-8000-000000000091'),
  'cancelled',
  'block cancels pre-activation session with the blocked person'
);

select * from finish();
rollback;
