# Litmo Codex Execution Guide

**THIS IS A PRIVATE EXORCISM ARTIFACT, NOT A PRODUCT.**

Litmo is the founder’s private **Trauma-to-Code Exorcism Dojo**: a systems-level
externalization of trauma responses around safety, control, touch, consent,
ambiguity, connection, and softness. Primary purpose is visibility and honesty —
not shipping a consumer product. Read `docs/EXORCISM_MANIFESTO.md` and
`docs/DOJO_GUIDELINES.md` before major work. Do not reframe as product-first
without explicit instruction.

> Touch is not a transaction — it is a language.  
> This repo is also a dictionary of control, written to be seen.

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

The active implementation milestone is **SAFETY-OPS-001 — Recommended
private-alpha safety-operations foundation**.

The founder selected the recommended directions in
`docs/SAFETY_OPS_FOUNDER_DECISIONS.md` on 2026-07-13. Read:

- `docs/adr/0042-private-alpha-safety-operations.md`
- `docs/SAFETY_OPS_DESIGN.md`
- `docs/SAFETY_OPS_FOUNDER_DECISIONS.md`
- `TASKS.md`
- `CURRENT_STATE.md`
- `project-state.json`

Implement engineering-safe, fail-closed foundations autonomously. Do not invent
or claim legal, privacy, clinical, or safeguarding approval. Destructive
retention, complete account deletion, jurisdiction policy, external referral,
named backup staffing, and two-person permanent-ban approval remain blocked
until the repository contains real qualified-review evidence or named human
owners.

BETA-001 remains complete. ACCESS-001's optional physical VoiceOver smoke
remains pending and does not block documentation/database work.

The phone-visible demo remains available through Expo Go without Docker or
`.env`. Face ID remains mandatory only for real account sessions.

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

### In-code comments — maximum intentionality (standing order)

Follow `docs/CODE_COMMENT_STANDARD.md` on **every** new or modified line of product code.

- Every function ships with WHAT / WHY / CONSENT / EDGE CASES / NEVER (and SEE when linked).
- Every safety-relevant branch explains fail-closed reasoning inline.
- Consent, Soft Signal, age, auth, boundaries, and encryption code use the strictest bar.
- No “obvious” free pass on consent surfaces. Hand-waving is a defect.
- Bring touched files up to the comment standard in the same workstream.

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
