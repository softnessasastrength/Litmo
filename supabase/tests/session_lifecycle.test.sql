begin;
select plan(17);

-- Canonical graph fixture. This edge list is intentionally explicit and must
-- stay synchronized with shared/src/sessionLifecycle.ts. The cross-product
-- matrix below exercises all 144 from/to pairs against transition_session().
create temporary table lifecycle_states (state text primary key, terminal boolean not null);
insert into lifecycle_states (state, terminal) values
  ('draft', false),
  ('requested', false),
  ('accepted', false),
  ('consent_pending', false),
  ('ready', false),
  ('active', false),
  ('completed', true),
  ('declined', true),
  ('cancelled', true),
  ('expired', true),
  ('soft_signaled', true),
  ('safety_ended', true);

create temporary table lifecycle_edges (from_state text, to_state text, primary key (from_state, to_state));
insert into lifecycle_edges (from_state, to_state) values
  ('draft', 'requested'),
  ('requested', 'accepted'),
  ('requested', 'declined'),
  ('requested', 'cancelled'),
  ('requested', 'expired'),
  ('accepted', 'consent_pending'),
  ('consent_pending', 'ready'),
  ('consent_pending', 'cancelled'),
  ('consent_pending', 'expired'),
  ('ready', 'consent_pending'),
  ('ready', 'active'),
  ('ready', 'cancelled'),
  ('ready', 'expired'),
  ('active', 'completed'),
  ('active', 'soft_signaled'),
  ('active', 'safety_ended');

create temporary table lifecycle_cases as
select
  gen_random_uuid() as session_id,
  f.state as from_state,
  t.state as to_state,
  exists (
    select 1 from lifecycle_edges e
    where e.from_state = f.state and e.to_state = t.state
  ) as is_edge,
  f.terminal
from lifecycle_states f
cross join lifecycle_states t;

create temporary table lifecycle_results (
  session_id uuid primary key,
  succeeded boolean not null,
  returned_state text,
  sqlstate text
);

-- Seed as the migration-runner role before switching to authenticated. Every
-- matrix row gets an independent session so one attempted edge cannot affect
-- another case.
insert into public.sessions (id, user_a, user_b, status)
select
  session_id,
  '10000000-0000-4000-8000-000000000001',
  '10000000-0000-4000-8000-000000000002',
  from_state
from lifecycle_cases;

-- `ready -> active` has the additional Chapter 4 snapshot precondition. Seed
-- exact confirmed data for that one matrix case so the graph test continues
-- to exercise the edge rather than weakening activation safety.
insert into public.touch_profile_versions (id, user_id, version, profile) values
  ('22000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001',1,'{}'),
  ('22000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000002',1,'{}');
insert into public.consent_snapshots (
  session_id, profile_a_id, profile_a_version, profile_b_id,
  profile_b_version, fingerprint, compatibility
)
select session_id,
  '22000000-0000-4000-8000-000000000001',1,
  '22000000-0000-4000-8000-000000000002',1,
  repeat('d',64),'{"consentGranted":false}'
from lifecycle_cases where from_state='ready' and to_state='active';
insert into public.consent_snapshot_confirmations (snapshot_id, user_id, fingerprint)
select id, '10000000-0000-4000-8000-000000000001'::uuid, fingerprint from public.consent_snapshots
union all
select id, '10000000-0000-4000-8000-000000000002'::uuid, fingerprint from public.consent_snapshots;

insert into public.sessions (id, user_a, user_b, status)
values (
  '30000000-0000-4000-8000-000000000001',
  '10000000-0000-4000-8000-000000000001',
  '10000000-0000-4000-8000-000000000002',
  'requested'
);
insert into public.session_events (session_id, actor_id, event_type, prior_state, resulting_state)
values (
  '30000000-0000-4000-8000-000000000001',
  '10000000-0000-4000-8000-000000000001',
  'session_transition',
  'draft',
  'requested'
);

grant select on lifecycle_cases to authenticated;
grant insert, select on lifecycle_results to authenticated;

-- Acting as user_b (the recipient in every seeded session below) so the
-- matrix and the fixture-session assertions can exercise every graph edge,
-- including requested -> accepted/declined, which migration 015 restricts
-- to the recipient only.
set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000002', true);

select is(
  (select count(*)::integer from public.sessions where id = '30000000-0000-4000-8000-000000000001'),
  1,
  'a participant can read their own session'
);
select is(
  (select count(*)::integer from public.session_events where session_id = '30000000-0000-4000-8000-000000000001'),
  1,
  'a participant can read their own session audit trail'
);
select throws_ok(
  $$ insert into public.sessions (user_a, user_b, status) values ('10000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000002','draft') $$,
  '42501',
  'permission denied for table sessions',
  'authenticated cannot create a session directly'
);
select throws_ok(
  $$ insert into public.session_events (session_id, actor_id, event_type, prior_state, resulting_state) values ('30000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','session_transition','requested','accepted') $$,
  '42501',
  'permission denied for table session_events',
  'authenticated cannot append directly to the audit trail'
);

