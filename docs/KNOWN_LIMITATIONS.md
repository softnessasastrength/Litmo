# Known limitations

## Age eligibility

- Adult confirmation uses Apple Declared Age Range when the native module and
  OS support it (ADR 0025). Expo Go and older iOS return `unavailable`;
  production fails closed, development may self-attest only outside production
  builds. This is **declared/account age range**, not government ID proof.
  Removal criterion: vendor KYC where law requires stronger assurance.

## Passkey authentication

- Passkeys require an iOS development/distribution build, the deployed AASA file,
  iCloud Keychain, a device passcode, and enabled Supabase experimental passkeys;
  they do not work inside stock Expo Go.
- **A free Apple "Personal Team" cannot use the Associated Domains capability
  passkeys require at all** (the same class of limitation as Push
  Notifications). `app.config.ts`'s `LITMO_FREE_TIER_BUILD=1` flag omits
  Associated Domains so a free-team local build can compile and install, at
  the direct cost of passkey sign-in not functioning in that build. Real
  passkey sign-in can only be verified with a paid Apple Developer Program
  membership (EAS or a paid local team). See
  `docs/adr/0015-session-request-creation-and-recipient-authorization.md`'s
  build-verification addendum and `docs/MACHINE_SETUP.md`.
- Human-reviewed account recovery and trusted backend session-revocation
  operations are specified but not yet deployed. Recovery therefore fails
  closed if no synced passkey remains.
- Device revocation is checked by the Litmo client on session validation. It does
  not delete an iCloud-synced passkey and cannot invalidate an independently
  replayed Supabase JWT before its server expiry.

## Demo-only shortcuts

- The mobile Consent Snapshot screen now runs the real canonical Chapter 3 engine (via `toConsentProfileVersion` and `computeCompatibility`), but both participants are still fixed mock fixtures in `app/data/mockConsentProfiles.ts`, not the signed-in user's actual saved profile versions. Impact: the visible demo proves live two-profile computation, but not live repository integration. Mitigation: all copy labels the flow as mock; the counterpart persona now varies by which mock match was tapped. Removal criterion: typed repository integration backed by RLS-tested profile versions. The Docker/RLS blocker that previously prevented even testing this locally is resolved (see below); the repository-integration work itself has not started.
- The legacy Express `/api/consent/overlap` route uses the original POC shape and is now explicitly marked deprecated (`Deprecation: true` response header, `docs/adr/0002-legacy-profile-adapter.md`). Impact: two consent implementations temporarily coexist. Mitigation: `POST /api/consent/compatibility` is canonical for all new Chapter 3+ work and is backed by the documented legacy-profile adapter (`toConsentProfileVersion` in `@litmo/domain`). Removal criterion: no client calls `/overlap`.
- The legacy-profile adapter assumes Chapter 2's touch and consent profile versions always move in lockstep (both written by the same `save_profile_versions` call) and throws if they diverge; it has no way to represent directional receive/offer asymmetry, since Chapter 2 never captured it. Impact: every mapped rule is symmetric (`canReceive: true, canOffer: true`) except hard stops. Removal criterion: a profile-editing UI that captures direction explicitly.

## Security and privacy limitations

- Application encryption is device-bound. Reinstall, device replacement, Keychain loss, or biometric-set change can permanently make encrypted private notes unavailable. Structured Consent Snapshots remain server-readable under participant RLS by design. Mitigation: fail closed, never downgrade to plaintext, and keep private notes out of snapshot computation. Removal criterion: independently reviewed multi-device/recovery key wrapping without weakening device revocation.

- Snapshot fingerprints detect deterministic changes but are not cryptographic signatures. Impact: they must not be treated as tamper-proof evidence. Mitigation: confirmation compares the full canonical fingerprint in the domain. Removal criterion: server-generated cryptographic hashes stored transactionally with immutable snapshots.
- **Resolved 2026-07-12** (`docs/adr/0015`–`0019`, `0023`–`0027`): session requests create/accept/decline/cancel with 24h request + pre-activation expiry; Realtime + local alert; **one-way blocks**; **structured report intake**; **staff review queue** (claim/note/resolve, no auto-punishment). Not implemented: remote OS push while backgrounded; consumer moderator console UI; account restrictions/appeals; auto-end of active sessions on block; rate limits. Removal criterion: reviewed push + restriction workflow + abuse controls.
- Mandatory Face ID applies to **real account sessions** only (ADR 0007 amendment, 2026-07-12). Impact: Expo Go can run the fictional demo path without Face ID; real sign-in / restored sessions still fail closed without Face ID (no passcode fallback), which blocks Expo Go for real accounts, Touch ID-only devices, simulators without enrolled Face ID, and any iPhone where Face ID is unavailable, unenrolled, or locked out. Mitigation: clear fail-closed lock copy and retry for real sessions; use an iOS development/standalone build on a Face ID device for account review. Removal criterion: none for real sessions unless a later security ADR changes the biometric-only requirement.
- The native/React privacy covers reduce app-switcher exposure but cannot prevent screenshots or recordings deliberately captured while unlocked, OS compromise, or all notification-preview leakage. Removal criterion: screen-capture and notification privacy review before private alpha.
- ~~Docker-backed RLS and integration tests remain blocked on this machine.~~ **Resolved 2026-07-12**: Docker installed, the full pgTAP RLS suite (`supabase/tests/rls.test.sql`, 8 assertions) and the two-client integration test (`npm run test:integration`) now pass locally. This surfaced and fixed a real bug (migration `006_grant_authenticated_table_privileges.sql`): migration 005's RLS policies existed with no underlying table-level `GRANT` to `authenticated`, so every signed-in user got "permission denied" on `profiles`, `onboarding_progress`, `touch_profile_versions`, and `consent_preference_versions` — not just in the test, in the real app too. Hosted CI (GitHub Actions) remains unrun from this branch.
- ~~Chapter 4 two-client end-to-end lifecycle integration scenario missing.~~ **Resolved 2026-07-12**: `integration/chapter4-session-lifecycle.test.mjs` covers request → accept → dual snapshot confirm → activate → Soft Signal → private wrap-ups. Building it also fixed migration `018_service_role_snapshot_read_grants.sql`: the trusted snapshot repository (ADR 0006) could not `SELECT` `sessions` / profile version tables as `service_role`, so snapshot creation failed closed with `snapshot_storage_failed` even when the service-role key was present.

