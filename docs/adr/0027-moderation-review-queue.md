# ADR 0027: Human moderation review queue

**Status:** Accepted  
**Date:** 2026-07-12

## Context

Structured report intake (ADR 0026) records evidence without automatic
punishment. Chapter 5 requires a human-review path: triage, assignment,
internal notes, and auditable close outcomes — without a public safety score
or end-user-visible punishment feed.

## Decision

- `staff_roles` grants `moderator` / `admin` (ops / service_role writes only).
- Each `user_report` opens a 1:1 `moderation_cases` row via trigger, with
  category-based priority (`underage_concern` → urgent, etc.).
- Staff RPCs: `list_moderation_queue`, `claim_moderation_case`,
  `add_moderation_note`, `resolve_moderation_case`.
- Claim may move reporter-visible status to `under_review`; resolve sets
  `closed` + coarse `closed_outcome` only.
- Internal notes are append-only, staff-only, length-limited platform text
  (not device application-encryption) so multiple reviewers can collaborate.
- **No** consumer app console in this slice; no auto-ban / auto-restriction.

## Alternatives considered

- Auto-suspend on report. Rejected: retaliation and false positives.
- Application-encrypt internal notes. Rejected for multi-moderator review
  without shared keys; revisit with org key management if required.
- Full admin SPA first. Deferred: schema + RPCs first, UI later.

## Consequences

- Ops can grant staff and exercise queue via authenticated staff accounts.
- Restrictions / appeals / rate limits remain follow-ups.
- Internal notes are highly sensitive; access must stay staff-only forever.

## Follow-up

- Temporary / permanent account restrictions with audit events.
- Moderator console UI (web or internal tool).
- Appeals workflow.
- Rate limits and retaliatory-report signals.
