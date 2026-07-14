# Litmo Roadmap

This file is a concise status map. Detailed chapter specifications remain under `docs/roadmap/`; current execution state lives in `CURRENT_STATE.md` and `TASKS.md`.

## Chapter 1 — First playable front-end

Status: **implemented at foundation level**

- [x] Welcome and local navigation
- [x] Deterministic Vibe Quiz with accessible progress
- [x] Provisional archetype result and Vibe Profile card
- [x] Touch Language setup
- [x] Synthetic Discover profiles and match detail
- [x] Explicit mock Consent Snapshot
- [x] Simulated timer and prominent Soft Signal
- [x] Private wrap-up and synthetic Trust Ledger
- [x] Shared visual system, reduced-motion support, and non-color status language
- [x] Expo-compatible setup and native iOS development-build path
- [x] Full founder acceptance pass on the latest integrated physical-iPhone build (BETA-001, 2026-07-13)

## Chapter 2 — Production-grade foundation

Status: **implemented at foundation level; environment-specific verification remains documented**

The Chapter 2 scope and acceptance criteria are maintained in [`docs/roadmap/CHAPTER_2_FOUNDATION.md`](docs/roadmap/CHAPTER_2_FOUNDATION.md). See [`docs/CHAPTER_2_COMPLETION.md`](docs/CHAPTER_2_COMPLETION.md) for completed work and verification limits.

## Chapter 3 — Consent Engine

Status: **implemented**

- [x] Canonical consent compatibility engine
- [x] Strictest-compatible-boundary semantics
- [x] Property-based safety tests
- [x] Immutable profile-version adapter
- [x] Canonical backend compatibility route
- [x] Mobile Consent Snapshot integration

See [`docs/CHAPTER_3_COMPLETION.md`](docs/CHAPTER_3_COMPLETION.md).

## Chapter 4 — Session Lifecycle

Status: **implemented at private-beta foundation level**

- [x] Database-enforced session state machine
- [x] Immutable Consent Snapshot persistence and invalidation
- [x] Session requests and recipient authorization
- [x] Realtime session updates and authoritative start time
- [x] Private wrap-ups and offline retry
- [x] Unilateral withdrawal and emergency stop
- [x] Passkey-first authentication architecture and device registration
- [x] Mandatory biometric app lock
- [x] Sensitive-data protection and privacy-safe notifications
- [x] Release/TestFlight boundaries and supporting ADRs

Known gaps and follow-up decisions are maintained in [`docs/CHAPTER_4_NEXT_STEPS.md`](docs/CHAPTER_4_NEXT_STEPS.md), [`docs/KNOWN_LIMITATIONS.md`](docs/KNOWN_LIMITATIONS.md), and the relevant ADRs.

## Guided Learning — First vertical slice

Status: **implemented**

- [x] Learn tab and module catalog
- [x] Consent Snapshots module
- [x] Soft Signal module
- [x] Touch Language module
- [x] One-step lesson player
- [x] Fictional scenario feedback
- [x] Private device-local progress and resume behavior
- [x] Deterministic progress tests
- [x] Full fictional two-person practice session (LEARN-002)
- [x] Blocking, reporting, and trust-signal literacy modules (LEARN-003)
- [ ] Physical-device accessibility validation
- [ ] Product decision on first-session learning gates

See [`docs/LEARNING_SYSTEM.md`](docs/LEARNING_SYSTEM.md).

## Current private-beta priorities

**Reality check:** "private-beta" here is aspirational design work, not an active program — there are no invited beta testers today, only the founder.

1. ~~Integrated physical-iPhone validation of the latest `main`.~~ Complete (BETA-001, 2026-07-13).
2. Optional founder VoiceOver smoke; broader Dynamic Type, reduced-motion, focus-order, and touch-target review.
3. ~~Full fictional two-person guided-practice flow.~~ Complete (LEARN-002).
4. Moderation, reporting, blocking, eligibility, invitation expiry, human review, and beta kill-switch design (SAFETY-OPS-001, pending).
5. Invite-only beta operations and release evidence.

The prioritized execution ledger is [`TASKS.md`](TASKS.md).

## Explicitly deferred

Do not treat the following as authorized merely because roadmap documents discuss them:

- stranger-scale discovery;
- public safety scores or certifications;
- engagement-maximizing recommendations;
- production AI companion access to user data;
- payments, tokens, or blockchain systems;
- precise live location;
- broad third-party integrations;
- desktop clients without a separately approved milestone.

## Future work

See [`docs/TODO.md`](docs/TODO.md), [`docs/roadmap/README.md`](docs/roadmap/README.md), and [`docs/AI_COMPANION_ROADMAP.md`](docs/AI_COMPANION_ROADMAP.md). Future documents preserve intent; they do not authorize implementation without an explicit active task.
