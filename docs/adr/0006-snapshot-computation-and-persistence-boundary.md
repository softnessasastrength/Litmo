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

The Express/trusted server adapter still needs wiring to call the creation function. Local database tests can seed canonical payloads directly, but mobile cannot create them. The legacy `consent_records` table remains inert for migration history and must be removed only through a later documented migration.

## Follow-up work

- Wire the trusted backend adapter to compute and persist snapshots.
- Add snapshot replacement/invalidation when material profile versions change.
- Define retention and deletion policy before production.
