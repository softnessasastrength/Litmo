# Task Ledger

Allowed statuses: `pending`, `active`, `blocked`, `completed`, `abandoned`.

Only one implementation task should normally be `active`. Every status change must include a short note and verification evidence where applicable.

## Active

### SAFETY-OPS-001 — Moderation and beta-operations design

- **Status:** active
- **Owner:** founder plus safety/product reviewer
- **Goal:** Define reporting, blocking, invitation expiry, eligibility, human review, escalation, retention, and beta kill-switch behavior before broader discovery.
- **Acceptance criteria:** product specification; threat/abuse cases; data handling; operational roles; unresolved legal and clinical boundaries clearly identified.
- **Progress 2026-07-13 (agent):** drafted `docs/SAFETY_OPS_DESIGN.md` — a ground-truth inventory of what Chapter 5 already built (blocking, reports, moderation queue, restrictions, appeals, rate limits, trust events, age gate) plus proposals for the still-unbuilt pieces (invite codes, retention/deletion/export framed around GDPR-style data-rights principles as design philosophy, beta kill-switch, escalation ladder). Explicitly a draft: does not authorize Chapter 6 implementation, does not constitute legal review, and flags several open questions (retention windows, jurisdiction exclusions, who staffs escalation beyond the founder) that only the founder/legal review can resolve. Still **pending** — this task isn't done until that review happens.
- **Decision preparation 2026-07-13:** `docs/SAFETY_OPS_FOUNDER_DECISIONS.md` converts the draft's open questions into ten explicit choices with recommended private-alpha defaults, alternatives, required reviewers, and a completion gate. This is decision preparation only: SAFETY-OPS-001 remains `pending`, and Chapter 6 implementation is not authorized.
- **Implementation progress 2026-07-13:** founder selected the recommended defaults. ADR 0042 and migration 036 implement hashed single-use seven-day staff invitations, membership gates, a scoped matching pause, 90-day minimal unblock tombstones, non-destructive cleanup, and self export, with pgTAP coverage. External-review and named-reviewer items remain blockers, not inferred approvals.
- **Verification:** The foundation and mobile controls are merged through PR #72; Project State, lint, typecheck, unit tests, build, database reset/lint, pgTAP (including private-alpha 17/17), and integration 5/5 passed on the reviewed implementation PRs.
- **Next action:** complete only operational/external-review items that have real named owners. Destructive retention, deletion, jurisdiction policy, external referral, backup staffing, and two-person permanent bans remain blocked.

## Pending

### ACCESS-001 — Physical-device accessibility review

