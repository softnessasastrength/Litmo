begin;
select plan(5);

set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000001', true);

select throws_ok(
  $$ select count(*) from public.list_moderation_case_notes(
       '00000000-0000-4000-8000-000000000001'
     ) $$,
  '42501',
  'moderator access required',
  'non-staff cannot list case notes'
);

select public.submit_report(
  '10000000-0000-4000-8000-000000000002',
  'harassment',
  null,
  null,
  'console-report-1'
) as rid \gset

reset role;
select id as cid
  from public.moderation_cases
 where report_id = :'rid'::uuid \gset

insert into public.staff_roles (user_id, role)
values ('10000000-0000-4000-8000-000000000003', 'moderator')
on conflict (user_id) do update set role = excluded.role;

set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000003', true);

select is(public.is_staff_moderator(), true, 'staff is recognized');

select lives_ok(
  'select public.claim_moderation_case(''' || :'cid' || '''::uuid)',
  'staff can claim'
);

select lives_ok(
  'select public.add_moderation_note(''' || :'cid' || '''::uuid, ''Console test note.'')',
  'staff can add a note'
);

select is(
  (select count(*)::integer from public.list_moderation_case_notes(:'cid'::uuid)),
  1,
  'staff can list the note trail'
);

select * from finish();
rollback;
