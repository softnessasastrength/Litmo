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
- **Progress 2026-07-13 (agent):** full checklist + Vibe Quiz audit in `docs/ACCESSIBILITY.md` (root pointer `ACCESSIBILITY.md`). Implemented P0/P1: question-change VoiceOver announces, Progress ND motion + value text, Eyebrow demoted from header, Choice option position labels, Screen keyboard persist for dictation, Dynamic Type on Title/Body/quiz prompts, result note labels. Remaining: physical VoiceOver smoke on device.

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

### SHARE-001 — Nearby local share (Multipeer / AirDrop-style)

- **Status:** completed (engineering foundation)
- **Result:** ADR 0053; `litmo-local-share` Multipeer Expo module; pure
  `localShareCore` (ephemeral X25519 + AES-GCM); `localShareService`;
  `/share/local` intentional UX; Settings master opt-in (default off); entry
  from profile edit and Consent Snapshot; Bonjour/Local Network plugin;
  `docs/LOCAL_SHARE.md`. Snapshot share is co-located review only — never
  session activation. Fail-soft without native module (Expo Go).
- **Verification:** unit tests for protocol + preference; typecheck after
  package link.
- **Boundary:** physical two-device radio smoke human-led; Android deferred;
  not a claim of AirDrop parity with Apple system UI.
- **Related:** ACCESS-001 residual device smoke; GDPR data minimization.

### ISO27701-001 — PIMS compliance roadmap (documentation)

- **Status:** completed (roadmap only; not certification)
- **Result:** `docs/ISO27701.md` — research-based ISO/IEC 27701 PIMS roadmap for
  a small team: scope, controller/processor stance, control themes, gap analysis,
  risk register, phased plan (0–4), SoA lite, safety-feature integration, and a
  five-item “PIMS week.” Focus: privacy by design, consent management, DSR,
  safety ops coupling. Linked from GDPR.md and DOCUMENTATION_MAP.
- **Boundary:** not ISO 27701 certification; 27001 base ISMS not established;
  legal DPAs and hard-delete remain external blockers.
- **Related:** GDPR-001, DATA_CLASSIFICATION, SAFETY-OPS.

### GDPR-001 — Privacy by design, export/erase, notices

- **Status:** completed (engineering); legal public-launch claim still blocked
- **Result:** `docs/GDPR.md`; Privacy Policy + Data Protection + Delete/wipe
  screens; Settings links; export merges server + local inventory; migration
  039 privacy notice acceptances + erasure request queue; local data wipe.
  Prioritizes touch profiles and consent snapshots in policy and export notes.
- **Verification:** typecheck; unit suite green.
- **Boundary:** no automatic `auth.users` hard-delete; controller/DPO contacts
  placeholders until legal review; not a claim of certified GDPR readiness.
- **Related:** DATA_CLASSIFICATION, PRIVACY_POLICY_DRAFT, SAFETY-OPS blockers,
  ISO27701-001.

### QUIZ-004 — Vibe Quiz review (short/deep, partner, E2E stub, ND/demo)

- **Status:** completed
- **Result:** Reviewed and tightened Quizzes surface. Short path = 10 fixed
  theme scenes (all 10 dimensions including repair); deep = full 100-scene bank.
  Mid-quiz save/resume always on-device (not ND-only). Partner invite retains
  dual share+compare consent + Signal-inspired E2E (focused stub, ADR 0052).
  Demo entry enables Neurodivergent Mode by default; onboarding Vibe uses short
  path in demo/ND for calm walkthrough; honest demo copy (local progress may
  remain). UX stays non-authority (weather ≠ consent).
- **Verification:** `vibeQuestionsForMode` short≥9/deep=100; full app test
  suite green; typecheck.
- **Boundary:** E2E is not a multi-device Signal audit; peer package consents
  package-asserted; ND/demo prefs device-local only.
- **Related:** QUIZ-001–003, ACCESS-002, ADR 0050/0052.

### ACCESS-002 — Global Neurodivergent Mode (inclusive patterns)

