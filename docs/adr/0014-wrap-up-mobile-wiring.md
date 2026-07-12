# ADR 0014: Wrap-up mobile wiring and "End together" completion

**Status:** Accepted
**Date:** 2026-07-12

## Context

ADR 0008 persisted participant-private immutable wrap-ups server-side (`submit_session_wrapup`, migration 012/013) but explicitly deferred mobile wiring. `submit_session_wrapup` only accepts a session already in a terminal state (`completed`, `soft_signaled`, `safety_ended`); nothing on the client called `transition_session(...)` to reach `completed` when two participants ended a session together, so a real wrap-up submission for that path would always fail closed with "session is not ready for wrap-up."

Separately, no caller anywhere in the mobile app currently passes a `sessionId` into `/session/active` — session creation and request/accept flow remain unbuilt (tracked as its own larger follow-up in `docs/CHAPTER_4_NEXT_STEPS.md`). The wrap-up screen and its "End together" completion call therefore had to work correctly today in the sessionId-less demo path and be immediately correct once a real session ID is threaded in later, without speculative code for a flow that doesn't exist yet.

## Decision

- Added `sessionRepository.completeSession(sessionId)`, a thin wrapper around `transition_session(session_id, 'completed', ...)`, called by the "End together" button before navigating to wrap-up. Guarded by `if (sessionId)`, mirroring the existing guard on `emergencyStopService.stop(sessionId)` in the same screen. If the transition throws (offline, no real session yet), the screen still navigates to wrap-up but with `ended=pending-sync`, reusing the existing pending-sync copy rather than inventing a new user-facing state.
- Added `sessionWrapupServiceCore.ts` / `sessionWrapupService.ts` following the existing core-plus-platform-wiring dependency-injection pattern (`emergencyStopServiceCore.ts`, `deviceRegistrationServiceCore.ts`). The core is pure and unit-tested without any native or network dependency.
- The wrap-up screen now presents the real five-value canonical `WrapupOutcome` enum (`completed_comfortably`, `ended_normally`, `soft_signal_used`, `felt_uncomfortable`, `safety_concern`) instead of the previous three ad hoc mock labels, plus an optional private note field.
- The private note is encrypted client-side through the existing `sensitiveDataService` vault (`session:{sessionId}:wrapup-note` purpose string) before submission, matching the mandatory encrypted-envelope check added to `session_wrapups.private_note` in migration 013.
- When `status !== "authenticated"` (demo mode) or no `sessionId` is present, the screen falls back to the prior mock behavior: it still shows all five real outcome choices for consistency, but does not call the repository, says so explicitly, and the button reads "Continue" instead of "Save my private reflection."

## Alternatives considered

- Wiring full session creation and request/accept flow first, then wrap-up. Rejected for this unit: it is explicitly scoped as a separate, larger follow-up in `docs/CHAPTER_4_NEXT_STEPS.md`, and the wrap-up/transition wiring done here is fully correct and testable independent of it.
- Silently keeping the three-way mock outcome mapping and translating it server-side. Rejected because it would require an undocumented, arbitrary mapping and would not exercise the real enum contract client-side.

## Consequences

Once a real `sessionId` is threaded into `/session/active` (the remaining, separately tracked work), both end paths — Soft Signal and "End together" — correctly reach a terminal session state before wrap-up, and a real private wrap-up with an optional encrypted note can be submitted end to end. Until then, behavior in the live demo app is unchanged except for the honest five-outcome copy.

## Follow-up work

- Thread a real `sessionId` into `/session/active` once session creation/request-accept exists.
- Offline-safe pending-wrap-up recovery (the wrap-up submission itself is not currently retried or queued if it fails after a real session reaches a terminal state; only the Soft Signal path has an offline queue, via `emergencyStopService`).
- Route `safety_concern` and `felt_uncomfortable` outcomes to human review, per ADR 0008.
