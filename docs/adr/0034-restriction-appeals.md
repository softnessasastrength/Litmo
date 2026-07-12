# ADR 0034: Restriction appeals

**Status:** Accepted  
**Date:** 2026-07-12

## Context

Staff holds/bans (ADR 0030) need a human reconsideration path without
automatic reversal or public drama.

## Decision

- `restriction_appeals` table: statement (staff-readable), status, optional
  staff note.
- One open appeal per restriction (`submitted` / `under_review`).
- Appellant RPCs: `list_my_active_restrictions`, `submit_restriction_appeal`,
  `list_my_appeals`.
- Staff RPCs: `list_open_appeals`, `resolve_restriction_appeal` (`upheld` |
  `lifted`).
- Lifting via appeal sets restriction lifted and appends
  `account_restriction_lifted` trust event with `via=appeal`.
- Mobile: `/security/appeals` (user), `/security/staff-appeals` (staff).

## Alternatives considered

- Auto-lift after N days of appeal. Rejected: still needs human judgment.
- Free-form public appeals. Rejected: privacy and abuse risk.

## Consequences

- Staff must monitor appeals alongside the moderation queue.
- Statements are sensitive; access remains staff-only via RPC.
