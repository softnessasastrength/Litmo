# ADR 0024: One-way user blocks (Chapter 5 first slice)

**Status:** Accepted  
**Date:** 2026-07-12

## Context

Chapter 4 deferred blocking/eligibility because no block system existed.
`docs/roadmap/CHAPTER_5_TRUST_AND_MODERATION.md` requires immediate,
non-disclosing blocks that prevent discovery, requests, and interaction, and
cancel future pending requests safely.

## Decision

- **One-way blocks:** `user_blocks (blocker_id, blocked_id)`. Either direction
  is enough to block the pair for discovery and `request_session`.
- **Non-disclosing:** The blocked user cannot list who blocked them. Request
  rejection uses the same opaque message as a missing profile.
- **Immediate write path:** `block_user` / `unblock_user` / `list_blocked_users`
  are security-definer; clients have no direct INSERT/UPDATE/DELETE.
- **On block:** any `requested` session between the pair is cancelled with a
  reason-free audit event (`trigger: user_action`).
- **Discovery:** `discovery_profiles()` excludes pair-blocked accounts.
- **No free-text block reasons** on the record (retaliation / inference risk).
- ~~Active mid-lifecycle sessions are not auto-cancelled~~ **Superseded by
  ADR 0040 (2026-07-12):** blocks cancel pre-activation and safety-end active
  pair sessions.

## Alternatives considered

- Mutual-only blocks. Rejected: one-way better matches harassment protection.
- Revealing “this user blocked you.” Rejected: roadmap non-disclosing rule.
- Auto-ending active sessions on block. ~~Deferred.~~ Accepted in ADR 0040.

## Consequences

Request spam and discovery contact after rejection can be cut immediately.
Reporting and moderator queues remain later Chapter 5 work.

## Follow-up work

- ~~Structured reports and human-review queue.~~ Done.
- ~~Optional auto-handling of active sessions on block.~~ ADR 0040.
- ~~Rate limits for block/unblock thrash.~~ Done.
