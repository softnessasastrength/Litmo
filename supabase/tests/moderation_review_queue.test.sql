begin;
select plan(11);

-- Regular user cannot list the queue.
set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000001', true);

select throws_ok(
  $$ select count(*) from public.list_moderation_queue(null) $$,
  '42501',
  'moderator access required',
  'non-staff cannot list the moderation queue'
);

select public.submit_report(
  '10000000-0000-4000-8000-000000000002',
  'underage_concern',
  null,
  null,
  'mod-report-1'
) as rid \gset

-- Case auto-created with urgent priority for underage_concern.
reset role;
select is(
  (select count(*)::integer from public.moderation_cases where report_id = :'rid'::uuid),
  1,
  'submitting a report opens a moderation case'
);

select is(
  (select priority from public.moderation_cases where report_id = :'rid'::uuid),
  'urgent',
  'underage_concern maps to urgent priority'
);

-- Promote user 0003 to moderator (ops path: direct staff_roles write as postgres).
insert into public.staff_roles (user_id, role)
values ('10000000-0000-4000-8000-000000000003', 'moderator')
on conflict (user_id) do update set role = excluded.role;

set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000003', true);

select is(public.is_staff_moderator(), true, 'staff role is recognized');

select is(
  (select count(*)::integer from public.list_moderation_queue('open')),
  1,
  'moderator sees the open case'
);

select id as cid
  from public.moderation_cases
 where report_id = :'rid'::uuid \gset

select lives_ok(
  'select public.claim_moderation_case(''' || :'cid' || '''::uuid)',
  'moderator can claim a case'
);

select is(
  (select queue_status from public.moderation_cases where id = :'cid'::uuid),
  'in_progress',
  'claim moves open case to in_progress'
);

select is(
  (select status from public.user_reports where id = :'rid'::uuid),
  'under_review',
  'claim updates reporter-visible status to under_review'
);

select lives_ok(
  'select public.add_moderation_note(''' || :'cid' || '''::uuid, ''Reviewed seed accounts; documenting for audit only.'')',
  'moderator can add an internal note'
);

select lives_ok(
  'select public.resolve_moderation_case(''' || :'cid' || '''::uuid, ''no_action'', ''resolved'')',
  'moderator can resolve with a coarse closed outcome'
);

select is(
  (select status from public.user_reports where id = :'rid'::uuid),
  'closed',
  'resolve closes the reporter-visible report'
);

select is(
  (select closed_outcome from public.user_reports where id = :'rid'::uuid),
  'no_action',
  'resolve records coarse closed_outcome only'
);

-- Reported party still cannot see queue.
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000002', true);
select throws_ok(
  $$ select count(*) from public.list_moderation_queue(null) $$,
  '42501',
  'moderator access required',
  'reported party cannot access the moderation queue'
);

select * from finish();
rollback;
