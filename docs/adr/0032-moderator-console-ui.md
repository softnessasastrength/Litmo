# ADR 0032: Moderator console UI (staff mobile)

**Status:** Accepted  
**Date:** 2026-07-12

## Context

Report intake and staff RPCs (ADR 0026–0027, 0030–0031) exist without a
console. Private beta needs a fail-closed staff surface to claim, note, and
resolve cases without automatic punishment.

## Decision

- Mobile screens `/security/moderation` (queue) and `/security/moderation-case`
  (detail) call existing staff RPCs only.
- Settings shows **Moderation queue (staff)** when `is_staff_moderator()` is true.
- Migration `030` adds `list_moderation_case_notes` for the note trail.
- Case detail can apply a 7-day matching hold via `apply_account_restriction`.
- Non-staff receive denied empty states; RPCs still enforce 42501.

## Alternatives considered

- Separate web-only admin. Deferred; mobile first for founder/staff on device.
- Expose internal notes to reporters. Rejected by ADR 0026.

## Consequences

- Staff must be granted via `staff_roles` (ops only).
- Not a full ops suite (search, bulk assign, audits UI) — queue + case only.

## Follow-up

- Appeals UI.
- Richer case evidence (encrypted note decrypt is device-bound — staff may only
  see that a note exists unless a server-readable evidence path is designed).
