# ADR 0037: Staff-readable report message + case evidence pack

**Status:** Accepted  
**Date:** 2026-07-12

## Context

Report intake (ADR 0026) stored free text as a **device-encrypted**
`private_note` while UI copy said human reviewers could use it. Staff
cannot decrypt device-bound envelopes, so the moderator console had no
usable reporter narrative and only queue metadata.

## Decision

1. Add optional **`staff_shared_message`** on `user_reports`: plain text
   (max 2000), written only via `submit_report`, readable only by staff
   through `get_moderation_case_evidence`. Never shown to the reported party.
2. Keep **`private_note`** as optional/legacy device-encrypted envelope.
   Staff only see a boolean `has_device_private_note` — no server decrypt.
3. **`get_moderation_case_evidence(case_id)`** returns a staff-only JSON pack:
   case/report ids, category, staff message, session metadata (status,
   participants, timestamps), active restriction kind on the reported
   account, and prior open/other report **counts** (facts, not a score).
4. Mobile report form sends free text as `staff_shared_message` with honest
   copy. Case detail loads and displays the evidence pack.

## Alternatives considered

- Server-side decrypt of device notes. Rejected: breaks ADR 0011 key model.
- Force all notes to remain encrypted and drop staff narrative. Rejected:
  human review needs a usable shared message path.
- Public or reporter-visible staff fields. Rejected: ADR 0026 boundaries.

## Consequences

- Moderators can act on reporter-authored text without device keys.
- Callers must not treat prior-report counts as a safety score.
- Existing encrypted `private_note` rows remain unread by staff forever.
