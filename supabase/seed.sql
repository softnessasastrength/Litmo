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
-- GoTrue password login scans token columns as non-null strings. Leaving them
-- NULL causes: "Scan error on column ... confirmation_token: converting NULL
-- to string is unsupported" and HTTP 500 on /auth/v1/token. Match the empty
-- string defaults GoTrue writes for signup-created users (Track B / ADR 0041).
insert into auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  confirmation_token,
  recovery_token,
  email_change_token_new,
  email_change,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
)
values
  ('00000000-0000-0000-0000-000000000000', '10000000-0000-4000-8000-000000000001', 'authenticated', 'authenticated', 'maya.demo@litmo.local', crypt('LitmoDemo123!', gen_salt('bf')), now(), '', '', '', '', '{"provider":"email","providers":["email"]}', '{"display_name":"Maya Demo"}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '10000000-0000-4000-8000-000000000002', 'authenticated', 'authenticated', 'eli.demo@litmo.local', crypt('LitmoDemo123!', gen_salt('bf')), now(), '', '', '', '', '{"provider":"email","providers":["email"]}', '{"display_name":"Eli Demo"}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '10000000-0000-4000-8000-000000000003', 'authenticated', 'authenticated', 'eli-persona.demo@litmo.local', crypt('LitmoDemo123!', gen_salt('bf')), now(), '', '', '', '', '{"provider":"email","providers":["email"]}', '{"display_name":"Eli"}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '10000000-0000-4000-8000-000000000004', 'authenticated', 'authenticated', 'jonah-persona.demo@litmo.local', crypt('LitmoDemo123!', gen_salt('bf')), now(), '', '', '', '', '{"provider":"email","providers":["email"]}', '{"display_name":"Jonah"}', now(), now())
on conflict (id) do nothing;

insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
values
  ('10000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'maya.demo@litmo.local', '{"sub":"10000000-0000-4000-8000-000000000001","email":"maya.demo@litmo.local"}', 'email', now(), now(), now()),
  ('10000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000002', 'eli.demo@litmo.local', '{"sub":"10000000-0000-4000-8000-000000000002","email":"eli.demo@litmo.local"}', 'email', now(), now(), now()),
  ('10000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000003', 'eli-persona.demo@litmo.local', '{"sub":"10000000-0000-4000-8000-000000000003","email":"eli-persona.demo@litmo.local"}', 'email', now(), now(), now()),
  ('10000000-0000-4000-8000-000000000004', '10000000-0000-4000-8000-000000000004', 'jonah-persona.demo@litmo.local', '{"sub":"10000000-0000-4000-8000-000000000004","email":"jonah-persona.demo@litmo.local"}', 'email', now(), now(), now())
on conflict (provider_id, provider) do nothing;

update public.profiles set pronouns = 'she/her', bio = 'Synthetic account for local RLS testing.', vibe_archetype = 'Quiet Tidepool', onboarding_completed_at = now(), age_signal_status = 'adult', age_signal_source = 'development_self_attest', age_signal_at = now() where user_id = '10000000-0000-4000-8000-000000000001';
update public.profiles set pronouns = 'they/them', bio = 'Synthetic account for local RLS testing.', vibe_archetype = 'Wandering Lantern', onboarding_completed_at = now(), age_signal_status = 'adult', age_signal_source = 'development_self_attest', age_signal_at = now() where user_id = '10000000-0000-4000-8000-000000000002';
update public.profiles set pronouns = 'they/them', bio = 'Synthetic mock-discovery persona for local request-flow testing.', vibe_archetype = 'Wandering Lantern', onboarding_completed_at = now(), age_signal_status = 'adult', age_signal_source = 'development_self_attest', age_signal_at = now() where user_id = '10000000-0000-4000-8000-000000000003';
update public.profiles set pronouns = 'he/him', bio = 'Synthetic mock-discovery persona for local request-flow testing.', vibe_archetype = 'Gentle Hearth', onboarding_completed_at = now(), age_signal_status = 'adult', age_signal_source = 'development_self_attest', age_signal_at = now() where user_id = '10000000-0000-4000-8000-000000000004';

-- Touch/consent profiles for all four seeded accounts, matching
-- app/data/mockConsentProfiles.ts's legacyProfiles fixtures exactly, so
-- POST /api/sessions/:sessionId/snapshot (backend/routes/sessionSnapshots.js)
-- can actually compute a real canonical Consent Snapshot for these accounts
-- without first requiring a manual onboarding pass through the mobile app.
-- Without these rows, snapshot creation fails closed with
-- profile_versions_missing for every seeded account.
--
-- Version 1000 (not 1) deliberately: several pgTAP fixtures hardcode small
-- version numbers (1, 2, 99) for these exact user ids within their own
-- rolled-back transactions. Since this file's inserts commit permanently
-- before any test runs, colliding on the same (user_id, version) unique key
-- would break those fixtures' own inserts. getLatestProfileVersions always
-- orders by version descending, so any sufficiently high, unused version
-- number is equally correct here.
insert into public.touch_profile_versions (user_id, version, profile) values
  ('10000000-0000-4000-8000-000000000001', 1000, '{"pressure":"medium","duration":"few_minutes","environments":["hosted_community"],"holdTypes":["side_by_side"]}'),
  ('10000000-0000-4000-8000-000000000002', 1000, '{"pressure":"medium","duration":"brief","environments":["hosted_community","public_calm"],"holdTypes":["side_by_side","hand_holding"]}'),
  ('10000000-0000-4000-8000-000000000003', 1000, '{"pressure":"light","duration":"decide_together","environments":["outdoors"],"holdTypes":["hand_holding"]}'),
  ('10000000-0000-4000-8000-000000000004', 1000, '{"pressure":"firm","duration":"few_minutes","environments":["hosted_community"],"holdTypes":["side_by_side"]}')
on conflict (user_id, version) do nothing;

insert into public.consent_preference_versions (user_id, version, preferences) values
  ('10000000-0000-4000-8000-000000000001', 1000, '{"bodyZones":[{"zone":"hands","status":"welcomed","pressure":"medium"},{"zone":"shoulders","status":"ask_first","pressure":"light"},{"zone":"upper_back","status":"welcomed","pressure":"medium"}],"hardStops":["face"]}'),
  ('10000000-0000-4000-8000-000000000002', 1000, '{"bodyZones":[{"zone":"hands","status":"welcomed","pressure":"medium"},{"zone":"shoulders","status":"ask_first","pressure":"medium"},{"zone":"upper_back","status":"welcomed","pressure":"firm"}],"hardStops":[]}'),
  ('10000000-0000-4000-8000-000000000003', 1000, '{"bodyZones":[{"zone":"hands","status":"welcomed","pressure":"light"}],"hardStops":["shoulders"]}'),
  ('10000000-0000-4000-8000-000000000004', 1000, '{"bodyZones":[{"zone":"hands","status":"welcomed","pressure":"firm"},{"zone":"upper_back","status":"welcomed","pressure":"firm"}],"hardStops":[]}')
on conflict (user_id, version) do nothing;

-- Migration 036 gates real matching on private-alpha admission. Seed accounts
-- are the local named cohort; production accounts are not created by this file.
insert into public.private_alpha_memberships (user_id, enrolled_by)
values
  ('10000000-0000-4000-8000-000000000001', null),
  ('10000000-0000-4000-8000-000000000002', null),
  ('10000000-0000-4000-8000-000000000003', null),
  ('10000000-0000-4000-8000-000000000004', null)
on conflict (user_id) do update set revoked_at = null;
