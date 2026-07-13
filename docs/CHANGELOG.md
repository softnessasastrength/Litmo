# Changelog

## 2026-07-14 — 16-agent dual-mode architecture swarm

### Summary

Sixteen specialized design agents (monorepo, flags, consent domain, Soft Signal,
onboarding, dual seal, Touch Language, RF gatekeeper, auth/age, App Review,
Maximum experience, macOS SPM, privacy, CI, a11y/trauma, docs stewardship)
produced a unified architecture for MAXIMUM_MODE vs APP_STORE_SAFE.

### Output

- `docs/DUAL_MODE_16_AGENT_SWARM.md` — roster, folder/graph, flag matrix, flows,
  consensus gap board (G1–G13), P0–P2 backlog
- Cross-linked from DOCUMENTATION_MAP

## 2026-07-14 — Dual-mode architecture (MAXIMUM_MODE / APP_STORE_SAFE + SPM)

### Summary

Platform law: macOS/Linux → MAXIMUM_MODE; iOS → APP_STORE_SAFE (explicit env
override for internal Maximum iOS). Swift Package `packages/LitmoBuildMode`
mirrors TS flags/copy; XcodeGen wires MAXIMUM_MODE into macOS apps. Consent
flow matrix in `consentFlowsByMode.ts` + `docs/DUAL_MODE_ARCHITECTURE.md`.

### Developer impact

- `MAXIMUM_MODE` / `APP_STORE_SAFE` boolean aliases in `buildMode.ts`
- SPM: BuildMode, FeatureFlags, SoftSignalCopy, ConsentFlowNotes
- `macos/project.yml` package dependency + compilation conditions
- Extreme architecture doc with step-level consent flow tables

## 2026-07-14 — Dual build modes (Maximum vs App Store Safe)

### Summary

One monorepo, two compile-time product modes: **Maximum** (macOS/Linux/internal
full autistic consent experience) and **App Store Safe** (iOS store-sanitized
copy + gated proximity/NFC/hardware/demo). Safety core (Soft Signal stop, dual
seal, age gate, fail-closed) never disabled. Mode via
`EXPO_PUBLIC_LITMO_BUILD_MODE`, feature matrix, dual copy packs, EAS profiles.

### Developer impact

- `app/config/buildMode.ts`, `features.ts`, `copy/*`, `runtime.ts`
- `app.config.ts` + `eas.json` profile pins (`production` → app_store)
- Welcome/entry/Soft Signal/proximity/NFC wired to mode
- `docs/BUILD_MODES.md`, ADR 0060
- Tests: `config/buildMode.test.ts`

## 2026-07-14 — Code comment standard (maximum intentionality)

### Summary

Standing order: every function and safety-relevant line must ship with autistic-level
in-code documentation (WHAT / WHY / CONSENT / EDGE CASES / NEVER). Codified in
`docs/CODE_COMMENT_STANDARD.md`, bound in `Agents.md` and `DOCUMENTATION_STANDARD.md`.
Applied as the exemplar bar to consent grammar helpers, `useConsentGrantArm`,
`ConsentAffirmRow`, and `ConsentAcceptGate`.

### Developer impact

- New/touched code incomplete without the comment bar (even if tests pass)
- Consent-critical modules use the strictest template
- Retrofit policy: touch a file → raise it to standard in the same workstream

## 2026-07-14 — Initial onboarding consent flow (full granularity)

### Summary

Canonical frame-by-frame design for first app open through Home: welcome,
entry (demo vs passkey), About You, vibe quiz/result, Touch Language prepare,
expanded body-zone boundaries, real-account age gate, and every control mapped
to `onboard_*` consent points. Documents non-claims (prepare ≠ touch),
edge-case encyclopedia, happy paths, and implementation gaps.

### Developer impact

- `docs/ONBOARDING_CONSENT_FLOW.md` (authoritative first-open flow)
- `onboard_*` catalog already in `consentInteractionCore.ts`; tests assert
  onboarding points are prepare/inform only and never grant touch
- Cross-linked from `CONSENT_MICROINTERACTIONS.md` and `DOCUMENTATION_MAP.md`

## 2026-07-14 — Consent micro-interactions (maximum detail expansion)

### Summary

Deepened consent grammar: visual roles (signal vs moss), gesture policy, 13
edge-case outcomes, motion tokens, `useConsentGrantArm` progress, 
`ConsentAcceptGate` on NFC + TL share, prepare Soft Signal acks via
ConsentAffirmRow, engine snapshot confirm arming + arm progress bar.

### Surfaces wired

- Prepare Soft Signal acks  
- Mutual dual seal arm progress  
- Match consent-snapshot Yes→arm→confirm  
- NFC post-tap Accept/Decline gate  
- Touch Language share review gate  

## 2026-07-14 — Consent micro-interactions (Apple-level granularity)

### Summary

Codified every consent surface as a typed interaction grammar: timings (grant
slow / Soft Signal 0ms), visual weight hierarchy, phase machines, forbidden
patterns, and a full `CONSENT_POINTS` catalog. Soft Signal sticky mode; dual
seal arm dwell; ConsentAffirmRow; canonical doc
`docs/CONSENT_MICROINTERACTIONS.md`.

### Invariants enforced in tests

- Soft Signal faster than grant arm  
- Soft Signal never requires arming; works offline; weight ≥ 90  
- Prepare ≠ mutual consent; learning scenarios ≠ real consent  
- Forbidden labels rejected  

## 2026-07-14 — Continue: Soft Signal offline matrix + soft_limit engine + time boundary

### Summary

Nuclear residual P1 shipment: injectable Soft Signal core with offline unit
proofs; `soft_limit` first-class on consent engine (softLimit overlap bucket);
dual-agreed optional max duration on local Consent Snapshot prepare/mutual;
active session applies sealed mutual time boundary; physical Soft Signal chaos
checklist documented for human evidence.

### Developer impact

- `app/services/softSignalServiceCore.ts` + tests
- `shared/src/consentEngine.ts` soft_limit state + softLimit[]
- `sessionConsentSnapshotCore` softLimit zones + maxDurationMinutes
- Prepare step “Time boundary for this moment”
- `docs/PHYSICAL_SOFT_SIGNAL_CHAOS.md`

## 2026-07-13 — Nuclear swarm: Living Constitution + EmotionalOS hardening

### Summary

Full six-agent nuclear activation. Shipped machine-checkable **Living Constitution**
invariants (`@litmo/domain` constitutionInvariants), hardened Touch Language hard
limits, sacred Soft Signal copy, Living Constitution learning module + path,
Device OS Soft Signal multi-modal matrix, and `docs/NUCLEAR_SWARM.md` /
`CONSTITUTION_ENFORCEMENT.md`.

### Constitution

- Articles I–VIII → callable guards + tests
- Soft Signal sacred contract encoded
- `evaluateFeatureConstitutionally` feature gate for agents

### Product

- Hard-limit zone aliases (hard limits win)
- Shared TL profile: optional `speed`; soft_limit → ask_first at engine
- Foundations module: **The Living Constitution**
- Soft Signal sticky label: never a penalty

## 2026-07-13 — Multi-agent feature swarm closeout

### Summary

Five-agent audit of Touch Language, Consent Snapshot + Soft Signal, Proximity/NFC,
Guided Learning, and Hardware Device OS confirmed all streams shipped (hardware =
design-only). Closeout fixes: sticky Soft Signal on active session; learning
presence haptic; proximity hub Soft Signal tears down radios; Settings →
Proximity hub gates; aftercare scenario; `docs/FEATURE_SWARM_TRACKER.md` task
system; CURRENT_STATE + TASKS updated.

### Swarm residual (not blockers for vertical slice)

- Dual-agreed session duration on server snapshot
- TL soft_limit/speed server mapping
- Physical Multipeer/NFC/Soft Signal chaos + VoiceOver
- Independent crypto review before external beta

## 2026-07-13 — Trauma-informed safety system

### Summary

Added panic mode, quick exit, optional session timeout, present-moment partner
checks, and skippable private post-session reflection — all built on Soft Signal
as stop authority. Not emergency services, not therapy, not safety certificates.

### User-visible impact

- Active session: Soft Signal · Quick exit · Panic cover · timeout banner
- `/safety` hub, verify, panic-cover, reflection
- Wrap-up → optional reflection tools
- Home / Settings entry points

### Developer impact

- `traumaSafetyCore`, `traumaSafetyService`, `traumaSafetyStore`
- ADR 0059, `docs/TRAUMA_INFORMED_SAFETY.md`

## 2026-07-13 — Local-first architecture + optional encrypted backup

### Summary

Personal data is now explicitly **local-first**: unified vault (Secure Store
preferred), offline-complete stores for Touch Language, Consent Snapshots, Soft
Signal log, private history, learning progress, and quiz summaries. Optional
**encrypted cloud backup** (opt-in, opaque ciphertext, recovery code) via
migration `041_personal_encrypted_backups.sql`.

### User-visible impact

- Settings → **Local-first vault & encrypted backup**
- Private history list on that screen
- App personal features work fully offline; backup is never required

### Developer impact

- `localVault`, `localFirstCore`, `encryptedBackupCore`,
  `encryptedCloudBackupService`, `localFirstCoordinator`, `privateHistoryStore`
- ADR 0058, `docs/LOCAL_FIRST.md`
- Wipe/inventory cover the vault registry

## 2026-07-13 — Litmo Device OS design (power-on → shutdown)

### Summary

Canonical **Litmo Device OS** design: a single-purpose presence operating surface
that only rests, carefully meets, mutually consents, stays together, stops freely,
and quiets — with zero phone-style distraction. Full lifecycle from cold boot to
shutdown; Soft Signal as highest interrupt; Nearby off by default.

### Impact

- New: `docs/HARDWARE/DEVICE_OS.md` (v1.0)
- Cross-linked from `HARDWARE_DEVICE_EXPERIENCE.md` and `DOCUMENTATION_MAP.md`
- Design vision only — not a shipping OS or manufacturing authorization

## 2026-07-13 — Full Guided Learning / lived-lessons experience

### Summary

Expanded the **Guided Learning** section into a full private curriculum: six
lived-lesson modules (consent as language, nervous system, boundaries,
recovery, partner communication, self-compassion) with multiple interactive
scenarios each, ephemeral reflection prompts, product practice links (Soft
Signal, Consent Snapshot, Touch Language, Campfire, dual-consent share), six
learning paths, recommended-next, and a richer Learn hub + soft-close player.

### User-visible impact

- Learn hub: progress split (lived / foundations), recommended next, paths with
  progress bars, step/scenario counts, product-practice chips
- Module player: private reflection (never stored), soft close with practice +
  optional quiz + continue learning
- Foundations gain scenarios and practice links where they were thin

### Developer impact

- `app/data/learningModules.ts` — themes, practice links, paths, recommend helpers
- `app/app/(tabs)/learn.tsx`, `app/app/learning/[id].tsx`
- `docs/LEARNING_SYSTEM.md` rewritten for full experience

## 2026-07-13 — Full Proximity Layer hub + TL compatibility %

### Summary

Unified **Proximity Layer** hub with extreme consent gating; anonymous **Touch
Language shape compatibility %** on radar (coarse axes only, no zones on wire);
NFC / encrypted QR / AirDrop-style Multipeer paths linked from one place; Soft
Signal integrated with personal log.

### User-visible impact

- `/proximity` hub (master off default + three gates)
- Radar shows weather resonance **and** TL compatibility when available
- Home → Proximity Layer opens the hub

### Developer impact

- `touchLanguageProximity.ts`, beacon `tlAnon` / `|c####`
- `proximity/index.tsx`, service TL load + Soft Signal fire

## 2026-07-13 — Full Soft Signal system (app + hardware contract + private log)

### Summary

Unified Soft Signal: impossible-to-miss `SoftSignalButton`, `softSignalService`
(local end → remote withdraw → private log → haptic → hardware command),
practice mode, personal Secure Store log with optional post-stop journal notes,
and a firmware contract aligned with Soft Edge haptics (warm descent, not alarm).

### User-visible impact

- Active session Soft Signal control redesigned (banner + heavy affordance)
- Home / Settings → practice + private log
- Emotionally safe wrap-up language preserved; no reason required at stop

### Developer impact

- `app/lib/softSignalCore.ts`, `softSignalService`, `softSignalLogStore`,
  `softSignalHardware`, `SoftSignalButton`
- `docs/SOFT_SIGNAL.md`

## 2026-07-13 — Consent Snapshot prepare + mutual seal system

### Summary

Added a serious pre-session **Consent Snapshot** path: personal declaration
(mood, energy, boundaries from Touch Language, safewords, aftercare, Soft
Signal acknowledgment) and **mutual seal** with dual protective checklists,
fail-closed intersection, fingerprint, and free withdrawal. Demo uses a
labeled practice partner for dual affirmation on one device.

### User-visible impact

- Home → **Consent Snapshot (prepare & mutual seal)**
- `/consent-snapshot/prepare` · `/consent-snapshot/mutual`
- Match consent screen links to full prepare flow (mock)

