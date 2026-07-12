# ADR 0031: Restriction gates on session lifecycle + cancel on apply

**Status:** Accepted  
**Date:** 2026-07-12

## Context

ADR 0030 blocked discovery and `request_session` for restricted accounts, but
a pending request could still be accepted and progressed. Staff also needed
pending requests cancelled when a hold/ban is applied.

## Decision

- `apply_account_restriction` cancels all `requested` sessions involving the
  restricted user (either side), with audit metadata `reason=account_restriction`.
- `transition_session` blocks **forward matching** targets  
  (`requested`, `accepted`, `consent_pending`, `ready`, `active`) when either
  participant is matching-restricted.
- Always allowed: `declined`, `cancelled`, terminal safety/end states  
  (`soft_signaled`, `safety_ended`, `completed`) and system expiry paths.
- Messages: restricted actor → `matching is paused on your account`;  
  unrestricted actor with restricted peer → opaque `that person is not available`.

## Alternatives considered

- Auto-end **active** sessions on restrict. Deferred (product decision open).
- Block decline while restricted. Rejected: people must always be able to say no.

## Consequences

- In-flight pre-activation sessions cannot advance while a party is held.
- Active sessions still end via Soft Signal / complete / safety paths.

## Follow-up

- Optional auto-end active sessions on permanent ban.
- Appeals and user-facing restriction notices beyond `my_matching_access`.
