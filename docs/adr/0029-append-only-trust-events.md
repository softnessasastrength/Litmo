# ADR 0029: Append-only trust events (no universal score)

**Status:** Accepted  
**Date:** 2026-07-12

## Context

Chapter 5 requires specific, legible trust signals without reducing safety to
a public ranking or star rating. Positive history must never override current
consent.

## Decision

- `trust_events` is append-only with typed events:
  `profile_completed`, `age_adult_confirmed`, `session_completed`,
  `session_soft_signaled`, `session_safety_ended`, `report_submitted`,
  `moderation_closed`.
- Triggers append events from profile, session, and report lifecycle changes.
- `my_trust_signals()` returns **self-only** coarse fields:
  account age days, profile complete, adult eligible, terminal session counts.
- No public score, no peer-visible report counts, no star ratings.
- Raw `trust_events` rows are not granted to authenticated clients.

## Alternatives considered

- Single 0–100 safety score. Rejected by Chapter 5 principles.
- Public “completed sessions” on discovery. Deferred until product decides
  disclosure rules; self-view first.
- Client-computed signals only. Rejected: not authoritative for moderation.

## Consequences

- Discovery can later surface **optional** specific indicators with explicit
  product copy; this ADR only ships the ledger + self RPC.
- `report_submitted` / `moderation_closed` exist for staff analysis, not
  consumer shaming UI.

## Follow-up

- Peer-visible indicators (account age, optional verification) with copy
  review.
- Account restriction events.
- Backfill historical completed sessions if needed for older data.
