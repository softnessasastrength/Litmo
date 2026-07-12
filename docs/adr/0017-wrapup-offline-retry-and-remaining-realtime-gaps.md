# ADR 0017: Wrap-up offline retry, precise pending-sync copy, snapshot-wait Realtime

**Status:** Accepted
**Date:** 2026-07-12

## Context

`docs/CHAPTER_4_NEXT_STEPS.md` listed three remaining small gaps after ADR 0016's Realtime work: wrap-up submission had no offline retry (only Soft Signal did, via `emergencyStopService`'s pending-storage pattern); `ended=pending-sync`'s copy conflated two different situations (a genuine network failure worth retrying, and a session that was never actually activated, which retrying cannot fix); and `consent-snapshot.tsx`'s "waiting for the other person" state required manually tapping "Check again" instead of updating live.

## Decision

- **Wrap-up offline retry**: `sessionWrapupServiceCore.submit(...)` now durably queues the submission (`pendingWrapupStorage`, a dedicated Keychain service mirroring `pendingSafetyActionStorage`) if `submitRemote` fails, returning `{status: "pending_sync"}` instead of throwing, and a new `reconcile()` retries it — wired into `AuthContext.tsx`'s restore flow alongside the existing `emergencyStopService.reconcile()` call, so a queued wrap-up retries on next app start. `submit`'s return type changed from `Promise<string>` to `Promise<WrapupSubmitState>` (`saved` / `pending_sync` / `idle`); `wrap-up.tsx`'s caller doesn't need to branch on it since both outcomes mean the device has durably recorded the reflection.
- **Precise pending-sync copy**: `mapExternalError` gained a mapping for Postgres errcode `55000` (invalid transition / already terminal) to `validation_failed`, non-retryable — previously this fell into the generic fallback, which is always `retryable: true`, making it indistinguishable from an actual network failure. `session/active.tsx`'s `endTogether()` now branches on `error.retryable` to pass `ended=not-active` (session was never actually active — retrying won't help, nothing was lost) versus `ended=pending-sync` (a real network failure). `wrap-up.tsx` shows distinct, accurate copy for each.
- **Snapshot-wait Realtime**: `consent-snapshot.tsx` now subscribes via `sessionRepository.subscribeToSession` while in the `waiting` state, and proceeds to `activateSession` automatically the moment the other participant's confirmation brings the session to `ready` — no more manual "Check again."

## Alternatives considered

- Leaving `submit()` throwing and handling retry entirely at the call site. Rejected: the existing `emergencyStopService` pattern (persist-then-retry-on-restart) is already established and tested; duplicating that shape here is more consistent than inventing a different retry mechanism for a conceptually identical problem (network unreliability, not application logic).
- Guessing at retryability from error message substrings instead of fixing `mapExternalError`'s missing `55000` case. Rejected: the underlying bug (a real state-transition error masquerading as retryable) would still exist for every other caller of `mapExternalError`, not just this one.

## Consequences

A wrap-up submission is never lost to a transient network failure. The three "ended" reasons (`soft-signal`, `pending-sync`, `not-active`, `together`) are each now accurate rather than `pending-sync` covering two different underlying causes. Consent-snapshot confirmation waiting is now live rather than requiring a manual check. Added a new unit test (`errors.test.ts`) and four new tests for `sessionWrapupServiceCore`'s queue/reconcile behavior (51 app tests total, up from 46).

## Follow-up work

- Blocking/eligibility checks before request creation and request expiration timestamps/jobs remain unbuilt — both require a product design decision (what "blocked" means, what expiration policy) rather than a mechanical wiring task, and are deliberately not invented here.
- The Express backend LAN dependency for snapshot creation remains an accepted trade-off per ADR 0015's addendum, revisit when scaling past one device.
