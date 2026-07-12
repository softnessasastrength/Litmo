begin;
select plan(10);
insert into public.sessions(id,user_a,user_b,status) values
 ('34000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000002','soft_signaled'),
 ('34000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000002','active');

set local role authenticated;
select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000001',true);
select lives_ok($$select public.submit_session_wrapup('34000000-0000-4000-8000-000000000001','soft_signal_used','litmo:encrypted:v1:{"format":1,"keyVersion":1,"ciphertext":"opaque"}','wrap-a')$$,'the first participant can submit a private wrap-up');
select is((select count(*)::integer from public.session_wrapups),1,'the owner can read their own wrap-up');
select is(public.submit_session_wrapup('34000000-0000-4000-8000-000000000001','safety_concern','litmo:encrypted:v1:{"format":1,"keyVersion":1,"ciphertext":"changed"}','another-key'),(select id from public.session_wrapups),'a repeated submission returns the original immutable result');
select is((select outcome from public.session_wrapups),'soft_signal_used','a retry cannot overwrite the original outcome');
select throws_ok($$select public.submit_session_wrapup('34000000-0000-4000-8000-000000000002','ended_normally',null,'active')$$,'55000','session is not ready for wrap-up','an active session cannot be wrapped up early');
select throws_ok($$insert into public.session_wrapups(session_id,user_id,outcome,idempotency_key) values('34000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','ended_normally','direct')$$,'42501','permission denied for table session_wrapups','authenticated users cannot write the table directly');

select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000002',true);
select is((select count(*)::integer from public.session_wrapups),0,'the counterpart cannot read the first participant response');
select lives_ok($$select public.submit_session_wrapup('34000000-0000-4000-8000-000000000001','felt_uncomfortable',null,'wrap-b')$$,'the counterpart can submit independently');
select is((select count(*)::integer from public.session_wrapups),1,'the counterpart sees only their own response');

select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000099',true);
select throws_ok($$select public.submit_session_wrapup('34000000-0000-4000-8000-000000000001','ended_normally',null,'stranger')$$,'42501','session not found or access denied','a non-participant learns nothing and cannot submit');
select * from finish();
rollback;