### Developer impact

- `app/lib/sessionConsentSnapshotCore.ts` (+ tests)
- `app/services/sessionConsentSnapshotStore.ts`
- `docs/CONSENT_SNAPSHOT_SYSTEM.md`

## 2026-07-13 — Full Touch Language system (local + secure share)

### Summary

Built the full **Touch Language** product surface: pressure, speed, duration,
environments, hold types, 12-zone body map (welcomed / ask-first / soft limit /
off limits), hard limits, soft limits, private notes. Visual body map,
multi-step editor, Secure Store persistence, and AES-GCM partner share with
unlock code (private notes stripped; review-only accept gate).

### User-visible impact

- Home / Settings / Vibe profile → **Touch Language**
- `/touch-language` hub, `/edit`, `/share`
- Onboarding saves into the same local document

### Developer impact

- `app/data/touchLanguageCatalog.ts`, `app/lib/touchLanguageCore.ts` (+ tests)
- `touchLanguageStore`, `touchLanguageShareCore`
- `docs/TOUCH_LANGUAGE.md`

## 2026-07-13 — Expanded boundaries onboarding

### Summary

Expanded demo/onboarding **body map** from 4 zones to 12 (upper, core, lower),
plus absolute hard-stop chips, optional private nervous-system note, multi-step
flow with review, and ND-friendly bulk “ask first” helpers. Still local-only,
fail closed (unset = off limits), never session consent.

### User-visible impact

- Onboarding boundaries: intro → upper → core → lower → hard stops → note →
  review summary before home.
- Hard stops: face, neck, surprise touch, from-behind, tickling, photos, etc.
- “Mark all / remaining ask first” for low-energy setup.

### Developer impact

- `app/context/PrototypeContext.tsx` — expanded zones, hardStops, boundaryNote.
- `app/app/onboarding/boundaries.tsx` — multi-step UI.

## 2026-07-13 — Hardware haptics v4: intensity sliders + sensory preference sync

### Summary

Expanded **`docs/HARDWARE/HAPTICS.md`** to **v4.0**: global **0–100% intensity
slider** (Settings + quick menu), optional **per-pattern intensity** advanced
sliders, Sensory-Friendly auto scale + favor visuals, `effectiveIntensity`
math, persistence across sessions, and **self-only sync** of sensory device
preferences as a sibling of Touch Language profile data (never consent
boundaries / never partner-visible). Patterns retain Primary / Gentle / full
Visual Fallback specs.

### User-visible impact

- None on current phone app (hardware vision).

### Developer impact

- `docs/HARDWARE/HAPTICS.md` v4 control surface + preference store.

## 2026-07-13 — Hardware haptics v3: full visual fallbacks + multi-modal Soft Edge

### Summary

Expanded **`docs/HARDWARE/HAPTICS.md`** to **v3.0**: every pattern now specifies
Primary haptic, Gentle Mode, and a **full Visual Fallback** (Soft Signal pulsing
border + soft field + explicit “Session ended via Soft Signal” breath text;
connection card glow; mutual seal ripple; positive check + particles; nearby
edge glow). Sensory-Friendly is **one-tap from anywhere**; automatic visual
fallback when haptics are off/failed; optional sound; reduced-motion rules.

### User-visible impact

- None on current phone app (hardware vision). Specs ready for device UI + firmware.

### Developer impact

- `docs/HARDWARE/HAPTICS.md` v3 multi-modal authority.

## 2026-07-13 — Hardware haptics v2: VCM-first, Gentle Mode, Soft Signal descent

### Summary

Canonical dedicated-device haptic spec moved to **`docs/HARDWARE/HAPTICS.md`**
(v2): wideband **VCM primary** + LRA secondary, device-wide warm field, **every
pattern has Gentle / Sensory-Friendly Mode**, Soft Signal as long smooth
**descending warm pulse**, connection rising heartbeat (gentle single throb),
mutual consent double-pulse, positive feedback, nearby ambient, global
Sensory-Friendly toggle, intensity + per-pattern presets, full off with
visual/sound, vibe/sensory **suggestions** (confirm before apply).

### User-visible impact

- None in the current mobile app (hardware vision).

### Developer impact

- `docs/HARDWARE/HAPTICS.md` — new canonical authority.
- `docs/HAPTIC_SYSTEM_DEVICE.md` — pointer only.
- ADR 0057, DOCUMENTATION_MAP, phone haptic plan, KNOWN_LIMITATIONS updated.

## 2026-07-13 — Soft Edge haptic system refined (warm, EI, anti cold-tech)

### Summary

Expanded `docs/HAPTIC_SYSTEM_DEVICE.md` to **v1.1 Soft Edge**: emotional
intelligence rules, explicit contrast vs cold/tech haptics, full pattern palette
(`breath`, `warmSeal`, `curtainClose`, `thorn`, …), profiles (`quiet_hearth`,
etc.), EmotionalGuard, Soft Signal emotional safety, and authoring/validation
gates. ADR 0057 updated to name Soft Edge personality.

### User-visible impact

- None in the current mobile app (design/vision).

### Developer impact

- `docs/HAPTIC_SYSTEM_DEVICE.md` — major expansion.
- `docs/adr/0057-device-haptic-vca-lra-architecture.md` — Soft Edge decision notes.

## 2026-07-13 — Dedicated-device haptic system design (VCA + LRA)

### Summary

Specified the **Soft Edge** tactile language for the Litmo companion device
vision: dual **voice-coil (VCA) + LRA** architecture, Soft Signal “curtain
close,” consent-exchange and connection notification patterns, timing budgets,
accessibility/ND rules, and firmware/software interfaces. Phone Expo haptics
(ADR 0039) remain the shipping path; device docs are design-only until hardware.

### User-visible impact

- None in the current mobile app. Product vision language may appear on the
  public `/litmo` hardware section separately.

### Developer impact

- `docs/HAPTIC_SYSTEM_DEVICE.md` — full implementation specification.
- `docs/adr/0057-device-haptic-vca-lra-architecture.md` — architecture decision.
- Cross-links from `docs/roadmap/HAPTIC_LANGUAGE_IMPLEMENTATION.md` and
  `docs/DOCUMENTATION_MAP.md`.

### Related work

- ADR 0039 / HAPTIC-001 phone semantic vocabulary
- Hardware vision on Softnessasastrength-Website `/litmo#hardware`

## 2026-07-13 — 100-question vibe quiz + model-heavy mix engine

### Summary

Expanded the onboarding Vibe Profile quiz to a full **100-question** social-weather
bank (10 themes × 10 scenes) and a **model-heavy** scoring layer: normalized mix,
per-theme leans, blend geometry, coverage confidence — still explicitly non-clinical.

### User-visible impact

- Themes: place, regulation, comfort, talk, senses, tempo, first step, nearness,
  play, and mends.
- Progress shows `n / 100` with theme labels; mid-quiz save/resume and back.
- Result: vibe card, **weather mix bars**, signature themes, confidence fill,
  five diversified notes (not 100).
- Copy: playful model version stamped; not diagnosis, safety, or consent.

### Developer impact

- `app/data/quiz.ts` — 100-question bank.
- `app/lib/quizModel.ts` — `runQuizModel` / mix / themes / confidence (`vibe-mix-1.0`).
- `quizScoring.ts` re-exports the model for existing imports.
- Tests cover bank size, mix normalization, partial vs full confidence, lantern path.

### Related work

- Onboarding Vibe Profile (not Touch Language / Consent Snapshot)

## 2026-07-13 — macOS session-requests read (read-only)

### Summary

Added a fail-closed **Requests** surface on native macOS that loads pending
incoming and outgoing session requests via existing RPCs (ADR 0048). No accept,
decline, create, or cancel actions.

### User-visible impact

- Sidebar **Requests** lists pending traffic or an honest empty state.
- Missing config/session or HTTP failure fails closed with no fabricated rows.
- Copy reminds that listing is never consent; action stays phone-first.

### Related work

- MACOS-004
- ADR 0048

## 2026-07-13 — macOS own-profile read and shared transport

### Summary

Added the second server-backed macOS participant read surface: self-only own
profile via owner-RLS `profiles` (ADR 0047). Extracted shared fail-closed
Supabase transport and load outcomes so trust history and profile use one
pattern.

### User-visible impact

- The Litmo macOS app gains a **Profile** sidebar surface.
- When configured with a session token, the app loads display name, pronouns,
  bio, vibe archetype, and onboarding completion from the server.
- Missing configuration/session or incomplete server payloads fail closed with
  no fabricated profile defaults.

### Safety and developer impact

- Shared `SupabaseParticipantTransport`, `ParticipantReadOutcome`, and JSON
  field helpers live in `LitmoMacCore`.
- Profile remains read-only on Mac; editing stays phone-first.
- Unit tests cover profile decoding and fail-closed HTTP paths (plus existing
  trust-history coverage after the transport refactor).

### Related work

- MACOS-003
- ADR 0047
- ADR 0046

## 2026-07-13 — macOS self-only trust history read

### Summary

Added the first server-backed participant read model on native macOS: self-only
trust history via the existing `my_trust_signals` RPC, with fail-closed
configuration and session handling (ADR 0046).

### User-visible impact

- The Litmo macOS app gains a **Trust history** sidebar surface.
- When Supabase URL, anon key, and an access token are present, the app loads
  server facts (account age, profile complete, adult confirmation, terminal
  session counts) without inventing a safety score.
- When configuration or session is missing, or the server refuses the call, the
  surface fails closed and shows no fabricated participant data.

### Safety and developer impact

- Swift decodes and displays server fields only; it does not recompute trust or
  consent.
- Local inspection uses `LITMO_SUPABASE_URL`, `LITMO_SUPABASE_ANON_KEY`, and
  `LITMO_ACCESS_TOKEN` (documented in `macos/README.md`). This is not production
  passkey sign-in.
- Unit tests cover decoding, configuration/session fail-closed paths, and HTTP
  success/error handling with an injected HTTP performer.
- Litmo Ops remains locked and still shares no credentials or app group.

### Related work

- MACOS-002 (trust-history read slice)
- ADR 0046
- ADR 0029 / ADR 0045

## 2026-07-13 — ACCESS-001 a11y semantics cleanup

### Summary

Standardized the remaining deferred accessibility semantics in the private-beta
review surface: moderation queue filter buttons now expose selected state, and
Settings haptics now uses a real `Switch` instead of a plain button. The
appearance control remains a cycle button because it is three-state, not a
binary toggle.

### User-visible impact

- VoiceOver now has clearer state for moderation filter choices.
- Haptics settings now announce and behave like an actual binary control.

### Developer impact

- `app/components/ui.tsx` now accepts explicit accessibility role/state props
  for shared pressable controls.
- `docs/ACCESSIBILITY_TRACK_C.md` records the refined surfaces.

### Related decision and roadmap

- `TASKS.md` ACCESS-001 (still pending physical founder VoiceOver smoke)

## 2026-07-13 — Native macOS participant and Ops foundations

### Summary

Added two native SwiftUI macOS targets generated from one reviewable XcodeGen specification: Litmo for participant preparation and local Campfire, and a separately bundled Litmo Ops shell.

### User-visible impact

- Circle, Quiet, and Digital Campfire practices run locally on macOS.
- The participant workspace exposes honest read-only placeholders rather than mock account or consent data.
- Litmo Ops displays its planned operational areas but remains disabled and fails closed.

### Safety and developer impact

- Active physical sessions and Soft Signal remain phone-first.
- Consent, session, and staff authorization remain server-authoritative rather than being reimplemented in Swift.
- Participant and Ops targets use separate bundle identifiers and entitlement files with no shared App Group.
- Hosted Xcode 26.5 CI runs four Campfire invariant tests, builds both unsigned arm64 apps, and uploads inspection artifacts and logs.

### Related work

- MACOS-001
- ADR 0045
- PR #76

## 2026-07-13 — Hosted native iOS compile gate

### Summary

Added a credential-free GitHub Actions lane that installs locked JavaScript and
CocoaPods dependencies and compiles the checked-in Xcode workspace on
`macos-26` with Xcode 26.5. The first run exposed a stale `Podfile.lock` and
an incompatible Xcode 16.4 runner selection; both were corrected before the
successful native build.

### User-visible impact

None. This is build verification only.

### Developer and release impact

- Pull requests changing app/native/shared dependency inputs now receive a real
  unsigned iOS Simulator compile.
- Manual workflow dispatch is available from GitHub Actions.
- Successful runs upload the compiled simulator `.app` and full Xcode log for
  seven days.
- Code signing, device installation, entitlements, staging services, IPA
  creation, and TestFlight upload remain explicitly out of scope.

### Verification

- iOS Native Build run #5 passed with Xcode 26.5 and strict CocoaPods
  deployment mode; the final lane targets native arm64 to reduce hosted Mac
  time.
- The run produced a 39.8 MB simulator `.app` and the full Xcode build log.

### Related work

- IOS-CI-001
- `docs/RELEASE_AND_TESTFLIGHT.md`

