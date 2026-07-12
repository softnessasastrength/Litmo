# Chapter 4 — next steps

Written 2026-07-12 so a break in work (or a new session/agent) can resume without re-deriving context. Read this alongside `AGENTS.md`'s "What 'continue' means" section and `docs/adr/0005-session-lifecycle-state-machine.md`.

## Where things stand right now

- `shared/src/sessionLifecycle.ts`: pure transition graph, fully tested (59 shared tests total).
- `supabase/migrations/007_session_lifecycle.sql`: `sessions` table aligned to the canonical 12 states, `session_events` audit trail table added. Both are **read-only** for `authenticated` — no client can write session state yet, by design.
- Docker/local Supabase is working on this machine (a real, hard-won milestone — see `docs/MACHINE_SETUP.md` if it ever needs rebuilding). `npm run db:start && npm run db:reset` gets a fully working local backend.
- Branch: `agent/chapter-4-session-lifecycle`, pushed. No PR opened yet.

## Deliverable 1 — the `transition_session(...)` Postgres function (complete)

Implemented in migration `008_transition_session.sql`. The function and the 144-pair graph matrix pass locally; see ADR 0005's latest update and the 2026-07-12 changelog entry. Snapshot-version matching at `ready -> active` remains correctly deferred to Deliverable 2.

**What it needs to do**, atomically, in one transaction:

1. Take `(session_id, to_state, idempotency_key default null, metadata default '{}')`.
2. Verify `auth.uid()` is a participant (`user_a` or `user_b`) of the session. Reject otherwise.
3. Check `idempotency_key`: if an event with this exact `(session_id, idempotency_key)` already exists, return that event's `resulting_state` again rather than re-applying anything (matches `docs/roadmap/CHAPTER_4_SESSION_LIFECYCLE.md`'s "return a stable result for repeated idempotency keys").
4. Validate the transition against the **same graph** as `shared/src/sessionLifecycle.ts`'s `sessionTransitions` — this has to be hand-mirrored in SQL (Postgres can't import the TS module), so keep the two in a comment cross-reference and add a test that would catch drift if one changes without the other (e.g., a pgTAP test enumerating both graphs' edges and asserting they match, or at minimum a code comment loudly flagging "keep in sync with shared/src/sessionLifecycle.ts").
5. Lock the row (`select ... for update`) before checking/updating to prevent a race between two concurrent transition attempts.
6. Update `sessions.status` and insert exactly one `session_events` row (prior_state, resulting_state, actor_id, idempotency_key, metadata) in the same transaction.
7. Grant `EXECUTE` on this function to `authenticated` — this becomes the _only_ write path; `sessions`/`session_events` themselves stay ungranted for direct INSERT/UPDATE.

**Testing**: extend `supabase/tests/session_lifecycle.test.sql` (or a new file) covering: every valid transition succeeds and writes one event; every invalid transition raises and writes nothing; a non-participant is rejected; a repeated idempotency key returns the same result without a second event row; a terminal-state session rejects any further transition.

**Don't implement yet** (explicitly deferred per ADR 0005): snapshot-version matching at `ready -> active` (needs the canonical snapshot persisted somewhere first — see Deliverable 2) and realtime broadcast of the change (Supabase Realtime, separate concern).

## Deliverable 2 — persist the canonical Consent Snapshot (complete)

`shared/src/consentSnapshot.ts` provides the pure snapshot semantics; migrations 009 and 011 persist and enforce their exact-version confirmation, withdrawal, activation, and material-change invalidation boundaries.

Implemented in migrations 009 and 011 plus ADRs 0005–0006. The trusted server owns canonical engine computation; PostgreSQL owns service-only persistence, exact versions, private confirmations, withdrawal, activation enforcement, and material profile-change invalidation. `POST /api/sessions/:sessionId/snapshot` authenticates a participant, loads exact latest profile pairs, computes with `@litmo/domain`, and invokes the service-only persistence function. A material profile edit invalidates affected pre-activation snapshots, clears confirmations, returns `ready` to `consent_pending`, and permits replacement from the new exact versions.

The `ready -> active` precondition is now enforced by a database trigger for every write path.

## Deliverable 3 — wire the mock session screens to real data

`app/app/session/active.tsx`'s timer is still a local fake timer (no backend calls). What's now real, as of 2026-07-12 (`docs/adr/0014-wrap-up-mobile-wiring.md`):

- "End together" calls `transition_session(..., 'completed')` (`sessionRepository.completeSession`) before navigating to wrap-up; Soft Signal already called `transition_session`'s sibling `withdraw_session_consent` via `emergencyStopService`.
- The wrap-up screen calls `submit_session_wrapup(...)` (`sessionWrapupService`) with the real five-value canonical outcome enum and an optional client-encrypted private note, when a real session ID and an authenticated (non-demo) user are present.

Still not done:

- Replace the local timer with a real `active` session row + Supabase Realtime subscription so both participants see the same state.
- **No mobile screen calls `request_session(...)` yet**, even though the database side of request creation and recipient-only accept/decline now exists (migration 015, `docs/adr/0015-session-request-creation-and-recipient-authorization.md`). This is the actual next piece of Deliverable 3: a "request a session" action from `match/[id].tsx` or `discover.tsx`, an accept/decline UI for incoming requests, and a way to navigate into `/session/active?sessionId=...` from a real accepted session rather than the current no-param `router.push("/session/active")` in `consent-snapshot.tsx`.
- Wrap-up submission itself has no offline retry/queue (only the Soft Signal path does, via `emergencyStopService`'s pending-storage pattern).
- No blocking/eligibility checks before request creation (no blocking system exists anywhere in this codebase), and no request expiration timestamps/jobs.

The database half of wrap-up is complete in migration 012 and ADR 0008: owner-only immutable rows, terminal-state validation, and retry-safe submission. The database half of request creation/response is complete in migration 015 and ADR 0015. The remaining mobile work is the request/accept/decline screens, replacing the local timer with Realtime, and wrap-up offline retry.

## Not yet scoped (fine to leave for later)

Realtime sync details, connectivity/offline recovery, request expiration (needs either a scheduled job or a check-on-read pattern — undecided), blocking/eligibility checks, and the two-client Chapter 4 integration test the roadmap doc calls for.

## How to resume

If picking this up fresh (new session, new agent, or just after a break):

1. `git checkout agent/chapter-4-session-lifecycle` (or start a new branch off it if it's already merged).
2. Confirm Docker/Supabase still work: `npm run db:start && npm run db:reset && npx supabase test db` should show 100/100 passing.
3. Deliverables 1–2 and the wrap-up/request-creation database boundaries (ADRs 0005, 0006, 0008, 0014, 0015) are complete. The next task is the mobile request/accept/decline UI described in Deliverable 3 above — read ADR 0015 first for the exact function contracts (`request_session`, and `transition_session`'s recipient-only `requested -> accepted/declined`) it will call.
