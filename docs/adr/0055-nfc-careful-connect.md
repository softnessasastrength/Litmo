# ADR 0055 — NFC careful-connect (tag + QR fallback)

## Status

Accepted (2026-07-13) for engineering foundation on private-alpha builds.

## Context

People sometimes want a **deliberate, short-range** way to start a discovery
profile share, a Consent Snapshot *review* invite, or an ephemeral key exchange
without typing or using Multipeer discovery.

iOS does not offer third-party phone-to-phone NFC P2P. Core NFC supports NDEF
**tag** read/write. QR/deep links and manual codes must work when NFC hardware
or tags are unavailable (including Expo Go).

Constitution: a physical action is never consent; Soft-style cancel must be
easy; privacy default; trauma-informed pacing.

## Decision

1. Implement **NFC NDEF** offer write/read via `litmo-nfc` (Core NFC).  
2. Use a single protocol (`nfcCore`) for NFC, deep link, QR/share, and paste.  
3. Require **explicit post-tap Accept** before deriving keys or opening content.  
4. Encrypt payloads with ephemeral X25519 + AES-GCM after accept.  
5. Snapshot intent is **review-only** (`notSessionActivation`).  
6. Fail soft without native module; Share sheet is the primary QR path.  

Details: [`docs/NFC_FEATURES.md`](../NFC_FEATURES.md).

## Consequences

- Requires NFC Reader entitlement and usage string (config plugin).  
- Physical tags recommended for end-to-end NFC tests.  
- Android HCE peer path deferred.  
- Must not claim phone-to-phone NFC on iOS.

## Alternatives considered

| Option | Why not |
| --- | --- |
| Multipeer only | Already exists; NFC is better for intentional single-intent bootstrap |
| Auto-open content on scan | Violates post-tap consent |
| Server relay for NFC packages | Unnecessary surveillance surface |

## Related

- `docs/NFC_FEATURES.md`  
- `app/services/nfcCore.ts`, `nfcService.ts`  
- `app/modules/litmo-nfc/`  
- ADR 0053, 0054  
