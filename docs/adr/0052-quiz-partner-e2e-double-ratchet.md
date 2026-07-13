# ADR 0052: Partner quiz E2E encryption (X3DH + Double Ratchet)

- **Status:** Accepted
- **Date:** 2026-07-13
- **Decision owners:** Founder and engineering

## Context

ADR 0050 introduced partner quiz comparison with four explicit consent gates and
a lightweight XOR seal whose portable package **included the seal key**. That
was enough for a first mutual-consent slice, but it is not production-grade E2E:

- Anyone with the package could open ciphertext (package ≈ password).
- No forward secrecy or authenticated key agreement.
- Supabase was correctly kept out of partner compare; if a relay were added
  later, cleartext keys must never appear on the server.

The product still requires: dual share + dual compare consent, fail closed,
quizzes never consent/safety/matching authority, and **simple user steps**.

## Decision

### 1. Signal-inspired X3DH + Double Ratchet (focused 1:1)

Use pure TypeScript crypto (`@noble/curves`, `@noble/hashes`, `@noble/ciphers`):

| Step | Role | Action |
| ---- | ---- | ------ |
| 1 | Host | Publish **public-invite** (identity + signed prekey only) |
| 2 | Peer | X3DH initiator + Alice ratchet; emit **session-open** ciphertext |
| 3 | Host | X3DH responder + Bob ratchet; decrypt session-open → send chain ready |
| 4 | Either | Encrypt `ShareableQuizResult` as AES-256-GCM under ratchet message keys |
| 5 | Either | Decrypt partner ciphertext only with local ratchet state |

This is a **focused E2E encryption stub / product path**, not a full multi-device
Signal client (no OPKs, no skipped-key store beyond sequential quiz messages, no
sealed sender). It is intentionally Signal-inspired X3DH + Double Ratchet for
1:1 partner quiz packages only. Independent crypto review remains before
external beta.

### 2. Device-local private keys (Secure Store + Secure Enclave vault wrap)

Apple Secure Enclave supports P-256, **not** Curve25519/X25519 used by Signal
X3DH. Therefore:

- X25519 identity / signed-prekey / ratchet secrets are generated in software.
- On real iOS builds with LitmoPasskeys, those bytes are **AES-GCM wrapped** via
  `litmoPasskeys.encryptSensitive` (ADR 0011 CryptoKit vault). Vault master keys
  sit in Keychain with passcode + biometry ACL (Secure Enclave evaluates
  biometry on capable devices).
- Envelopes live in `expo-secure-store` (`WHEN_UNLOCKED_THIS_DEVICE_ONLY`).
- Ratchet state is vault-wrapped the same way when the vault is available.
- Demo / Expo Go may fall back to Secure Store–only storage (documented limit).
- Private keys, root keys, and chain keys **never** appear in portable packages
  or Supabase rows.

### 2b. Only the invited partner can decrypt

- Ciphertext is bound by Double Ratchet message keys from an X3DH session that
  requires the host’s private keys and the peer’s ephemeral contribution.
- AAD includes `quizId`, `invitePublicId`, and **host identity public key**.
- Host accept fails closed if this device’s public keys do not match the invite
  bundle (wrong device cannot open partner packages).
- An outsider who only has ciphertext (or who starts a different X3DH session)
  cannot decrypt — unit-tested.
- The public-invite package is a **bearer invitation**: only share it with the
  intended partner. Product copy states this; it is not a multi-party ACL.

### 3. Package kinds (v3) — no sealKey

| `kind` | Contents | Secrets? |
| ------ | -------- | -------- |
| `public-invite` | Host public bundle | Public keys only |
| `peer-handshake` | Peer identity/ephemeral public + session-open ciphertext | No private keys |
| `result` | Double Ratchet ciphertext + share/compare flags; peer may embed handshake | Ciphertext only |

Legacy v1 packages that embed `sealKey` are rejected by the v3 parser and by the
optional relay refuse-list.

### 4. Supabase sees ciphertext only (optional relay)

Migration `038_quiz_e2e_ciphertext_relay.sql`:

- Table `quiz_e2e_relay` stores **opaque `ciphertext` text** + claim code.
- Check constraints refuse payloads containing `sealKey`, `privateKey`,
  `dhsPrivate`, `chainKeySend`, or `rootKey`.
- Clients use `publish_quiz_e2e_relay` / `claim_quiz_e2e_relay` only (no direct
  table grants to `authenticated`).
- One-time claim, 7-day expiry; purge helper for ops.
- **Out-of-band paste remains the primary path** so Expo Go / demo works without
  Docker or auth.

Server never decrypts, never stores quiz weather plaintext, and never treats
relay presence as consent.

### 5. Consent and safety (unchanged product rules)

- Four gates still required for comparison (local share, local compare, partner
  share, partner compare) plus both decrypted results present.
- Share consent fails closed without an encrypted package and local plaintext.
- Withdraw share clears local plaintext + cipher package.
- Comparison copy still states weather is never consent to touch or a Consent
  Snapshot substitute.
- Peer consent flags in packages remain **package-asserted** (OOB trust), not
  server-attested dual opt-in.

### 6. Simple user path

1. Host: **Create encrypted invite** → **Show package** (public keys).
2. Partner: **Import** → take quiz → **Share** + **Compare** → **Show package**.
3. Host: **Import** (handshake+result) → **Share** + **Compare** → optional
   return package.
4. Either: **Open comparison** when all gates pass.

Optional: publish claim code (ciphertext relay) instead of long paste when
signed in.

## Alternatives considered

- **Keep XOR seal with sealKey in package:** rejected for partner privacy goal.
- **Full libsignal / multi-device Signal Protocol:** deferred; oversized for quiz
  packages and Expo footprint.
- **Server-side comparison after mutual consent:** rejected; central readable
  weather surface and weakens privacy.
- **Host-first share without peer handshake:** rejected; Double Ratchet Bob
  needs a first receive (session-open) before a send chain exists.
- **iCloud-synchronizable keys:** rejected (same class as ADR 0011).

## Consequences

### Benefits

- Supabase (and any intermediary) can only store/relay opaque ciphertext.
- Packages no longer carry a reusable seal key.
- Unit-tested X3DH agreement, bidirectional ratchet, AAD fail-closed, host-after-
  session-open path, and consent gates.
- UX stays few steps with clear fail-closed messages.

### Costs and risks

- Not a full Signal audit surface; sequential messages only (quiz has few msgs).
- Device loss / reinstall loses identity keys and open ratchets (fail closed).
- Peer consent flags still package-asserted.
- Optional relay requires auth; claim codes are not encryption secrets.
- Legacy v1 invites discarded on load (storage key `litmo.quizzes.invites.v2`).
- Secure Enclave wrap depends on native LitmoPasskeys; simulator/Expo Go may
  fall back to Secure Store–only private key bytes.

### Follow-up work

- Independent crypto review before external beta.
- Optional one-time prekeys and skipped-message key store if multi-message abuse
  becomes relevant.
- Account deletion must clear local ratchets/invites and expired relay rows.
- Do not wire quiz weather into discovery, trust, or Consent Snapshot without a
  new ADR.

## Related documents

- ADR 0050 — Quizzes section and partner consent
- ADR 0051 — Optional owner-only quiz result backup
- ADR 0011 — Device-bound sensitive encryption
- `app/services/doubleRatchetCore.ts`
- `app/services/quizE2eIdentity.ts`
- `app/services/quizE2eSession.ts`
- `app/services/quizE2eRelay.ts`
- `supabase/migrations/038_quiz_e2e_ciphertext_relay.sql`
