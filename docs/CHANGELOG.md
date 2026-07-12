# Changelog

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