## 2026-07-13 — MPL-2.0 project license

### Summary

Selected the Mozilla Public License Version 2.0 for Litmo and added the
canonical license text, package metadata, and ADR 0044. MPL-2.0 provides
file-level copyleft while allowing covered files to be combined into larger
works distributed through channels such as compiled mobile applications.

### User-visible impact

None to application behavior. The repository is now openly reusable under
clear terms instead of defaulting to all rights reserved.

### Developer and governance impact

- Except where noted otherwise, Litmo is licensed under `MPL-2.0`.
- Distributed modifications to covered files remain under MPL-2.0 as required
  by the license.
- No noncommercial or custom field-of-use restriction was added.
- Contributor attestation, trademark policy, third-party notice audit, and
  qualified legal review remain follow-up work.

### Migration and setup impact

None. Runtime dependencies, commands, and application behavior are unchanged.

### Related decision

- ADR 0044
- DOCS-002

## 2026-07-13 — Campfire Mode local practice hub

### Summary

Added one phone-visible Campfire hub with three device-local practices: a
consent-gated group circle, open-ended quiet co-regulation, and a timed digital
focus fire.

### User-visible impact

- Guided Practice links to Campfire Mode.
- Circle campfire supports two to eight people, requires each seat to opt in,
  and gives anyone an immediate reason-free pause control.
- Quiet co-regulation provides a non-goal orientation timer.
- Digital campfire provides five-, ten-, and twenty-minute visible focus
  periods without tasks, scores, streaks, or saved completion.

### Developer and data impact

- Campfire state exists only in React component memory and clears on exit.
- No database, account, analytics, location, contacts, camera, microphone,
  notification, or HealthKit access is added.
- Pure circle/timer behavior is covered in `app/lib/campfireCore.test.ts`.

### Related decision

- ADR 0043
- CAMPFIRE-001

## 2026-07-13 — Recommended private-alpha safety-operations foundation

### Summary

Founder selected the recommended SAFETY-OPS directions. Added ADR 0042,
migration 036, and pgTAP coverage for staff-issued hashed invitations,
seven-day expiry, private-alpha membership gates, a scoped matching pause,
minimal unblock tombstones, non-destructive cleanup, and self data export.

### User-visible impact

- Non-member accounts cannot enter real discovery or create session requests.
- Staff can pause new matching activity without removing active-session safety
  controls.
- No mobile invitation or export UI is added in this slice.

### Data and safety impact

- Plaintext invitation codes are returned once and never stored.
- Existing accounts form the initial named cohort; new accounts require
  invitation redemption.
- Unblock tombstones contain pair identifiers and timestamps only and expire
  after 90 days.
- Destructive safety-record retention and account deletion remain blocked
  pending qualified review.

### Verification

- `supabase/tests/private_alpha_safety_ops.test.sql` covers admission, code
  issuance/redemption, matching pause, export categories, and tombstones.
- GitHub Project State, lint, typecheck, unit tests, build, database reset/lint, all pgTAP tests, and integration 5/5 pass on PR #67.

### Related decision

- ADR 0042
- SAFETY-OPS-001

## 2026-07-13 — Continuity reconciliation and SAFETY-OPS decision packet

### Summary

Reconciled stale execution metadata after BETA-001 completion and added
`docs/SAFETY_OPS_FOUNDER_DECISIONS.md`, a ten-decision founder worksheet for
private-alpha safety operations. The worksheet records options, conservative
recommended defaults, external-review dependencies, and an explicit completion
gate without promoting Chapter 6.

### User-visible impact

- None. Documentation and governance preparation only; runtime behavior is
  unchanged.

### Developer impact

- `AGENTS.md`, `CURRENT_STATE.md`, `TASKS.md`, and `project-state.json`
  now agree that no implementation milestone is active and SAFETY-OPS-001 is
  pending decisions.
- The decision packet is registered in `docs/DOCUMENTATION_MAP.md` and linked
  from `docs/SAFETY_OPS_DESIGN.md`.
- The integrated baseline is recorded as
  `42a1eed65b182c9880238eca26f3a53032ad5c43`.

### Verification

- Documentation-only change; no runtime tests claimed.
- `project-state.json` remains valid JSON and conforms to the repository's
  allowed status values.
- GitHub PR checks are the branch-level validation authority.

### Related decision and roadmap

- SAFETY-OPS-001 remains `pending`.
- Chapter 6 remains unauthorized until a separate human promotion decision.

## 2026-07-13 — Draft SAFETY-OPS-001 moderation/beta-ops design proposal

### Summary

Added `docs/SAFETY_OPS_DESIGN.md`: a ground-truth inventory of Chapter 5's
already-shipped moderation system (blocking, reports, review queue,
restrictions, appeals, rate limits, trust events, age gate) plus proposals for
what Chapter 6 still needs (invite-only enrollment, retention/deletion/export,
beta kill-switch, escalation ladder). Retention/deletion/export is framed
around GDPR-style data-rights principles as design philosophy, not a
compliance claim.

### User-visible impact

- None. Draft proposal document; no runtime behavior changed.

### Developer impact

- New doc registered in `docs/DOCUMENTATION_MAP.md` under "Roadmaps and future
  intent." Explicitly does not authorize Chapter 6 implementation.

### Related decision and roadmap

- `TASKS.md` SAFETY-OPS-001 (stays `pending` — needs founder/safety review),
  PR #63
- `docs/roadmap/CHAPTER_6_PRIVATE_ALPHA.md`

## 2026-07-13 — Close out BETA-001 (physical Track B B1-B26 pass)

### Summary

Founder completed the physical two-device Track B walkthrough (B1-B26) with
all items passing and no Fail findings, closing BETA-001.

### User-visible impact

- None (validation record, not a code change).

### Developer impact

- `docs/PHYSICAL_BETA_WALKTHROUGH_RESULTS.md` records the full B1-B26 pass;
  `TASKS.md` / `project-state.json` mark BETA-001 completed;
  `CURRENT_STATE.md` corrected a stale branch pointer left over from PR #60.

### Related decision and roadmap

- `docs/PHYSICAL_BETA_WALKTHROUGH.md`, BETA-001

## 2026-07-13 — Static accessibility audit fixes (ACCESS-001)

### Summary

Static-analysis accessibility pass over app screens not covered by BETA-001's
Track C. Fixed two real bugs found along the way: `boundaries.tsx` collapsed
its body-zone radiogroup into one opaque VoiceOver stop (consent-adjacent
screen), and `learning/[id].tsx`'s back/exit handler called a React hook
outside of render, which would throw on tap. Also fixed a dark-mode contrast
bug (auth/profile screens used a static light-palette stylesheet) and added
missing `accessibilityRole`/`accessibilityLabel`/`accessibilityState` in
several places.

### User-visible impact

- VoiceOver can now reach each individual boundary choice on the body-zone
  setup screen.
- Sign-up, recovery, and profile-edit screens render readable text in dark
  mode instead of near-invisible light-on-light text.
- The learning module's Back/Exit control no longer crashes on tap.

### Developer impact

- `sign-in.tsx` now exports a theme-aware `authFormStyles(colors)` factory
  (call via `useThemedStyles`) instead of a static `StyleSheet`; sign-up,
  recovery, and profile/edit updated to match.
- `SectionTitle` (`components/ui.tsx`) now carries
  `accessibilityRole="header"`, propagating to every screen that uses it.

### Related decision and roadmap

- `TASKS.md` ACCESS-001 (still pending — physical VoiceOver smoke and two
  product-decision items remain), PR #61

## 2026-07-12 — Track B seed-account integration test

### Summary

Added an integration scenario that exercises the real BETA-001 seed accounts
(password grant, discovery, full session lifecycle with trusted snapshot), so
the founder Track B path cannot regress without failing `npm run test:integration`.

### Developer impact

- `integration/track-b-seed-accounts.test.mjs` (2 tests; suite total 5)
- Documented under `docs/TRACK_B_LOCAL.md`

### Related decision and roadmap

- `docs/TRACK_B_LOCAL.md`, BETA-001 / ADR 0041

## 2026-07-12 — Fix Track B seed password sign-in (GoTrue tokens)

### Summary

Local seed accounts in `supabase/seed.sql` left GoTrue token columns `NULL`.
Password grant then returned HTTP 500 (`confirmation_token` scan error), so
Track B seed sign-in was broken after every `db reset` even though integration
tests (which create users via signup) still passed.

### User-visible impact

- Development seed sign-in works again for all four seeded emails

### Developer impact

- Seed inserts empty-string token fields; setup script verifies password grant
- ADR 0041 addendum; BETA-001 results record automated backend Pass

### Related decision and roadmap

- `docs/adr/0041-development-seed-password-sign-in.md`
- `docs/TRACK_B_LOCAL.md`, `docs/PHYSICAL_BETA_WALKTHROUGH_RESULTS.md`

## 2026-07-12 — Track B development seed sign-in + local setup

### Summary

Development builds can sign in with local seed emails/passwords for BETA-001
Track B without passkeys. Setup script writes Supabase + backend env from
`supabase status`. Passkeys remain the product path outside development.

### User-visible impact

- Sign-in (development only): **Sign in with seed account** form
- Demo mode and passkey path unchanged

### Developer impact

- `authService.signInWithPassword`; ADR 0041
- `scripts/setup-track-b-local.sh`; `docs/TRACK_B_LOCAL.md`

### Related decision and roadmap

- `docs/adr/0041-development-seed-password-sign-in.md`
- `docs/TRACK_B_LOCAL.md`

## 2026-07-12 — BETA-001 Track C accessibility pass

### Summary

Hardened Soft Signal and Consent Snapshot for VoiceOver-ready labels, Dynamic
Type, reduced motion, non-color Soft Signal meaning, and larger touch targets.
Track C engineering criteria recorded as Pass.

### User-visible impact

- Clearer Soft Signal / consent a11y labels and hints
- Larger safety buttons; choices announce selected state

### Developer impact

- `docs/ACCESSIBILITY_TRACK_C.md`
- UI Button/Choice a11y; active + consent-snapshot screens

## 2026-07-12 — BETA-001 Track A Pass (founder)

### Summary

Founder confirmed fictional demo walkthrough Track A is good. Results log
updated; BETA-001 continues with Tracks B (real accounts) and C (accessibility).

### User-visible impact

- None in code; validation milestone recorded.

### Related decision and roadmap

- `docs/PHYSICAL_BETA_WALKTHROUGH_RESULTS.md`

## 2026-07-12 — Soft Signal label + walkthrough automation start

### Summary

Active session stop control is labeled **Soft Signal — end now** (not
“Emergency stop”). Maestro Track A helper flow and a partial BETA-001 results
log added. Full physical/Face ID / Track B still founder-owned when Docker is up.

### User-visible impact

- Soft Signal naming matches product language on the active session screen.

### Developer impact

- `docs/screenshots/maestro-track-a-walkthrough.yaml`
- `docs/PHYSICAL_BETA_WALKTHROUGH_RESULTS.md`

## 2026-07-12 — Block ends open sessions + system appearance

### Summary

One-way blocks now cancel pre-activation and safety-end active sessions with
the blocked person (ADR 0040). Active session UI can block and leave. Appearance
Settings cycles light → dark → **system** (follows OS).

### User-visible impact

- Blocking mid-session ends that pair’s open work and discovery contact.
- Settings: Appearance light / dark / system.
- Soft Signal remains the stop without permanently cutting discovery.

### Developer impact

- Migration `035_block_ends_open_sessions.sql`; pgTAP `block_ends_sessions.test.sql`
- Theme preference `system` + `Appearance` listener
- ADR 0040

### Related decision and roadmap

- `docs/adr/0040-block-ends-open-sessions.md`

## 2026-07-12 — Dark mode toggle in Settings

### Summary

Device-local light/dark appearance preference with a Settings toggle. Soft dark
palette preserves distinct Soft Signal / safety colors. Theme applies across
shared UI, navigation chrome, and themed screens.

### User-visible impact

- Settings: **Appearance: light / dark**
- Preference persists on device (AsyncStorage); not account-synced

### Developer impact

- `ThemeProvider` / `useTheme` / `useColors` / `useThemedStyles`
- `lightColors` / `darkColors` in `theme.ts`
- `themePreference` service + unit tests

### Related decision and roadmap

- Settings alongside haptics; physical validation still under BETA-001

## 2026-07-12 — HAPTIC-001 + matching hold ends open sessions

### Summary

Semantic haptic vocabulary (`presence`, `attention`, `confirmation`,
`softSignal`, `emergencyStop`) via `expo-haptics`, local Settings toggle, and
limited learning / Soft Signal / Consent Snapshot integrations. Matching holds
now cancel pre-activation and safety-end active sessions (same as permanent ban).

### User-visible impact

- Settings: **Haptics: on/off** (device-local).
- Gentle haptics on learn entry, scenarios, module complete, Soft Signal, Consent Snapshot pause.
- Staff matching hold closes live matching work for the restricted account.

