-- Synthetic local-only accounts. Password: LitmoDemo123!
insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values
  ('00000000-0000-0000-0000-000000000000', '10000000-0000-4000-8000-000000000001', 'authenticated', 'authenticated', 'maya.demo@litmo.local', crypt('LitmoDemo123!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"display_name":"Maya Demo"}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '10000000-0000-4000-8000-000000000002', 'authenticated', 'authenticated', 'eli.demo@litmo.local', crypt('LitmoDemo123!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"display_name":"Eli Demo"}', now(), now())
on conflict (id) do nothing;

insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
values
  ('10000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'maya.demo@litmo.local', '{"sub":"10000000-0000-4000-8000-000000000001","email":"maya.demo@litmo.local"}', 'email', now(), now(), now()),
  ('10000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000002', 'eli.demo@litmo.local', '{"sub":"10000000-0000-4000-8000-000000000002","email":"eli.demo@litmo.local"}', 'email', now(), now(), now())
on conflict (provider_id, provider) do nothing;

update public.profiles set pronouns = 'she/her', bio = 'Synthetic account for local RLS testing.', vibe_archetype = 'Quiet Tidepool', onboarding_completed_at = now() where user_id = '10000000-0000-4000-8000-000000000001';
update public.profiles set pronouns = 'they/them', bio = 'Synthetic account for local RLS testing.', vibe_archetype = 'Wandering Lantern', onboarding_completed_at = now() where user_id = '10000000-0000-4000-8000-000000000002';
