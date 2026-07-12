# ADR 0015: Session request creation and recipient-only response authorization

**Status:** Accepted
**Date:** 2026-07-12

## Context

`docs/roadmap/CHAPTER_4_SESSION_LIFECYCLE.md`'s "Requests" section requires creating, sending, accepting, and declining session requests, with idempotent duplicate submission. Until now no authenticated client could create a `sessions` row at all (migration 007 granted only `select`), which `docs/KNOWN_LIMITATIONS.md` documented as a hard blocker: "no authenticated client can create a session directly."

Separately, `transition_session(...)` (migration 008, amended by 011) authorized either participant (`user_a` or `user_b`) for every graph-valid edge, including `requested -> accepted` and `requested -> declined`. `docs/KNOWN_LIMITATIONS.md` flagged this as a known gap: "it does not yet distinguish requester-only, recipient-only, or system-only actions," with removal explicitly tied to "document and enforce actor roles for each transition alongside the request-creation... actions" — the roadmap treats these as one unit of work, not two.

## Decision

- Added `request_session(p_recipient_id uuid, p_idempotency_key text default null)`, establishing a convention that did not exist before: the caller becomes `user_a` (the requester), the named recipient becomes `user_b`. It creates a `sessions` row directly at `requested` (skipping a materialized `draft` row, since nothing ever observes `draft` as a persisted state) and writes one `session_requested` audit event with `prior_state = 'draft'`, in one atomic function, consistent with `transition_session`'s existing "one transition, one event" contract.
- Idempotent duplicate prevention is business-level, not key-based: if the two people already have a non-terminal session in _either_ direction, `request_session` returns that session's id instead of creating a second one. This both satisfies "make duplicate request submission idempotent" and prevents request spam, and naturally covers the reverse-direction case (B requesting A while A's request to B is still pending).
- `transition_session(...)` now additionally requires `v_actor_id = user_b` for the `requested -> accepted` and `requested -> declined` edges specifically. Every other transition's authorization (either participant) is unchanged. The requester still withdraws their own pending request through the existing `withdraw_session_consent(...)` (ADR 0012), which already permits either participant to cancel — this ADR does not touch that function.
- `request_session` checks recipient existence against `public.profiles` (the active Chapter 3+ profile table), not the legacy `public.users` table from migration 001, which has no rows for any real account and was superseded by migration 005's `profiles` table.

## Alternatives considered

- A separate `respond_session_request(...)` function wrapping `transition_session`. Rejected: `transition_session` already validates the `requested -> accepted/declined` edges correctly; duplicating that logic in a second function would create two places that could drift out of sync. Adding the recipient check directly to `transition_session` keeps one authorization surface.
- A dedicated idempotency-key-based dedup table for request creation, mirroring `session_events`'s per-session unique index. Rejected in favor of the business-level "existing non-terminal session between this pair" check, which is both simpler and matches the roadmap's actual intent (prevent duplicate/parallel requests to the same person) more directly than a pure replay-key mechanism would.

## Explicitly out of scope

- **Blocking/eligibility checks** ("prevent requests to blocked, ineligible, or unavailable accounts"): no blocking or eligibility system exists anywhere in this codebase. Implementing one is a separate, substantial subsystem and is not invented here.
- **Expiration timestamps and jobs**: still unscoped, as recorded in `docs/CHAPTER_4_NEXT_STEPS.md` before this change.
- **Mobile UI for sending/receiving requests**: no screen calls `request_session` yet. `/session/active` still has no caller that threads a real `sessionId` into it (see ADR 0014); this ADR makes request creation correct and tested, not yet reachable from the app.

## Consequences

A session can now genuinely be requested and responded to correctly and safely at the database layer, with the recipient-only authorization the feature requires to be meaningful. Both are covered by twelve new pgTAP assertions (`supabase/tests/session_requests.test.sql`) and the existing 144-pair `transition_session` matrix (`supabase/tests/session_lifecycle.test.sql`), which now runs under the recipient's identity so it continues to exercise every graph edge, including the two now-restricted ones, correctly.

## Follow-up work

- Wire a mobile "request a session" action (from `match/[id].tsx` or `discover.tsx`) that calls `request_session`, and an accept/decline UI for incoming requests, so `/session/active` finally receives a real `sessionId`.
- Blocking/eligibility checks before request creation.
- Expiration timestamps/jobs for unanswered requests.
