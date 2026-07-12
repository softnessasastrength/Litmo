begin;
select plan(6);

-- Seed one session and one audit event directly (bypassing RLS, as the
-- migration-runner role) between the two demo seed users from
-- supabase/seed.sql, before switching to `authenticated` for the actual
-- RLS assertions below.
insert into public.sessions (id, user_a, user_b, status)
values (
  '30000000-0000-4000-8000-000000000001',
  '10000000-0000-4000-8000-000000000001',
  '10000000-0000-4000-8000-000000000002',
  'requested'
);
insert into public.session_events (session_id, actor_id, event_type, prior_state, resulting_state)
values (
  '30000000-0000-4000-8000-000000000001',
  '10000000-0000-4000-8000-000000000001',
  'transition',
  'draft',
  'requested'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000001', true);

select is((select count(*)::integer from public.sessions where id = '30000000-0000-4000-8000-000000000001'), 1, 'a participant can read their own session');
select is((select count(*)::integer from public.session_events where session_id = '30000000-0000-4000-8000-000000000001'), 1, 'a participant can read their own session''s audit trail');
select throws_ok($$ insert into public.sessions (user_a, user_b, status) values ('10000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000002','draft') $$, '42501', 'permission denied for table sessions', 'authenticated cannot create a session directly yet: no transition function exists');
select throws_ok($$ insert into public.session_events (session_id, actor_id, event_type, prior_state, resulting_state) values ('30000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','transition','requested','accepted') $$, '42501', 'permission denied for table session_events', 'authenticated cannot append to the audit trail directly: must go through a future transition function');

-- Switching the JWT claim (not the role) proves a stranger to this session
-- sees neither the session nor its audit trail, without needing to
-- re-elevate privileges mid-transaction.
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000099', true);
select is((select count(*)::integer from public.sessions where id = '30000000-0000-4000-8000-000000000001'), 0, 'a non-participant cannot see the session');
select is((select count(*)::integer from public.session_events where session_id = '30000000-0000-4000-8000-000000000001'), 0, 'a non-participant cannot see the session''s audit trail');

select * from finish();
rollback;
