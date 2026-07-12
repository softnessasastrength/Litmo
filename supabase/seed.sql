-- Synthetic local-only accounts. Password: LitmoDemo123!
--
-- UUIDs 0003/0004 exist so app/data/mockConsentProfiles.ts's "eli" and
-- "jonah" mock discovery personas map to real public.profiles rows and can
-- be targeted by request_session(...) (docs/adr/0015). Without them, a
-- "request a session" UI built against the mock discovery list would work
-- for the "maya" persona (which happens to map to UUID 0002) and fail
-- confusingly for "eli"/"jonah" -- see docs/CHAPTER_4_NEXT_STEPS.md's
-- "Genuine blocker found 2026-07-12" section for the full trace. Note the
-- account labels below intentionally follow the *mock persona* each UUID
-- represents (per mockConsentProfiles.ts's userId map), not the pre-existing
-- 0001/0002 accounts' own display names, which predate this mapping and
-- don't line up with the "maya"/"eli" persona names by coincidence.
insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values
  ('00000000-0000-0000-0000-000000000000', '10000000-0000-4000-8000-000000000001', 'authenticated', 'authenticated', 'maya.demo@litmo.local', crypt('LitmoDemo123!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"display_name":"Maya Demo"}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '10000000-0000-4000-8000-000000000002', 'authenticated', 'authenticated', 'eli.demo@litmo.local', crypt('LitmoDemo123!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"display_name":"Eli Demo"}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '10000000-0000-4000-8000-000000000003', 'authenticated', 'authenticated', 'eli-persona.demo@litmo.local', crypt('LitmoDemo123!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"display_name":"Eli"}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '10000000-0000-4000-8000-000000000004', 'authenticated', 'authenticated', 'jonah-persona.demo@litmo.local', crypt('LitmoDemo123!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"display_name":"Jonah"}', now(), now())
on conflict (id) do nothing;

insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
values
  ('10000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'maya.demo@litmo.local', '{"sub":"10000000-0000-4000-8000-000000000001","email":"maya.demo@litmo.local"}', 'email', now(), now(), now()),
  ('10000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000002', 'eli.demo@litmo.local', '{"sub":"10000000-0000-4000-8000-000000000002","email":"eli.demo@litmo.local"}', 'email', now(), now(), now()),
  ('10000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000003', 'eli-persona.demo@litmo.local', '{"sub":"10000000-0000-4000-8000-000000000003","email":"eli-persona.demo@litmo.local"}', 'email', now(), now(), now()),
  ('10000000-0000-4000-8000-000000000004', '10000000-0000-4000-8000-000000000004', 'jonah-persona.demo@litmo.local', '{"sub":"10000000-0000-4000-8000-000000000004","email":"jonah-persona.demo@litmo.local"}', 'email', now(), now(), now())
on conflict (provider_id, provider) do nothing;

update public.profiles set pronouns = 'she/her', bio = 'Synthetic account for local RLS testing.', vibe_archetype = 'Quiet Tidepool', onboarding_completed_at = now() where user_id = '10000000-0000-4000-8000-000000000001';
update public.profiles set pronouns = 'they/them', bio = 'Synthetic account for local RLS testing.', vibe_archetype = 'Wandering Lantern', onboarding_completed_at = now() where user_id = '10000000-0000-4000-8000-000000000002';
update public.profiles set pronouns = 'they/them', bio = 'Synthetic mock-discovery persona for local request-flow testing.', vibe_archetype = 'Wandering Lantern', onboarding_completed_at = now() where user_id = '10000000-0000-4000-8000-000000000003';
update public.profiles set pronouns = 'he/him', bio = 'Synthetic mock-discovery persona for local request-flow testing.', vibe_archetype = 'Gentle Hearth', onboarding_completed_at = now() where user_id = '10000000-0000-4000-8000-000000000004';
