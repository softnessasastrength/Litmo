begin;
select plan(4);

insert into public.sessions(id,user_a,user_b,status) values(
 '35000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000002','completed'
);

select throws_ok(
 $$insert into public.touch_profile_versions(user_id,version,profile,private_nervous_system_notes) values('10000000-0000-4000-8000-000000000001',99,'{}','plaintext private note')$$,
 '23514',null,'plaintext touch notes are rejected before persistence'
);
select lives_ok(
 $$insert into public.touch_profile_versions(user_id,version,profile,private_nervous_system_notes) values('10000000-0000-4000-8000-000000000001',99,'{}','litmo:encrypted:v1:{"format":1,"keyVersion":1,"ciphertext":"opaque"}')$$,
 'a versioned encrypted touch-note envelope is accepted'
);
select throws_ok(
 $$insert into public.session_wrapups(session_id,user_id,outcome,private_note,idempotency_key) values('35000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','ended_normally','plaintext reason','plaintext-test')$$,
 '23514',null,'plaintext private wrap-up notes are rejected'
);
select ok(
  not exists(select 1 from public.touch_profile_versions where private_nervous_system_notes like '%plaintext private note%'),
  'rejected plaintext never appears in storage'
);

select * from finish();
rollback;
