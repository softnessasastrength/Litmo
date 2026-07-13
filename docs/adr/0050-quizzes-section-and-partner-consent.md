# ADR 0050: Quizzes section and partner comparison consent

- **Status:** Accepted
- **Date:** 2026-07-13
- **Decision owners:** Founder and engineering

## Context

Litmo needs a dedicated Quizzes surface for self-understanding, including short
and deep Vibe paths, without turning quizzes into consent, diagnosis, or public
scores. Partner sharing requires explicit mutual consent before comparison and
must stay privacy-preserving.

## Decision

1. Add a **Quizzes** tab cataloging Vibe short/deep and additional self quizzes.
2. Keep all results device-local; step-up Face ID via `SensitiveAccessGate` for
   private result and share screens on real accounts.
3. Partner invites store seal keys in Secure Store; results are sealed with the
   invite seal before any package leaves the host’s consent flow.
4. Comparison requires **four consents**: host share, host compare, peer share,
   peer compare. Missing any consent fails closed.
5. Comparison copy always reminds that shared weather is never consent to touch
   and never replaces a Consent Snapshot.

## Alternatives considered

- **Server-mediated comparison without dual consent:** rejected.
- **Automatic share on quiz complete:** rejected.
- **Treating quiz similarity as compatibility/consent:** rejected by constitution.

## Consequences

- Users can explore self-understanding calmly and optionally invite a partner.
- Crypto is a lightweight seal for out-of-band packages, not a substitute for
  full production E2E product review before external beta.
