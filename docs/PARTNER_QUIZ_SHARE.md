# Partner Invite + Shared Quiz Comparison

## Intent

Two consenting adults may optionally share **encrypted social weather** from a
shareable quiz and compare notes — only after **explicit mutual consent**.

This flow is **safe, empowering, and easy**:

- You choose every step; nothing auto-opens.
- Dual yes: **share** and **compare** (four gates when both people are counted).
- End-to-end encryption (Signal-inspired X3DH + Double Ratchet).
- Weather is **never** consent to touch, a safety score, or a Consent Snapshot.

## User path (host)

1. **Create encrypted invite** — public keys only in the package.
2. **Send package privately** (copy/paste) or demo: practice with fictional peer.
3. **Take the quiz** if needed → **Consent to share** (encrypts on device).
4. **Consent to compare** (separate toggle).
5. **Import their package** when they reply.
6. **Open comparison** only when all four consents + both results are present.

## User path (peer)

1. **Paste / import** host public invite.
2. Take the same quiz → share → compare.
3. Send encrypted package back (may embed handshake).
4. Open comparison when both sides are ready.

## Consent model (fail closed)

| Gate | Meaning |
| ---- | ------- |
| Local share | You encrypt and attach *your* result |
| Local compare | You allow a joint view *if they do too* |
| Partner share | Their package includes share consent + decryptable result |
| Partner compare | Their package includes compare consent |

Missing any gate → comparison stays closed. Withdraw share clears your
ciphertext and plaintext for that invite.

## Encryption (ADR 0052)

- **X3DH** key agreement + **Double Ratchet** message keys (AES-256-GCM).
- Private keys on device (Secure Store + optional CryptoKit vault wrap).
- Packages: public keys + ciphertext only (no seal keys).
- Optional Supabase relay: opaque ciphertext claim codes only.
- Focused product path — not a full multi-device Signal client audit.

## Product surfaces

- `app/app/quizzes/share.tsx` — guided next-step UI
- `quizInviteStore` / `quizE2eSession` / `quizShareCore`
- Demo: `practiceWithFictionalPartner` (real crypto, fictional weather)
- Face ID step-up on share screen for real accounts (`SensitiveAccessGate`)

## Related

- ADR 0050 — Quizzes section and partner consent
- ADR 0052 — Partner E2E Double Ratchet
- `docs/NEURODIVERGENT_MODE.md` — calm/plain language aids
