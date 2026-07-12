# ADR 0005: Pure session-lifecycle state machine

**Status:** Accepted
**Date:** 2026-07-11

## Context

`docs/roadmap/CHAPTER_4_SESSION_LIFECYCLE.md` requires "one canonical state machine controls all lifecycle transitions" and that "UI code must not invent or directly mutate lifecycle states." Chapter 3's consent snapshot work (`shared/src/consentSnapshot.ts`) already defined the full canonical state list — `consentLifecycleStates` — for withdrawal testing, but nothing yet enforces which transitions between those states are actually allowed. Following the same approach that worked for Chapter 3 (a pure, framework-independent domain module built and tested before any backend/DB wiring), this defines that transition graph as a first, self-contained slice of Chapter 4.

## Decision

Add `shared/src/sessionLifecycle.ts`, reusing `ConsentLifecycleState` from `consentSnapshot.ts` rather than redefining the same twelve states a second time. It exports:

- `sessionTransitions`: a `Record<ConsentLifecycleState, ReadonlySet<ConsentLifecycleState>>` — the canonical directed graph, the single source of truth for "what can this session become next."
- `isTerminalState(state)`: true for `completed`, `declined`, `cancelled`, `expired`, `soft_signaled`, `safety_ended` — states with no outgoing edges.
- `canTransition(from, to)`: a pure boolean query against the graph, for UI code that wants to show/hide an action without attempting it.
- `transition(from, to)`: the actual state-changing operation, returning `{ ok: true, state, changed }` or `{ ok: false, reason, state }`. Two safety properties, both required by the roadmap doc:
  - **Idempotent no-op**: requesting a transition to the _current_ state succeeds with `changed: false` rather than being rejected, so a retried action (duplicate submission, a client that didn't see its own earlier success) never errors.
  - **Fail-closed on terminal states**: once in any terminal state, every further transition attempt — including to itself — is rejected with `reason: "terminal_state"`. A completed, cancelled, or safety-ended session can never be reopened by replaying an action.

### The graph

```
draft           -> requested
requested       -> accepted | declined | cancelled | expired
accepted        -> consent_pending
consent_pending -> ready | cancelled | expired
ready           -> active | cancelled | expired
active          -> completed | soft_signaled | safety_ended
```

`declined`, `cancelled`, `expired`, `completed`, `soft_signaled`, `safety_ended` are terminal.

Notes on specific decisions:

- **Withdrawal maps to `cancelled`, not a new state.** The roadmap doc says "allow either participant to withdraw before activation without penalty"; there is no separate `withdrawn` state in the canonical list, so withdrawal from `consent_pending` or `ready` is just a transition to `cancelled`. The distinction between "the requester cancelled" and "a participant withdrew consent" is an _actor/reason_ detail for the audit trail (out of scope for this pure graph), not a different destination state.
- **Material snapshot changes do not change the session's lifecycle state.** Chapter 3's `invalidateForMaterialChange` and `withdrawConsent` already clear a snapshot's `confirmations` map without touching session state; a session can sit in `consent_pending` through any number of confirm/invalidate cycles before either reaching `ready` or being cancelled/expired. This module does not duplicate that logic.
- **`expired` is reachable from `requested`, `consent_pending`, and `ready`** — any state before actual activation can time out — but not from `accepted`, since acceptance immediately generates a snapshot and moves to `consent_pending` in the same step (there is no waiting period at `accepted` itself for a human timeout to apply to).

## What this slice deliberately does not cover

Consistent with Chapter 3's incremental approach, this is the transition graph only. Explicitly deferred, and requiring backend/DB work this machine cannot have without Docker (a pre-existing, unrelated blocker — see `docs/CHAPTER_2_COMPLETION.md`):

- **Actor authorization** (can _this_ user trigger _this_ transition on _this_ session) — the roadmap's "Server-side transition rules" section requires validating actor authorization, current state, and snapshot/profile versions atomically in a transactional server action or DB function. This module answers "is the graph edge valid," not "is this specific caller allowed to traverse it."
- **Idempotency-key deduplication** at the request layer (the roadmap's "return a stable result for repeated idempotency keys") — this module's `changed: false` no-op covers same-state retries at the state-machine level, but a real idempotency key (e.g., deduping two different session-request rows created from a double-tapped button) needs a database unique constraint or lookup, not a pure function.
- **Snapshot-version matching** ("prevent activation when confirmations reference different snapshot versions") — this belongs to the `ready -> active` transition's precondition check, which needs the actual snapshot and confirmation records from the database, not just a state label.
- **Realtime sync, connectivity recovery, wrap-up independence, and the audit trail's actual persistence** — all explicitly Chapter 4 scope, all requiring Supabase Realtime and RLS-protected tables this machine cannot exercise locally yet.

## Alternatives considered

- Encoding transitions as a flat list of `[from, to]` tuples instead of a `Record<state, Set<state>>` was rejected: the record form makes "what can X become" and "is this terminal" (empty outgoing set) both O(1) lookups, which matters once UI code queries it on every render to decide which actions to show.
- Adding actor/role parameters to `transition()` now, even as unused placeholders, was rejected: it would invite half-implemented authorization checks that look enforced but aren't, which is exactly the kind of gap `docs/DOCUMENTATION_STANDARD.md` and this repo's safety-first conventions warn against. Better to add real parameters when the real (server-side, DB-backed) authorization logic exists.

## Consequences

UI code and, later, backend transition handlers can both import the same `sessionTransitions` graph and `transition()` function, so client-side "can I show this button" checks and server-side "is this actually allowed" checks can never silently drift into disagreeing about what's a valid move — they call the same function.

## Follow-up work

- Wire `transition()` into an actual server-side action (Postgres function or transactional Express handler) once local Supabase is available to test against, adding actor authorization and idempotency-key deduplication at that layer.
- Extend the graph if a genuine need for a `consent_pending -> requested` (re-request after a snapshot becomes stale) or similar backward edge emerges — none is defined yet because the roadmap doc doesn't call for one.

## Update: schema landed, transition function still pending

Docker became available on this machine, unblocking the "requires backend/DB work" items above for the first time. Migration `007_session_lifecycle.sql` (`agent/chapter-4-session-lifecycle` branch) took the first step:

- Replaced the Chapter 1/2-era `sessions.status` check constraint (`'requested','consent_pending','consented','active','completed','exited','cancelled'`) with this ADR's canonical twelve-state list. That old table had no rows and was never wired to a shipped feature, so this was a clean replacement, not a data migration.
- Added `session_events`, the append-only audit trail table the roadmap doc requires (session id, actor id, event type, prior/resulting state, snapshot version, timestamp, idempotency key via a partial unique index on `(session_id, idempotency_key) where idempotency_key is not null`, and a `jsonb` metadata column).
- Fixed the same missing-`GRANT` bug documented in `docs/CHANGELOG.md`'s 2026-07-12 entry: the `sessions` table's "participants read sessions" RLS policy (migration 002) had never had a matching `GRANT SELECT`, so it had never actually been reachable.
- Deliberately granted **no** `INSERT`/`UPDATE` on `sessions` or `session_events` to `authenticated` yet. Both pgTAP-verified (`supabase/tests/session_lifecycle.test.sql`): a participant can read their own session and its audit trail; a non-participant can read neither; and any direct write attempt is rejected outright, since the transition function this ADR calls for — the only thing that should ever be allowed to write these rows — does not exist yet.

Still not done: the `transition_session(...)`-style Postgres function itself (actor authorization, mirroring `sessionTransitions` in SQL, idempotency-key handling, snapshot-version preconditions for `ready -> active`), and everything downstream of it (realtime sync, connectivity recovery, wrap-up, request creation/accept/decline/cancel endpoints). This is the next concrete slice.