-- Exercise every valid edge, every invalid edge, every nonterminal same-state
-- no-op, and every attempted transition from a terminal state.
do $$
declare
  c record;
  v_result text;
begin
  for c in select * from lifecycle_cases loop
    begin
      v_result := public.transition_session(
        c.session_id,
        c.to_state,
        'matrix-' || c.from_state || '-' || c.to_state,
        '{"source":"test","trigger":"user_action"}'::jsonb
      );
      insert into lifecycle_results values (c.session_id, true, v_result, null);
    exception when others then
      insert into lifecycle_results values (c.session_id, false, null, sqlstate);
    end;
  end loop;
end;
$$;

select is(
  (
    select count(*)::integer
    from lifecycle_cases c
    join lifecycle_results r using (session_id)
    where r.succeeded <> (c.is_edge or (not c.terminal and c.from_state = c.to_state))
       or (r.succeeded and r.returned_state <> c.to_state)
  ),
  0,
  'the SQL transition matrix accepts exactly the canonical TypeScript graph plus nonterminal no-ops'
);
select is(
  (
    select count(*)::integer
    from lifecycle_cases c
    join public.sessions s on s.id = c.session_id
    where s.status <> case when c.is_edge then c.to_state else c.from_state end
  ),
  0,
  'valid edges update state and rejected or no-op cases leave state unchanged'
);
select is(
  (
    select count(*)::integer
    from lifecycle_cases c
    left join public.session_events e on e.session_id = c.session_id
    where (c.is_edge and e.id is null)
       or (not c.is_edge and e.id is not null)
  ),
  0,
  'every valid edge writes exactly one event and invalid or no-op cases write none'
);

select is(
  public.transition_session(
    '30000000-0000-4000-8000-000000000001',
    'accepted',
    'accept-once',
    '{"source":"test","trigger":"user_action"}'::jsonb
  ),
  'accepted',
  'a participant can apply a valid transition'
);
select is(
  public.transition_session(
    '30000000-0000-4000-8000-000000000001',
    'cancelled',
    'accept-once',
    '{"source":"test","trigger":"retry"}'::jsonb
  ),
  'accepted',
  'reusing an idempotency key returns the original stable result even if the requested target differs'
);
select is(
  (
    select count(*)::integer from public.session_events
    where session_id = '30000000-0000-4000-8000-000000000001'
      and idempotency_key = 'accept-once'
  ),
  1,
  'an idempotent retry does not append a second event'
);
select is(
  (
    select count(*)::integer from public.session_events
    where session_id = '30000000-0000-4000-8000-000000000001'
      and event_type = 'session_transition'
      and prior_state = 'requested'
      and resulting_state = 'accepted'
      and actor_id = '10000000-0000-4000-8000-000000000002'
  ),
  1,
  'the audit event records actor, prior state, resulting state, and event type'
);
select throws_ok(
  $$ select public.transition_session('30000000-0000-4000-8000-000000000001', 'consent_pending', 'bad-metadata', '{"private_note":"do not log this"}'::jsonb) $$,
  '22023',
  'session transition metadata contains unsupported fields or values',
  'free-text or unsupported metadata cannot enter the participant-visible audit trail'
);
select throws_ok(
  $$ select public.transition_session('30000000-0000-4000-8000-000000000001', 'not_a_state', 'bad-state') $$,
  '22023',
  'invalid session lifecycle state',
  'unknown target states fail closed'
);

-- Switching only the JWT proves a stranger sees neither data nor a distinct
-- not-found/unauthorized error that could disclose the session's existence.
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000099', true);
select is(
  (select count(*)::integer from public.sessions where id = '30000000-0000-4000-8000-000000000001'),
  0,
  'a non-participant cannot see the session'
);
select is(
  (select count(*)::integer from public.session_events where session_id = '30000000-0000-4000-8000-000000000001'),
  0,
  'a non-participant cannot see the session audit trail'
);
select throws_ok(
  $$ select public.transition_session('30000000-0000-4000-8000-000000000001', 'consent_pending', 'stranger') $$,
  '42501',
  'session not found or access denied',
  'a non-participant cannot transition the session'
);

-- The function is not executable by anon even if a JWT claim is spoofed.
reset role;
set local role anon;
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000001', true);
select throws_ok(
  $$ select public.transition_session('30000000-0000-4000-8000-000000000001', 'consent_pending', 'anon') $$,
  '42501',
  'permission denied for function transition_session',
  'anon cannot execute the transition function'
);

select * from finish();
rollback;
