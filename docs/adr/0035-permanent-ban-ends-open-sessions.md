# ADR 0035: Permanent ban ends open matching work

**Status:** Accepted  
**Date:** 2026-07-12

## Context

Temporary matching holds already cancel `requested` sessions. Permanent bans
are stronger: leaving active or pre-activation sessions open would keep a
banned account in live matching work.

## Decision

On `apply_account_restriction` with `kind = permanent_ban`:

- Cancel all `requested` sessions involving the user (unchanged for holds).
- Cancel `accepted` / `consent_pending` / `ready` sessions involving the user.
- Transition `active` sessions involving the user to `safety_ended`.

~~`matching_hold` still only cancels `requested`~~ **Superseded for holds by
ADR 0038 (2026-07-12):** matching holds now also cancel pre-activation and
safety-end active sessions.

## Alternatives considered

- Also end active sessions on matching_hold. ~~Deferred.~~ Accepted in ADR 0038.
- Only cancel requested. Rejected for permanent ban residual risk.

## Consequences

- Peers in active sessions with a banned account get a safety-ended path.
- Soft Signal / wrap-up still available for those terminal states.
