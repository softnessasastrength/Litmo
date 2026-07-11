# Litmo Codex Execution Guide

Litmo is a consent-centered, trauma-informed platform for safe, non-sexual, platonic physical connection between consenting adults.

> Touch is not a transaction — it is a language.

## Current assignment

Implement **Chapter 2: Production-Grade Foundation** from:

`docs/roadmap/CHAPTER_2_FOUNDATION.md`

Read these files before changing code:

1. `README.md`
2. `docs/CONCEPT.md`
3. `docs/CONSENT_FLOW.md`
4. `docs/TRUST_SYSTEM.md`
5. `docs/roadmap/README.md`
6. `docs/roadmap/CHAPTER_2_FOUNDATION.md`

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
5. Tests added
6. Commands run and exact results
7. Known limitations
8. Files materially changed
9. Recommended first task for Chapter 3

If an acceptance criterion remains unfinished, state it plainly instead of silently skipping it.