### Developer impact

- `hapticService` / `hapticServiceCore` + unit tests; ADR 0039
- Migration `034_matching_hold_ends_open_sessions.sql`; ADR 0038
- pgTAP `matching_hold_sessions.test.sql`; permanent-ban test residual updated

### Related decision and roadmap

- `docs/adr/0038-matching-hold-ends-open-sessions.md`
- `docs/adr/0039-semantic-haptic-language.md`
- `docs/roadmap/HAPTIC_LANGUAGE_IMPLEMENTATION.md`

## 2026-07-12 — LEARN-002: full fictional session practice module

### Summary

New guided-learning module walks fictional adults River and Sam from request
through Consent Snapshot, dual confirm, active session, Soft Signal, and
wrap-up. Device-local progress only; never creates a real session or claims
safety competence.

### User-visible impact

- Learn tab: **A full practice session** (~8 min, recommended before first session).

### Developer impact

- `app/data/learningModules.ts` module `full-session-practice`
- `docs/LEARNING_SYSTEM.md` curriculum update

### Related decision and roadmap

- `TASKS.md` LEARN-002
- `docs/LEARNING_SYSTEM.md`

## 2026-07-12 — Chapter 5: staff case evidence + reviewer message

### Summary

Reporter free text for human review is stored as staff-readable
`staff_shared_message` (not device-encrypted). Staff case detail loads a
structured evidence pack: message, session metadata, active restriction, and
prior report counts (facts, not a score). Device-encrypted notes stay opaque.

### User-visible impact

- Report form: “Message for reviewers” with honest staff-share copy.
- Staff case: Evidence section with message, session, counts, restriction.

### Developer impact

- Migration `033_staff_case_evidence.sql`
- `get_moderation_case_evidence`; extended `submit_report`
- ADR 0037; pgTAP `staff_case_evidence.test.sql`

### Related decision and roadmap

- `docs/adr/0037-staff-case-evidence.md`

## 2026-07-12 — Physical beta walkthrough checklist

### Summary

Founder/private physical-device validation checklist covering demo (Expo Go) and
real two-account session paths, Chapter 5 safety smoke, accessibility, and
evidence rules. Not external TestFlight approval.

### User-visible impact

- None in app code; operators use `docs/PHYSICAL_BETA_WALKTHROUGH.md`.

### Developer impact

- Single checklist before claiming on-device success or inviting humans
- Points at RELEASE_AND_TESTFLIGHT blockers and KNOWN_LIMITATIONS

### Related decision and roadmap

- `docs/PHYSICAL_BETA_WALKTHROUGH.md`
- `docs/CHAPTER_5_NEXT_STEPS.md`

## 2026-07-12 — Chapter 5: real Consent Snapshot display

### Summary

When a real `sessionId` is present, Consent Snapshot loads the latest non-withdrawn
snapshot (or creates one via the trusted backend) and renders rows from that
snapshot's `compatibility` JSON. Mock fixtures remain only for the demo path.

### User-visible impact

- Real pairs see live directional overlap from saved profiles, not mock people.
- Fail-closed loading/error with retry if backend or profiles are missing.
- Empty overlap lists clearly; confirm is disabled until shared items exist.

### Developer impact

- `sessionRepository.createSnapshot` returns `compatibility`
- `getLatestSessionSnapshot` via participant RLS on `consent_snapshots`
- ADR 0036

### Related decision and roadmap

- `docs/adr/0036-real-consent-snapshot-display.md`

## 2026-07-12 — Chapter 5: real discovery UI + permanent ban ends sessions

### Summary

Signed-in discovery loads `discovery_profiles` with peer-visible age/session
facts. Demo still uses synthetic neighbors. Permanent bans cancel pre-activation
work and safety-end active sessions; temporary holds still only cancel requests.

### User-visible impact

- Authenticated Discover: real people (or empty fail-closed list).
- Match detail for UUIDs uses repository data + real request/block/report.
- Permanent ban closes open matching work fail-closed.

### Developer impact

- Migration `032_permanent_ban_ends_sessions.sql`
- `discoveryService`; discover + match dual-mode
- ADR 0035; pgTAP `permanent_ban_sessions.test.sql`

### Related decision and roadmap

- `docs/adr/0035-permanent-ban-ends-open-sessions.md`

## 2026-07-12 — Chapter 5: peer signals + restriction appeals

### Summary

Discovery exposes account age (days) and completed session counts as separate
facts — never a safety score. Users can appeal active matching holds/bans for
human review; staff can uphold or lift.

### User-visible impact

- Peer context: specific days/counts with anti-score copy.
- Settings → **Appeals**; staff → **Open appeals (staff)**.

### Developer impact

- Migration `031_peer_signals_and_appeals.sql`
- `peerSignalsService`, `appealService`
- ADR 0033 / 0034; pgTAP `peer_signals_and_appeals.test.sql`

### Related decision and roadmap

- `docs/adr/0033-peer-visible-specific-signals.md`
- `docs/adr/0034-restriction-appeals.md`

## 2026-07-12 — Chapter 5: moderator console UI

### Summary

Staff-only mobile queue for human review: list cases, claim, internal notes,
resolve with coarse reporter outcomes, optional 7-day matching hold. Built on
existing moderation RPCs plus `list_moderation_case_notes`.

### User-visible impact

- Staff: Settings → **Moderation queue (staff)**.
- Non-staff: link hidden; RPCs still deny.

### Developer impact

- Migration `030_moderation_case_notes_list.sql`
- `moderationService`; `/security/moderation`, `/security/moderation-case`
- ADR 0032; pgTAP `moderation_console.test.sql`

### Related decision and roadmap

- `docs/adr/0032-moderator-console-ui.md`

## 2026-07-12 — Chapter 5: restriction lifecycle gates + active report

### Summary

Staff restrictions now cancel pending requests and block forward session
lifecycle transitions (accept → active). Decline, cancel, and safety exits
remain available. Active sessions gain a calm mid-session report entry.

### User-visible impact

- Restricted accounts cannot accept or advance sessions.
- Applying a hold/ban cancels open requests involving that account.
- Active session: **Report for human review** (does not end the session).

### Developer impact

- Migration `029_restriction_transition_gates.sql`
- ADR 0031; pgTAP `restriction_transition_gates.test.sql`

### Related decision and roadmap

- `docs/adr/0031-restriction-lifecycle-gates.md`

## 2026-07-12 — Chapter 5: report entry from session wrap-up

### Summary

Real session wrap-up offers optional structured reporting linked to the
session and peer when the outcome signals discomfort, Soft Signal, or a
safety concern. Wrap-up remains private and separate from reporting.

### User-visible impact

- After selecting soft signal / uncomfortable / safety concern on a real
  session wrap-up: **Report this session for human review**.
- Report form receives `sessionId` + peer id automatically.

### Developer impact

- `sessionRepository.getSession` returns `userA` / `userB`
- Wrap-up → `/security/report` with session params

### Related decision and roadmap

- `docs/CHAPTER_5_NEXT_STEPS.md` (report entry from wrap-up)

## 2026-07-12 — Chapter 5: staff account restrictions

### Summary

Human-only matching holds and permanent bans with audit trail. Enforced on
discovery and session requests. Self-visible coarse status only — no staff
notes or automatic bans from reports/rate limits.

### User-visible impact

- Restricted accounts cannot match; peers see opaque “not available.”
- Settings → Your private signals shows **Matching access** (open/paused).

### Developer impact

- Migration `028_account_restrictions.sql`
- `apply_account_restriction` / `lift_account_restriction` / `my_matching_access`
- ADR 0030; `matchingAccessService`; pgTAP `account_restrictions.test.sql`

### Migration and setup impact

`npm run db:reset` (or apply 028). Staff role required to apply/lift.

### Related decision and roadmap

- `docs/adr/0030-account-restrictions.md`

## 2026-07-12 — Chapter 5: rate limits + append-only trust events

### Summary

Abuse soft-limits on new session requests, reports, and block/unblock, plus
an append-only trust event ledger with a self-only `my_trust_signals` view.
No universal safety score; no automatic punishment on rate limit hits.

### User-visible impact

- Over-limit actions fail with a calm “try again later” message.
- Settings → **Your private signals** (account age, profile complete, adult
  flag, terminal session counts — self only).

### Developer impact

- Migrations `026_rate_limits.sql`, `027_trust_events.sql`
- ADRs 0028 / 0029; `trustSignalsService`
- pgTAP `rate_limits.test.sql`, `trust_events.test.sql`

### Migration and setup impact

`npm run db:reset` (or apply 026–027).

### Related decision and roadmap

- `docs/adr/0028-abuse-rate-limits.md`
- `docs/adr/0029-append-only-trust-events.md`
- `docs/CHAPTER_5_NEXT_STEPS.md`

## 2026-07-12 — Chapter 5: human moderation review queue

### Summary

Staff-only human-review queue for structured reports: auto-open cases with
category priority, claim/assign, internal notes, resolve with coarse
reporter-visible outcomes. No auto-punishment and no consumer admin UI yet.

### User-visible impact

- When a report is claimed, reporter status may become **Under review**.
- When resolved, reporter sees coarse closed outcome only.

### Developer impact

- Migration `025_moderation_review_queue.sql`
- `staff_roles`, `moderation_cases`, `moderation_case_notes`
- RPCs: `list_moderation_queue`, `claim_moderation_case`,
  `add_moderation_note`, `resolve_moderation_case`
- pgTAP `moderation_review_queue.test.sql`; ADR 0027

### Migration and setup impact

`npm run db:reset` (or apply 025). Grant staff via `staff_roles` as service
role / ops (not self-service).

### Related decision and roadmap

- `docs/adr/0027-moderation-review-queue.md`
- `docs/CHAPTER_5_NEXT_STEPS.md`

## 2026-07-12 — Chapter 5: structured user reports (intake)

### Summary

Reporters can submit structured safety categories with an optional
device-encrypted private note and optional session link. Status is
reporter-visible only; the reported party has no access. Human-review
queue is still deferred.

### User-visible impact

- **Report** on a match profile (signed-in).
- Settings → **My reports** with coarse private status.
- Acknowledgment copy: not emergency response; no promised outcome.

### Developer impact

- Migration `024_structured_reports.sql`
- `reportService`; `/security/report`, `/security/reports`
- pgTAP `structured_reports.test.sql`; ADR 0026

### Migration and setup impact

`npm run db:reset` (or apply 024).

### Related decision and roadmap

- `docs/adr/0026-structured-user-reports.md`
- `docs/CHAPTER_5_NEXT_STEPS.md`

## 2026-07-12 — Apple Declared Age Range adult eligibility gate

### Summary

Real accounts must confirm adult status (18+) before discovery or session
requests. Primary path is Apple Declared Age Range on device; production
fails closed when unavailable. Development may self-attest only outside
production. Demo mode is exempt. Composed with one-way blocks (022).

### User-visible impact

- After onboarding, signed-in users hit **Confirm you are 18 or older**.
- System age-range sheet when the native module is available.
- Not adult / declined → access denied copy (no real matching).

### Developer impact

- Module `litmo-age-range` (Swift + Expo)
- Migration `023_age_eligibility_gate.sql`
- Auth status `age_gate`; `/onboarding/age-gate`
- ADR 0025; entitlement `com.apple.developer.declared-age-range`
- `discovery_profiles` / `request_session` require adult + not blocked

### Migration and setup impact

`npm run db:reset`. Seed users are marked adult for local tests. Real device
check needs a dev build (not Expo Go) with the capability enabled.

### Related decision and roadmap

- `docs/adr/0025-apple-declared-age-range-gate.md`

## 2026-07-12 — Chapter 5: one-way user blocks

### Summary

First Trust & Moderation slice: immediate, non-disclosing one-way blocks that
hide people from discovery and block session requests in either direction.
Pending requests between the pair are cancelled.

### User-visible impact

- **Block** on a match profile (signed-in only).
- Settings → **Blocked accounts** with private unblock.
- Blocked users are not told who blocked them.
- Requesting a blocked account fails with the same opaque “not available”
  message as a missing profile.

### Developer impact

- Migration `022_user_blocks.sql`
- `blockService`; `/security/blocked`
- pgTAP `user_blocks.test.sql`; ADR 0024; `CHAPTER_5_NEXT_STEPS.md`

### Migration and setup impact

`npm run db:reset` (or apply 022).

### Related decision and roadmap

- `docs/adr/0024-one-way-user-blocks.md`
- `docs/roadmap/CHAPTER_5_TRUST_AND_MODERATION.md`

## 2026-07-12 — Pre-activation review expiration and Chapter 4 completion

### Summary

Pre-activation sessions (`accepted` / `consent_pending` / `ready`) now expire
24 hours after review starts (same check-on-read pattern as request expiry).
Home open-session cards show the review deadline. Chapter 4 engineering is
documented as complete with explicit deferred gaps.

### User-visible impact

- Abandoned consent reviews fail closed after a day; Home resume cards drop them.
- Open consent cards show when the review expires.
- Active sessions are not auto-expired.

