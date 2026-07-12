# Task Ledger

Allowed statuses: `pending`, `active`, `blocked`, `completed`, `abandoned`.

Only one implementation task should normally be `active`. Every status change must include a short note and verification evidence where applicable.

## Active

### HAPTIC-001 — Semantic haptic language foundation

- **Status:** active
- **Owner:** current coding agent
- **Goal:** Implement a restrained, accessible, user-controlled semantic haptic vocabulary for guided learning, Soft Signal acknowledgement, and emergency-stop acknowledgement.
- **Depends on:** LEARN-001, FOUNDATION-001
- **Specification:** `docs/roadmap/HAPTIC_LANGUAGE_IMPLEMENTATION.md`
- **Acceptance criteria:** one semantic service; five documented events; local preference; no direct platform haptic calls outside the adapter; learning integration; safety actions independent of playback; unit/integration coverage; synchronized documentation; physical-device validation documented or explicitly deferred to BETA-001.
- **Verification:** pending implementation. Record exact commands and results; never claim physical haptic validation from simulator-only testing.
- **Notes:** Haptics supplement visible and spoken meaning. They never represent remote consent, trust, safety, or another person’s presence. Do not add custom Core Haptics waveforms in the first slice unless the documented Expo-compatible path is insufficient.
- **Next action:** read `AGENTS.md` and `docs/roadmap/HAPTIC_LANGUAGE_IMPLEMENTATION.md`, inspect current dependencies and preference patterns, then implement the semantic service as the first coherent commit.

## Pending

### BETA-001 — Integrated physical-iPhone validation

- **Status:** pending
- **Owner:** founder plus current coding agent
- **Goal:** Verify the integrated `main` experience on a physical iPhone from entry through learning, consent, session, stop, and wrap-up.
- **Specification:** `docs/PHYSICAL_BETA_WALKTHROUGH.md` (Tracks A demo, B real two-account, C accessibility)
- **Acceptance criteria:** documented test script (done); exact build/install method; passkey and Face ID behavior; privacy-safe backgrounding; session request; **real** Consent Snapshot (ADR 0036); realtime transition; Soft Signal; wrap-up; Chapter 5 safety smoke; failures recorded without euphemism.
- **Next action:** execute the walkthrough on device; fill the result columns and environment matrix; open fix PRs only when Fail items need code changes.

### ACCESS-001 — Physical-device accessibility review

- **Status:** pending
- **Owner:** founder plus current coding agent
- **Depends on:** BETA-001
- **Goal:** Validate VoiceOver, Dynamic Type, reduced motion, focus order, contrast, large touch targets, and non-color-only meaning.
- **Acceptance criteria:** screen-by-screen findings; severity; reproducible steps; fixes and regression tests for material failures.

### SAFETY-OPS-001 — Moderation and beta-operations design

- **Status:** pending
- **Owner:** founder plus safety/product reviewer
- **Goal:** Define reporting, blocking, invitation expiry, eligibility, human review, escalation, retention, and beta kill-switch behavior before broader discovery.
- **Acceptance criteria:** product specification; threat/abuse cases; data handling; operational roles; unresolved legal and clinical boundaries clearly identified.

### DOCS-002 — Keep documentation synchronized

- **Status:** pending
- **Owner:** every contributor and coding agent
- **Goal:** Treat documentation as part of each implementation unit.
- **Acceptance criteria:** update current state, task ledger, changelog, known limitations, architecture, ADRs, and release docs whenever behavior changes.

## Blocked

None recorded. External credentials, signing, App Store configuration, or policy review may block specific tasks and must be documented when encountered.

## Completed

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
