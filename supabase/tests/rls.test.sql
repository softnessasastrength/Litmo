begin;
select plan(7);

set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000001', true);

select is((select count(*)::integer from public.profiles), 1, 'user sees only their own private profile row');
select is((select count(*)::integer from public.onboarding_progress), 1, 'user sees only their own onboarding progress');
select is((select count(*)::integer from public.discovery_profiles()), 1, 'discovery function exposes another completed synthetic profile');
select is((select count(*)::integer from public.discovery_profiles() where user_id = '10000000-0000-4000-8000-000000000002'), 1, 'discovery exposes only intentional safe projection');

select lives_ok($$ select * from public.save_profile_versions('{"pressure":"light"}'::jsonb, '{"bodyZones":[]}'::jsonb) $$, 'authenticated user can append own profile versions');
select is((select count(*)::integer from public.touch_profile_versions where user_id = '10000000-0000-4000-8000-000000000002'), 0, 'user cannot read another user touch versions');
select throws_ok($$ update public.touch_profile_versions set profile = '{}' where user_id = '10000000-0000-4000-8000-000000000001' $$, 'profile versions are immutable', 'historical touch versions cannot be rewritten');

select * from finish();
rollback;
