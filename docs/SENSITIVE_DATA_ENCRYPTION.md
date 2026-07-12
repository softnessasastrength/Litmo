# Sensitive-data encryption and privacy-safe storage

## Boundary

Litmo layers application encryption over iOS data protection and PostgreSQL/RLS for the highest-risk free text: private nervous-system notes and private wrap-up notes. The iOS native vault uses CryptoKit AES-256-GCM with purpose- and key-version-bound authenticated data. Keys are random CryptoKit `SymmetricKey` values stored only in the Keychain with `WhenPasscodeSetThisDeviceOnly` and `biometryCurrentSet`; biometric enrollment changes invalidate access.

Structured Consent Snapshots remain server-readable because both participants must review the same canonical agreement and PostgreSQL must enforce confirmation/activation. They remain immutable, participant-only under RLS, excluded from logs, and protected by platform/database encryption, but are not claimed to be application-opaque. Authentication tokens and device secrets use the passcode-required non-migrating Keychain; they are not copied into the application encryption envelope.

## Classification

| Data | Class | Storage and exposure |
| --- | --- | --- |
| Identity/profile fields | private or discovery-selected | PostgreSQL + RLS; only explicitly selected fields enter discovery |
| Passkeys | authentication secret | private key/biometric data remain with Apple; public ceremony material handled by Supabase |
| Session tokens/device secrets | authentication secret | this-device-only, passcode-required Keychain; server stores only device-secret digest |
| Session identifiers/states/timestamps | shared sensitive metadata | participant-only RLS; minimal append-only audit |
| Touch Language and consent rules | sensitive consent | immutable owner rows; canonical overlap disclosed only for a specific participant session |
| Consent Snapshots/confirmations | shared consent / private decision | immutable participant snapshot; confirmation owner-only; never analytics/log payload |
| Private notes and private wrap-up notes | highly sensitive | AES-256-GCM application envelope before database persistence; plaintext rejected by migration 013 |
| Rejection/withdrawal/safety reasons | highly sensitive | not collected in general flows; never shared audit, logs, notifications, or analytics |
| Audit records | restricted operational | actor, timestamp, states, idempotency key, enumerated metadata only |
| Notifications | lock-screen exposed | fixed generic content only; private detail requires app unlock |
| Local cache/decrypted runtime state | highly sensitive | no plaintext persistence; access disabled immediately on background/lock/sign-out/revocation |
| Exports | highly sensitive | not implemented; production export requires authenticated encrypted generation and expiry |
| Analytics/crash/diagnostics | restricted | no provider configured; recursive redaction boundary applies before any future sink |
| Test fixtures/snapshots | synthetic only | no real user data or production ciphertext/keys |

## Envelope and key hierarchy

Persisted values begin `litmo:encrypted:v1:` and contain only envelope format, key version, and CryptoKit combined ciphertext. AES-GCM nonces and tags are generated/verified by CryptoKit. Additional authenticated data binds ciphertext to `litmo-sensitive-v1`, its purpose (including owner/context), and key version, preventing field or account-context substitution.

The Keychain stores a current non-secret version marker and one 256-bit key per version. The JavaScript boundary never receives raw key bytes. It gates encryption/decryption on successful application unlock and converts malformed, tampered, unsupported, missing-key, or wrong-purpose data into a generic fail-closed error.

## Rotation and atomicity

Rotation creates and stores the next key before it becomes current. Authorized code decrypts the old envelope, encrypts a replacement with the new key, persists the replacement atomically at the repository/database boundary, verifies access, and only then retires the superseded key. An interruption before persistence leaves the old key/envelope valid; an interruption after persistence but before retirement leaves a bounded extra decrypt-capable key, not plaintext or corrupt data. Keys must never be retired before every referenced envelope is replaced.

## Lifecycle and recovery

- Background, privacy lock, sign-out, revocation, and sensitive reauthentication immediately disable the JavaScript decrypt boundary and discard decrypted return values from application state.
- Keys do not migrate in device backups. A restored/reinstalled/replacement device cannot decrypt old device-bound notes. It fails closed; structured consent/session authority remains available subject to authentication and RLS.
- Passkey iCloud synchronization does not synchronize Litmo encryption keys.
- Lost/revoked devices lose application access through device registration; Keychain data remains protected by the device passcode/biometric state.
- Biometric enrollment changes invalidate `biometryCurrentSet` keys. Ciphertext remains but is unrecoverable without a separately reviewed future recovery design.
- Partial restoration never silently downgrades to plaintext or creates a new key to “decrypt” old data.
- Account deletion and local-data clearing must delete keys before production release; those workflows are Milestone 3 work.

## Threat model and residual risk

Protected against database-only disclosure of encrypted free text, plaintext local-file/cache exposure, ciphertext tampering, field substitution, stale-key use after retirement, backup migration, and access before app unlock. RLS, consent-state constraints, and server authorization remain independent controls.

Not protected against a fully compromised unlocked OS, coerced device-owner authentication, plaintext visible to an authorized user at display time, deliberate screenshots, server disclosure of structured snapshot content, or Apple/Supabase/platform compromise. JavaScript strings cannot be deterministically zeroized; Litmo minimizes lifetime and clears references but does not claim memory-forensic resistance. Key loss currently means encrypted note loss, a conservative availability tradeoff that requires explicit user communication before external beta.
