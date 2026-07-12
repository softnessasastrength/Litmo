# ADR 0019: Incoming session-request Realtime

**Status:** Accepted  
**Date:** 2026-07-12

## Context

After ADR 0016 wired Realtime for active-session status and snapshot wait, a remaining Chapter 4 gap was that a recipient only discovered a new session request by manually opening `/requests`. `docs/CHAPTER_4_NEXT_STEPS.md` and ADR 0016's follow-up listed "Realtime delivery for new incoming requests" as open. Push notifications are still a separate product surface; this ADR only covers in-app observation.

## Decision

- Reuse the existing `sessions` membership in the `supabase_realtime` publication (migration 016). No new migration is required.
- Add `sessionRepository.subscribeToIncomingRequests(recipientId, onChange)` listening for `INSERT` and `UPDATE` on `public.sessions` with filter `user_b=eq.<recipientId>`, matching migration 015's invariant that `request_session` always stores the recipient as `user_b`.
- `/requests` quietly reloads the authoritative `list_incoming_requests()` RPC when the subscription fires (quiet reload avoids a full-screen loading flash). Home shows a live pending-count badge and primary CTA when count &gt; 0.
- Realtime remains non-authority: acceptance, decline, and expiration still go through the existing security-definer RPCs. The subscription only triggers a re-read of the same list the screen already uses.

## Alternatives considered

- Polling on an interval. Rejected: sessions are already published; Realtime matches the active-session pattern.
- Filter only `status=eq.requested` in the subscription. Rejected: Postgres Realtime filters are limited, and UPDATE events when a request leaves `requested` still matter so the badge/list can clear after accept/decline/expire.
- Push notifications. Deferred: OS permission, preview privacy, and AASA/credential constraints are separate release work (`docs/KNOWN_LIMITATIONS.md`).

## Consequences

A signed-in recipient with `/requests` or Home open sees new and completed request activity without a manual refresh. Demo mode is unchanged (no real account, no subscription). Does not invent blocking/eligibility or pre-activation expiry policy.

## Follow-up work

- Optional push/local notification when a request arrives while the app is backgrounded.
- Blocking/eligibility before request creation (product decision).
- Pre-activation expiry beyond `requested` (product decision).
