begin;
select plan(15);

insert into public.touch_profile_versions (id, user_id, version, profile) values
  ('21000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001',1,'{}'),
  ('21000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000002',1,'{}');
insert into public.consent_preference_versions (user_id, version, preferences) values
  ('10000000-0000-4000-8000-000000000001',1,'{}'),
  ('10000000-0000-4000-8000-000000000002',1,'{}');
insert into public.sessions (id, user_a, user_b, status) values
  ('31000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000002','consent_pending'),
  ('31000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000002','consent_pending'),
  ('31000000-0000-4000-8000-000000000003','10000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000002','consent_pending');

set local role service_role;
select lives_ok(
  $$ select public.create_session_snapshot('31000000-0000-4000-8000-000000000001','21000000-0000-4000-8000-000000000001',1,'21000000-0000-4000-8000-000000000002',1,repeat('a',64),'{"consentGranted":false}') $$,
  'the server can persist an exact-version canonical snapshot'
);
select throws_ok(
  $$ select public.create_session_snapshot('31000000-0000-4000-8000-000000000002','21000000-0000-4000-8000-000000000002',1,'21000000-0000-4000-8000-000000000001',1,repeat('b',64),'{"consentGranted":false}') $$,
  '22023', 'exact participant profile versions are required',
  'profile ownership cannot be swapped'
);
select lives_ok(
  $$ select public.create_session_snapshot('31000000-0000-4000-8000-000000000003','21000000-0000-4000-8000-000000000001',1,'21000000-0000-4000-8000-000000000002',1,repeat('c',64),'{"consentGranted":false}') $$,
  'a second session receives an independent snapshot'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000001',true);
select is((select count(*)::integer from public.consent_snapshots),2,'a participant can read both session snapshots they share');
select throws_ok(
  $$ select public.confirm_session_snapshot((select id from public.consent_snapshots where session_id='31000000-0000-4000-8000-000000000001'), repeat('b',64)) $$,
  '55000','snapshot confirmation rejected','a mismatched fingerprint is rejected'
);
select is(
  public.confirm_session_snapshot((select id from public.consent_snapshots where session_id='31000000-0000-4000-8000-000000000001'),repeat('a',64)),
  'consent_pending','the first independent confirmation does not broaden session state'
);
select is((select count(*)::integer from public.consent_snapshot_confirmations),1,'a participant sees only their own confirmation');

select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000002',true);
select is((select count(*)::integer from public.consent_snapshot_confirmations),0,'the counterpart cannot read the first participant private confirmation');
select is(
  public.confirm_session_snapshot((select id from public.consent_snapshots where session_id='31000000-0000-4000-8000-000000000001'),repeat('a',64)),
  'ready','the exact second confirmation moves the session to ready atomically'
);
select is((select status from public.sessions where id='31000000-0000-4000-8000-000000000001'),'ready','both confirmations persist the ready state');
select is(
  public.transition_session('31000000-0000-4000-8000-000000000001','active','activate-after-confirmation','{"source":"test","trigger":"user_action"}'),
  'active','activation succeeds only after both exact confirmations'
);

reset role;
update public.sessions set status='ready' where id='31000000-0000-4000-8000-000000000002';
select throws_ok(
  $$ update public.sessions set status='active' where id='31000000-0000-4000-8000-000000000002' $$,
  '55000','both participants must confirm the current snapshot before activation',
  'the database trigger blocks activation even outside transition_session'
);

set local role authenticated;
select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000001',true);
select throws_ok(
  $$ select public.withdraw_session_consent((select id from public.consent_snapshots where session_id='31000000-0000-4000-8000-000000000001')) $$,
  '55000','session consent cannot be withdrawn in this state',
  'pre-activation withdrawal cannot be replayed after activation'
);

select public.confirm_session_snapshot(
  (select id from public.consent_snapshots where session_id='31000000-0000-4000-8000-000000000003'),
  repeat('c',64)
);
select is(
  public.withdraw_session_consent((select id from public.consent_snapshots where session_id='31000000-0000-4000-8000-000000000003')),
  'cancelled','either participant can withdraw before activation without an explanation'
);
select ok(
  (select withdrawn_by is not null and withdrawn_at is not null from public.consent_snapshots where session_id='31000000-0000-4000-8000-000000000003')
  and not exists (select 1 from public.consent_snapshot_confirmations c join public.consent_snapshots s on s.id=c.snapshot_id where s.session_id='31000000-0000-4000-8000-000000000003'),
  'withdrawal records the actor and clears prior confirmations'
);

select * from finish();
rollback;
