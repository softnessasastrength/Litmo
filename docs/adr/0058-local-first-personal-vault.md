# ADR 0058 — Local-first personal vault with optional encrypted cloud backup

## Status

Accepted — 2026-07-13

## Context

Litmo holds highly personal data: Touch Language maps, pre-session Consent Snapshot declarations, Soft Signal logs, private history, learning progress, and quiz weather. Prior implementation stored many of these locally, but storage was fragmented, wipe/inventory incomplete, and there was no unified offline-first contract or encrypted personal backup for the full set.

Requirements:

1. The app must work fully offline for personal data.
2. Personal data is stored **locally first** (authoritative on device).
3. Optional **encrypted** cloud backup for disaster recovery.
4. Never confuse backup or history with consent, safety scores, or multi-party session authority.

## Decision

1. Introduce a **local vault** (`localVault`) with a canonical domain registry, Secure Store preferred for sensitive domains, AsyncStorage fallback.
2. Route Touch Language, Consent Snapshot local packages, Soft Signal log, private history, learning progress, and quiz summaries through the vault.
3. After successful local writes, optionally fire **best-effort** encrypted backup when the user has opted in and is authenticated.
4. Cloud storage is **opaque ciphertext only** (`personal_encrypted_backups` + `upsert_own_encrypted_backup`), owner RLS, allow-listed domains.
5. Client seals with a device-held 32-byte master key (AES-256-GCM + HKDF per domain). Users export a recovery code for restore on a new device.
6. Multi-party live sessions and discovery remain network features; they do not block personal offline use.

## Consequences

### Positive

- Clear offline product story and single wipe/inventory registry.
- Backup cannot leak plaintext to the server under normal operation.
- Local success never blocked by remote failure.
- Aligns with GDPR data-minimization and user control.

### Negative / tradeoffs

- Recovery code loss + device loss ⇒ backup unrecoverable (conservative availability).
- Dual paths (local mutual seal vs server session snapshots) must stay carefully labeled.
- Secure Store size limits may force future chunking for very large histories.

### Non-decisions

- Not multi-device automatic key sync.
- Not server-side decryption for support.
- Not encrypting structured multi-party session rows that both participants must read online (existing ADR 0006 / 0011 boundary).

## Alternatives considered

| Alternative | Why rejected |
| ----------- | ------------ |
| Server-authoritative personal profiles only | Breaks offline; higher breach impact |
| Plaintext cloud sync | Unacceptable for Soft Signal notes / TL |
| Always-on backup without opt-in | Violates minimization and user agency |
| Rely only on iCloud device backup | Not under Litmo crypto control; Secure Store often excluded |

## References

- `docs/LOCAL_FIRST.md`
- `docs/SENSITIVE_DATA_ENCRYPTION.md`
- ADR 0051 (quiz summary backup pattern)
- ADR 0011 (device-bound sensitive encryption)
