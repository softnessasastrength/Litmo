# ADR 0022: Open-session resume, pre-activation withdraw UI, active re-sync

**Status:** Accepted  
**Date:** 2026-07-12

## Context

Chapter 4 connectivity recovery requires that participants recover correctly after restart without inventing consent from stale local state. Soft Signal, End together, and wrap-up already reconcile pending writes. Missing pieces: (1) finding an in-progress consent or active session after relaunch, (2) a real withdraw action on the Consent Snapshot “No” path for live sessions, (3) re-reading active session status when the app returns to the foreground.

## Decision

- Add `list_open_sessions()` (migration 020): security-definer list of sessions where the caller is a participant and status is `accepted` | `consent_pending` | `ready` | `active`. Requested rows stay on list_incoming/list_outgoing.
- Home shows resume CTAs for each open session; navigation returns to consent snapshot or active session with the real `sessionId`. Labels state that resume does not grant new consent.
- Consent Snapshot “No” for a real `sessionId` calls `withdraw_session_consent` (reason-free) then leaves to Home; mock path leaves without network I/O.
- Active session re-fetches on AppState `active` and shows a display-only connectivity note if the fetch fails — Soft Signal remains available offline; completion still uses durable queue (ADR 0020).

## Alternatives considered

- Storing last-route in AsyncStorage. Rejected: server list is the source of truth and cannot fabricate activation.
- Auto-navigating on cold start. Rejected: Home resume is explicit and calmer.

## Consequences

Participants can resume mid-lifecycle work after restart. Pre-activation refusal is enforceable from the snapshot UI. Offline copy remains non-authority.

## Follow-up work

- Blocking/eligibility; pre-activation timeout policy beyond `requested`; remote push; physical chaos tests.
