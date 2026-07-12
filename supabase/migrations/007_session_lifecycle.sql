-- Chapter 4 (Session Lifecycle). Aligns the Chapter 1/2 `sessions` table's
-- status values with the canonical twelve-state graph already defined and
-- tested in shared/src/sessionLifecycle.ts (docs/adr/0005-session-lifecycle-state-machine.md),
-- and adds an append-only audit trail table.
--
-- The old status list ('requested','consent_pending','consented','active',
-- 'completed','exited','cancelled') predates that canonical graph and has no
-- rows yet (this table has never been used by any shipped feature), so it is
-- safe to replace outright rather than migrate data.
alter table public.sessions drop constraint sessions_status_check;
alter table public.sessions add constraint sessions_status_check check (
  status in (
    'draft', 'requested', 'accepted', 'consent_pending', 'ready', 'active',
    'completed', 'declined', 'cancelled', 'expired', 'soft_signaled', 'safety_ended'
  )
);
alter table public.sessions alter column status set default 'draft';

-- Same class of bug fixed in migration 006: the "participants read sessions"
-- RLS policy from migration 002 has never had a matching table-level GRANT,
-- so it has never actually been reachable by `authenticated`. No INSERT/UPDATE
-- grant yet either -- those wait for the server-side transition function
-- (follow-up work), which must validate actor authorization and the
-- transition graph atomically rather than letting a client mutate
-- `sessions.status` directly.
grant select on public.sessions to authenticated;

-- Append-only audit trail. Fields match docs/roadmap/CHAPTER_4_SESSION_LIFECYCLE.md's
-- "Audit trail" section: session id, actor id, event type, prior and
-- resulting state, snapshot version where relevant, server timestamp,
-- idempotency key, and safe metadata. Never raw private notes or
-- unnecessary consent details -- callers must keep `metadata` to safe,
-- structured fields only (this migration cannot enforce that at the schema
-- level; it is a contract for whatever writes to this table).
create table if not exists public.session_events (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions(id) on delete cascade,
  actor_id uuid references auth.users(id) on delete set null,
  event_type text not null,
  prior_state text not null check (
    prior_state in (
      'draft', 'requested', 'accepted', 'consent_pending', 'ready', 'active',
      'completed', 'declined', 'cancelled', 'expired', 'soft_signaled', 'safety_ended'
    )
  ),
  resulting_state text not null check (
    resulting_state in (
      'draft', 'requested', 'accepted', 'consent_pending', 'ready', 'active',
      'completed', 'declined', 'cancelled', 'expired', 'soft_signaled', 'safety_ended'
    )
  ),
  snapshot_version integer check (snapshot_version is null or snapshot_version > 0),
  idempotency_key text,
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object'),
  created_at timestamptz not null default now()
);

create unique index if not exists session_events_idempotency_key_idx
  on public.session_events(session_id, idempotency_key)
  where idempotency_key is not null;
create index if not exists session_events_session_id_idx on public.session_events(session_id, created_at);

alter table public.session_events enable row level security;

-- Read-only for now: participants may read their own session's audit trail.
-- No INSERT policy is granted to `authenticated` yet -- writing an event
-- must go through a server-side transition function (follow-up work per
-- docs/adr/0005-session-lifecycle-state-machine.md) that validates actor
-- authorization and the transition graph atomically, rather than letting a
-- client insert an arbitrary event directly. Until that function exists,
-- only service_role can write to this table.
create policy "participants read own session events" on public.session_events
  for select to authenticated using (
    exists (
      select 1 from public.sessions s
      where s.id = session_id and auth.uid() in (s.user_a, s.user_b)
    )
  );

grant select on public.session_events to authenticated;
