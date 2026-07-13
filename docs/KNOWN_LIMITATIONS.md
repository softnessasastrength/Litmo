# Known limitations

## Native macOS foundation

- The native participant app provides functional device-local Campfire plus server-backed self-only reads: **trust history** (`my_trust_signals`, ADR 0046), **own profile** (owner-RLS `profiles`, ADR 0047), **pending requests** (ADR 0048, read-only), and **self export** (`export_my_data`, ADR 0049). Other participant sections remain honest placeholders. The app does not fabricate participant records, cannot accept/decline requests, and cannot control active physical sessions or Soft Signal.
- Self export is an engineering portability summary with optional local pasteboard copy. It is not a claim of legally complete data access, not account deletion, and not a consent record.
- Server-backed reads require explicit local configuration (`LITMO_SUPABASE_URL`, `LITMO_SUPABASE_ANON_KEY`) and a developer-supplied `LITMO_ACCESS_TOKEN`. Missing configuration or session fails closed. This is not passkey sign-in, not multi-device Keychain sync, and not production account UX.
- Trust facts are never presented as a safety score and never grant consent. A profile is never consent or proof of safety. Positive history does not replace a current Consent Snapshot. Profile editing remains phone-first.
- Litmo Ops is a separately bundled, fail-closed shell. Staff authentication, authorization, review data, mutations, audit logging, and operational readiness are not implemented.
- The participant and Ops targets intentionally share no App Group or Keychain group. Signing, notarization, hardened-runtime distribution validation, and physical accessibility review remain outstanding.
- Hosted CI artifacts are unsigned arm64 inspection builds. They are not notarized, installable distribution releases, or evidence of production entitlements.

## Licensing and governance

- Litmo is licensed under MPL-2.0, but contributor attestation, a trademark
  policy, a bundled-asset and third-party notice audit, and qualified legal
  review are not yet complete. Impact: the source license is clear, while
  public contribution and branded redistribution procedures are still
  incomplete. Current mitigation: accept changes through reviewed repository
  history and make no implied trademark grant. Removal criterion: publish the
  missing governance policies and complete legal/distribution review before
  public launch.

## Authentication (passkeys + Edge)

- Real passkeys require an **iOS development build**, Associated Domains, and
  Supabase Auth WebAuthn. Expo Go cannot complete ceremonies.
- Edge Function `auth-ceremony` must be **deployed** for production rate limits
  and audit. Locally, if the function is missing, the client fails open so
  demos work; explicit 429 still fails closed.
- Human recovery without a passkey is **not deployed** — accounts stay locked
  rather than accepting email-only proof.
- Consent snapshot confirmation requires a **bound device**; restored phones
  must passkey sign-in again before confirming consent.

## Encrypted QR fallback

- QR payloads use short TTL (~3 min) AES-GCM envelopes. Co-located mode embeds
  the media key in the QR (ease); split mode requires the unlock code.
- On-screen QR is generated in-app; camera-based scanning of foreign QR apps is
  not required — paste/deep link works. OS Camera may open `litmo://` links when
  registered on a development build.
- A successful QR decode still requires **explicit Accept** before content use.

## NFC careful-connect

- Real NFC read/write needs an **iOS development build** with Core NFC and the
  `litmo-nfc` module. Expo Go uses encrypted QR/share/manual paste.
- iOS third-party apps **cannot** do general phone-to-phone NFC P2P; Litmo uses
  NDEF **tags** plus deep-link fallbacks. Do not claim AirDrop-like phone bumps.
- Offers expire (~3 minutes). Post-tap Accept is mandatory; a scan alone never
  opens identity or snapshot content.
- Snapshot NFC intent is review-only and never activates a session.
- Physical tag smoke tests are human-led; Android HCE peer path is deferred.

## Proximity social layer

- Proximity radar real radio requires an **iOS development build** with
  `startProximityAsync`. Expo Go uses a **practice demo** path only.
