# ADR 0020: Durable offline retry for "End together"

**Status:** Accepted  
**Date:** 2026-07-12

## Context

Chapter 4 connectivity requirements ask that stop and completion actions survive temporary network loss without inventing consent from stale state. Soft Signal already uses `emergencyStopService` (persist-then-retry). Wrap-up uses `sessionWrapupService`. "End together" (`transition_session` → `completed`) still threw and only showed `pending-sync` copy without queuing a retry — a real completion intent could be lost after app kill.

## Decision

- Add `sessionCompleteService` with the same durable pattern: write a minimal Keychain pending record `{ sessionId, idempotencyKey }` before the RPC, reuse that key on reconcile, clear on success.
- Inject `isRetryable` so permanent failures (e.g. session never active, invalid transition) clear the queue and surface `failed_closed` instead of retrying forever.
- Wire `reconcile()` into `AuthContext` restore next to emergency-stop and wrap-up reconciliation.
- Active session "End together" calls the service instead of bare `sessionRepository.completeSession`.

## Alternatives considered

- Leaving only Soft Signal durable. Rejected: ordinary mutual end is a first-class terminal path in the lifecycle graph.
- Always retry any error. Rejected: a never-activated session would spin forever; non-retryable mapping already exists in `mapExternalError`.

## Consequences

A network-failed mutual end is retried on next signed-in restore with the same idempotency key (Postgres returns a stable result for replays). Demo mode without a real `sessionId` is unchanged. Consent is never inferred offline.

## Follow-up work

- Optional in-session connectivity banner while offline (display-only; not authority).
- Physical offline/termination chaos tests before private alpha.
