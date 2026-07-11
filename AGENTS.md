# Litmo Codex Execution Guide

Litmo is a consent-centered, trauma-informed platform for safe, non-sexual, platonic physical connection between consenting adults.

> Touch is not a transaction — it is a language.

## Immediate priority

Before disappearing into deep backend work, produce and preserve a **phone-visible vertical slice** that can be launched on a physical iPhone through Expo Go or an iOS development build.

Read and execute:

`docs/roadmap/PHONE_VISIBLE_VERTICAL_SLICE.md`

The visible demo path must include:

1. Launch screen
2. Sign-in or demo-entry screen
3. Touch Language onboarding
4. Body-zone and boundary setup
5. Discovery with safe seeded examples
6. Session request flow
7. Consent Snapshot confirmation
8. Active session timer
9. Soft Signal exit
10. Session wrap-up
11. Private trust history

Do not block the visible mobile experience on unfinished infrastructure when safe demo data or a clearly isolated demo adapter can support the path.

## Current chapter assignment

Continue implementing **Chapter 2: Production-Grade Foundation** from:

`docs/roadmap/CHAPTER_2_FOUNDATION.md`

The phone-visible vertical slice is the first user-facing milestone inside Chapter 2. It does not cancel the chapter's security, persistence, testing, or CI requirements.

Read these files before changing code:

1. `README.md`
2. `docs/CONCEPT.md`
3. `docs/CONSENT_FLOW.md`
4. `docs/TRUST_SYSTEM.md`
5. `docs/DOCUMENTATION_STANDARD.md`
6. `docs/roadmap/README.md`
7. `docs/roadmap/PHONE_VISIBLE_VERTICAL_SLICE.md`
8. `docs/roadmap/CHAPTER_2_FOUNDATION.md`

## Autonomy rules

- Work autonomously until the assigned milestone is complete or a genuine external blocker is reached.
- Do not pause for routine implementation decisions.
- Make reasonable, conservative choices, document them, and continue.
- Batch non-urgent questions in the completion report instead of interrupting after each step.
- Ask for approval only when required by the execution environment or before an irreversible/high-risk action.
- Never invent credentials, production secrets, legal conclusions, or claims of successful testing.

## Execution rules

- Inspect and run the repository before editing it.
- Record the initial state in `docs/CHAPTER_2_BASELINE.md`.
- Work in small, coherent commits.
- Keep the repository usable after every commit.
- Do not claim a command passed unless it was actually run.
- Do not weaken tests to make CI green.
- Never commit secrets, service-role keys, JWT secrets, or real user data.
- Never log sensitive consent data or private nervous-system notes.
- Treat safety logic as product logic, not decorative copy.
- Preserve explicit, session-specific, revocable consent.
- A match, profile, prior session, or trust signal never constitutes consent.
- Do not present compatibility or trust data as proof that a person is safe.
- Prefer conservative behavior whenever consent data is missing, stale, contradictory, or unavailable.
- No dead-end screens, blank failure states, or unexplained placeholder text in the demo path.
- Preserve accessibility basics: labels, focus order, large touch targets, dynamic text support, reduced motion, and non-color-only meaning.

## Documentation is part of the implementation

Follow `docs/DOCUMENTATION_STANDARD.md` strictly.

Documentation is not optional cleanup. Every meaningful code change must update the relevant documentation in the same workstream.

At minimum:

- Never knowingly leave documentation stale.
- Never add an environment variable without documenting it.
- Never add a command without documenting exactly how and when to run it.
- Never add a database table without documenting purpose, ownership, sensitivity, and deletion behavior.
- Never add a user-facing flow without documenting states, transitions, failure modes, and recovery behavior.
- Never add a safety-sensitive feature without documenting abuse cases, limits, and unresolved risks.
- Never leave an unexplained TODO. Every TODO must include context, intended outcome, and release impact.
- Keep examples copy-pasteable and clean-clone setup reproducible.
- Create an ADR in `docs/adr/` for substantial architecture, data, safety, or product decisions.
- Update `docs/CHANGELOG.md` and `docs/KNOWN_LIMITATIONS.md` continuously.

## Scope gate

Complete Chapter 2 and make all required checks pass before implementing Chapters 3–6.

You may create planning notes for later chapters, but do not implement their features during Chapter 2 unless a minimal interface is necessary to avoid rework. Document any such interface and keep it inert.

Do not add during Chapter 2:

- Payments
- Blockchain or token systems
- Wearable integration
- Precise live location
- Production identity verification
- Public safety scores
- Engagement-maximizing recommendation systems
- Unrelated visual redesigns

## Required completion report

Create `docs/CHAPTER_2_COMPLETION.md` containing:

1. Initial repository condition
2. Material changes
3. Architecture decisions
4. Security decisions
5. Product and safety decisions
6. Tests added
7. Commands run and exact results
8. Passing checks
9. Failing or skipped checks and why
10. Known limitations
11. Data-handling implications
12. Exact iPhone launch instructions
13. Files materially changed
14. Remaining blockers
15. Recommended first task for Chapter 3

If an acceptance criterion remains unfinished, state it plainly instead of silently skipping it.