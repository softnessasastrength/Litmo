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
- Core safety concepts must retain the same meaning on every supported platform.
- The repository, not private conversations or one vendor, is the durable source of project intent.

## Chapters

### Chapter 1 — Proof of concept

Status: existing repository.

The current vertical slice demonstrates Touch Language onboarding, body-zone preferences, conservative matching, session requests, immutable Consent Snapshots, an active session timer, Soft Signal, wrap-up, and a private Trust Ledger.

### Chapter 2 — Production-grade foundation

Status: current assignment.

Make authentication, persistence, validation, local development, database security, testing, CI, accessibility states, and documentation dependable.

The first user-facing milestone is `PHONE_VISIBLE_VERTICAL_SLICE.md`.

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

### Chapter 7 — Identity, eligibility, and verification

Add privacy-conscious adult eligibility and optional verification without treating verification as proof of safety.

### Chapter 8 — Moderation operations and safeguarding

Build the human roles, case handling, evidence, appeals, escalation, transparency, and operational safeguards required for responsible use.

### Chapter 9 — Accessibility, internationalization, and inclusive design

Make Litmo usable across disability, language, culture, device, and sensory needs while preserving precise consent language.

### Chapter 10 — Multi-platform clients and open-source preparation

Create platform-neutral packages and consistent clients for iOS, Android, web, macOS, Windows, and Linux, plus open-source governance and contributor infrastructure.

### Chapter 11 — Public API, SDKs, and ecosystem

Provide versioned APIs, scoped authorization, SDKs, webhooks, sandbox fixtures, and client-conformance requirements.

### Chapter 12 — Release engineering and distribution

Make cross-platform builds reproducible, signed, testable, attributable, distributable, and recoverable.

### Chapter 13 — Production operations, reliability, and continuity

Build observability, incident response, backup and restore, disaster recovery, vendor-exit plans, succession procedures, and responsible service wind-down capabilities.

See `CHAPTERS_7_TO_13_PLATFORM_FUTURE.md` for the detailed future roadmap.

## Continuity

Read `../CONTINUITY_AND_STEWARDSHIP.md`. Litmo must be maintainable without its founder, its original coding assistant, or access to private conversations.

## Chapter gate

Do not begin implementing a later chapter until the current chapter's acceptance criteria pass and its completion report exists. Later chapter documents may be refined when implementation reveals architectural constraints, but product invariants may not be weakened for convenience.

A future chapter becomes active only when `AGENTS.md` explicitly promotes it.