- Anonymous beacons still emit RF while the screen is open — users who need zero
  presence must leave radio off. Tokens are ephemeral, not account IDs.
- Weather resonance is **not** safety, trust, or consent. Physical two-device
  Multipeer smoke is human-led. Android deferred.
- Soft Signal on proximity tears down nearby radio; it does not replace Soft
  Signal on an active physical session screen.

## Nearby local share (Multipeer)

- Nearby Share requires an **iOS development build** with the `litmo-local-share`
  module. Expo Go reports unavailable and does not advertise or browse.
- Multipeer radio behavior depends on Local Network permission, device proximity,
  and OS policy. Two-device physical smoke is not fully automated in CI.
- Android nearby share is not implemented in this milestone.
- Snapshot nearby share is **review only**; it does not activate sessions or
  record consent confirmations. Profiles shared nearby never include private
  nervous-system notes.
- Application-layer crypto is ephemeral ECDH; Multipeer also uses required
  transport encryption. Independent crypto review before external beta is still
  recommended (same class as quiz E2E).

## Campfire Mode

- Campfire is a local practice surface, not a real multi-person Litmo session.
  Circle readiness means only “join this gathering”; it does not grant touch,
  disclosure, advice, duration, or any other consent. No participant identity
  or readiness is persisted.
- Circle campfire uses one shared phone and cannot prove who tapped a seat,
  prevent social pressure, or independently deliver a stop request to remote
  participants. Current mitigation: explicit copy, unanimous start, and one
  prominent reason-free pause control. Removal criterion for real group
  sessions: a reviewed group-consent, authorization, withdrawal, blocking,
  reporting, retention, and moderation design.
- Quiet and digital timers are best-effort while the screen is open. They do
  not schedule background notifications or recover after the screen/app closes.
- The animated flame honors the OS reduced-motion preference. Physical
  VoiceOver, large-text, switch-control, and sensory-comfort review remain
  pending under ACCESS-001.

## Private-alpha safety operations

- Migration 036 adds hashed, single-use, seven-day staff invitations and
  membership gates for discovery/new session requests. Invitation admission is
  not identity verification, proof of safety, consent, or a legal eligibility
  determination. Existing accounts at migration time are grandfathered as the
  initial named cohort.
- The routine matching pause hides discovery and rejects new requests. It does
  not force-end active sessions and never removes Soft Signal, withdrawal,
  wrap-up, blocking, or reporting controls.
- The 90-day unblock tombstone contains only pair identifiers and timestamps
  and is staff-only. Its duration is a provisional product/engineering default
  pending privacy/safety review.
- The cleanup RPC removes 30-day rate-limit data, expired tombstones, and unused
  invitations only. It deliberately does not delete reports, moderation cases,
  notes, trust events, or accounts.
- `export_my_data()` is a self-only structured portability primitive. It is
  not yet exposed in the mobile UI and is not a claim of legally complete data
  access.
- Complete account deletion, server-session revocation, scoped legal/safety
  holds, destructive retention, jurisdiction policy, external-referral policy,
  and backup reviewer staffing remain blocked.
- **Two-person permanent-ban machinery is implemented** (migration 042 /
  ADR 0061: request + distinct confirmer, staff audit, fail-closed defaults).
  Completion remains **blocked in practice** until a real named second reviewer
  is documented and `named_second_owner_configured` is flipped by service-role
  ops. Matching holds stay single-staff. Direct permanent ban RPC fails closed
  while two-person policy is on.

## Exorcism Dojo (device-local)

- Urge log free-text and burn gates live in AsyncStorage (`litmo.dojo.state.v1`),
  unencrypted at rest, never account-synced. Impact: device backup may retain
  private fear sentences. Mitigation: wipe includes this key; portability
  inventory exports flags/counts only. Removal criterion: Secure Store or vault
  domain if ritual notes need stronger at-rest protection.

## GDPR / privacy tooling

- In-app Privacy Policy, Data Protection, export, and erase/wipe screens exist
  (`docs/GDPR.md`). They are **engineering alignment**, not certified legal
  compliance or a finalized public notice.
