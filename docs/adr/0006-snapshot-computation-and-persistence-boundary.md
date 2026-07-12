# ADR 0006: Snapshot computation and persistence boundary

**Status:** Accepted  
**Date:** 2026-07-12

## Context

The canonical TypeScript engine computes directional compatibility and deterministic fingerprints, while PostgreSQL owns transactional session state, authorization, confirmations, and audit durability. Reimplementing the full engine in SQL would create a second safety-critical implementation; accepting a snapshot directly from mobile would trust an untrusted client.

## Decision

Canonical snapshot payloads are computed by `@litmo/domain` in a trusted server adapter and persisted through service-role-only `create_session_snapshot(...)`. PostgreSQL verifies the session state, participant ownership, exact immutable profile IDs/versions, fingerprint shape, and that compatibility does not claim consent. Authenticated participants confirm or withdraw only through security-definer functions. A database trigger independently prevents activation unless one unwithdrawn snapshot has exact-fingerprint confirmations from both participants.

Confirmations use a separate table and are owner-readable: one participant cannot inspect whether the other has confirmed. Snapshot compatibility is shared with both participants because it is the agreement they are being asked to confirm. Raw private profile notes are never copied into snapshot or confirmation storage.

## Alternatives considered

- Porting the full compatibility engine to PL/pgSQL was rejected because two implementations could drift.
- Allowing the mobile client to create snapshots was rejected because a modified client could forge compatibility.
- Storing confirmations as shared JSON on the snapshot was rejected because it would reveal the counterpart's private pending decision.

## Consequences

`POST /api/sessions/:sessionId/snapshot` is the trusted creation adapter. It authenticates a Supabase bearer token, returns the same opaque result for missing and stranger-owned sessions, loads both participants' latest immutable touch/consent version pairs with a server-only service-role client, computes the snapshot through `@litmo/domain`, rejects ineligible overlap, and invokes `create_session_snapshot(...)`. Private nervous-system notes are supplied only to domain validation and never enter the compatibility result or persistence call. The route returns stable public error codes without database messages.

The adapter needs `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in the backend process only. It fails closed with `snapshot_service_unavailable` when either is absent. Neither value may enter Expo configuration, client source, or logs.

The legacy `consent_records` table remains inert for migration history and must be removed only through a later documented migration.

Migration 011 completes persisted invalidation. Saving a new immutable profile pair marks every affected unwithdrawn pre-activation snapshot invalid, records the actor and server time, clears its confirmations, and audits the change. A ready session moves back to `consent_pending` through the canonical transition function; an already-pending session stays pending and receives a same-state `snapshot_invalidated` event. Active and terminal sessions remain historical records and are never rewritten. The trusted adapter can then compute a replacement from both latest exact version pairs.

## Follow-up work

- Wire the mobile session-request flow to the authenticated endpoint after request creation and transition-specific actor authorization exist.
- Define retention and deletion policy before production.
