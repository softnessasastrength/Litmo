# ADR 0033: Peer-visible specific signals (no score)

**Status:** Accepted  
**Date:** 2026-07-12

## Context

Chapter 5 allows specific, legible trust signals while forbidding universal
safety scores. Self-only signals already exist (ADR 0029). Peers need limited
context in discovery without shaming or ranking.

## Decision

- `discovery_profiles` returns `account_age_days` and `completed_sessions`
  (from auth user creation and `trust_events` session_completed counts).
- `peer_public_signals(user_id)` returns the same facts for one available peer
  (blocked/restricted/missing → opaque unavailable).
- UI copy must state these are **not** a safety score and never replace consent.
- No public report counts, no star ratings, no composite score.

## Alternatives considered

- Account age bands only. Rejected: less precise than days with clear copy.
- Peer-visible report counts. Rejected: stigma and gaming.

## Consequences

- Clients must treat extra discovery columns as optional additive fields.
- Counts can be low early; that is expected and must not imply danger.
