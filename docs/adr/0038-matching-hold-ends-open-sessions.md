# ADR 0038: Matching hold ends open matching work

**Status:** Accepted  
**Date:** 2026-07-12  
**Supersedes (in part):** ADR 0035 (hold no longer leaves active sessions open)

## Context

ADR 0035 made permanent bans cancel pre-activation and safety-end active
sessions, while **matching_hold** only cancelled `requested` sessions. That
left people mid-consent or mid-session with someone under temporary safety
review — residual risk for private beta.

## Decision

On `apply_account_restriction` for **both** `matching_hold` and
`permanent_ban`:

- Cancel `requested` (unchanged).
- Cancel `accepted` / `consent_pending` / `ready`.
- Transition `active` → `safety_ended`.

Event metadata records `reason` as the restriction kind (`matching_hold` or
`permanent_ban`). Soft Signal / wrap-up remain available for terminal states.

## Alternatives considered

- Keep holds soft (ADR 0035). Rejected for private-beta residual risk.
- Only cancel pre-activation, leave active. Rejected: active is higher risk.

## Consequences

- Staff 7-day holds from the moderator console close live work fail-closed.
- Peers see safety-ended / cancelled paths, not an explanation of the hold.
- Lifting a hold does **not** reopen closed sessions.
