# Task Ledger

Allowed statuses: `pending`, `active`, `blocked`, `completed`, `abandoned`.

Only one implementation task should normally be `active`. Every status change must include a short note and verification evidence where applicable.

## Active

None. BETA-001 is complete; no other task is currently in the `active` state.

## Pending

### ACCESS-001 — Physical-device accessibility review

- **Status:** pending
- **Owner:** founder plus current coding agent
- **Depends on:** BETA-001 (complete)
- **Goal:** Validate VoiceOver, Dynamic Type, reduced motion, focus order, contrast, large touch targets, and non-color-only meaning.
- **Acceptance criteria:** screen-by-screen findings; severity; reproducible steps; fixes and regression tests for material failures.
- **Notes:** BETA-001 Track C covered engineering-level accessibility criteria (Pass); the optional founder VoiceOver smoke (`docs/ACCESSIBILITY_TRACK_C.md`) is the only physical-device item still outstanding. **Progress 2026-07-13 (agent):** static-analysis-only audit of screens Track C didn't cover, fixing a VoiceOver bug in `boundaries.tsx` (radiogroup collapsed under a stray `accessible` prop) and a dark-mode contrast bug across auth/profile screens; see PR #61. Two items explicitly deferred as needing a product decision, not fixed in that PR: moderation-queue filter buttons lack `accessibilityState` for the active filter; Settings toggles use plain buttons instead of switch semantics.

### SAFETY-OPS-001 — Moderation and beta-operations design

- **Status:** pending
- **Owner:** founder plus safety/product reviewer
- **Goal:** Define reporting, blocking, invitation expiry, eligibility, human review, escalation, retention, and beta kill-switch behavior before broader discovery.
- **Acceptance criteria:** product specification; threat/abuse cases; data handling; operational roles; unresolved legal and clinical boundaries clearly identified.
- **Progress 2026-07-13 (agent):** drafted `docs/SAFETY_OPS_DESIGN.md` — a ground-truth inventory of what Chapter 5 already built (blocking, reports, moderation queue, restrictions, appeals, rate limits, trust events, age gate) plus proposals for the still-unbuilt pieces (invite codes, retention/deletion/export framed around GDPR-style data-rights principles as design philosophy, beta kill-switch, escalation ladder). Explicitly a draft: does not authorize Chapter 6 implementation, does not constitute legal review, and flags several open questions (retention windows, jurisdiction exclusions, who staffs escalation beyond the founder) that only the founder/legal review can resolve. Still **pending** — this task isn't done until that review happens.

### DOCS-002 — Keep documentation synchronized

- **Status:** pending
- **Owner:** every contributor and coding agent
- **Goal:** Treat documentation as part of each implementation unit.
- **Acceptance criteria:** update current state, task ledger, changelog, known limitations, architecture, ADRs, and release docs whenever behavior changes.

## Blocked

None recorded. External credentials, signing, App Store configuration, or policy review may block specific tasks and must be documented when encountered.

## Completed

### LEARN-003 — Blocking, reporting, and trust-signal learning modules

- **Status:** completed
- **Result:** Two new content-only modules — `blocking-and-reporting` (block is immediate/unilateral/non-disclosing; reporting starts private human review; restrictions are always human-decided with human-reviewed appeal, never automatic) and `trust-signals` (peer-visible facts are not a score; a fuller self-only view exists; history informs but never substitutes for a current Consent Snapshot). Teaches real, already-shipped Chapter 5 behavior — no new product surface. Addresses `docs/LEARNING_SYSTEM.md`'s documented future-work items "privacy" and "the Trust Ledger."
- **Verification:** `npm run lint` / `typecheck` pass; `npm test` pass (147/147, no learning-module tests needed changes — progress tracking is keyed generically by module id).

### BETA-001 — Integrated physical-iPhone validation

- **Status:** completed
- **Result:** Track A (founder demo) Pass; Track C (engineering accessibility) Pass; Track B automated backend Pass (Docker + setup + all four seed password grants + integration 5/5 + pgTAP 240/240; seed GoTrue NULL-token bug fixed) plus **Track B physical B1–B26 Pass** on device(s) with two seed accounts (founder, 2026-07-13). No Fail items recorded. See `docs/PHYSICAL_BETA_WALKTHROUGH_RESULTS.md`.
- **Next:** Optional founder VoiceOver smoke (`docs/ACCESSIBILITY_TRACK_C.md`, tracked under ACCESS-001). External TestFlight/private-alpha distribution remains a separate, explicitly gated decision — not authorized by this pass.

### HAPTIC-001 — Semantic haptic language foundation

- **Status:** completed
- **Result:** `hapticService` + `expo-haptics` adapter; five events; Settings toggle; learning / Soft Signal / Consent Snapshot integrations; unit tests. Physical feel validation deferred to BETA-001. ADR 0039.

### LEARN-002 — Full fictional guided-practice session

- **Status:** completed
- **Result:** Module `full-session-practice` — fictional River/Sam lifecycle with scenarios; private progress via existing player; not a real-session gate or safety certificate.

### RESUME-001 — Model-portable resumable development workflow

- **Status:** completed
- **Result:** durable handoff, task ledger, decision ledger, machine-readable state, validator, CI workflow, and stop/resume procedures merged.

### FOUNDATION-001 — Chapters 1–4 application foundation

- **Status:** completed
- **Result:** playable mobile flow, persistence, consent engine, session lifecycle, requests, snapshots, realtime behavior, private wrap-ups, withdrawal, and emergency stop merged at foundation level.

### AUTH-001 — Secure authentication and local protection foundation

- **Status:** completed
- **Result:** passkey-first architecture, device registration, biometric locking, secure storage boundaries, and deployment documentation merged.

### LEARN-001 — Guided learning vertical slice

- **Status:** completed
- **Result:** Learn tab, three initial modules, lesson player, fictional scenarios, private local progress, resume behavior, tests, and educational documentation merged.

### WIKI-001 — Publish-ready GitHub Wiki source

- **Status:** completed
- **Result:** navigable wiki source and publishing instructions merged under `wiki/`.

## Abandoned

None.

## Task template

```md
### ID — Concise title

- **Status:** pending | active | blocked | completed | abandoned
- **Owner:** person or agent
- **Goal:** one clear outcome
- **Depends on:** task IDs or `none`
- **Acceptance criteria:** observable definition of done
- **Verification:** commands and exact results
- **Notes:** constraints, risks, or handoff details
- **Next action:** exact next step
```
