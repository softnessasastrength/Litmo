begin;
select plan(7);

reset role;
insert into public.staff_roles (user_id, role)
values ('10000000-0000-4000-8000-000000000003', 'moderator')
on conflict (user_id) do update set role = excluded.role;

-- Open a request 0001 → 0002, then restrict 0002 → request cancels.
set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000001', true);
select public.request_session(
  '10000000-0000-4000-8000-000000000002',
  'gate-req-1'
) as sid \gset

select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000003', true);
select public.apply_account_restriction(
  '10000000-0000-4000-8000-000000000002',
  'matching_hold',
  'safety_review',
  now() + interval '3 days',
  'gate test'
) as hold_id \gset

-- Session status is participant-RLS; assert as postgres (not the moderator).
reset role;
select is(
  (select status from public.sessions where id = :'sid'::uuid),
  'cancelled',
  'applying a restriction cancels pending requested sessions'
);

-- Lift 0002 as staff, then restrict 0004 for accept-gate tests.
set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000003', true);
select lives_ok(
  'select public.lift_account_restriction(''' || :'hold_id' || '''::uuid)',
  'lift hold on 0002'
);

select public.apply_account_restriction(
  '10000000-0000-4000-8000-000000000004',
  'matching_hold',
  'policy_violation',
  now() + interval '2 days',
  null
);

-- Create a requested session as postgres, then attempt accept while restricted.
reset role;
-- Ensure 0004 still restricted
select is(
  public.is_matching_restricted('10000000-0000-4000-8000-000000000004'),
  true,
  '0004 remains restricted'
);

insert into public.sessions (id, user_a, user_b, status)
values (
  'b1000000-0000-4000-8000-000000000088',
  '10000000-0000-4000-8000-000000000001',
  '10000000-0000-4000-8000-000000000004',
  'requested'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000004', true);
select throws_ok(
  $$ select public.transition_session(
       'b1000000-0000-4000-8000-000000000088',
       'accepted',
       'gate-accept-1',
       '{"source":"api","trigger":"user_action"}'::jsonb
     ) $$,
  '42501',
  'matching is paused on your account',
  'restricted recipient cannot accept a request'
);

-- Restricted recipient can still decline.
select lives_ok(
  $$ select public.transition_session(
       'b1000000-0000-4000-8000-000000000088',
       'declined',
       'gate-decline-1',
       '{"source":"api","trigger":"user_action"}'::jsonb
     ) $$,
  'restricted recipient may still decline'
);

reset role;
select is(
  (select status from public.sessions where id = 'b1000000-0000-4000-8000-000000000088'),
  'declined',
  'decline lands while restricted'
);

-- Requester cannot accept (not recipient) — already covered. Peer message:
-- unrestricted actor cannot move restricted pair forward via accept either
-- (would need to be recipient). Check ready→active blocked when peer held.
reset role;
insert into public.sessions (id, user_a, user_b, status)
values (
  'b1000000-0000-4000-8000-000000000089',
  '10000000-0000-4000-8000-000000000001',
  '10000000-0000-4000-8000-000000000004',
  'ready'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000001', true);
select throws_ok(
  $$ select public.transition_session(
       'b1000000-0000-4000-8000-000000000089',
       'active',
       'gate-active-1',
       '{"source":"api","trigger":"user_action"}'::jsonb
     ) $$,
  '42501',
  'that person is not available',
  'cannot activate when the other party is restricted'
);

select * from finish();
rollback;
