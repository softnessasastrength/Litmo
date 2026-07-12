begin;
select plan(13);
insert into public.touch_profile_versions(id,user_id,version,profile) values
 ('24000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001',1,'{}'),
 ('24000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000002',1,'{}');
insert into public.sessions(id,user_a,user_b,status) values
 ('36000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000002','consent_pending'),
 ('36000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000002','active');
insert into public.consent_snapshots(id,session_id,profile_a_id,profile_a_version,profile_b_id,profile_b_version,fingerprint,compatibility) values
 ('46000000-0000-4000-8000-000000000001','36000000-0000-4000-8000-000000000001','24000000-0000-4000-8000-000000000001',1,'24000000-0000-4000-8000-000000000002',1,repeat('a',64),'{"consentGranted":false}'),
 ('46000000-0000-4000-8000-000000000002','36000000-0000-4000-8000-000000000002','24000000-0000-4000-8000-000000000001',1,'24000000-0000-4000-8000-000000000002',1,repeat('b',64),'{"consentGranted":false}');
insert into public.consent_snapshot_confirmations(snapshot_id,user_id,fingerprint) values
 ('46000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001',repeat('a',64)),
 ('46000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000001',repeat('b',64)),
 ('46000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000002',repeat('b',64));

set local role authenticated;
select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000001',true);
select is(public.withdraw_session_consent('36000000-0000-4000-8000-000000000001','pre-stop'),'cancelled','one participant withdraws before activation');
select is((select count(*)::integer from public.consent_snapshot_confirmations where snapshot_id='46000000-0000-4000-8000-000000000001'),0,'pre-activation confirmations are cleared');
select ok((select withdrawn_at is not null and withdrawn_by='10000000-0000-4000-8000-000000000001' from public.consent_snapshots where id='46000000-0000-4000-8000-000000000001'),'withdrawal records only actor and time');
select is(public.withdraw_session_consent('36000000-0000-4000-8000-000000000001','pre-stop'),'cancelled','duplicate idempotency key returns stable result');
select is((select count(*)::integer from public.session_events where session_id='36000000-0000-4000-8000-000000000001'),1,'duplicate withdrawal creates one audit event');
select is(public.withdraw_session_consent('36000000-0000-4000-8000-000000000002','active-stop'),'soft_signaled','active withdrawal immediately soft-signals');
select ok((select ended_at is not null and exit_reason='soft_signal' from public.sessions where id='36000000-0000-4000-8000-000000000002'),'active stop records terminal timing without a reason');
select is((select count(*)::integer from public.consent_snapshot_confirmations where snapshot_id='46000000-0000-4000-8000-000000000002'),0,'active stop invalidates confirmations');
select throws_ok($$select public.transition_session('36000000-0000-4000-8000-000000000002','active','replay-active')$$,'55000','session is already terminal','a stopped session cannot reactivate');
select throws_ok($$select public.confirm_session_snapshot('46000000-0000-4000-8000-000000000002',repeat('b',64))$$,'55000','snapshot confirmation rejected','a stopped session cannot reconfirm stale consent');
select is((select metadata from public.session_events where idempotency_key='active-stop'),'{}'::jsonb,'withdrawal audit metadata contains no private reason');
select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000099',true);
select throws_ok($$select public.withdraw_session_consent('36000000-0000-4000-8000-000000000002','stranger')$$,'42501','session not found or access denied','a stranger cannot withdraw or learn session existence');
reset role; set local role anon;
select throws_ok($$select public.withdraw_session_consent('36000000-0000-4000-8000-000000000002','anon')$$,'42501','permission denied for function withdraw_session_consent','anonymous callers cannot stop sessions');
select * from finish(); rollback;
