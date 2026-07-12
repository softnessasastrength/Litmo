# ADR 0023: Pre-activation review expiration (24 hours)

**Status:** Accepted  
**Date:** 2026-07-12

## Context

ADR 0018 expired unanswered **`requested`** sessions after 24 hours but left
`consent_pending` and `ready` open indefinitely. The graph already allows
`expired` from those states. Chapter 4 required a decision: how long mutual
confirmation may remain pending. Without a deadline, abandoned consent reviews
block pair re-request forever (non-terminal duplicate detection) and leave
zombie Home resume cards.

## Decision

- **Policy:** Pre-activation review (`accepted`, `consent_pending`, `ready`)
  expires **24 hours after the first transition into `accepted` or
  `consent_pending`** (min of those event timestamps). If no such event exists,
  fall back to `sessions.created_at + 24 hours`.
- **Mechanism:** Same check-on-read/write as ADR 0018 — no cron.
  - `preactivation_deadline(session_id)` is the single source of truth.
  - `list_open_sessions()` expires stale rows before listing and returns
    `expires_at` for UI deadlines.
  - `transition_session(...)` expires stale pre-activation rows before applying
    any further user transition and returns `expired`.
- **Active sessions are not auto-expired** by this policy (Soft Signal / End
  together remain human-driven).
- Audit events use `{"source":"api","trigger":"system_expiration"}` with no
  private reason text.

## Alternatives considered

- Leaving pre-activation open forever. Rejected: fails closed pair hygiene and
  recovery UX.
- A different window (e.g. 1 hour / 7 days). Deferred: 24h matches request
  expiration and is conservative for async adult scheduling without inventing
  engagement pressure.
- Cron-based expiry. Rejected for the same local-first reasons as ADR 0018.

## Consequences

Abandoned consent reviews fail closed after a day. Home resume cards show
deadlines. Fresh requests between the same pair become possible after expiry.
Covered by `session_preactivation_expiry.test.sql` and list_open_sessions
assertions.

## Follow-up work

- Blocking/eligibility; remote push; physical chaos tests; optional different
  windows per environment if product later requires them.
