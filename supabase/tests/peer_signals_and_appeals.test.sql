begin;
select plan(10);

set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000001', true);

select ok(
  (
    select account_age_days is not null
    from public.discovery_profiles()
    where user_id = '10000000-0000-4000-8000-000000000002'
    limit 1
  ),
  'discovery_profiles returns account_age_days for peer candidates'
);

select cmp_ok(
  (
    select completed_sessions
    from public.discovery_profiles()
    where user_id = '10000000-0000-4000-8000-000000000002'
    limit 1
  ),
  '>=',
  0,
  'completed_sessions is non-negative'
);

select lives_ok(
  $$ select * from public.peer_public_signals(
       '10000000-0000-4000-8000-000000000002'
     ) $$,
  'peer_public_signals returns specific facts for an available peer'
);

-- Staff restrict 0001, then 0001 appeals.
reset role;
insert into public.staff_roles (user_id, role)
values ('10000000-0000-4000-8000-000000000003', 'moderator')
on conflict (user_id) do update set role = excluded.role;

set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000003', true);
select public.apply_account_restriction(
  '10000000-0000-4000-8000-000000000001',
  'matching_hold',
  'safety_review',
  now() + interval '7 days',
  'appeal test'
) as rid \gset

select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000001', true);
select is(
  (select count(*)::integer from public.list_my_active_restrictions()),
  1,
  'restricted user sees the active restriction'
);

select lives_ok(
  'select public.submit_restriction_appeal(''' || :'rid' || '''::uuid, ''I believe this hold was applied in error and request human review.'')',
  'restricted user can submit an appeal'
);

select is(
  (select count(*)::integer from public.list_my_appeals()),
  1,
  'appellant sees their appeal'
);

select throws_ok(
  'select public.submit_restriction_appeal(''' || :'rid' || '''::uuid, ''duplicate'')',
  '55000',
  'an open appeal already exists for that restriction',
  'only one open appeal per restriction'
);

select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000003', true);
select is(
  (select count(*)::integer from public.list_open_appeals()),
  1,
  'staff sees open appeals'
);

select id as aid from public.list_open_appeals() limit 1 \gset

select lives_ok(
  'select public.resolve_restriction_appeal(''' || :'aid' || '''::uuid, ''lifted'', ''Hold lifted after review.'')',
  'staff can resolve an appeal by lifting'
);

select is(
  public.is_matching_restricted('10000000-0000-4000-8000-000000000001'),
  false,
  'lifted appeal removes the matching restriction'
);

select * from finish();
rollback;