- `docs/ISO27701.md` is a **PIMS roadmap**, not ISO/IEC 27701 certification.
  A formal ISMS (ISO 27001 base), DPAs, DPIA sign-off, and hard-delete fulfillment
  remain open.
- `request_account_erasure` records a **pending queue** only. Complete
  automated destruction of `auth.users` and all related rows is **not**
  implemented — blocked until legal/ops name owners (see Agents.md).
- Device wipe is immediate for known local stores; residual Secure Store keys
  for ad-hoc ratchet sessions may remain until app uninstall.
- Export does **not** include E2E private keys or partner plaintext.
- Controller identity, DPO, EU representative, and supervisory complaint
  contacts are placeholders until legal review.

## Neurodivergent Mode

- Preference is **device-local** only (AsyncStorage). It is not synced, not
  exported as a profile trait, and not a matching or consent input.
- Master toggle enables a fixed optimization bundle; fine-grained sub-toggles
  are not yet in Settings UI (prefs model supports them for later).
- Read-aloud uses `expo-speech` when the native module is available; otherwise
  system accessibility announce. Quality varies by device language and VoiceOver
  state. Spoken content is not sent to Litmo servers.
- “Voice input” aids use **keyboard dictation** (option number field) — not a
  custom cloud speech-to-text model. Accuracy depends on the OS keyboard.
- Mid-quiz save/resume is local; reinstall or clearing app data drops it.
  Learning progress already had local resume; ND mode adds jump lists and
  read-aloud on top.
- Enabling ND mode turns haptics off by default; users can re-enable haptics
  without leaving ND mode.

## Trauma-informed safety tools

- Panic mode ends the session via Soft Signal then shows a calm cover; it cannot
  force-quit iOS or dispatch emergency services.
- Session timeout is a **local preference**, not yet a dual-agreed field on the
  server Consent Snapshot. Extending time on-device does not create a new mutual
  snapshot.
- Nuclear session machine (ADR 0062 / migration 043) hardens snapshot body
  immutability, revocation ledger, offline intent enqueue, seal authority view,
  and wrap-up `skipped` in domain + SQL. Universal client reconcile of
  `session_offline_intents` and continuous-consent UI clocks are not complete;
  physical offline Soft Signal chaos remains pending.
- Present-moment verification is **not** identity proof, background check, or
  safety certification.
- Reflection tools are optional self-help, not clinical care. Editorial review
  for plain language / clinical safety of prompts remains open.
- Trusted-contact SMS / external panic networks are not implemented.

## Local-first vault & encrypted backup

- Personal domains (Touch Language, local Consent Snapshot packages, Soft Signal
  log, private history, learning progress, quiz summaries) are authoritative on
  the device and work offline. Live multi-party sessions and discovery still
  need network when using real accounts.
- Optional cloud backup is **off by default**. When enabled, the server stores
  only opaque ciphertext. Losing the recovery code and the device makes backup
  unrecoverable by design (no staff decryption path).
- Secure Store size limits may constrain very large Soft Signal / history logs
  (capped in app). Migration `041` must be applied for backup RPCs to succeed.
- Backup is not multi-device key sync and not a substitute for account security.

## Guided Learning (full curriculum)

- Twelve modules (six **lived lessons** + six **foundations**) plus curated
  **paths** and recommended-next. Content is short, private, and device-local.
  Completing modules or paths is **not therapy**, not crisis care, not a safety
  certificate, and does **not** gate session creation.
- Recovering-from-violation is non-graphic and tool-focused (Soft Signal, block,
  report); it does not force processing. Leave-anytime is first-class.
- Private **reflection** prompts are on-screen only and **never persisted**.
- Soft-close **product practice** links (Soft Signal, Consent Snapshot, Touch
  Language, Campfire, dual-consent share) are optional muscle memory — never
  scored. Optional quiz pairings never treat weather as consent.
