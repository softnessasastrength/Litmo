# ADR 0012: Single-party withdrawal authority with offline local stop

**Status:** Accepted
**Date:** 2026-07-12

## Context

Consent must be revocable without counterpart agreement, network availability, explanation, or reauthentication. Activation and withdrawal may race.

## Decision

Add one participant-authorized transactional withdrawal function. It locks snapshots then the session, invalidates confirmations, and moves pre-active states to `cancelled` or active to `soft_signaled`. It stores no reason and deduplicates by the shared audit idempotency key. Mobile disables and clears protected state before network I/O and persists only a reason-free pending request in the this-device-only Keychain for replay.

## Alternatives considered

- UI-only stopping was rejected because a modified or stale client could resume.
- Requiring Face ID, passkey, confirmation, or counterpart acknowledgement was rejected because it delays revocation.
- Free-text reason storage was rejected because it creates coercion and disclosure risk.
- Waiting for network success before stopping locally was rejected.

## Consequences

Withdrawal wins in final effect even if activation commits immediately before it. Notification and realtime delivery are secondary signals, never authority. Remote push/realtime wiring and real two-device chaos tests remain required before beta.

## Follow-up work

- Wire persisted session IDs and Realtime subscriptions through the complete mobile request path.
- Add physical-device offline/termination/reconnect tests.
- Add privacy-safe push delivery without lock-screen detail.
