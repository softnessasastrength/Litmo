# Litmo Codex Execution Guide

**This is currently a personal emotional containment system, not a public product.**

Litmo is the founder’s **private psychological containment system / emotional
shield**: fear of intimacy, terror of conflict, shame around conflict, and
new-relationship anxiety are poured into code so they are less likely to dump
onto Renn. The human is on **Option A** (keep building) by conscious choice.

Read first:

1. `CLAUDE_CONSTITUTION.md` — the ethical/relational posture toward the founder; read this before anything else
2. `docs/REAL_PURPOSE.md`  
3. `docs/CONTAINMENT_SYSTEM.md`  
4. `CURRENT_STATE.md`  

Before building anything genuinely new (not a bugfix or doc update), run
`docs/PILLAR_FIT_CHECK.md`'s five questions first.

Older dojo/exorcism docs are secondary layers. Do not reframe as a public
product without explicit instruction. Fun and intellectual craft are welcome;
lying about purpose is not.

> Touch is not a transaction — it is a language.  
> This repo is also a very elaborate shield.

## Durable-agent rule

This repository must remain usable by a competent human developer or any capable coding agent without access to private conversations, the founder's memory, OpenAI, Codex, or ChatGPT.

Read `docs/CONTINUITY_AND_STEWARDSHIP.md` before making material architectural or governance changes.

The repository is the source of truth. Do not rely on undocumented chat context.

## Immediate priority (containment honesty)

1. Keep purpose honest (`REAL_PURPOSE`, `CONTAINMENT_SYSTEM`).
2. Name containment jobs when adding systems — do not invent product launch work by default.
3. Soft Signal and fail-closed consent craft remain load-bearing integrity, not App Store goals.
4. Phone-visible demo may exist as **local simulation**; it is not “users.”

Product-era chapter **SAFETY-OPS-001** is **residue** unless the human explicitly resumes product work. External legal/staffing blockers stay non-inventable.

If the human asks for product engineering again, resume residual technical docs under containment honesty — still not market theater.

## 16-agent dual-mode mode

When the human says **“16 agent mode”**, **“16 agent autism mode”**, or equivalent:

1. Read `docs/16_AGENT_MODE.md` (operator index).  
2. Read gap board in `docs/DUAL_MODE_16_AGENT_SWARM.md` §9.  
3. Prefer open gaps only; Soft Signal freeness never reduced.  
4. Update `docs/16_AGENT_AUTISM_MODE_RUN.md` when work lands.  
5. Run `npm run parity:features` if flags/Swift change.

## What “continue” means

When instructed to “continue,” “continue the plan,” or equivalent:

**Primary purpose:** [`docs/REAL_PURPOSE.md`](docs/REAL_PURPOSE.md).  
**System map:** [`docs/CONTAINMENT_SYSTEM.md`](docs/CONTAINMENT_SYSTEM.md).  
**Secondary continue protocol:** [`docs/DOJO_CONTINUE.md`](docs/DOJO_CONTINUE.md) (older layer).

1. Read `docs/REAL_PURPOSE.md` and `docs/CONTAINMENT_SYSTEM.md`.
2. Read this file and `CURRENT_STATE.md` (purpose first).
3. Inspect git status and recent commits.
4. Prefer **honest naming / containment craft / simplifying** over product milestones.
5. Do **not** default to SAFETY-OPS staffing, App Store, or growth work unless the human explicitly asked for product residue.
6. Implement the largest safe coherent unit that serves the stated purpose (docs count).
7. Update `CONTAINMENT_SYSTEM.md` / `TRAUMA_ARCHITECTURE.md` when systems are named or reframed.
8. Run relevant checks if code changed.
9. Commit with honest messages (not fake “user value”).
10. Stop when the unit is coherent or a real blocker is documented.

Do not invent nuclear engines to look productive. Naming a fear is progress.

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
