# ADR 0026: Structured user reports (intake)

**Status:** Accepted  
**Date:** 2026-07-12

## Context

Chapter 5 requires accountability without public punishment automation.
Blocking (ADR 0024) removes contact; reports preserve evidence for human
review. Private free text is already application-encrypted elsewhere
(migration 013).

## Decision

- `user_reports` stores structured **categories**, optional **session
  reference**, optional **encrypted private note**, and coarse
  **reporter-visible status** (`submitted` / `under_review` / `closed`).
- Writes only via `submit_report` (security definer). Idempotent per reporter
  - key.
- Reported party has **no** select access (RLS + no RPCs).
- `list_my_reports` returns only safe fields — never the private note or
  internal triage.
- Categories are closed enums (harassment, coercion_pressure,
  boundary_violation, unsafe_behavior, impersonation, underage_concern,
  spam_scam, other).
- Closed outcomes for reporters are coarse only (`no_action`,
  `action_taken`, `info_needed`) — no public punishment signal.

## Alternatives considered

- Free-text-only reports. Rejected: harder triage, more sensitive over-collection.
- Immediate auto-ban on report. Rejected: abuse/retaliation risk; human review required.
- Shared public “report count.” Rejected: retaliatory gaming and stigma.

## Consequences

- Intake works without a full moderator console.
- Human-review queue (assignment, internal notes, restrictions) is a
  follow-up migration.
- Client must encrypt notes with the sensitive-data vault before submit;
  server rejects plaintext.

## Follow-up

- Moderator role + review queue tables.
- Rate limits and retaliatory-report signals.
- Emergency-resource copy near report UI (not emergency response).
