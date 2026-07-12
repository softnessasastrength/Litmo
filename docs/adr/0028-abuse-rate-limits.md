# ADR 0028: Abuse rate limits for requests, reports, and blocks

**Status:** Accepted  
**Date:** 2026-07-12

## Context

Chapter 5 requires abuse resistance for request spam, report flooding, and
block thrash without treating rate limits as proof of misconduct or as
automatic punishment.

## Decision

- Append-only `rate_limit_events` records successful attempts to consume a
  budget for: `session_request`, `report`, `block`, `unblock`.
- `assert_under_rate_limit` enforces windows before the side effect:
  - session_request: **20 / hour** (only on **new** requests)
  - report: **15 / day** (idempotent resubmits do not re-consume)
  - block / unblock: **40 / day** each
- Over-limit raises a non-revealing error:  
  `you're doing that too often — try again later` (`P0001`).
- Table is not readable by authenticated clients.

## Alternatives considered

- Count only domain tables (sessions/reports/blocks). Rejected for unblock
  thrash (rows delete) and mixed idempotency.
- IP-based limits. Deferred: need edge/proxy integration.
- Auto-suspend on limit hit. Rejected: rate limits are review inputs, not
  proof (Chapter 5 roadmap).

## Consequences

- Legitimate power users may eventually hit soft ceilings; limits are
  intentionally generous for private beta and can be tuned by migration.
- Staff/moderation flows are not rate-limited here.

## Follow-up

- Pair-specific block churn detection.
- Per-target report limits.
- Feed rate-limit anomalies into the moderation queue as signals only.