- Progress stays on-device (no server learning table). No public badges, streaks,
  or rankings. Plain-language / clinical editorial review of lived lessons is
  still outstanding.

## Partner invite & shared comparison (demo + real)

- **Demo path (single device):** Quizzes → Partner invites → Create invite →
  **Practice with fictional partner (demo)** → consent to **share** (after
  taking the quiz) → consent to **compare** → Open shared comparison. Face ID
  is skipped in demo. The fictional peer is educational only and still arrives
  via real X3DH + Double Ratchet ciphertext; local human consents are never
  auto-granted.
- **Real dual-device path:** Host creates invite → share public package → peer
  joins and shares encrypted result → host imports → both complete share +
  compare → comparison opens. Optional claim-code relay when signed in.
- Comparison requires **four gates** (local share, local compare, partner share,
  partner compare) plus both decrypted results. Missing any gate fails closed.

## Quizzes section, partner E2E, and optional own-summary backup

- The Quizzes tab (ADR 0050 / **0052**) is **local-first self-understanding**.
  Results live in AsyncStorage (`quizResultsStore`); callers use
  `quizResultsRepository`. Invites, identity keys, and Double Ratchet state live
  in Secure Store (`quizInviteStore` / `quizE2eIdentity` / `quizE2eSession`).
- Partner packages use **X3DH + Double Ratchet** (AES-256-GCM message keys).
  Portable packages carry **public keys and ciphertext only** — no `sealKey`,
  no private keys. Supabase optional relay (`quiz_e2e_relay`, migration 038)
  stores **opaque ciphertext** with refuse-list checks; it never decrypts.
- Optional **owner-only** server backup of own result summaries
  (`quiz_result_summaries`, ADR 0051) runs when Supabase is configured and the
  user is authenticated. Demo/unauthenticated use stays local-only. Backup
  failure never blocks local save and never invents results. Partner comparison
  plaintext never lives on the server.
- Without authentication/config, reinstall or storage clear drops local results,
  invites, and ratchet sessions. With authentication, own summaries may restore;
  invites/partner packages do not. Multi-device partner-compare sync remains
  absent beyond one-shot opaque relay claim codes.
- Short (~10) and deep (100) Vibe paths plus Soft Capacity, Boundary Voice,
  Comfort & Care, and Connection Pace are playful weather/self quizzes only.
  They are never diagnosis, a safety rating, matching eligibility, trust
  signals, or consent to touch. Impact: users may still over-read similarity.
  Mitigation: catalog, hub, result, and comparison copy always remind that
  weather is conversation-only and never replaces a Consent Snapshot.
- Partner comparison requires **four consents** (local share, local compare,
  partner share, partner compare) plus both decrypted results. Host share
  consent is effective only with ciphertext + local plaintext. Missing any gate
  fails closed. Primary exchange is out-of-band paste; optional claim codes when
  signed in.
- Peer share/compare flags in portable packages are **self-asserted**, not
  server-attested dual opt-in. Impact: a forged package can claim consents the
  peer never gave in-app. Mitigation: OOB trust + fail-closed decrypt; ciphertext
  without device private keys is useless. Removal criterion: server-mediated
  mutual opt-in before multi-device external beta if review requires it.
- Results persist in **AsyncStorage** (unencrypted at rest); E2E keys/ratchets
  use Secure Store and optionally CryptoKit vault wrap (Secure Enclave path on
  real iOS builds). Impact: device backup/forensics may still expose local
  weather. Mitigation: Face ID step-up on private result/share; hub shows only
  “saved privately.” Removal criterion: encrypt real-account results at rest if
  privacy review requires it.
- E2E crypto is **Signal-inspired, not a full audited Signal client** (no OPKs,
  sequential quiz messages only, no multi-device identity). X25519 keys cannot
  live *inside* Secure Enclave (P-256 only); real builds wrap them with the
  CryptoKit vault (biometry ACL / SE-evaluated access). Expo Go / simulator may
  fall back to Secure Store–only private keys. Public-invite packages are bearer
  invitations — only share with the intended partner. Impact: residual protocol
  and platform limits. Mitigation: host-device binding, AAD host binding, unit
  tests for outsider decrypt fail-closed and dual consent; ADR 0052. Removal
  criterion: independent crypto review before external beta.
