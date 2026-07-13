begin;
select plan(9);

-- Fixture pattern mirrors consent_withdrawal.test.sql
insert into public.touch_profile_versions (id, user_id, version, profile) values
  ('24000000-0000-4000-8000-000000000091', '10000000-0000-4000-8000-000000000001', 91, '{}'),
  ('24000000-0000-4000-8000-000000000092', '10000000-0000-4000-8000-000000000002', 91, '{}');

insert into public.sessions (id, user_a, user_b, status) values
  (
    '36000000-0000-4000-8000-000000000091',
    '10000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000002',
    'consent_pending'
  ),
  (
    '36000000-0000-4000-8000-000000000092',
    '10000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000002',
    'active'
  );

insert into public.consent_snapshots (
  id, session_id, profile_a_id, profile_a_version, profile_b_id, profile_b_version,
  fingerprint, compatibility
) values
  (
    '46000000-0000-4000-8000-000000000091',
    '36000000-0000-4000-8000-000000000091',
    '24000000-0000-4000-8000-000000000091', 91,
    '24000000-0000-4000-8000-000000000092', 91,
    repeat('c', 64),
    '{"consentGranted":false}'::jsonb
  ),
  (
    '46000000-0000-4000-8000-000000000092',
    '36000000-0000-4000-8000-000000000092',
    '24000000-0000-4000-8000-000000000091', 91,
    '24000000-0000-4000-8000-000000000092', 91,
    repeat('d', 64),
    '{"consentGranted":false}'::jsonb
  );

insert into public.consent_snapshot_confirmations (snapshot_id, user_id, fingerprint) values
  ('46000000-0000-4000-8000-000000000092', '10000000-0000-4000-8000-000000000001', repeat('d', 64)),
  ('46000000-0000-4000-8000-000000000092', '10000000-0000-4000-8000-000000000002', repeat('d', 64));

-- Immutability of seal body
select throws_ok(
  $$ update public.consent_snapshots
       set fingerprint = repeat('e', 64)
     where id = '46000000-0000-4000-8000-000000000091' $$,
  '55000',
  'consent snapshot body is immutable after create',
  'snapshot fingerprint is immutable after create'
);

select lives_ok(
  $$ update public.consent_snapshots
       set withdrawn_by = '10000000-0000-4000-8000-000000000001',
           withdrawn_at = now()
     where id = '46000000-0000-4000-8000-000000000091' $$,
  'withdraw columns remain mutable'
);

-- Offline intent enqueue
set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000001', true);

select lives_ok(
  $$ select public.enqueue_session_offline_intent(
       '36000000-0000-4000-8000-000000000091',
       'soft_signal',
       'offline-ss-nuclear-1',
       null,
       '{}'::jsonb
     ) $$,
  'participant can enqueue Soft Signal offline intent'
);

select is(
  (
    select kind from public.session_offline_intents
    where session_id = '36000000-0000-4000-8000-000000000091'
      and idempotency_key = 'offline-ss-nuclear-1'
  ),
  'soft_signal',
  'offline intent stored as soft_signal'
);

select lives_ok(
  $$ select * from public.session_seal_authority(
       '36000000-0000-4000-8000-000000000092'
     ) $$,
  'session_seal_authority is callable by participant'
);

select is(
  (
    select mutually_confirmed from public.session_seal_authority(
      '36000000-0000-4000-8000-000000000092'
    )
  ),
  true,
  'dual-confirmed active snapshot is mutually_confirmed'
);

-- Active Soft Signal writes revocation ledger
select is(
  public.withdraw_session_consent(
    '36000000-0000-4000-8000-000000000092',
    'withdraw-nuclear-active-1'
  ),
  'soft_signaled',
  'active withdraw soft-signals'
);

reset role;
select ok(
  exists (
    select 1 from public.consent_revocation_events
    where session_id = '36000000-0000-4000-8000-000000000092'
      and idempotency_key = 'withdraw-nuclear-active-1'
      and cause = 'soft_signal'
  ),
  'revocation event appended on Soft Signal withdraw'
);

-- Wrap-up skip after Soft Signal
set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000001', true);

select lives_ok(
  $$ select public.submit_session_wrapup(
       '36000000-0000-4000-8000-000000000092',
       'skipped',
       null,
       'wrap-skip-nuclear-1'
     ) $$,
  'wrap-up skipped outcome accepted after Soft Signal'
);

select * from finish();
rollback;
