# ADR 0008: Participant-private immutable session wrap-ups

**Status:** Accepted
**Date:** 2026-07-12

## Context

Chapter 4 requires each participant to complete an independent private check-in after a session. Showing one response to the counterpart could create pressure, retaliation risk, or a false public rating system. Retries after connectivity loss must not duplicate or overwrite sensitive outcomes.

## Decision

Store one immutable `session_wrapups` row per session participant, readable only by its owner under row-level security. Authenticated clients submit through `submit_session_wrapup(...)`, which verifies participation and a terminal session state, validates an enumerated outcome and bounded optional private note, and returns the original row for any retry after the first successful submission. Clients have no direct table-write grant.

Eligible outcomes are `completed_comfortably`, `ended_normally`, `soft_signal_used`, `felt_uncomfortable`, and `safety_concern`. Responses and notes never enter the shared session audit trail. A safety concern is private evidence for later human-review infrastructure; this chapter does not automatically punish or publicly score the counterpart.

## Alternatives considered

- A shared wrap-up row was rejected because either participant could infer or overwrite the other's response.
- Mutable upserts were rejected because a retry with changed local state could silently rewrite sensitive history.
- Writing outcomes into `session_events` was rejected because both participants can read that audit trail.

## Consequences

The database now guarantees independent visibility and idempotent immutable submission. Mobile UI wiring, offline pending-state presentation, moderation routing for safety concerns, retention, correction, and appeal workflows remain follow-up work.

## Follow-up work

- Wire the wrap-up screen through a typed mobile repository.
- Route `safety_concern` and `felt_uncomfortable` to human review in Chapter 5 without exposing them to the counterpart.
- Define production retention, export, correction, and deletion policy.