- Face ID step-up (`SensitiveAccessGate`) protects private **result** and
  **partner share** screens on real account sessions only. The catalog hub and
  play flow are not gated; demo mode skips biometrics so Expo Go can walk the
  path. Hub/list screens never show archetype labels outside that gate.
- Server-backed own summaries appear in `export_my_data()` under
  `quiz_result_summaries`. Local invites/ratchets wipe and relay purge on
  account deletion remain incomplete. Production retention beyond cascade is
  undecided.

## Appearance

- Appearance is device-local (light / dark / **system**). System follows the OS
  light/dark setting via React Native `Appearance`. Preference is not synced
  across devices. Contrast and Soft Signal distinctness should be checked on a
  physical phone under BETA-001.

## Haptics

- Semantic haptics (ADR 0039) use `expo-haptics`. Simulator and desktop cannot
  validate comfort, intensity, or recognizability. Physical-device validation is
  part of `docs/PHYSICAL_BETA_WALKTHROUGH.md` / BETA-001 — do not claim feel
  acceptance from unit tests alone. Preference is device-local only (no sync).
- **Dedicated-device** high-fidelity VCM+LRA Soft Edge patterns
  (`docs/HARDWARE/HAPTICS.md`, ADR 0057) are design-only. No production
  hardware, factory calibration, or perceptual study has been completed. Do not
  claim shipping device haptics or Soft Signal tactile guarantees until H3–H4
  bench and sensory user-study gates pass. Gentle / Sensory-Friendly Mode is
  specified but not implemented on a physical companion device.

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

- **Demo path only:** Consent Snapshot without `sessionId` still uses mock fixtures in `app/data/mockConsentProfiles.ts` and client-side `computeCompatibility` to prove the engine UI. **Real path (2026-07-12, ADR 0036):** when `sessionId` is present, the screen loads or creates a trusted backend snapshot and renders server `compatibility` rows — not mocks. Impact: demo remains synthetic; real pairs need backend + both saved profiles. Mitigation: real path fails closed with retry; demo copy still says mock.
- The legacy Express `/api/consent/overlap` route uses the original POC shape and is now explicitly marked deprecated (`Deprecation: true` response header, `docs/adr/0002-legacy-profile-adapter.md`). Impact: two consent implementations temporarily coexist. Mitigation: `POST /api/consent/compatibility` is canonical for all new Chapter 3+ work and is backed by the documented legacy-profile adapter (`toConsentProfileVersion` in `@litmo/domain`). Removal criterion: no client calls `/overlap`.
- The legacy-profile adapter assumes Chapter 2's touch and consent profile versions always move in lockstep (both written by the same `save_profile_versions` call) and throws if they diverge; it has no way to represent directional receive/offer asymmetry, since Chapter 2 never captured it. Impact: every mapped rule is symmetric (`canReceive: true, canOffer: true`) except hard stops. Removal criterion: a profile-editing UI that captures direction explicitly.

## Security and privacy limitations

- Application encryption is device-bound. Reinstall, device replacement, Keychain loss, or biometric-set change can permanently make encrypted private notes unavailable. Structured Consent Snapshots remain server-readable under participant RLS by design. Mitigation: fail closed, never downgrade to plaintext, and keep private notes out of snapshot computation. Removal criterion: independently reviewed multi-device/recovery key wrapping without weakening device revocation.

