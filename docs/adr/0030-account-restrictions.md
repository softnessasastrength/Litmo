# ADR 0030: Staff-applied account restrictions

**Status:** Accepted  
**Date:** 2026-07-12

## Context

Reports and rate limits must not auto-punish. Serious patterns still need
human-applied temporary holds and permanent bans that fail closed on matching,
with an audit trail and coarse self-visible status.

## Decision

- `account_restrictions` stores staff-applied `matching_hold` (optional
  `ends_at`) or `permanent_ban` (`ends_at` must be null).
- Closed `reason_code` enum for ops; optional `internal_note` never shown to
  the restricted user.
- Staff RPCs: `apply_account_restriction`, `lift_account_restriction`.
- `is_matching_restricted` gates discovery + `request_session`.
- Restricted actor message: `matching is paused on your account`.
- Restricted recipient: same opaque “not available” as blocks/missing profiles.
- `my_matching_access()` returns self-only coarse status (allowed / kind /
  ends_at) without internal notes.
- Trust events `account_restricted` / `account_restriction_lifted`.

## Alternatives considered

- Auto-suspend on report threshold. Rejected: retaliation risk.
- Soft client-only flag. Rejected: not authoritative.
- Show reason codes to users. Deferred: legal/product copy; may retraumatize.

## Consequences

- Accept/transition of in-flight sessions while restricted is not fully gated
  in this slice (request + discovery first).
- Appeals workflow still open.

## Follow-up

- Gate `transition_session` accepts while restricted.
- Optional cancel of open requests on apply.
- Appeals + user-facing support copy.