## Safety limitations

- Transactional withdrawal, offline Soft Signal, offline "End together" (ADR 0020), offline wrap-up retry, session Realtime (active + snapshot-wait + incoming requests), and the real request UI are wired for authenticated users. Demo mode still uses synthetic local session flow. Impact: server authority and pending reconciliation are enforceable when a real session ID is supplied. Mitigation: the local UI stops immediately and terminal database state rejects reactivation; Realtime/push is never authority. Remaining: OS push while backgrounded, optional offline UI banners, and physical offline/termination chaos tests. Removal criterion: push privacy review and chaos tests before private alpha.

- Consent explanations have not received independent trauma-informed, safeguarding, or legal review. Impact: wording may omit important interpretations. Mitigation: explanations disclose conservative outcomes and never private reasoning. Removal criterion: documented expert and user review.
- Duplicate rules are excluded as contradictory even when duplicates are textually identical. Impact: false exclusions are possible, but no permission is broadened. Removal criterion: canonical input deduplication with tests proving identical duplicates are harmless.

## Demo mode

- Demo mode (`docs/adr/0003-demo-mode-entry-point.md`) does not persist across an app restart by design; a developer wanting a longer walkthrough must re-enter it each cold start. Removal criterion: none — this is an intentional safety property, not a gap.
- `profile/edit.tsx` and the persistence steps in `onboarding/quiz.tsx` / `onboarding/touch-language.tsx` are unavailable in demo mode and say so, rather than persisting anything. Removal criterion: Chapter 4+ decision on whether demo-mode edits should be representable as ephemeral local state instead of simply disabled.
- ~~Missing Supabase env forced a hard error screen that blocked welcome/entry until the user found a config-error demo button; Face ID also blocked Expo Go before any screen.~~ **Resolved 2026-07-12**: missing env restores as signed-out (`locked`) so welcome → entry → demo works without Docker; Face ID is not required until a real account session exists.

## Release blockers

- TestFlight external testing is blocked by missing hosted staging validation, staging/production AASA deployment, push credentials, complete account deletion/session revocation/local clearing, audited first-launch beta onboarding, final privacy policy/App Store disclosures, independent security/privacy/accessibility review, signed archive inspection, and physical-device scenario completion. Automated environment/release validation and a structured plan exist in `docs/RELEASE_AND_TESTFLIGHT.md`.

- Canonical snapshot persistence, trusted server computation/creation, exact-fingerprint confirmation, withdrawal, material profile-change invalidation, `ready -> active` enforcement, participant-private wrap-up persistence, and 24-hour request expiration now exist. As of 2026-07-12 a real session can be requested, accepted, snapshot-confirmed by **both** participants, and activated entirely through the mobile app — **verified on-device**, closing the request/accept/confirm/activate chain end to end (`docs/adr/0015-session-request-creation-and-recipient-authorization.md`'s addenda). Snapshot creation depends on the separate Express backend being run locally and reachable on the same LAN as the phone (`EXPO_PUBLIC_BACKEND_URL`); this is a deliberate, accepted trade-off for now (single-developer, single-device local testing) rather than an oversight — revisit moving that logic into a Postgres/Edge function specifically when scaling past the founder's own iPhone. Transition-specific actor authorization (beyond the recipient-only accept/decline added in migration 015) remains otherwise unimplemented for other transitions. Mitigation: profile history is immutable, stale confirmation is cleared transactionally, activation remains database-gated, and wrap-ups are owner-only. **Realtime landed 2026-07-12** (`docs/adr/0016-session-realtime-and-real-timer.md`): `/session/active`'s timer now reflects real `started_at`, and one participant ending the session automatically navigates the other's screen via a Supabase Realtime subscription. `consent-snapshot.tsx`'s "waiting for the other person" state also now proceeds automatically via Realtime (`docs/adr/0017-wrapup-offline-retry-and-remaining-realtime-gaps.md`). Not yet covered by Realtime: a new incoming request still requires manually reopening `/requests`. **Wrap-up submission offline retry landed 2026-07-12** (same ADR): a failed wrap-up submission is durably queued and retried on next app restart, mirroring `emergencyStopService`'s existing pattern. Removal criterion: a non-LAN-dependent snapshot-creation path (when scaling), remaining transition actor-role enforcement, Realtime coverage for new requests, blocking/eligibility checks, later pre-activation expiry policy beyond `requested`, and two-client tests.
- Hosted CI (GitHub Actions) has not been run from this branch. The local Docker blocker is resolved (see above).