- Snapshot fingerprints detect deterministic changes but are not cryptographic signatures. Impact: they must not be treated as tamper-proof evidence. Mitigation: confirmation compares the full canonical fingerprint in the domain. Removal criterion: server-generated cryptographic hashes stored transactionally with immutable snapshots.
- **Resolved 2026-07-12** (`docs/adr/0015`–`0019`, `0023`–`0040`): session requests create/accept/decline/cancel with 24h request + pre-activation expiry; Realtime + local alert (including incoming requests, ADR 0019); **one-way blocks** that cancel pre-activation and safety-end active pair sessions (ADR 0040); matching hold / permanent ban end open work (ADR 0035/0038); **structured report intake**; **staff review queue + console**; **rate limits**; **trust events** + self signals; **staff account restrictions** + appeals + lifecycle gates; **peer signals**; **real Consent Snapshot UI**; **staff-readable reporter messages + case evidence pack** (ADR 0037). Not implemented: remote OS push while backgrounded; full ops suite (search/bulk). Legacy device-encrypted report notes remain unreadable by staff. Removal criterion: reviewed push + disclosure review.
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

- The hosted iOS Native Build proves an unsigned simulator compile on Xcode 26.5 only. It does not validate physical-device behavior, signing identities, provisioning profiles, production entitlements, archive contents, staging connectivity, IPA installation, or TestFlight upload. Mitigation: keep the workflow credential-free and preserve the manual signed-release procedure. Removal criterion: a reviewed signed staging archive and physical-device release evidence.

- TestFlight external testing is blocked by missing hosted staging validation, staging/production AASA deployment, push credentials, complete account deletion/session revocation/local clearing, audited first-launch beta onboarding, final privacy policy/App Store disclosures, independent security/privacy/accessibility review, signed archive inspection, and physical-device scenario completion. Automated environment/release validation and a structured plan exist in `docs/RELEASE_AND_TESTFLIGHT.md`.

- Canonical snapshot persistence, trusted server computation/creation, exact-fingerprint confirmation, withdrawal, material profile-change invalidation, `ready -> active` enforcement, participant-private wrap-up persistence, and 24-hour request expiration now exist. As of 2026-07-12 a real session can be requested, accepted, snapshot-confirmed by **both** participants, and activated entirely through the mobile app — **verified on-device**, closing the request/accept/confirm/activate chain end to end (`docs/adr/0015-session-request-creation-and-recipient-authorization.md`'s addenda). Snapshot creation depends on the separate Express backend being run locally and reachable on the same LAN as the phone (`EXPO_PUBLIC_BACKEND_URL`); this is a deliberate, accepted trade-off for now (single-developer, single-device local testing) rather than an oversight — revisit moving that logic into a Postgres/Edge function specifically when scaling past the founder's own iPhone. Transition-specific actor authorization (beyond the recipient-only accept/decline added in migration 015) remains otherwise unimplemented for other transitions. Mitigation: profile history is immutable, stale confirmation is cleared transactionally, activation remains database-gated, and wrap-ups are owner-only. **Realtime landed 2026-07-12** (`docs/adr/0016-session-realtime-and-real-timer.md`): `/session/active`'s timer now reflects real `started_at`, and one participant ending the session automatically navigates the other's screen via a Supabase Realtime subscription. `consent-snapshot.tsx`'s "waiting for the other person" state also now proceeds automatically via Realtime (`docs/adr/0017-wrapup-offline-retry-and-remaining-realtime-gaps.md`). **Incoming-request Realtime landed** (`docs/adr/0019-incoming-request-realtime.md`): Home badge and `/requests` refresh on INSERT/UPDATE without a manual reopen; privacy-safe local alert on new request (not remote push). **Wrap-up submission offline retry landed 2026-07-12** (ADR 0017): a failed wrap-up submission is durably queued and retried on next app restart, mirroring `emergencyStopService`'s existing pattern. **Track B seed password login fixed 2026-07-12**: seed `auth.users` rows must use empty-string GoTrue token columns (ADR 0041 addendum). Removal criterion: a non-LAN-dependent snapshot-creation path (when scaling), remaining transition actor-role enforcement, remote push, multi-device chaos tests.
- Hosted CI (GitHub Actions) has not been run from this branch. The local Docker blocker is resolved (see above).
