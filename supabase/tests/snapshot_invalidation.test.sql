begin;
select plan(9);

insert into public.touch_profile_versions(id,user_id,version,profile) values
 ('23000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001',1,'{}'),
 ('23000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000002',1,'{}');
insert into public.consent_preference_versions(user_id,version,preferences) values
 ('10000000-0000-4000-8000-000000000001',1,'{}'),
 ('10000000-0000-4000-8000-000000000002',1,'{}');
insert into public.sessions(id,user_a,user_b,status) values
 ('33000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000002','ready'),
 ('33000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000002','consent_pending');
insert into public.consent_snapshots(
 id,session_id,profile_a_id,profile_a_version,profile_b_id,profile_b_version,fingerprint,compatibility
) values
 ('43000000-0000-4000-8000-000000000001','33000000-0000-4000-8000-000000000001','23000000-0000-4000-8000-000000000001',1,'23000000-0000-4000-8000-000000000002',1,repeat('e',64),'{"consentGranted":false}'),
 ('43000000-0000-4000-8000-000000000002','33000000-0000-4000-8000-000000000002','23000000-0000-4000-8000-000000000001',1,'23000000-0000-4000-8000-000000000002',1,repeat('f',64),'{"consentGranted":false}');
insert into public.consent_snapshot_confirmations(snapshot_id,user_id,fingerprint) values
 ('43000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001',repeat('e',64)),
 ('43000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000002',repeat('e',64)),
 ('43000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000001',repeat('f',64));

set local role authenticated;
select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000001',true);
select lives_ok(
 $$ select public.save_profile_versions('{}','{}') $$,
 'a material profile edit persists and invalidates affected pre-activation snapshots atomically'
);
select is((select status from public.sessions where id='33000000-0000-4000-8000-000000000001'),'consent_pending','a ready session returns to consent pending');
select is((select status from public.sessions where id='33000000-0000-4000-8000-000000000002'),'consent_pending','an already-pending session stays consent pending');
select is((select count(*)::integer from public.consent_snapshots where invalidated_at is not null and invalidated_by='10000000-0000-4000-8000-000000000001'),2,'both stale snapshots record who invalidated them and when');
select is((select count(*)::integer from public.consent_snapshot_confirmations),0,'all confirmations on stale snapshots are cleared');
select is((select count(*)::integer from public.session_events where event_type='session_transition' and prior_state='ready' and resulting_state='consent_pending'),1,'the ready rollback uses the canonical transition audit path');
select is((select count(*)::integer from public.session_events where event_type='snapshot_invalidated' and prior_state='consent_pending' and resulting_state='consent_pending'),1,'pending invalidation has its own append-only audit event');
select throws_ok(
 $$ select public.confirm_session_snapshot('43000000-0000-4000-8000-000000000002',repeat('f',64)) $$,
 '55000','snapshot confirmation rejected','an invalidated fingerprint cannot be reconfirmed'
);

reset role;
-- Look up the actual latest version save_profile_versions() just created
-- for user 0001, rather than a hardcoded literal: real callers always
-- resolve "latest" dynamically, and a hardcoded number would be fragile
-- against any other fixture (seed data included) that changes how many
-- versions this user already has.
select lives_ok(
 format(
   $$ select public.create_session_snapshot('33000000-0000-4000-8000-000000000001',%L,%s,'23000000-0000-4000-8000-000000000002',1,repeat('a',64),'{"consentGranted":false}') $$,
   (select id from public.touch_profile_versions where user_id='10000000-0000-4000-8000-000000000001' order by version desc limit 1),
   (select version from public.touch_profile_versions where user_id='10000000-0000-4000-8000-000000000001' order by version desc limit 1)
 ),
 'the trusted persistence boundary can replace the stale agreement with exact latest versions'
);

select * from finish();
rollback;
