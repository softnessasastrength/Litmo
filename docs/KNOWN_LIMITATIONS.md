# Known limitations

## Passkey authentication

- Passkeys require an iOS development/distribution build, the deployed AASA file,
  iCloud Keychain, a device passcode, and enabled Supabase experimental passkeys;
  they do not work inside stock Expo Go.
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
- `transition_session(...)` currently authorizes either participant for every graph-valid edge; it does not yet distinguish requester-only, recipient-only, or system-only actions. Impact: this is sufficient to prove the transactional state boundary but not to ship request acceptance, decline, or expiration. Mitigation: no mobile screen calls the function and no authenticated client can create a session directly. Removal criterion: document and enforce actor roles for each transition alongside the request-creation and expiration actions.
- Mandatory Face ID blocks Expo Go, Touch ID-only devices, simulators without enrolled Face ID, and any iPhone where Face ID is unavailable, unenrolled, or locked out. Impact: there is intentionally no in-app fallback. Mitigation: clear fail-closed lock copy and retry; use an iOS development/standalone build on a Face ID device. Removal criterion: none unless a later security ADR explicitly changes the biometric-only requirement.
- The native/React privacy covers reduce app-switcher exposure but cannot prevent screenshots or recordings deliberately captured while unlocked, OS compromise, or all notification-preview leakage. Removal criterion: screen-capture and notification privacy review before private alpha.
- ~~Docker-backed RLS and integration tests remain blocked on this machine.~~ **Resolved 2026-07-12**: Docker installed, the full pgTAP RLS suite (`supabase/tests/rls.test.sql`, 8 assertions) and the two-client integration test (`npm run test:integration`) now pass locally. This surfaced and fixed a real bug (migration `006_grant_authenticated_table_privileges.sql`): migration 005's RLS policies existed with no underlying table-level `GRANT` to `authenticated`, so every signed-in user got "permission denied" on `profiles`, `onboarding_progress`, `touch_profile_versions`, and `consent_preference_versions` — not just in the test, in the real app too. Hosted CI (GitHub Actions) remains unrun from this branch.

## Safety limitations

- Transactional withdrawal and offline local stop exist, but the full real session-request UI and Supabase Realtime/push delivery are not wired. Impact: server authority and pending reconciliation are enforceable when a real session ID is supplied, while the default visible flow remains synthetic. Mitigation: the local UI stops immediately and terminal database state rejects reactivation; notification delivery is never authority. Removal criterion: persisted request flow, two-device Realtime, push delivery, and physical offline/termination chaos tests.

- Consent explanations have not received independent trauma-informed, safeguarding, or legal review. Impact: wording may omit important interpretations. Mitigation: explanations disclose conservative outcomes and never private reasoning. Removal criterion: documented expert and user review.
- Duplicate rules are excluded as contradictory even when duplicates are textually identical. Impact: false exclusions are possible, but no permission is broadened. Removal criterion: canonical input deduplication with tests proving identical duplicates are harmless.

## Demo mode

- Demo mode (`docs/adr/0003-demo-mode-entry-point.md`) does not persist across an app restart by design; a developer wanting a longer walkthrough must re-enter it each cold start. Removal criterion: none — this is an intentional safety property, not a gap.
- `profile/edit.tsx` and the persistence steps in `onboarding/quiz.tsx` / `onboarding/touch-language.tsx` are unavailable in demo mode and say so, rather than persisting anything. Removal criterion: Chapter 4+ decision on whether demo-mode edits should be representable as ephemeral local state instead of simply disabled.

## Release blockers

- TestFlight external testing is blocked by missing hosted staging validation, staging/production AASA deployment, push credentials, complete account deletion/session revocation/local clearing, audited first-launch beta onboarding, final privacy policy/App Store disclosures, independent security/privacy/accessibility review, signed archive inspection, and physical-device scenario completion. Automated environment/release validation and a structured plan exist in `docs/RELEASE_AND_TESTFLIGHT.md`.

- Canonical snapshot persistence, trusted server computation/creation, exact-fingerprint confirmation, withdrawal, material profile-change invalidation, `ready -> active` enforcement, and participant-private wrap-up persistence now exist. Transition-specific actor authorization remains unimplemented, and no mobile screen calls these boundaries. Mobile session screens therefore remain demo-only. Mitigation: profile history is immutable, stale confirmation is cleared transactionally, activation remains database-gated, and wrap-ups are owner-only. Removal criterion: authenticated request/mobile wiring, role enforcement, realtime recovery, wrap-up UI recovery states, and two-client tests.
- Hosted CI (GitHub Actions) has not been run from this branch. The local Docker blocker is resolved (see above).
