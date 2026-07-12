begin;
select plan(12);

set local role authenticated;
select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000001',true);
select lives_ok($$select public.register_auth_device('51000000-0000-4000-8000-000000000001','aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa','Maya iPhone')$$,'an authenticated user can register a device secret');
select is((select count(*)::integer from public.auth_devices),1,'the owner can read registered device metadata');
select isnt((select secret_hash from public.auth_devices),'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa','the raw device secret is never stored');
select ok(public.verify_auth_device('51000000-0000-4000-8000-000000000001','aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'),'the exact current secret verifies');
select isnt(public.verify_auth_device('51000000-0000-4000-8000-000000000001','bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb'),true,'a wrong secret fails closed');
select lives_ok($$select public.revoke_auth_device('51000000-0000-4000-8000-000000000001','aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa','51000000-0000-4000-8000-000000000001')$$,'a trusted current device can revoke a registration');
select isnt(public.verify_auth_device('51000000-0000-4000-8000-000000000001','aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'),true,'a revoked registration no longer verifies');
select lives_ok($$select public.register_auth_device('51000000-0000-4000-8000-000000000001','cccccccccccccccccccccccccccccccc','Replacement iPhone')$$,'passkey-authenticated registration can restore the same installation');
select ok(public.verify_auth_device('51000000-0000-4000-8000-000000000001','cccccccccccccccccccccccccccccccc'),'the rotated device secret verifies');

select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000002',true);
select is((select count(*)::integer from public.auth_devices),0,'another user cannot read device metadata');
select throws_ok($$select public.register_auth_device('51000000-0000-4000-8000-000000000001','dddddddddddddddddddddddddddddddd','Collision')$$,'42501','device registration unavailable','a cross-account identifier collision cannot take over a device');
select throws_ok($$insert into public.auth_devices(id,user_id,secret_hash,display_name) values('51000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000002','raw','Direct')$$,'42501','permission denied for table auth_devices','authenticated clients cannot write device rows directly');

select * from finish();
rollback;
