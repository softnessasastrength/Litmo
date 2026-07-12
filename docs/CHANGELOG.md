# Changelog

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
