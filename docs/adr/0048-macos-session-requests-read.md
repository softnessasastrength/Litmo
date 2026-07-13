# ADR 0048: macOS session-requests read model

- **Status:** Accepted
- **Date:** 2026-07-13
- **Decision owners:** Founder and engineering

## Context

After ADR 0046 (trust history) and ADR 0047 (own profile), the next useful
participant read is pending session requests. Mutations (create, accept,
decline, cancel) must remain phone-first with Soft Signal and active sessions.

## Decision

1. Expose a **read-only** Requests sidebar surface on macOS.
2. Load `list_incoming_requests` and `list_outgoing_requests` via the shared
   fail-closed Supabase transport.
3. Display request id (shortened), counterpart user id, created_at, expires_at.
4. Empty lists are success states (nothing pending)—not fabricated sample rows.
5. Do **not** implement accept/decline/create/cancel on Mac in this slice.
6. Authority copy: a listed request is never consent; act on the phone.

## Alternatives considered

- **export_my_data first:** broader surface; deferred.
- **Consent snapshot detail:** still risks reinterpretation; deferred.
- **Mock pending requests when offline:** rejected.

## Consequences

- Participants can review open request traffic on a desktop screen without
  turning the Mac into a session controller.
- Further request mutations require a separate, reviewed design.