### Developer impact

- Migration `021_preactivation_expiry.sql` — `preactivation_deadline`,
  `list_open_sessions` + `transition_session` expiry
- pgTAP `session_preactivation_expiry.test.sql`
- ADR 0023; `docs/CHAPTER_4_COMPLETION.md`

### Migration and setup impact

`npm run db:reset` (or apply 021).

### Related decision and roadmap

- `docs/adr/0023-preactivation-review-expiration.md`
- `docs/CHAPTER_4_COMPLETION.md`

## 2026-07-12 — Ready-session resume and consent cancel watch

### Summary

Resuming a `ready` session activates and opens the active timer. Consent
Snapshot watches the session row for counterpart cancel/expire and leaves
cleanly without inventing consent. Integration coverage for cancel + open
session list.

### User-visible impact

- Home “both confirmed” resumes into the active session (after activation).
- If the other person withdraws during consent review, this screen explains
  that nothing will begin and offers Home.

### Developer impact

- Home resume path for `ready` calls `activateSession`
- Consent Snapshot lifecycle subscription for terminal statuses
- Integration test: cancel outgoing + `list_open_sessions`

## 2026-07-12 — Live open-session refresh and match-detail cancel

### Summary

Home open-session cards refresh live when either participant’s session row
changes. Resuming an `accepted` session advances into consent review first.
Match detail stores the real request id so the requester can cancel without
leaving the profile.

### User-visible impact

- Home resume list updates when the counterpart accepts or a session ends.
- “Begin consent review” from Home moves `accepted → consent_pending` when possible.
- After sending a request from a match profile, **Cancel this request** appears.

### Developer impact

- `sessionRepository.subscribeToParticipantSessions`
- Home resume calls `beginConsentReview` for `accepted`
- Match detail keeps `sessionId` from `requestSession` for cancel

### Related decision and roadmap

- Builds on ADR 0021 / 0022
- `docs/CHAPTER_4_NEXT_STEPS.md`

## 2026-07-12 — Open-session resume and pre-activation withdraw UI

### Summary

Participants can resume mid-lifecycle sessions from Home after restart.
Consent Snapshot “No” now withdraws real sessions via the existing
reason-free authority. Active sessions re-sync on foreground and show a
display-only connectivity note when the server is unreachable.

### User-visible impact

- Home lists open `accepted` / `consent_pending` / `ready` / `active` sessions
  with resume actions that do not invent consent.
- Choosing “No” on a real Consent Snapshot cancels pre-activation consent.
- Active session warns when connection is uncertain without disabling Soft Signal.

### Developer impact

- Migration `020_list_open_sessions.sql`
- `sessionRepository.listOpenSessions` / `withdrawConsent`
- pgTAP `session_open_list.test.sql`; ADR 0022

### Migration and setup impact

`npm run db:reset` (or apply migration 020).

### Related decision and roadmap

- `docs/adr/0022-open-session-resume-and-preactivation-withdraw.md`
- `docs/roadmap/CHAPTER_4_SESSION_LIFECYCLE.md` (connectivity and recovery)

## 2026-07-12 — Outgoing requests, cancel, and local request alert

### Summary

Requesters can list and cancel pending session requests. Recipients get a
privacy-safe local notification when a new request arrives (Realtime INSERT),
without revealing names or consent details.

### User-visible impact

- Session requests screen shows **Incoming** and **Outgoing**.
- **Cancel request** withdraws a pending ask (no explanation required).
- A new incoming request can raise a local device notification: “Open Litmo
  for a private update.”

### Developer impact

- Migration `019_outgoing_requests.sql` — `list_outgoing_requests()`
- `sessionRepository.listOutgoingRequests` / `cancelRequest`
- `notifyPrivateUpdate()`; Realtime callback now passes `INSERT` | `UPDATE`
- pgTAP `session_outgoing_requests.test.sql`; ADR 0021

### Migration and setup impact

Run `npm run db:reset` (or apply migration 019) for local Supabase.

### Related decision and roadmap

- `docs/adr/0021-outgoing-requests-and-local-request-alert.md`
- `docs/roadmap/CHAPTER_4_SESSION_LIFECYCLE.md` (cancel requests)

## 2026-07-12 — Durable offline retry for End together

### Summary

"End together" now queues a durable Keychain pending action when the network
fails, and retries on the next signed-in restore — matching Soft Signal and
wrap-up recovery. Permanent invalid transitions clear the queue instead of
retrying forever.

### User-visible impact

If mutual end fails only because of connectivity, the completion intent is
kept and applied when the app can reach Supabase again. A session that was
never active still fails closed without a false "will retry" promise.

### Developer impact

- `sessionCompleteService` / `sessionCompleteServiceCore` + Keychain storage
- `AuthContext` restore reconciles completion after emergency stop
- ADR 0020; unit tests for queue, permanent failure, and reconcile

### Related decision and roadmap

- `docs/adr/0020-session-complete-offline-retry.md`
- `docs/roadmap/CHAPTER_4_SESSION_LIFECYCLE.md` (connectivity and recovery)

## 2026-07-12 — Incoming session-request Realtime

### Summary

Signed-in recipients now see new session requests without manually reopening
the requests screen. Home shows a live pending count; `/requests` quietly
reloads when a request is created or changes.

### User-visible impact

While signed in with Home or Session requests open, a new request from another
participant appears without a pull-to-refresh. Accepting still only begins
consent review — Realtime never grants consent.

### Developer impact

