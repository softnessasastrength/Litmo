# ADR 0011: Device-bound application encryption for highly sensitive free text

**Status:** Accepted
**Date:** 2026-07-12

## Context

RLS and storage encryption protect database access but do not make private notes opaque to a database disclosure. Litmo also needs fail-closed local key behavior without weakening canonical Consent Snapshot review or server authority.

## Decision

Use Apple CryptoKit AES-256-GCM through the existing native Expo module. Store versioned keys only in the passcode-required, this-device-only Keychain with biometric-current-set access control. Bind ciphertext to purpose, owner/context, format, and key version as AES-GCM authenticated data. Require the `litmo:encrypted:v1:` envelope for private profile and wrap-up notes at the database boundary.

Keep structured canonical snapshots server-readable under participant RLS because mutual review and activation enforcement require shared semantics. Never copy encrypted notes into the canonical engine, snapshots, general audit, logs, analytics, crashes, or notifications.

## Alternatives considered

- Custom JavaScript cryptography was rejected.
- One hard-coded or bundled key was rejected.
- A synchronizable iCloud Keychain key was rejected because it broadens migration/recovery exposure and weakens device-bound invalidation.
- Encrypting the complete canonical snapshot with one participant's device key was rejected because the counterpart and server could not verify the same agreement.

## Consequences

Database disclosure alone does not reveal encrypted free text, but device migration/reinstall/key invalidation can make it permanently unavailable. Rotation is explicit and versioned. The native bridge must be compiled and independently security-reviewed before production. Account deletion, export, and multi-device encrypted-note sharing remain follow-up work.

## Follow-up work

- Add user-visible deletion/local-data clearing in release hardening.
- Design reviewed multi-device/recovery wrapping only if product requirements justify the added trust boundary.
- Obtain independent cryptography, mobile-platform, privacy, and penetration review.
