# ADR 0040: One-way block ends open pair sessions

**Status:** Accepted  
**Date:** 2026-07-12  
**Supersedes (in part):** ADR 0024 (active mid-lifecycle sessions deferred)

## Context

Blocks already cancelled `requested` sessions and hid discovery. Leaving
`accepted` / `consent_pending` / `ready` / `active` work open after a block
left residual contact with someone the blocker chose to cut off. Matching holds
and permanent bans already close that work (ADR 0035 / 0038).

## Decision

On `block_user` between A and B (rate limit unchanged):

- Cancel pair `requested` sessions (unchanged).
- Cancel pair `accepted` / `consent_pending` / `ready` sessions.
- Transition pair `active` sessions to `safety_ended`.
- Audit metadata includes `reason: user_block` (staff/internal; not shown as a
  public score or “blocked you” disclosure).
- Unblock does **not** reopen closed sessions.
- Soft Signal / wrap-up remain available for terminal states via existing UI.

## Alternatives considered

- Leave active sessions to Soft Signal only. Rejected: residual contact risk.
- End _all_ of the blocked user’s sessions. Rejected: only the pair is relevant.

## Consequences

- Blocking mid-session is an immediate hard distance, fail-closed.
- Peers see safety-ended / cancelled paths without learning who blocked them.
- Active session UI should offer block as a secondary control (not instead of Soft Signal).