- `sessionRepository.subscribeToIncomingRequests` (INSERT + UPDATE on
  `sessions` filtered by `user_b`, reusing migration 016's publication).
- No new migration.
- ADR 0019.

### Related decision and roadmap

- `docs/adr/0019-incoming-request-realtime.md`
- `docs/CHAPTER_4_NEXT_STEPS.md`

## 2026-07-12 — Demo path body-zone step and practice session request

### Summary

Completed two phone-visible vertical-slice gaps that still interrupted the
Expo Go walkthrough: interactive body-zone boundary setup (local only) and a
clearly labeled practice session-request step in demo mode.

### User-visible impact

- After Touch Language in demo mode, users set Welcomed / Ask first / Off
  limits for hands, shoulders, upper back, and torso before discovery.
- Match detail in demo offers **Practice requesting a session** (nothing is
  sent) and continues into the mock Consent Snapshot.
- Learning module TypeScript strictness fixes unblocked `app` typecheck on
  the same path (pre-existing strict-null errors).

### Related decision and roadmap

- `docs/roadmap/PHONE_VISIBLE_VERTICAL_SLICE.md`
- `docs/adr/0003-demo-mode-entry-point.md`

## 2026-07-12 — Expo Go / backend-free demo path unblocked

### Summary

Unblocked the phone-visible fictional demo on a physical iPhone through Expo
Go without Docker or Supabase. Missing env no longer hard-fails the app, and
mandatory Face ID now applies only to real account sessions (not demo /
pre-account exploration).

### User-visible impact

- Welcome → entry → **"Enter the fictional demo"** works with no `app/.env`.
- Demo mode no longer requires Face ID or a development build.
- Real sign-in still requires Supabase config; when env is missing, sign-in is
  disabled with an honest notice and demo remains available.
- Restored or newly signed-in accounts still fail closed behind Face ID.

### Developer impact

- `AuthContext` restores as `locked` when Supabase URL/anon key are missing.
- `biometricRequiredForAuthStatus` + `BiometricLockProvider` under `AuthProvider`.
- Sensitive screens skip step-up Face ID in demo via the same gate.
- Docs: ADR 0007 amendment, `LOCAL_DEVELOPMENT.md`, `KNOWN_LIMITATIONS.md`.

### Related decision and roadmap

- `docs/adr/0003-demo-mode-entry-point.md`
- `docs/adr/0007-mandatory-face-id-lock.md`
- `docs/roadmap/PHONE_VISIBLE_VERTICAL_SLICE.md`

## 2026-07-12 — Two-client Chapter 4 lifecycle integration test

### Summary

Added the deterministic two-client Chapter 4 integration scenario the
roadmap requires: request → accept → dual Consent Snapshot confirmation →
activation → Soft Signal → independent private wrap-ups, against local
Supabase. Fixed a pre-existing service-role SELECT grant gap that made
trusted snapshot creation fail closed before any snapshot could be computed.

### User-visible impact

None directly. The same trusted snapshot path the mobile app uses is now
exercised end-to-end by automation; service-role read grants unblocked the
backend repository that was already documented in ADR 0006.

### Developer impact

- `integration/chapter4-session-lifecycle.test.mjs` — two authenticated
  clients exercise the existing RPC and snapshot-service boundaries.
- `scripts/run-integration.mjs` — also supplies `SUPABASE_SERVICE_ROLE_KEY`
  from local `supabase status` when unset.
- Migration `018_service_role_snapshot_read_grants.sql` — `SELECT` only for
  `service_role` on `sessions`, `touch_profile_versions`, and
  `consent_preference_versions` (no authenticated privilege change).

### Migration and setup impact

Run `npm run db:reset` to apply migration 018. Verify with
`npm run test:integration` (requires local Supabase).

### Related decision and roadmap

- `docs/adr/0006-snapshot-computation-and-persistence-boundary.md`
- `docs/roadmap/CHAPTER_4_SESSION_LIFECYCLE.md`
- `docs/CHAPTER_4_NEXT_STEPS.md`

## 2026-07-12 — Request expiration and visible deadlines

### Summary

Implemented Chapter 4's unanswered-request expiration policy. A `requested`
session now expires after 24 hours, stale requests no longer block a fresh
request between the same two people forever, and the incoming-requests screen
shows each request's deadline.

### User-visible impact

Incoming requests now show when they expire. Opening the requests screen clears
out stale requests automatically, and responding after the deadline fails
closed instead of silently reviving old intent.

### Developer impact

Added migration 017 with `request_expires_at(...)`,
`list_incoming_requests()`, and stale-request handling inside both
`request_session(...)` and `transition_session(...)`. The mobile repository now
lists requests through the RPC boundary instead of reading `sessions`
directly, and it treats a stale response as a validation failure after the
database has already persisted the terminal `expired` state. Added
`supabase/tests/session_request_expiration.test.sql` and updated the verified
pgTAP count from 101 to 111.

### Migration and setup impact

Run `npm run db:reset` to apply migration 017. Verified locally with
`npm --workspace app run typecheck`, `npm run lint`, a clean `db:reset`, and
`env HOME=/tmp npx supabase test db` passing 111/111 assertions.

### Related decision and roadmap

- `docs/adr/0018-request-expiration-check-on-read.md`
- `docs/roadmap/CHAPTER_4_SESSION_LIFECYCLE.md`

## 2026-07-12 — Wrap-up offline retry, precise pending-sync copy, snapshot-wait Realtime

### Summary

Closed three remaining small gaps from `docs/CHAPTER_4_NEXT_STEPS.md`: wrap-up submissions now durably retry after a network failure, the "pending-sync" wrap-up copy no longer conflates a real network failure with a session that was never activated, and the consent-snapshot "waiting for the other person" state updates live via Realtime instead of needing a manual recheck.

### User-visible impact

A wrap-up reflection is never lost to a flaky connection — it retries automatically next app launch. Ending a session together shows accurate copy depending on what actually happened. Confirming a snapshot while waiting on the other participant now proceeds automatically the moment they confirm.

### Developer impact

`sessionWrapupServiceCore.submit` now returns `{status: "saved"|"pending_sync"}` instead of throwing on network failure, with a new `reconcile()` wired into `AuthContext.tsx` alongside the existing `emergencyStopService.reconcile()`. Added `pendingWrapupStorage` (Keychain). Fixed `mapExternalError` to map Postgres errcode `55000` to non-retryable `validation_failed` — previously it fell into the generic always-retryable fallback, making a genuine state error indistinguishable from a real network failure. `session/active.tsx`'s `endTogether()` now branches on `error.retryable` to choose between `ended=not-active` and `ended=pending-sync`.

### Migration and setup impact

No new migration. Typecheck, 51 app tests (up from 46), lint, integration test, and a clean `db:reset` with 101/101 pgTAP all pass.

### Related decision and roadmap

- `docs/adr/0017-wrapup-offline-retry-and-remaining-realtime-gaps.md`
- `docs/CHAPTER_4_NEXT_STEPS.md`

## 2026-07-12 — Real session timer and Realtime updates

### Summary

Replaced `/session/active`'s fake local timer with a real one computed from `sessions.started_at`, and added a Realtime subscription so one participant sees the other's Soft Signal or completion without a manual refresh.

### User-visible impact

The elapsed timer on a real session now reflects actual activation time and survives backgrounding correctly. Ending a session on one device now automatically navigates the other participant's screen to wrap-up.

### Developer impact

Migration 016: `transition_session(...)` now sets `started_at` on `ready -> active`, and `sessions`/`session_events` are added to the `supabase_realtime` publication. Added `sessionRepository.getSession`/`subscribeToSession`. One new pgTAP assertion (101 total). See `docs/adr/0016-session-realtime-and-real-timer.md` for the full design, including a documented same-device double-navigation guard.

### Migration and setup impact

Run `npm run db:reset` to apply migration 016. Typecheck, 46 app tests, lint, integration test, and a clean `db:reset` with 101/101 pgTAP all pass.

### Related decision and roadmap

- `docs/adr/0016-session-realtime-and-real-timer.md`
- `docs/CHAPTER_4_NEXT_STEPS.md`

## 2026-07-12 — Dual-confirmation verified on-device; backend architecture decision

### Summary

The founder manually verified two-participant snapshot confirmation on-device: both sides confirmed, and the session correctly reached `active`. This closes Chapter 4's request/accept/confirm/activate chain end to end.

### User-visible impact

None (verification only, no code change).

### Developer impact

Decision recorded: the Express backend + LAN-address approach for snapshot creation stays as-is for now (single-developer, single-device local testing). Revisit moving `createConsentSnapshot` into a Supabase Postgres/Edge function specifically when scaling past the founder's own iPhone.

### Related decision and roadmap

- `docs/adr/0015-session-request-creation-and-recipient-authorization.md`
- `docs/CHAPTER_4_NEXT_STEPS.md`

## 2026-07-12 — Real snapshot creation and confirmation wiring

### Summary

`consent-snapshot.tsx` now calls the real backend snapshot-creation endpoint and `confirm_session_snapshot`/`transition_session` when a real session id is present, instead of only navigating forward locally.

### User-visible impact

A real accepted session can now progress through actual snapshot confirmation. If the other participant hasn't confirmed yet, the screen shows an honest "waiting for the other person" state (no Realtime auto-refresh yet — manual "Check again").

### Developer impact

Added `sessionRepository.createSnapshot`/`confirmSnapshot`/`activateSession`, and `runtimeConfig.backendUrl`/`EXPO_PUBLIC_BACKEND_URL` (must be a LAN address on a physical device, same as `EXPO_PUBLIC_SUPABASE_URL`). Seeded version-1000 profile-version rows for all four demo accounts so snapshot creation doesn't fail closed on missing profile data; fixed a resulting test fragility in `snapshot_invalidation.test.sql` (a hardcoded absolute version number) to look up the latest version dynamically instead. Fixed stale password-based demo-account docs in `docs/LOCAL_DEVELOPMENT.md` (sign-in has been passkey-only since ADR 0010).

### Migration and setup impact

No new migration (seed data only). Typecheck, 46 app tests, lint, and a clean `db:reset` with 100/100 pgTAP plus the integration test all pass.

### Related decision and roadmap

- `docs/adr/0015-session-request-creation-and-recipient-authorization.md`
- `docs/LOCAL_DEVELOPMENT.md`

## 2026-07-12 — Free-tier local build fix and on-device verification

### Summary

A free Apple "Personal Team" cannot use the Associated Domains capability that passkey sign-in (ADR 0010) requires, blocking every local build once the requester passed re-authentication. Added an `app.config.ts` flag (`LITMO_FREE_TIER_BUILD=1`) that omits Associated Domains for local free-tier builds only, keeping it for real (paid-team/EAS) builds.

### User-visible impact

Local builds on a free Apple account work again; passkey sign-in specifically does not function in that build (demo mode and everything else does), matching the existing Push Notifications trade-off.

### Developer impact

Fixed a bug caught before landing: the first version only skipped adding an `associatedDomains` override, but `app.json`'s hardcoded value leaked through via the `...base.expo.ios` spread regardless; fixed by destructuring it out first. Verified end to end: `LITMO_FREE_TIER_BUILD=1 npx expo prebuild --platform ios` + `pod install` + `xcodebuild` succeeded, and the app installed and launched on the physical device (confirmed by the founder), verifying this session's request/accept/decline UI on-device.

### Migration and setup impact

No migration. See `docs/MACHINE_SETUP.md` and `docs/KNOWN_LIMITATIONS.md` for the flag and its trade-off.

### Related decision and roadmap

- `docs/adr/0015-session-request-creation-and-recipient-authorization.md`

## 2026-07-12 — Connect an accepted request to consent review

### Summary

Accepting an incoming request now advances the session (`accepted -> consent_pending`, best-effort) and navigates into the consent-snapshot screen with the real session id, which now forwards it into `/session/active`.

### User-visible impact

None fully end-to-end yet: a real session correctly reaches `consent_pending` but the flow visibly breaks down after that, since reaching `active` needs snapshot creation/confirmation that isn't wired (see the ADR 0015 addendum and `docs/CHAPTER_4_NEXT_STEPS.md` for the precise, honest account of what happens and why — it fails closed with a real backend error, not a fabricated success).

### Developer impact

Added `sessionRepository.beginConsentReview` and `mockConsentProfiles.ts`'s `personaIdForUserId` (inverse of `personaUserId`). `consent-snapshot.tsx` accepts and forwards an optional `sessionId` param.

### Migration and setup impact

No new migration. Typecheck, 46 app tests, lint all pass.

### Related decision and roadmap

- `docs/adr/0015-session-request-creation-and-recipient-authorization.md`
- `docs/CHAPTER_4_NEXT_STEPS.md`

## 2026-07-12 — Mobile session request, accept, and decline UI

### Summary

Wired the mobile side of migration 015's request/response boundary: a "Request a session" action on the match screen, and a new incoming-requests screen with Accept/Decline.

### User-visible impact

Signed-in (non-demo) users can send a real session request from a match's detail screen, and see + respond to incoming requests from a new "Session requests" link on the home tab. Demo mode shows an honest explanation instead, matching the established pattern from wrap-up wiring (ADR 0014).

### Developer impact

Added `sessionRepository.requestSession`/`respondToRequest`/`listIncomingRequests`. `app/data/mockConsentProfiles.ts`'s persona-to-UUID map is now exported (`personaUserId`) so the match screen can resolve a real recipient id. The requests screen resolves requester display names via the existing `discovery_profiles()` RPC.

### Migration and setup impact

No new migration. Typecheck, 46 app / 60 shared / 12 backend tests, lint, and a clean `db:reset` with 100/100 pgTAP all pass. On-device build verification was blocked by an expired free-tier Xcode Apple ID sign-in (environment issue, unrelated to this change) — see the addendum in `docs/adr/0015-session-request-creation-and-recipient-authorization.md`.

### Related decision and roadmap

- `docs/adr/0015-session-request-creation-and-recipient-authorization.md`
- `docs/CHAPTER_4_NEXT_STEPS.md`

## 2026-07-12 — Session request creation and recipient-only response authorization

### Summary

Added `request_session(...)`, the first authenticated write path that can create a `sessions` row at all, and narrowed `transition_session(...)` so only the recipient (not the requester) can accept or decline a request.

### User-visible impact

None yet: no mobile screen calls `request_session` yet. This lands the database boundary a future "request a session" UI will call.

### Developer impact

`request_session(p_recipient_id, p_idempotency_key)` establishes the requester-becomes-`user_a`/recipient-becomes-`user_b` convention, creates the session directly at `requested`, and returns an existing non-terminal session between the same two people (in either direction) instead of creating a duplicate. `transition_session(...)` now requires the actor to be `user_b` for `requested -> accepted`/`declined` specifically; every other edge's authorization is unchanged. Twelve new pgTAP assertions in `supabase/tests/session_requests.test.sql` (100 total, up from 88); `supabase/tests/session_lifecycle.test.sql`'s 144-pair matrix now runs as the recipient so it continues to exercise every graph edge, including the two newly restricted ones. Fixed a regression caught before commit: the new migration's first draft was based on migration 008's superseded `transition_session` body rather than 011's current one, which would have silently dropped the `ready -> consent_pending` edge and the `material_profile_change` metadata trigger value 011 had added.

### Migration and setup impact

Run `npm run db:reset` to apply migration 015. Verified with a clean local reset, 100/100 pgTAP assertions, and typecheck/test/lint all green.

### Related decision and roadmap

- `docs/adr/0015-session-request-creation-and-recipient-authorization.md`
- `docs/roadmap/CHAPTER_4_SESSION_LIFECYCLE.md`
- `docs/CHAPTER_4_NEXT_STEPS.md`

## 2026-07-12 — Wrap-up mobile wiring and real session completion

### Summary

Wired the previously mock-only wrap-up screen to the persisted `submit_session_wrapup(...)` boundary from ADR 0008, and made "End together" call `transition_session(..., 'completed')` first so a real session actually reaches the terminal state that function requires.

### User-visible impact

The wrap-up screen now presents the real five-outcome canonical enum (`completed_comfortably`, `ended_normally`, `soft_signal_used`, `felt_uncomfortable`, `safety_concern`) plus an optional private note, instead of three ad hoc mock labels. In demo mode or without a real session ID, the screen still shows the real outcomes but says explicitly that nothing is saved.

### Developer impact

Added `sessionWrapupServiceCore.ts`/`sessionWrapupService.ts` (pure core plus platform wiring, matching `emergencyStopServiceCore.ts`'s pattern) and `sessionRepository.completeSession(...)`. The private note is encrypted client-side via the existing `sensitiveDataService` vault before submission, matching migration 013's mandatory encrypted-envelope constraint. Three new unit tests for the pure core (46 app tests total, up from 43); typecheck, format, and the full 88-assertion pgTAP suite remain green.

### Migration and setup impact

No new migration. No caller yet threads a real `sessionId` into `/session/active` — that remains separately tracked follow-up work in `docs/CHAPTER_4_NEXT_STEPS.md`, so live demo behavior otherwise proceeds exactly as before.

### Related decision and roadmap

- `docs/adr/0008-private-session-wrapups.md`
- `docs/adr/0014-wrap-up-mobile-wiring.md`
- `docs/CHAPTER_4_NEXT_STEPS.md`

## 2026-07-12 — TestFlight and production-readiness hardening

Added explicit development/staging/production bundle/domain profiles, production-disabled demo/diagnostics surfaces, automated release validation, a non-sensitive diagnostics screen, privacy-policy draft, and structured TestFlight/release/rollback plan. Automated hardening passes with synthetic release variables; hosted services, deletion operations, reviewed onboarding/privacy disclosures, signed archive, and physical-device plan remain explicit blockers, so TestFlight readiness is not claimed.

## 2026-07-12 — Consent withdrawal and offline emergency stop

Added a reason-free, single-party transactional withdrawal authority and an offline-first mobile emergency stop. Migration 014 serializes against activation, clears confirmations, terminalizes the session, and writes one idempotent minimal audit event. Mobile disables locally, locks decrypted state, persists only a Keychain request identifier/session identifier, and reconciles after connectivity returns. ADR 0012 documents atomicity, privacy, race behavior, and remaining Realtime/push limitations.

## 2026-07-12 — Sensitive-data encryption and privacy-safe storage

Added a CryptoKit AES-256-GCM vault with versioned biometric-current-set Keychain keys, a locked application decrypt boundary, encrypted private profile/wrap-up note persistence, recursive diagnostic redaction, and generic notification content. Migration 013 rejects plaintext highly sensitive notes while preserving RLS, immutable snapshots, and server session authority. ADR 0011 and `docs/SENSITIVE_DATA_ENCRYPTION.md` document classification, hierarchy, rotation, recovery, backup behavior, and residual risk.

## 2026-07-12 — Participant-private immutable session wrap-ups

### Summary

Added owner-only post-session check-ins with enumerated outcomes, bounded private notes, terminal-session validation, and immutable idempotent submission through migration 012 and ADR 0008.

### User-visible impact

Each participant can eventually record a private outcome without exposing it to the counterpart or creating a public rating. Mobile wiring is still pending.

### Developer impact

`submit_session_wrapup(...)` is the only authenticated write path. Direct writes are denied, a counterpart reads zero rows, retries return the first result without mutation, and non-participants receive an opaque denial. Ten pgTAP assertions cover privacy, authorization, lifecycle gating, and idempotency.

### Migration and setup impact

Run `npm run db:reset` to apply migration 012. Verified with a clean local reset, 59/59 pgTAP assertions, and database lint with no schema errors.

### Related decision and roadmap

- `docs/adr/0008-private-session-wrapups.md`
- `docs/roadmap/CHAPTER_4_SESSION_LIFECYCLE.md`

## 2026-07-12 — Transactional snapshot invalidation after profile edits

### Summary

Completed the persisted Consent Snapshot boundary: a material touch/consent profile edit now invalidates affected unwithdrawn pre-activation snapshots, clears their confirmations, and audits the change atomically. The canonical graph adds the conservative `ready -> consent_pending` edge so displayed lifecycle state cannot imply that stale confirmations remain current.

### User-visible impact

A session that had been ready cannot activate from stale consent after either person changes a material preference. Both people must review and confirm a replacement snapshot computed from the latest exact versions.

### Developer impact

Migration 011 extends `consent_snapshots` with paired invalidation actor/time fields, hardens confirmation and activation checks, and integrates invalidation into `save_profile_versions(...)`. The domain suite adds the new edge test; pgTAP adds nine invalidation/replacement assertions and updates the exhaustive 144-pair SQL graph matrix.

### Migration and setup impact

Run `npm run db:reset` to apply migration 011. Verified with a clean local reset, 49/49 pgTAP assertions, and database lint with no schema errors.

### Related decision and roadmap

- `docs/adr/0005-session-lifecycle-state-machine.md`
- `docs/adr/0006-snapshot-computation-and-persistence-boundary.md`
- `docs/roadmap/CHAPTER_4_SESSION_LIFECYCLE.md`

## 2026-07-12 — Trusted canonical snapshot creation adapter

### Summary

Added an authenticated Express route and injected service/repository boundary that loads both session participants' latest immutable profile versions, computes the canonical Consent Snapshot with `@litmo/domain`, and persists it only through the service-role-only `create_session_snapshot(...)` function.

### User-visible impact

None yet. The mobile session flow remains demo-only; this establishes the trusted server boundary it will call.

### Developer impact

`POST /api/sessions/:sessionId/snapshot` requires a Supabase bearer token. Missing authentication, stranger-owned sessions, invalid or divergent profiles, ineligible overlap, unavailable configuration, and storage errors fail closed with stable public codes. Four focused tests cover successful exact-version persistence, authentication short-circuiting, opaque participant denial, private-note exclusion, and profile-version divergence.

### Migration and setup impact

No database migration. The backend process needs server-only `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`; `backend/.env.example` and `docs/LOCAL_DEVELOPMENT.md` document local setup. Existing demo and mobile configuration are unchanged.

### Related decision and roadmap

- `docs/adr/0006-snapshot-computation-and-persistence-boundary.md`
- `docs/roadmap/CHAPTER_4_SESSION_LIFECYCLE.md`

## 2026-07-12 — Passkey-first iOS authentication

### Summary

Replaced app-owned password creation/sign-in with bootstrap-only email OTP, mandatory Apple passkey registration, and discoverable passkey sign-in. Moved Supabase sessions from AsyncStorage to the passcode-required, this-device-only Keychain and added hashed installation registration, verification, rotation, and revocation.

### User-visible impact

People create no password. Apple performs device-owner verification for routine sign-in. Restored tokens without a local device secret and revoked installations fail closed; revoking the current installation signs out immediately. Demo mode remains account-free.

### Developer impact

Added the `LitmoPasskeys` Swift Expo module, Expo SecureStore/Crypto, explicit auth states, recovery and device-management screens, Associated Domains/AASA configuration, migration 010, 3 device-service tests, 5 passkey-service tests, and 12 pgTAP device assertions. Crash recovery repaired device-secret generation, corrupt-storage handling, revoked-device re-registration, and native/lockfile consistency.

### Migration and setup impact

Apply migration 010 and enable the Supabase passkey/WebAuthn configuration. Serve the AASA file at the documented HTTPS path and use a development/distribution build; Expo Go cannot host the native module. `npx pod-install` regenerated Pods after dependency changes.

### Related decision and roadmap

- `docs/adr/0010-passkey-first-authentication.md`
- `docs/PASSKEY_AUTHENTICATION.md`

## 2026-07-12 — Mandatory Face ID security lock

### Summary

Added a centralized biometric service/controller using Apple's biometric-only policy, mandatory launch and 30-second resume locks, native and React privacy covers, fail-closed availability/error states, and fresh step-up authentication for private session, Consent Snapshot, settings, and consent-history routes. Added seven reducer/timing/race tests and ADR 0007.

### User-visible impact

Litmo remains fully covered until Face ID succeeds. Unsupported, unenrolled, locked-out, failed, or cancelled Face ID never falls through to app content and always offers a visible evergreen retry button.

### Developer impact

Added `expo-local-authentication` ~55.0.15, `NSFaceIDUsageDescription`, native pod linkage, a reproducible SceneDelegate privacy cover in the existing config plugin, and centralized step-up gating. Face ID requires a development/standalone build and cannot be tested in Expo Go.

### Migration and setup impact

Run `npm install` and `cd app/ios && pod install`. Physical-device testing now requires a Face ID iPhone and development/standalone build.

### Related decision

- `docs/adr/0007-mandatory-face-id-lock.md`

## 2026-07-12 — Chapter 4: persisted Consent Snapshots

### Summary

Added service-owned canonical snapshot persistence, participant-private exact-fingerprint confirmations, pre-activation withdrawal, and a database-level activation guard in migration 009. Added ADR 0006 for the trusted-engine/PostgreSQL responsibility split and 15 pgTAP assertions; the database total is now 40.

### User-visible impact

None yet. Mobile session screens remain isolated demo adapters, but the server now has the safety boundary they will eventually call.

### Developer impact

Only `service_role` can create a snapshot after trusted `@litmo/domain` computation. Participants can confirm or withdraw through dedicated functions, cannot write tables directly, and cannot read the counterpart's confirmation.

### Migration and setup impact

Run `npm run db:reset`, then `npx supabase test db`. The legacy `consent_records` table remains inert; no destructive migration is performed.

### Related decision and roadmap

- `docs/adr/0006-snapshot-computation-and-persistence-boundary.md`
- `docs/roadmap/CHAPTER_4_SESSION_LIFECYCLE.md`

## 2026-07-12 — Chapter 4: transactional session transitions

### Summary

Added migration `008_transition_session.sql`, the sole authenticated write boundary for lifecycle state changes. It applies participant authorization, row locking, graph validation, session-scoped idempotency, atomic audit insertion, and constrained privacy-safe metadata. The SQL test now exercises all 144 state pairs against the canonical graph and covers replay, authorization, RLS visibility, direct-write denial, and audit contents.

### User-visible impact

None yet; mobile session screens still use isolated demo state. This establishes the durable server authority they will call later.

### Developer impact

Authenticated clients may execute `transition_session(...)` but still cannot directly insert or update `sessions` or `session_events`. The function currently permits either participant to invoke any graph-valid edge; transition-specific requester/recipient/system roles remain deliberately unimplemented until request creation and expiration are designed.

### Migration and setup impact

Run `npm run db:reset` to apply migration 008. `npx supabase test db` now runs 25 pgTAP assertions across the RLS and lifecycle files (17 lifecycle assertions, including the exhaustive transition matrix).

### Related decision and roadmap

- `docs/adr/0005-session-lifecycle-state-machine.md`
- `docs/roadmap/CHAPTER_4_SESSION_LIFECYCLE.md`

## 2026-07-12 — Bundled display typography and welcome artwork

### Summary

Replaced device-dependent Georgia headings with bundled Cormorant Garamond Italic, reserved bundled Beau Rivage for Litmo identity marks, and added a calm decorative wallpaper to the welcome screen. The root layout now provides a visible font-loading state and retains a system-font fallback if a local asset fails.

### User-visible impact

The welcome, onboarding, discovery, session wrap-up, and trust-history surfaces now share a consistent display voice across Expo Go and standalone iOS builds. Body text remains in the platform sans-serif for legibility, and the wallpaper carries no product or safety meaning.

### Developer impact

Display-family names are centralized in `app/theme.ts`; font and wallpaper files live under `app/assets`. `expo-font` is now an explicit SDK-55-compatible app dependency rather than an accidental transitive import.

### Migration and setup impact

Run `npm install` after pulling. No environment variable or network-at-runtime requirement was added.

### Related documentation

- `docs/FIRST_PLAYABLE.md`
- `docs/roadmap/PHONE_VISIBLE_VERTICAL_SLICE.md`

## 2026-07-12 — Chapter 4: session schema and audit trail (branch: agent/chapter-4-session-lifecycle)

### Summary

First database-backed slice of Chapter 4, on its own branch. Migration `007_session_lifecycle.sql` replaces the Chapter 1/2-era `sessions.status` values with the canonical twelve-state list already defined and tested in `shared/src/sessionLifecycle.ts` (ADR 0005), and adds `session_events`, the append-only audit trail table the roadmap requires. Also fixes the same missing-`GRANT` bug found earlier today on the `sessions` table itself.

### User-visible impact

None yet.

### Developer impact

New migration `supabase/migrations/007_session_lifecycle.sql`. New `supabase/tests/session_lifecycle.test.sql` (6 pgTAP assertions; repo pgTAP total now 14). Deliberately no `INSERT`/`UPDATE` grant on `sessions` or `session_events` yet — direct writes are rejected outright and tested as such, since only a future server-side transition function should ever be allowed to write these rows.

### Migration and setup impact

`npm run db:reset` picks up migration 007 automatically. The old `sessions` table had no rows and was never wired to a shipped feature, so this is a clean schema replacement, not a data migration.

### Related decision and roadmap

- `docs/adr/0005-session-lifecycle-state-machine.md` (see its "Update" section)
- `docs/roadmap/CHAPTER_4_SESSION_LIFECYCLE.md`

## 2026-07-12 — Fixed missing table grants; Chapter 2's Docker-blocked checks now pass

### Summary

Docker was installed and local Supabase run for the first time since Chapter 2. This immediately surfaced a real bug: migration 005's RLS policies existed for `profiles`, `onboarding_progress`, `touch_profile_versions`, and `consent_preference_versions`, but none of those tables had an underlying table-level `GRANT` to `authenticated`. Postgres denies access at the grant level before RLS is even evaluated, so every signed-in user got "permission denied" on all four tables — in the real app, not just in a test that had never actually been run. Fixed in `supabase/migrations/006_grant_authenticated_table_privileges.sql`.

Also fixed a test-correctness bug this uncovered: `supabase/tests/rls.test.sql` expected rewriting a historical `touch_profile_versions` row to raise the `prevent_version_mutation` trigger's exception. With no `UPDATE` RLS policy at all, Postgres denies row visibility for that command before the trigger ever runs — the statement succeeds but affects zero rows, which is a stronger protection, not a weaker one, but doesn't match `throws_ok`'s expectation. Rewrote the assertion to check that zero rows were actually changed instead.

### User-visible impact

None to already-shipped behavior — this fixes a bug that was blocking real Supabase-backed usage (sign-up, onboarding, profile save) from ever working correctly, which had gone undetected because the tests that would have caught it were never run in this environment until now.

### Developer impact

New migration `006_grant_authenticated_table_privileges.sql`. `supabase/tests/rls.test.sql` grew from 7 to 8 assertions. All previously Docker-blocked checks now pass: `npm run db:lint`, `npx supabase test db` (8/8), `npm run test:integration`. Full details and updated status tables in `docs/CHAPTER_2_COMPLETION.md` and `docs/KNOWN_LIMITATIONS.md`.

### Migration and setup impact

Anyone running `npm run db:reset` picks up migration 006 automatically. No application code changes needed.

### Related decision and roadmap

- `docs/CHAPTER_2_COMPLETION.md`
- `docs/KNOWN_LIMITATIONS.md`
- `docs/SECURITY_MODEL.md`

## 2026-07-11 — Machine setup bootstrap script and disaster-recovery doc

### Summary

Added `scripts/bootstrap-macos-dev-env.sh` and `docs/MACHINE_SETUP.md` so a fresh Mac (new laptop, wiped disk) can be brought up for Litmo development without rediscovering the several real, non-obvious issues hit while setting this machine up: a CocoaPods crash from a missing UTF-8 locale, a broken `docker` CLI symlink when Docker Desktop is installed off the default `/Applications` path, and the `expo-build-properties`/npm-hoisting conflict.

### User-visible impact

None to the app. `npm run bootstrap` checks Homebrew, Node version, CocoaPods, locale configuration, Xcode, and the Docker CLI, fixing what it safely can and printing the manual steps (Xcode/Docker Desktop installation, Apple/Expo account logins) that genuinely require interactive, credentialed steps.

### Developer impact

New `scripts/bootstrap-macos-dev-env.sh` (idempotent, safe to re-run) and `docs/MACHINE_SETUP.md`. New `npm run bootstrap` script. Linked from `docs/LOCAL_DEVELOPMENT.md`.

### Migration and setup impact

None to existing setups. Verified by running the script twice against this already-configured machine and confirming the second run reports everything already satisfied rather than re-applying changes.

### Related decision and roadmap

- `docs/MACHINE_SETUP.md`
- `docs/adr/0004-ios-27-beta-build-fixes.md`

## 2026-07-11 — Chapter 4 kickoff: pure session-lifecycle state machine

### Summary

Added `shared/src/sessionLifecycle.ts` (`docs/adr/0005-session-lifecycle-state-machine.md`), the first slice of Chapter 4 (Session Lifecycle): a pure, framework-independent transition graph over the canonical session states already defined by Chapter 3's `ConsentLifecycleState`. Mirrors the approach that worked for Chapter 3 — a testable domain module before any backend/DB wiring.

### User-visible impact

None yet. No screen calls this module in this slice.

### Developer impact

`@litmo/domain` exports `sessionTransitions`, `canTransition`, `transition`, and `isTerminalState`. `transition()` is idempotent for same-state retries (`changed: false`) and fails closed once a session reaches any terminal state, rejecting every further transition including to itself. Shared tests increased from 46 to 59.

### Migration and setup impact

None. Explicitly deferred to a later slice, once local Supabase is available to test against: actor authorization, snapshot-version matching at the `ready -> active` transition, idempotency-key deduplication at the request layer, realtime sync, connectivity recovery, wrap-up independence, and the audit trail's actual persistence.

### Related decision and roadmap

- `docs/adr/0005-session-lifecycle-state-machine.md`
- `docs/roadmap/CHAPTER_4_SESSION_LIFECYCLE.md`

## 2026-07-11 — Reconciled dedicated entry screen with demo-mode plumbing

### Summary

`main` had independently gained a dedicated "choose how to enter" screen (`app/app/entry.tsx`, reached from `app/app/index.tsx`) offering demo mode and account sign-in side by side, authored separately from this branch's `AuthState`/`AuthContext` "demo" status work (`docs/adr/0003-demo-mode-entry-point.md`). Neither alone was functional: the entry screen's buttons didn't change any auth state, and without it the app's launch screen never routed anywhere a signed-out visitor could make that choice. Merged `main` in and reconciled both pieces into one working flow.

### User-visible impact

Launch → "Explore the prototype" → a dedicated screen offering "Enter the fictional demo" (now actually enters demo mode) or "Sign in with an account" (now actually opens sign-in, replacing a permanently-disabled placeholder that said sign-in "is not enabled in this prototype yet" — Chapter 2's real sign-in has worked since before this ADR). Exiting demo mode, or a session expiring, now returns to this same choice screen instead of skipping past it to the sign-in form.

### Developer impact

`protectedRouteFor` (`app/context/authState.ts`) takes a broader `{ inAuthGroup, isPublicRoute }` route descriptor instead of a single boolean; `isPublicRoute` covers the auth group, `"/"`, and `"/entry"`. Signed-out visitors on any other route now land on `/entry` rather than `/auth/sign-in` directly. 3 tests updated, 1 added (23 app tests, up from 22).

### Migration and setup impact

None. Verified with `npm test` (76 total), `npm --workspace app run typecheck`, and `npm run lint`.

### Related decision and roadmap

- `docs/adr/0003-demo-mode-entry-point.md`

## 2026-07-11 — iOS 27 beta Scene-lifecycle and pod deployment-target fixes

### Summary

Running Litmo as a locally-built (non-EAS) standalone Release build on a physical iPhone with an early Xcode 27 / iOS 27 beta surfaced two real bugs: the app crashed instantly on every launch (`EXC_BREAKPOINT` in a UIKit runtime check for missing Scene-lifecycle adoption), and Release builds failed outright because several third-party pods declare a deployment target Xcode 27's SDK no longer accepts. Added `app/plugins/withIOSXcode27Fixes.cjs`, an Expo config plugin, so both fixes survive `expo prebuild` regeneration instead of living only in the generated (and largely untracked) `ios/` folder. Full story in `docs/adr/0004-ios-27-beta-build-fixes.md`.

### User-visible impact

None to the app's behavior. This only affects whether a locally-built standalone iOS binary launches successfully on very new iOS versions.

### Developer impact

New `app/plugins/withIOSXcode27Fixes.cjs`, registered in `app/app.json`. Adds `UIApplicationSceneManifest` and a `SceneDelegate` to the generated `AppDelegate.swift`/`Info.plist`, and a `post_install` Podfile hook plus an Xcode project mod that floor every pod's and the app target's own `IPHONEOS_DEPLOYMENT_TARGET` at 17.0.

### Migration and setup impact

None for Expo Go or EAS-built usage. Verified end-to-end by deleting `ios/` entirely, running `expo prebuild --platform ios`, building Release, and installing/launching on a physical device — confirmed running (no crash) via `xcrun devicectl device info processes`.

### Related decision and roadmap

- `docs/adr/0004-ios-27-beta-build-fixes.md`

## 2026-07-11 — EAS build configuration for a standalone iOS install

### Summary

Added `app/eas.json` (`preview` and `production` build profiles) and an `ios.bundleIdentifier` in `app/app.json` so a real, installable iOS build can be produced with EAS Build, rather than only running through Expo Go. Documented the exact steps in `docs/LOCAL_DEVELOPMENT.md`.

### User-visible impact

None by itself; this is build tooling. Once the human runs the documented `eas login` / `eas build` steps with their own Expo account and Apple Developer Program membership, they get a standalone app icon installable directly on their iPhone with no Metro connection required.

### Developer impact

`app/eas.json` is new. `app/app.json` gained `ios.bundleIdentifier: "com.litmo.app"` (a placeholder — change it before a first real build if a different reverse-domain name is wanted). Deliberately did not add `expo-dev-client` or a `development` EAS profile: installing it triggered a pre-existing dependency-hoisting bug in this Expo CLI version that crashed the dev server (`Cannot find module 'expo-router/_ctx-shared'`), so the profile set was kept to what's needed for a standalone install build. Verified by reverting cleanly to a known-good `node_modules` state, confirming the dev server and full test suite were unaffected, and re-verifying with `npm test`, `npm run lint`, and `npm --workspace app run typecheck`.

### Migration and setup impact

None to existing behavior. `eas login` and `eas build` were not run in this session: both require the human's own Expo and Apple credentials, which this agent does not handle.

### Related decision and roadmap

- `docs/LOCAL_DEVELOPMENT.md`
- `docs/roadmap/PHONE_VISIBLE_VERTICAL_SLICE.md`

## 2026-07-11 — Backend-free demo mode for physical-device launch

### Summary

Added a `"demo"` `AuthState` status (`docs/adr/0003-demo-mode-entry-point.md`), entered only through an explicit `enterDemoMode()` action, so the full Chapter 1 tap-through path (Welcome → Vibe Quiz → Vibe Profile → Touch Language → Discover → Match Detail → Consent Snapshot → Active Session → Wrap-Up → Trust Ledger) can run on a physical iPhone through Expo Go with no Supabase instance configured at all. This was blocking the concrete goal of running Litmo on a personal device: `AuthContext` previously redirected every signed-out visitor straight to sign-in, which requires a reachable local Supabase instance this machine cannot start (no Docker installed).

### User-visible impact

The sign-in screen, and the screen shown when no local Supabase URL/key is configured, now offer "Continue without an account (demo mode)". Demo mode is clearly labeled, creates no account, and does not persist across an app restart. `onboarding/touch-language.tsx`'s save action, which previously did nothing at all with no signed-in user, now advances to Discovery. `match/discover.tsx`'s "Edit my general profile" button and `profile/edit.tsx` now explain that editing requires a real account instead of hanging or silently failing. `profile/trust-ledger.tsx` labels its exit action "Exit demo mode" instead of "Sign out" while in demo mode.

### Developer impact

`app/context/authState.ts` gained a `"demo"` status and `ENTERED_DEMO_MODE` action (3 new tests, app test count 19 → 22). `AuthContext`'s `signOut()` skips the network call entirely in demo mode, since there is no real session to invalidate.

### Migration and setup impact

None. Verified with `npm --workspace app test`, `npm --workspace app run typecheck`, full repo lint, and a live Metro bundler boot: requested the actual iOS bundle Expo Go would load (`platform=ios`) and confirmed it compiled successfully (1,353 modules, no errors) before stopping the server. Scanning the QR code on a physical device was not performed in this session; see `docs/CHAPTER_3_COMPLETION.md` and this entry for what was and was not verified.

### Related decision and roadmap

- `docs/adr/0003-demo-mode-entry-point.md`
- `docs/roadmap/PHONE_VISIBLE_VERTICAL_SLICE.md`
- `docs/roadmap/CHAPTER_4_SESSION_LIFECYCLE.md`

## 2026-07-11 — Chapter 3 mock Consent Snapshot runs the real engine

### Summary

Replaced the hardcoded seven-row display array in `app/app/match/consent-snapshot.tsx` with a live call to `computeCompatibility` over two `ConsentProfileVersion`s built through the new legacy-profile adapter. Added mock fixtures for four personas (`app/data/mockConsentProfiles.ts`) and a pure, unit-tested row-formatting helper (`app/lib/consentSnapshotView.ts`). The match-detail screen now passes the tapped persona's id through to the snapshot screen so the counterpart varies per match.

### User-visible impact

The mock Consent Snapshot screen shows real computed overlap (welcomed, ask-first, pressure, duration, place, connection type) that changes depending on which mock match was opened, instead of one static set of values. The screen still clearly labels the flow as mock and never grants consent.

### Developer impact

Added `app/data/mockConsentProfiles.ts` and `app/lib/consentSnapshotView.ts` (4 new tests, app test count now 19). Removed the now-unused `snapshot` export from `app/data/mock.ts`. Verified with `npm --workspace app test`, `npm --workspace app run typecheck`, and a direct Node script exercising the exact code path for every mock persona plus an unknown id. Full on-device/browser verification was not performed: this environment has no local Supabase running (`.env` absent, matching the existing Chapter 2 Docker/RLS blocker), and the app's auth-gated root layout cannot be reached without it.

### Migration and setup impact

None.

### Related decision and roadmap

- `docs/adr/0001-directional-consent-engine.md`
- `docs/adr/0002-legacy-profile-adapter.md`
- `docs/roadmap/CHAPTER_3_CONSENT_ENGINE.md`

## 2026-07-11 — Chapter 3 legacy-profile adapter and canonical backend route

### Summary

Added `toConsentProfileVersion` to `@litmo/domain`, a documented adapter (`docs/adr/0002-legacy-profile-adapter.md`) mapping Chapter 2's persisted `TouchLanguageProfile`/`ConsentPreference` shapes onto the canonical Chapter 3 `ConsentProfileVersion`. Added `POST /api/consent/compatibility` in the Express backend, built on the adapter and the canonical engine, and marked the legacy `/api/consent/overlap` POC route deprecated (`Deprecation: true` response header) rather than removing it outright.

### User-visible impact

None yet. No mobile screen calls the new route in this slice.

### Developer impact

`@litmo/domain` exports `toConsentProfileVersion`; shared tests increased to 46. The backend now depends on `@litmo/domain` and runs under `--experimental-strip-types` (`start`, `dev`, `test` scripts updated) to import the shared TypeScript source directly, matching the existing app/shared pattern. Backend tests increased from 6 to 8. Manually verified end-to-end with a live `POST /api/consent/compatibility` request against a running server.

### Migration and setup impact

No database migration. Backend `npm install` picks up the new `@litmo/domain` workspace dependency (already present as a symlink via the existing workspace).

### Related decision and roadmap

- `docs/adr/0001-directional-consent-engine.md`
- `docs/adr/0002-legacy-profile-adapter.md`
- `docs/roadmap/CHAPTER_3_CONSENT_ENGINE.md`

## 2026-07-11 — Chapter 3 practical-effect preview

### Summary

Added `previewProfileChange` to `@litmo/domain`, a pure diff between a not-yet-saved profile version and the currently saved version, both evaluated against the same counterpart profile. Satisfies the Chapter 3 "Versioned profiles" requirement that users can preview the practical effect of a change before saving.

### User-visible impact

None yet. No mobile screen calls this function in this slice; it is available for the profile-edit flow to adopt.

### Developer impact

`@litmo/domain` exports `previewProfileChange` and `ProfileChangePreview`. It never persists a version and never sets `consentGranted`. Shared tests increased to 40.

### Migration and setup impact

None.

### Related decision and roadmap

- `docs/adr/0001-directional-consent-engine.md`
- `docs/roadmap/CHAPTER_3_CONSENT_ENGINE.md`

## 2026-07-11 — Chapter 3 consent engine property-based coverage

### Summary

Added a seeded, randomized property test proving that restricting any consent rule (stricter state, or revoking receive/offer capability) can never broaden the computed permitted or ask-first overlap, closing the remaining `docs/roadmap/CHAPTER_3_CONSENT_ENGINE.md` testing requirement.

### User-visible impact

None. Domain test coverage only.

### Developer impact

`@litmo/domain` shared tests increased from 35 to 36; the new test runs 200 seeded iterations internally. No production code changed.

### Migration and setup impact

None.

### Related decision and roadmap

- `docs/adr/0001-directional-consent-engine.md`
- `docs/roadmap/CHAPTER_3_CONSENT_ENGINE.md`

## 2026-07-11 — Chapter 3 consent engine started

### Summary

Added the canonical directional, version-aware consent engine and session snapshot semantics in `@litmo/domain`.

### User-visible impact

No mobile screen changes yet. Future compatibility views can distinguish welcomed, ask-first, and excluded options without exposing private notes.

### Developer impact

The domain package now exports runtime schemas, deterministic overlap computation, privacy-safe explanations, exact-version snapshots, explicit confirmation, material-change invalidation, and withdrawal behavior. Shared tests increased to 35.

### Migration and setup impact

No database migration or environment change in this slice.

### Related decision and roadmap

- `docs/adr/0001-directional-consent-engine.md`
- `docs/roadmap/CHAPTER_3_CONSENT_ENGINE.md`
