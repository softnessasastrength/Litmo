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

What is now real, as of 2026-07-12:

- "End together" calls `transition_session(..., 'completed')` (`sessionRepository.completeSession`) before navigating to wrap-up; Soft Signal already called `transition_session`'s sibling `withdraw_session_consent` via `emergencyStopService`.
- The wrap-up screen calls `submit_session_wrapup(...)` (`sessionWrapupService`) with the real five-value canonical outcome enum and an optional client-encrypted private note, when a real session ID and an authenticated (non-demo) user are present.

Landed 2026-07-12 (`docs/adr/0015-session-request-creation-and-recipient-authorization.md`'s UI addenda):

- `app/app/match/[id].tsx` has a real "Request a session" action for signed-in users (`sessionRepository.requestSession`).
- `app/app/requests.tsx` (linked from the home tab) lists incoming pending requests and lets the recipient Accept or Decline (`sessionRepository.respondToRequest`/`listIncomingRequests`).
- Accepting now calls `sessionRepository.beginConsentReview` (`accepted -> consent_pending`, best-effort) and navigates into `/match/consent-snapshot` with the real `sessionId` and the requester's resolved mock persona id (`personaIdForUserId`), which now forwards `sessionId` into `/session/active` on "Confirm this mock snapshot."

Landed 2026-07-12 (`docs/adr/0015-session-request-creation-and-recipient-authorization.md`'s snapshot-wiring addendum): `consent-snapshot.tsx` now calls the real backend (`POST /api/sessions/:sessionId/snapshot`, requires `EXPO_PUBLIC_BACKEND_URL`) and `confirm_session_snapshot`/`transition_session(..., 'active')` when a real `sessionId` is present.

**Verified on-device 2026-07-12: both participants confirming the same snapshot works, and the session correctly reaches `active`.** This closes out the request -> accept -> confirm -> active chain end to end on a physical device.

**Architecture decision (2026-07-12):** the Express backend + LAN-address approach for snapshot creation is deliberately kept as-is rather than moved to a Supabase Postgres/Edge function. Reasoning: single-developer, single-device local testing today — the LAN dependency is a non-issue at this scale. Revisit moving `createConsentSnapshot`'s logic into an Edge function specifically when scaling past the founder's own iPhone (multiple real testers/devices, or a hosted deployment), since that's when "backend must be running on a specific laptop reachable on the same network" actually becomes a blocker.

Landed 2026-07-12 (`docs/adr/0016-session-realtime-and-real-timer.md`): `/session/active`'s timer now computes real elapsed time from `sessions.started_at` (set by `transition_session` on `ready -> active`), and a Realtime subscription (`sessions`/`session_events` added to `supabase_realtime`) navigates a participant to wrap-up automatically when the other participant ends the session.

Landed 2026-07-12 (`docs/adr/0017-wrapup-offline-retry-and-remaining-realtime-gaps.md`): wrap-up submissions now durably retry after a network failure (mirroring `emergencyStopService`'s pending-storage pattern); `mapExternalError` correctly marks an invalid-transition error as non-retryable, so `session/active.tsx` can distinguish a genuine network failure (`ended=pending-sync`) from a session that was never actually activated (`ended=not-active`), each with accurate wrap-up copy; and `consent-snapshot.tsx`'s "waiting for the other person" state now proceeds automatically via Realtime instead of requiring "Check again."

Landed 2026-07-12 (`docs/adr/0018-request-expiration-check-on-read.md`): unanswered `requested` sessions now expire after 24 hours. PostgreSQL owns the rule through `request_expires_at(...)`, `list_incoming_requests()`, and stale-request handling inside both `request_session(...)` and `transition_session(...)`. The requests screen now shows each request's expiration timestamp, stale requests disappear the next time the recipient opens the list, and an old unanswered request no longer blocks a fresh request between the same two people forever.

Not done — both require a product design decision, not just wiring, and are deliberately not invented here:

- **Blocking/eligibility checks before request creation.** No blocking system exists anywhere in this codebase. Needs a decision on what "blocked" means (mutual block, one-way block, report-triggered) before it can be built.
- **Later pre-activation expiry beyond `requested`.** The canonical graph still permits `expired` from `consent_pending` and `ready`, but no product policy exists yet for how long mutual confirmation may remain pending before timing out.

Also still open: the Express backend's LAN dependency for snapshot creation (accepted trade-off for now, see ADR 0015's addendum).

- The Express backend snapshot-creation dependency only works when the backend process is running and reachable on the same LAN as the phone — an accepted trade-off for now (see the architecture decision above), revisit when scaling past one device.

Landed 2026-07-12: the deterministic two-client Chapter 4 integration scenario (`integration/chapter4-session-lifecycle.test.mjs`, run via `npm run test:integration`). It covers request → accept → dual snapshot confirmation → activation → Soft Signal → independent private wrap-ups against local Supabase, using authenticated RPCs plus the same trusted snapshot service the Express route uses. Migration `018_service_role_snapshot_read_grants.sql` grants `service_role` SELECT on the three tables that repository must read (a pre-existing gap that made trusted snapshot creation fail closed with `snapshot_storage_failed`).

Landed 2026-07-12 (`docs/adr/0019-incoming-request-realtime.md`): signed-in recipients subscribe to `sessions` Realtime for rows where they are `user_b`. The requests list quietly refreshes on INSERT/UPDATE, and Home shows a live pending-request count. This is in-app only — not push notifications.

Landed 2026-07-12 (`docs/adr/0020-session-complete-offline-retry.md`): "End together" now uses the same durable Keychain queue + restore reconcile pattern as Soft Signal and wrap-up. Permanent invalid transitions fail closed without infinite retry.

Landed 2026-07-12 (`docs/adr/0021-outgoing-requests-and-local-request-alert.md`): requesters list/cancel outgoing pending requests (migration 019); recipients get a privacy-safe **local** notification on Realtime INSERT (not remote push).

Landed 2026-07-12 (`docs/adr/0022-open-session-resume-and-preactivation-withdraw.md`): `list_open_sessions` + Home resume; Consent Snapshot withdraw UI; active session foreground re-sync and connectivity note.

Landed 2026-07-12: Home open-session cards refresh via `subscribeToParticipantSessions`; resume of `accepted` calls `beginConsentReview`; match detail can cancel a just-sent request by session id.

The database half of wrap-up is complete in migration 012 and ADR 0008. Request create/accept/decline/cancel/expire, snapshot, Realtime, offline retry, resume, and two-client integration are largely complete. This document is mainly a handoff for remaining policy/release items.

## Not yet scoped (fine to leave for later)

Later pre-activation expiry policy beyond `requested`, blocking/eligibility checks, remote OS push (local alert exists), and physical offline/termination chaos tests.

## Resolved 2026-07-12: mock discovery now has real accounts to request

Tracing exactly what `request_session(p_recipient_id uuid, ...)` would be called with from `app/app/match/[id].tsx` surfaced that only one of the three mock discovery personas (`maya`/`eli`/`jonah` in `app/data/mock.ts`, mapped to UUIDs by `app/data/mockConsentProfiles.ts`) had a real backing `public.profiles` row. Fixed by seeding two more synthetic accounts in `supabase/seed.sql` for `eli`'s and `jonah`'s existing UUIDs (see ADR 0015's addendum for the full trace and why the seed's pre-existing 0001/0002 account labels don't match the "maya"/"eli" persona names). All three mock personas now resolve to real, requestable accounts.

## How to resume

If picking this up fresh (new session, new agent, or just after a break):

1. `git checkout agent/chapter-4-session-lifecycle` (or start a new branch off it if it's already merged).
2. Confirm Docker/Supabase still work: `npm run db:start && npm run db:reset && env HOME=/tmp npx supabase test db` should show 111/111 passing.
3. Deliverables 1–3 are complete through open-session resume (ADRs 0005–0022; migrations through 020). Remaining gaps need product decisions (blocking/eligibility, later pre-activation expiry) or release-track work (remote push, chaos tests).
