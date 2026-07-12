begin;
select plan(8);

-- Non-staff cannot load case evidence.
set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000001', true);

select throws_ok(
  $$ select public.get_moderation_case_evidence('00000000-0000-4000-8000-000000000001') $$,
  '42501',
  'moderator access required',
  'non-staff cannot load case evidence'
);

-- Reporter submits with staff-shared message (not encrypted).
select public.submit_report(
  '10000000-0000-4000-8000-000000000002',
  'harassment',
  null,
  null,
  'evidence-report-1',
  'They ignored a clear stop and kept requesting contact.'
) as rid \gset

reset role;
select id as cid
  from public.moderation_cases
 where report_id = :'rid'::uuid \gset

select is(
  (select staff_shared_message from public.user_reports where id = :'rid'::uuid),
  'They ignored a clear stop and kept requesting contact.',
  'staff_shared_message is stored in plaintext for staff RPC access'
);

insert into public.staff_roles (user_id, role)
values ('10000000-0000-4000-8000-000000000003', 'moderator')
on conflict (user_id) do update set role = excluded.role;

set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000003', true);

select is(
  (public.get_moderation_case_evidence(:'cid'::uuid) ->> 'staff_shared_message'),
  'They ignored a clear stop and kept requesting contact.',
  'staff can read the shared reporter message'
);

select is(
  (public.get_moderation_case_evidence(:'cid'::uuid) ->> 'has_device_private_note'),
  'false',
  'device private note flag is false when only staff message was sent'
);

select is(
  (public.get_moderation_case_evidence(:'cid'::uuid) ->> 'reported_id'),
  '10000000-0000-4000-8000-000000000002',
  'evidence includes reported party id'
);

select is(
  (public.get_moderation_case_evidence(:'cid'::uuid) ->> 'prior_other_reports_for_reported')::integer,
  0,
  'prior report count is a plain integer fact'
);

-- Reported party still cannot see the report row via table select.
set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000002', true);

select is(
  (select count(*)::integer from public.user_reports where id = :'rid'::uuid),
  0,
  'reported party cannot select the report row'
);

-- Second report increases prior count for staff evidence.
set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000001', true);

select public.submit_report(
  '10000000-0000-4000-8000-000000000002',
  'spam_scam',
  null,
  null,
  'evidence-report-2',
  null
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000003', true);

select is(
  (public.get_moderation_case_evidence(:'cid'::uuid) ->> 'prior_other_reports_for_reported')::integer,
  1,
  'staff sees prior other report count after a second report'
);

select * from finish();
rollback;
