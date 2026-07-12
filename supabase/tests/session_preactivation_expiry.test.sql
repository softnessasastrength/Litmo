begin;
select plan(6);

set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000001', true);

select public.request_session('10000000-0000-4000-8000-000000000002', 'pre-1') as session_id \gset

select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000002', true);
select public.transition_session(:'session_id'::uuid, 'accepted', 'pre-accept');
select public.transition_session(:'session_id'::uuid, 'consent_pending', 'pre-pending');

select ok(
  public.preactivation_deadline(:'session_id'::uuid) > now(),
  'fresh consent review has a future pre-activation deadline'
);

-- Backdate as table owner (postgres); session_events is not writable by roles.
reset role;
update public.session_events
   set created_at = now() - interval '25 hours'
 where session_id = :'session_id'::uuid
   and resulting_state = 'consent_pending';

set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000002', true);

select ok(
  public.preactivation_deadline(:'session_id'::uuid) <= now(),
  'backdated consent review is past the pre-activation deadline'
);

select is(
  public.transition_session(:'session_id'::uuid, 'ready', 'pre-stale-confirm'),
  'expired',
  'transition_session auto-expires a stale pre-activation session'
);

select is(
  (select status from public.sessions where id = :'session_id'::uuid),
  'expired',
  'stale pre-activation session is terminal expired'
);

select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000001', true);
select public.request_session('10000000-0000-4000-8000-000000000002', 'pre-2') as session_id_2 \gset
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000002', true);
select public.transition_session(:'session_id_2'::uuid, 'accepted', 'pre2-accept');
select public.transition_session(:'session_id_2'::uuid, 'consent_pending', 'pre2-pending');

reset role;
update public.session_events
   set created_at = now() - interval '25 hours'
 where session_id = :'session_id_2'::uuid
   and resulting_state in ('accepted', 'consent_pending');

set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000002', true);

select is(
  (select count(*)::integer from public.list_open_sessions() where id = :'session_id_2'::uuid),
  0,
  'list_open_sessions drops sessions it auto-expires'
);

select is(
  (select status from public.sessions where id = :'session_id_2'::uuid),
  'expired',
  'list_open_sessions persisted the expired terminal state'
);

select * from finish();
rollback;