- **Status:** active
- **Owner:** founder plus current coding agent
- **Depends on:** BETA-001 (complete)
- **Goal:** Validate VoiceOver, Dynamic Type, reduced motion, focus order, contrast, large touch targets, and non-color-only meaning.
- **Acceptance criteria:** screen-by-screen findings; severity; reproducible steps; fixes and regression tests for material failures.
- **Notes:** BETA-001 Track C covered engineering-level accessibility criteria (Pass); the optional founder VoiceOver smoke (`docs/ACCESSIBILITY_TRACK_C.md`) is the only physical-device item still outstanding. **Progress 2026-07-13 (agent, PR #61):** static-analysis-only audit of screens Track C didn't cover, fixing a VoiceOver bug in `boundaries.tsx` (radiogroup collapsed under a stray `accessible` prop) and a dark-mode contrast bug across auth/profile screens. **Progress 2026-07-13 (agent):** standardized the remaining deferred semantics fixes: moderation-queue filters now expose selected state, and Settings haptics uses a real switch instead of a button. Physical VoiceOver smoke remains pending.

### DOCS-002 — Keep documentation synchronized

- **Status:** pending
- **Owner:** every contributor and coding agent
- **Goal:** Treat documentation as part of each implementation unit.
- **Acceptance criteria:** update current state, task ledger, changelog, known limitations, architecture, ADRs, and release docs whenever behavior changes.
- **Progress 2026-07-13:** founder selected MPL-2.0. ADR 0044, the canonical `LICENSE`, package metadata, and public license copy record the file-level copyleft decision. Contributor attestation, trademark policy, third-party notice audit, and qualified legal review remain follow-up governance work.
- **Progress 2026-07-13 (quizzes docs):** ADR 0050 strengthened (short/deep, local-first vs partner-local, four consent gates, Face ID, seal posture, hub non-disclosure). Living docs aligned with ADR 0051 optional owner-only backup. `docs/KNOWN_LIMITATIONS.md`, `docs/ARCHITECTURE.md`, `docs/CHANGELOG.md`, `CURRENT_STATE.md`, and `project-state.json` updated.

## Blocked

None recorded. External credentials, signing, App Store configuration, or policy review may block specific tasks and must be documented when encountered.

## Completed

### QUIZ-001 — Quizzes section (short/deep + partner consent)

- **Status:** completed
- **Result:** Quizzes tab with vibe short/deep and four self quizzes; local-first
  results; Face ID step-up on private result/share; partner invites with four
  consent gates and lightweight seal; hard non-authority copy. Optional
  owner-only summary backup added under ADR 0051. ADR 0050.
- **Verification:** unit tests for `quizShareCore` (seal fail-closed, dual
  share+compare, export omission), path/scoring, and repository core tests.
  Full suite and migration 037 pgTAP should be re-run on the implementation PR
  before merge.
- **Boundary:** never consent/safety/matching authority; seal is not production
  E2E; partner path has no server API; own summaries may use owner-RLS backup;
  macOS has no Quizzes surface.
- **Related decision:** ADR 0050, ADR 0051.

### MACOS-004 — macOS session-requests read (read-only)

- **Status:** completed
- **Result:** Requests sidebar loads `list_incoming_requests` and
  `list_outgoing_requests` via shared transport; empty lists are honest
  success; no mutations. ADR 0048.
- **Verification:** local Xcode tests + Ops build; hosted macOS CI on PR.
- **Boundary:** read-only; request is never consent; act on phone; Ops locked.
- **Related decision:** ADR 0048.

### MACOS-003 — macOS own-profile read + shared transport

- **Status:** completed
- **Result:** Own-profile sidebar read via owner-RLS `profiles`; shared
  fail-closed Supabase transport reused by trust history and profile. ADR 0047.
  Merged as PR #80.
- **Verification:** local XcodeGen + Litmo tests + Ops unsigned build; hosted
  macOS Native Build green on PR #80.
- **Boundary:** read-only; no fabricated profiles; no profile edits; Ops locked.
- **Related decision:** ADR 0047.

### MACOS-002 — macOS self-only trust history read

- **Status:** completed
- **Result:** Native participant app loads self-only trust facts from
  `my_trust_signals` when configuration and a session token are present;
  otherwise fails closed. ADR 0046 records the boundary. Merged as PR #79.
- **Verification:** local XcodeGen + `xcodebuild test` on Litmo scheme (arm64);
  hosted macOS Native Build green on PR #79.
- **Boundary:** no consent recomputation, no mock trust rows, no Ops unlock, no
  production passkey UX, no shared App Group/Keychain with Ops or iOS.
- **Related decision:** ADR 0046.

### MACOS-001 — Native participant and Ops foundations

- **Status:** completed
- **Result:** PR #76 adds two native SwiftUI macOS targets from one XcodeGen specification: a participant app with functional local Circle, Quiet, and Digital Campfire practices, and a separately bundled Litmo Ops app that fails closed with no staff actions.
- **Verification:** macOS Native Build run #2 passed on `macos-26` with Xcode 26.5; four Campfire invariant tests passed, both arm64 apps compiled unsigned, and the workflow uploaded both `.app` bundles and Xcode logs.
- **Boundary:** active physical sessions and Soft Signal remain phone-first; consent and staff authority remain server-side; no participant data is fabricated; the two apps share no App Group or Keychain group; unsigned CI artifacts are not distributable releases.
- **Related decision:** ADR 0045.

### IOS-CI-001 — Hosted unsigned native iOS build

- **Status:** completed
- **Result:** PR #75 adds a credential-free `macos-26` workflow that installs locked npm and CocoaPods dependencies, compiles the checked-in Xcode workspace for a generic iOS Simulator with signing disabled, and uploads the compiled `.app` plus complete build log.
- **Verification:** GitHub Actions iOS Native Build run #5 passed with Xcode 26.5 and strict `pod install --deployment`; artifacts: 39.8 MB universal simulator `.app` and full Xcode log. The final lane targets the hosted Apple-silicon runner's native arm64 architecture to reduce CI time.
- **Boundary:** This proves native compilation only. It does not produce a signed device IPA, validate entitlements on hardware, upload to TestFlight, or remove any release blocker.

### CAMPFIRE-001 — Local Campfire practice hub

- **Status:** completed
- **Result:** One local Campfire hub with three explicitly distinct practices:
  a two-to-eight-person unanimous-readiness circle with immediate reason-free
  pause, open-ended quiet co-regulation, and a five/ten/twenty-minute digital
  focus fire. No state is persisted or shared, and no group matching or
  multi-person Consent Snapshot is implied.
- **Verification:** pure circle/timer unit tests plus repository CI recorded on
  the implementation PR.
- **Related decision:** ADR 0043.

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
