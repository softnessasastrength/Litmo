# Litmo implementation roadmap

This roadmap turns the original proof of concept into a sequence of independently reviewable engineering chapters. Every chapter must leave the repository working, documented, and ready for the next chapter.

## Product invariants

- Litmo serves consenting adults seeking non-sexual, platonic physical connection.
- Consent is explicit, session-specific, mutual, and revocable at any moment.
- Compatibility is informational and never proof that another person is safe.
- Missing or conflicting consent data resolves to the more restrictive outcome.
- Stopping must remain immediate and must not require an explanation.
- Sensitive consent information is private by default.
- Safety-sensitive decisions require human review rather than automatic public punishment.

## Chapters

### Chapter 1 — Proof of concept

Status: existing repository.

The current vertical slice demonstrates Touch Language onboarding, body-zone preferences, conservative matching, session requests, immutable Consent Snapshots, an active session timer, Soft Signal, wrap-up, and a private Trust Ledger.

### Chapter 2 — Production-grade foundation

Status: current assignment.

Make authentication, persistence, validation, local development, database security, testing, CI, accessibility states, and documentation dependable.

See `CHAPTER_2_FOUNDATION.md`.

### Chapter 3 — Consent engine

Build a versioned, explainable compatibility and consent system that distinguishes what a user welcomes from what they can offer.

See `CHAPTER_3_CONSENT_ENGINE.md`.

### Chapter 4 — Session lifecycle

Implement the complete request-to-wrap-up state machine with realtime synchronization, expiration, connectivity recovery, Soft Signal, and auditability.

See `CHAPTER_4_SESSION_LIFECYCLE.md`.

### Chapter 5 — Trust and moderation

Replace simplistic universal safety scoring with specific trust signals, append-only records, reporting, blocking, human review, and appeals.

See `CHAPTER_5_TRUST_AND_MODERATION.md`.

### Chapter 6 — Private alpha

Add invite-only access, adult eligibility controls, coarse discovery, safety onboarding, trusted-contact check-ins, privacy controls, observability, and distribution readiness.

See `CHAPTER_6_PRIVATE_ALPHA.md`.

## Chapter gate

Do not begin implementing a later chapter until the current chapter's acceptance criteria pass and its completion report exists. Later chapter documents may be refined when implementation reveals architectural constraints, but product invariants may not be weakened for convenience.
