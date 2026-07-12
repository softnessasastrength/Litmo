begin;
select plan(8);

set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000001', true);

select is((select count(*)::integer from public.profiles), 1, 'user sees only their own private profile row');
select is((select count(*)::integer from public.onboarding_progress), 1, 'user sees only their own onboarding progress');
select is((select count(*)::integer from public.discovery_profiles()), 1, 'discovery function exposes another completed synthetic profile');
select is((select count(*)::integer from public.discovery_profiles() where user_id = '10000000-0000-4000-8000-000000000002'), 1, 'discovery exposes only intentional safe projection');

select lives_ok($$ select * from public.save_profile_versions('{"pressure":"light"}'::jsonb, '{"bodyZones":[]}'::jsonb) $$, 'authenticated user can append own profile versions');
select is((select count(*)::integer from public.touch_profile_versions where user_id = '10000000-0000-4000-8000-000000000002'), 0, 'user cannot read another user touch versions');
-- No RLS policy grants authenticated users UPDATE on touch_profile_versions,
-- so Postgres denies visibility of the row for that command before the
-- touch_profile_versions_immutable trigger ever runs: the statement
-- succeeds but affects zero rows, rather than raising an exception. The
-- trigger remains real defense-in-depth for a context that bypasses RLS
-- (e.g. service_role). Either way, nothing is ever actually mutated -- which
-- is the property this test asserts directly.
select lives_ok($$ update public.touch_profile_versions set profile = '{}' where user_id = '10000000-0000-4000-8000-000000000001' $$, 'rewriting a historical touch version is denied silently rather than raising');
select is((select count(*)::integer from public.touch_profile_versions where user_id = '10000000-0000-4000-8000-000000000001' and profile = '{}'::jsonb), 0, 'historical touch versions cannot be rewritten');

select * from finish();
rollback;
