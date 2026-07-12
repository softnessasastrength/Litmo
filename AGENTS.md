# Litmo Codex Execution Guide

Litmo is a consent-centered, trauma-informed platform for safe, non-sexual, platonic physical connection between consenting adults.

> Touch is not a transaction — it is a language.

## Durable-agent rule

This repository must remain usable by a competent human developer or any capable coding agent without access to private conversations, the founder's memory, OpenAI, Codex, or ChatGPT.

Read `docs/CONTINUITY_AND_STEWARDSHIP.md` before making material architectural or governance changes.

The repository is the source of truth. Do not rely on undocumented chat context.

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

Chapter 3 (Consent Engine) is complete; see `docs/CHAPTER_3_COMPLETION.md`. Promoted by explicit human instruction to:

Implement **Chapter 4: Session Lifecycle** from:

`docs/roadmap/CHAPTER_4_SESSION_LIFECYCLE.md`

The human directing this work has stated their concrete near-term goal is a build they can run on their own physical iPhone via Expo Go. **Demo path status (2026-07-12):** backend-free demo mode exists (`docs/adr/0003-demo-mode-entry-point.md`); Face ID is required only for real account sessions (ADR 0007 amendment), so Expo Go can walk the fictional path without Docker or `.env`. Documented in `docs/LOCAL_DEVELOPMENT.md`. Chapter 4 session-lifecycle work continues for remaining gaps (blocking policy, later pre-activation expiry, new-request Realtime)—not for re-opening the demo entry path.

Read these files before changing code:

1. `README.md`
2. `docs/CONCEPT.md`
3. `docs/CONTINUITY_AND_STEWARDSHIP.md`
4. `docs/CONSENT_FLOW.md`
5. `docs/TRUST_SYSTEM.md`
6. `docs/DOCUMENTATION_STANDARD.md`
7. `docs/roadmap/README.md`
8. `docs/roadmap/PHONE_VISIBLE_VERTICAL_SLICE.md`
9. `docs/roadmap/CHAPTER_4_SESSION_LIFECYCLE.md`
10. `docs/CHAPTER_3_COMPLETION.md`
11. `docs/CHAPTER_4_NEXT_STEPS.md` — exact next deliverable and how to resume mid-chapter

## What “continue” means

When instructed to “continue,” “continue the plan,” or equivalent:

1. Read this file and the current chapter specification.
2. Inspect the git status and recent commits.
3. Read the current chapter baseline, completion report, changelog, known limitations, and relevant ADRs if they exist.
4. Identify the next unmet acceptance criterion in the current milestone.
5. Implement the largest safe, coherent unit of work that advances that criterion.
6. Update tests and documentation in the same workstream.
7. Run the relevant checks.
8. Commit the coherent change.
9. Continue to the next unmet criterion without asking routine questions.
10. Stop only when the current milestone is complete or a genuine external blocker is documented.

Do not skip ahead merely because a later chapter appears more interesting.

## Chapter promotion rule

Only the chapter explicitly named under **Current chapter assignment** is active.

Future roadmap documents preserve intent but are not implementation authorization. Chapters 7–13 are currently planning-only and are described in `docs/roadmap/CHAPTERS_7_TO_13_PLATFORM_FUTURE.md`.

When a chapter is complete:

- Finish its completion report.
- Confirm each acceptance criterion as passed, explicitly deferred by a documented human decision, or blocked with evidence.
- Update `docs/CHANGELOG.md`, `docs/KNOWN_LIMITATIONS.md`, and relevant ADRs.
- Do not promote the next chapter yourself unless a human explicitly asks you to update the active assignment.
- Recommend the exact next chapter and first task in the completion report.

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
- A match, profile, prior session, verification state, or trust signal never constitutes consent.
- Do not present compatibility, verification, or trust data as proof that a person is safe.
- Prefer conservative behavior whenever consent data is missing, stale, contradictory, or unavailable.
- No dead-end screens, blank failure states, or unexplained placeholder text in the demo path.
- Preserve accessibility basics: labels, focus order, large touch targets, dynamic text support, reduced motion, and non-color-only meaning.
- Platform clients must share canonical domain and consent semantics rather than reinterpreting them independently.

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
- Create an ADR in `docs/adr/` for substantial architecture, data, safety, product, platform, governance, or vendor decisions.
- Update `docs/CHANGELOG.md` and `docs/KNOWN_LIMITATIONS.md` continuously.
- No critical project intent may exist only in a model prompt or private conversation.

## Scope gate

Complete Chapter 3 and make all required checks pass before implementing later chapters. Chapter 2's Docker-backed verification gaps remain recorded in `docs/CHAPTER_2_COMPLETION.md`.

You may refine future planning documents, but do not implement later chapter features unless a minimal inert interface is necessary to avoid rework. Document the interface and why it exists.

Do not add during Chapter 2:

- Payments
- Blockchain or token systems
- Wearable integration
- Precise live location
- Production identity verification
- Public safety scores
- Engagement-maximizing recommendation systems
- Desktop clients
- Public APIs or third-party integrations
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
