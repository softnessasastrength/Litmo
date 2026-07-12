# ADR 0021: Outgoing request list, cancel, and privacy-safe local alert

**Status:** Accepted  
**Date:** 2026-07-12

## Context

Chapter 4 requires create, receive, accept, decline, **and cancel** for session requests. Incoming list + Realtime (ADRs 0015–0019) covered the recipient path; the requester could not see or withdraw a pending ask in the UI. Separately, a new request only updated in-app badges — no device-level alert when the app was open but not focused on `/requests`.

## Decision

- Add `list_outgoing_requests()` (migration 019): security-definer list of `requested` sessions where `user_a` is the caller, with the same 24-hour check-on-read expiration pattern as incoming.
- Reuse `transition_session(..., 'cancelled')` for cancel — already graph-valid and participant-authorized for either party (accept/decline remain recipient-only).
- Expand `/requests` into Incoming + Outgoing sections with Cancel on outgoing rows.
- On Realtime `INSERT` for the recipient (`subscribeToIncomingRequests`), fire an **immediate local** notification via `notifyPrivateUpdate()` using the existing privacy-safe title/body. Not remote push; no names, session ids, or consent text.

## Alternatives considered

- Soft-delete or free-text cancel reasons. Rejected: reason-free cancel matches Soft Signal / withdrawal philosophy.
- Remote push (APNs). Deferred: credentials, preview privacy, and AASA remain release-track work.

## Consequences

Requesters can withdraw pending asks; recipients still own accept/decline. Local alerts are identity-free. Demo mode remains non-account (no list/subscription).

## Follow-up work

- Blocking/eligibility; pre-activation expiry beyond `requested`; remote push.
