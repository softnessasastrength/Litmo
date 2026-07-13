# ADR 0018: Request expiration via database check-on-read/write

**Status:** Accepted
**Date:** 2026-07-12

## Context

`docs/roadmap/CHAPTER_4_SESSION_LIFECYCLE.md` requires session requests to
define expiration behavior, show visible expiration timestamps, and fail safely
when a stale request is acted on. After ADR 0015 landed, requests could be
created, listed, and responded to, but no expiry policy existed at all:

- a stale `requested` session could sit indefinitely
- `request_session(...)` would treat an old unanswered request as a live
  duplicate forever
- the mobile requests screen had no deadline to show

The codebase still has no scheduler or hosted job runner, and the active
near-term environment is a local Supabase instance plus a physical phone. The
expiration path therefore needs to work correctly without cron infrastructure.

## Decision

- A `requested` session now expires **24 hours after creation**. The deadline
  is exposed centrally through `request_expires_at(created_at)`.
- Expiration is enforced with a **database check-on-read/write pattern**, not a
  scheduled job:
  - `list_incoming_requests()` auto-expires stale incoming requests for the
    authenticated recipient before returning the current list.
  - `request_session(...)` auto-expires stale unanswered requests between the
    same pair before duplicate detection, so a fresh request can be created.
  - `transition_session(...)` auto-expires a stale `requested` session before
    any attempted response and returns the stable resulting state `expired`.
- Every auto-expiration appends one safe audit event with
  `{"source":"api","trigger":"system_expiration"}` and no private reason text.
- The mobile requests screen now reads through `list_incoming_requests()` and
  shows each request's expiration timestamp explicitly.

This ADR intentionally scopes expiration to the **`requested` state only**.
The canonical graph still allows `expired` from `consent_pending` and `ready`,
but those later pre-activation states need a separate product decision about
how long mutual confirmation may remain pending.

## Alternatives considered

- A scheduled background job that expires requests proactively. Rejected for
  now: the local-first development environment has no durable scheduler, and
  adding one would create more infrastructure than the current Chapter 4 gap
  requires.
- Leaving expiration purely in the client. Rejected: duplicate prevention and
  lifecycle authority live in PostgreSQL, so client-only expiry would drift and
  fail open under retries or multiple devices.
- Applying the same 24-hour deadline to `consent_pending` and `ready` now.
  Rejected: that would silently invent a confirmation-timeout product policy
  that has not been decided.

## Consequences

Unanswered requests now fail closed after 24 hours, the request list shows a
real deadline, and a stale request no longer blocks a fresh request between the
same pair forever. The mechanism works entirely within the existing local
Supabase boundary and is covered by pgTAP in
`supabase/tests/session_request_expiration.test.sql`.

The remaining Chapter 4 policy gap is no longer "whether requests expire" but
"whether later pre-activation states also expire, and if so on what timeline."

## Follow-up work

- Define whether `consent_pending` and `ready` should also time out, and by
  what policy.
- Add Realtime delivery for new incoming requests.
- Add blocking/eligibility checks before request creation.
- ~~Add the deterministic two-client Chapter 4 integration scenario.~~ Done: `integration/chapter4-session-lifecycle.test.mjs` (plus migration 018 service-role read grants for trusted snapshot creation).