- **Status:** completed
- **Result:** Global Settings toggle + pace control. Inclusive patterns on Vibe
  Quiz and Guided Learning: progressive disclosure, customizable pace
  (confirm/slow/auto), reduced motion, voice aids, clear progress (n of total ·
  % · left), easy breaks with save, larger text scale. Demo enables by default.
  Docs: `docs/NEURODIVERGENT_MODE.md`.
- **Verification:** preference + pace + neuroStyleScale unit tests; typecheck;
  full app test suite.
- **Boundary:** never gates consent; not a score; calm/respectful only; device
  keyboard dictation; optional expo-speech.
- **Related:** ACCESS-001 VoiceOver smoke still optional for physical device.

### LEARN-004 — Lived-lesson modules + Vibe Quiz pairing

- **Status:** completed
- **Result:** Full Guided Learning lived track: six expanded short modules
  (Consent as Language, Nervous System Safety, Boundaries, Recovering from
  Violation, Partner Communication, Self-Compassion) with frame steps +
  interactive scenarios; Learn hub labeled Guided Learning; Home + demo entry;
  quiz result → related modules; soft-close quiz CTAs; private progress.
- **Verification:** `learningModules.test.ts` + app typecheck/tests.
- **Boundary:** not therapy; not safety certification; weather ≠ consent;
  recovering module non-graphic and exit-friendly.
- **Related docs:** `docs/LEARNING_SYSTEM.md`.

### QUIZ-003 — Partner invite & shared comparison flow

- **Status:** completed
- **Result:** Designed + implemented partner invite with **guided next-step UX**
  (`quizPartnerFlowCore`), dual share+compare consent fail-closed, Signal-
  inspired E2E (X3DH + Double Ratchet), package auto-show on create, demo
  fictional peer with real crypto, withdraw anytime, Face ID on real accounts.
  Design doc: `docs/PARTNER_QUIZ_SHARE.md`.
- **Verification:** `quizPartnerFlowCore` + `quizDemoPartner` +
  `doubleRatchetCore` + `quizShareCore` tests; app typecheck.
- **Boundary:** fictional partner is demo-only; peer package consents remain
  package-asserted; E2E is focused product path not full Signal audit; never
  consent/safety authority.
- **Related decision:** ADR 0050, 0052.

### QUIZ-002 — Partner quiz E2E (X3DH + Double Ratchet)

- **Status:** completed
- **Result:** Partner packages use Signal-inspired X3DH + Double Ratchet
  (AES-GCM). Identity/SPK private keys in Secure Store with optional CryptoKit
  vault wrap (Secure Enclave path). Packages carry public keys + ciphertext
  only (no sealKey). Optional Supabase `quiz_e2e_relay` stores opaque
  ciphertext with refuse-list checks. Four consent gates preserved. ADR 0052.
- **Verification:** `doubleRatchetCore` tests (X3DH agree, bidirectional
  ratchet, AAD/tamper fail-closed, host-after-session-open); `quizShareCore`
  dual-consent tests; app `typecheck` green.
- **Boundary:** not a full multi-device Signal audit; peer consents still
  package-asserted; sequential quiz messages only; Expo Go may skip Enclave
  wrap; never consent/safety/matching authority.
- **Related decision:** ADR 0052 (builds on 0050/0051).

### QUIZ-001 — Quizzes section (short/deep + partner consent)

- **Status:** completed
- **Result:** Quizzes tab with Vibe short (~10 scenes, all themes) and deep
  (100); four self quizzes; private results behind Face ID with retry/back on
  deny; partner invites with four consent gates; comparison uses friendly names
  and hard non-authority copy. Results prefer Secure Store. Optional owner-only
  summary backup (ADR 0051). Demo entry + Home link to Quizzes. Partner crypto
  upgraded in QUIZ-002 / ADR 0052.
- **Verification:** unit tests for `quizShareCore` (dual share+compare, fail
  closed), path/scoring, repository core; typecheck on implementation PR.
- **Boundary:** never consent/safety/matching authority; peer consent flags
  remain package-asserted; macOS has no Quizzes surface.
- **Related decision:** ADR 0050, ADR 0051, ADR 0052.
- **Constitution review 2026-07-13:** fixed SensitiveAccessGate fail UI; hub
  non-disclosure; share-without-seal fail-closed; join invite; Secure Store
  results; demo path mentions quizzes.

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
