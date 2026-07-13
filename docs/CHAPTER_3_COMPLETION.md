# Chapter 3 completion report

## Status

Implementation is complete on `agent/chapter-3-consent-engine`. All static checks, unit tests, and a live manual verification of the new backend route pass. Database-backed persistence of canonical snapshots and independent expert review are explicitly **not implemented / not obtained** and are recommended as the first Chapter 4 (or interstitial) task, not because they are blocked by tooling, but because they were out of scope for a framework-independent domain milestone and because persistence design should follow, not precede, Chapter 4's session-lifecycle state machine.

## 1. Initial repository condition

Chapter 2 closed with Supabase auth, session restoration, versioned touch/consent profiles under RLS, and repository-wide checks passing, but with Docker-backed RLS and integration tests unverified on this machine (`CHAPTER_2_COMPLETION.md`). Before this chapter's work began, an earlier session had already added the canonical directional consent engine (`shared/src/consentEngine.ts`), snapshot lifecycle (`shared/src/consentSnapshot.ts`), and ADR 0001, with 35 shared tests passing. No property-based tests existed yet, no practical-effect preview existed, no adapter connected Chapter 2's persisted profile shape to the canonical engine, and the mobile Consent Snapshot screen and legacy Express route were unchanged from Chapter 1/2.

## 2. Material changes

- Added a seeded, randomized property-based test (200 iterations) proving that restricting any rule can never broaden computed overlap, closing the one still-open item in the Chapter 3 Testing section.
- Added `previewProfileChange` to `@litmo/domain`: a pure diff between a not-yet-saved and a currently saved profile version, both against the same counterpart, satisfying the "preview the practical effect of changes before saving" requirement. Never persists a version; never sets `consentGranted`.
- Added ADR 0002 and `toConsentProfileVersion`, a documented, tested adapter mapping Chapter 2's persisted `TouchLanguageProfile`/`ConsentPreference` shapes onto the canonical `ConsentProfileVersion`.
- Added `POST /api/consent/compatibility` in the Express backend, built on the adapter and the existing engine; marked the legacy `/api/consent/overlap` POC route deprecated (response header and code comment) rather than removing it.
- Backend now depends on `@litmo/domain` and runs under `--experimental-strip-types` to import the shared TypeScript source directly, matching the existing shared/app pattern.
- Replaced the hardcoded seven-row array in the mobile Consent Snapshot screen with a live `computeCompatibility` call over two profiles built through the adapter, so the visible demo now proves the real engine end-to-end. Added four mock personas (`app/data/mockConsentProfiles.ts`) and a pure, unit-tested row formatter (`app/lib/consentSnapshotView.ts`). The match-detail screen now passes the tapped persona's id through so the counterpart varies per match. Removed the now-unused `snapshot` export from `app/data/mock.ts`.

## 3. Architecture decisions

- The canonical engine (ADR 0001, prior session) evaluates `a_receives_from_b` and `b_receives_from_a` separately, resolves state/pressure/duration conservatively, and always returns `consentGranted: false`.
- The legacy-profile adapter (ADR 0002, this session) is a read-time transform only; it never changes a database schema or persisted shape. It assumes Chapter 2's touch and consent profile versions move in lockstep (both written by one `save_profile_versions` call) and **throws** on divergence rather than guessing which version is current.
- Legacy body zones and hard stops both map to the `body_zone` dimension; hard stops force `off_limits` with both capabilities revoked. Legacy environments and hold types map to `welcomed`, symmetric rules, since Chapter 2 never captured directional receive/offer asymmetry — this is a documented, honest limitation, not an invented permission.
- The mobile screen calls the same adapter and engine the backend route uses, rather than a third parallel implementation, keeping "one canonical engine" true across client and server.

## 4. Security and privacy decisions

- No change to RLS, credentials, or trust boundaries. The new backend route accepts the same shape of data the legacy route already accepted and performs no persistence.
- Private nervous-system notes from both legacy tables are concatenated for audit purposes only; the property-based and adapter tests both assert notes never appear in compatibility output.
- The adapter's fail-closed choice (throwing on version divergence) was made explicitly to avoid silently computing compatibility against a profile version that may not be the one a user most recently confirmed.

## 5. Product and safety decisions

- A hard stop for a zone the counterpart never lists still produces a safe (non-permitted) result, because unmatched dimension/value pairs are already excluded as `missing_preference` — verified by a dedicated test rather than assumed.
- `decide_together` duration maps to `null` (no ceiling of its own) rather than to a large fixed number, so it can only ever inherit the counterpart's limit, never remove one — verified by a dedicated test.
- The mobile screen's copy was updated to describe the snapshot as "the live, directional overlap of two mock preference sets computed by the real consent engine," replacing language that implied a single static example, while keeping the "does not grant consent" framing intact.

## 6. Tests added

- 1 property-based test (200 seeded iterations) in `shared/src/consentEngine.test.ts` (shared tests: 35 → 36).
- 4 table-driven tests for `previewProfileChange` (shared tests: 36 → 40).
- 6 tests for `toConsentProfileVersion` in `shared/src/legacyProfileAdapter.test.ts` (shared tests: 40 → 46).
- 2 backend tests for the adapter/engine pairing in `backend/test/compatibility.test.js` (backend tests: 6 → 8).
- 4 tests for `buildSnapshotRows` in `app/lib/consentSnapshotView.test.ts` (app tests: 15 → 19).
- Total automated tests: 69 → 73 across the four commits in this chapter's work.

## 7. Commands run and exact results

### Passed

- `npm --workspace shared test` — 46/46 passed.
- `npm --workspace app test` — 19/19 passed.
- `npm --workspace backend test` — 8/8 passed.
- `npm test` (root, all three workspaces) — 73/73 passed, run repeatedly after each commit.
- `npm run lint` (app Prettier check + shared Prettier check) — passed.
- `npm --workspace shared run typecheck` — passed.
- `npm --workspace app run typecheck` — passed.
- Live manual verification: started the backend with `node --experimental-strip-types server.js` and sent a real `POST /api/consent/compatibility` request via `curl`; received a correct directional compatibility response, then stopped the server.
- A standalone Node script (`--experimental-strip-types`) exercised the exact mobile code path (`mockConsentProfileVersion` → `computeCompatibility` → `buildSnapshotRows`) for all four personas plus an unknown id, confirming the unknown-id fallback and sane output for each.

### Not run / not applicable

- `npm run test:integration`, `npm run db:*` — not attempted. This machine has no Docker installed (confirmed by `which docker` returning not found), the same pre-existing blocker recorded in `CHAPTER_2_COMPLETION.md`; nothing in this chapter's work touches the database layer, so these checks are unaffected by it either way.
- Physical iPhone or Expo web verification of the updated Consent Snapshot screen — not performed. The app's root layout is gated by `AuthContext`, which fails closed to an error screen without a local Supabase instance (no `app/.env` present, and none can be created without Docker). This is the same infrastructure gap, not a defect introduced by this chapter's changes.

## 8. Known limitations and acceptance criteria

| Acceptance criterion (from `docs/roadmap/CHAPTER_3_CONSENT_ENGINE.md`) | Status                                                                                                                                      |
| ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Consent rules live in a framework-independent domain module            | Implemented (prior session)                                                                                                                 |
| Compatibility output is deterministic and explainable                  | Implemented (prior session); property-based proof added this session                                                                        |
| More restrictive preferences always win                                | Implemented (prior session); property-based proof added this session                                                                        |
| A match never activates consent                                        | Implemented; `consentGranted` is always `false`                                                                                             |
| Consent Snapshots reference immutable profile versions                 | Implemented (prior session)                                                                                                                 |
| Material changes invalidate previous confirmations                     | Implemented (prior session)                                                                                                                 |
| Sensitive data remains private by default                              | Implemented; asserted by tests in both the engine and the adapter                                                                           |
| Safety-critical edge cases have automated tests                        | Implemented, including the previously-missing property-based coverage                                                                       |
| Architecture, threat model, and limitations are documented             | Implemented; `ARCHITECTURE.md`, `KNOWN_LIMITATIONS.md`, ADR 0001, ADR 0002                                                                  |
| Users can preview the practical effect of changes before saving        | Implemented this session (`previewProfileChange`); not yet wired to a profile-edit UI                                                       |
| Legacy Express route replaced or bridged                               | Bridged this session: canonical route added, legacy route deprecated but retained (no client migration performed)                           |
| Mobile Consent Snapshot uses the canonical engine                      | Implemented this session, against mock fixtures; not yet against live per-user profile data (depends on Chapter 4 discovery/session wiring) |

Remaining, explicitly documented limitations (see `docs/KNOWN_LIMITATIONS.md` for full detail): the adapter assumes symmetric receive/offer capability for anything mapped from legacy data; it throws if touch and consent versions diverge rather than resolving the divergence; the legacy `/overlap` route still exists pending a client migration; snapshot fingerprints are deterministic identifiers, not cryptographic signatures; consent explanations have not received independent trauma-informed, safeguarding, or legal review; Docker/RLS integration tests remain unverified on this machine (unchanged from Chapter 2, unaffected by this chapter's work).

## 9. Data-handling implications

No new tables, columns, or persisted fields were introduced. The adapter and preview function operate entirely on data already validated by existing Zod schemas and never write to storage. The new backend route accepts the same category of input the legacy route already accepted (profile-shaped JSON in a request body) and returns only compatibility data, never private notes.

## 10. Exact iPhone launch instructions

Unchanged from `docs/LOCAL_DEVELOPMENT.md` and `CHAPTER_2_COMPLETION.md`; this chapter did not change auth, environment variables, or the launch procedure. Physical-device verification remains blocked by the absence of a local Docker/Supabase instance on this machine (see Chapter 4 recommendation below, which targets exactly this problem via a demo-mode entry point rather than by resolving the Docker gap directly).

## 11. Files materially changed

- Domain: `shared/src/consentEngine.ts`, `shared/src/consentEngine.test.ts`, `shared/src/legacyProfileAdapter.ts`, `shared/src/legacyProfileAdapter.test.ts`, `shared/src/index.ts`
- Backend: `backend/package.json`, `backend/server.js`, `backend/routes/consent.js`, `backend/routes/compatibility.js`, `backend/test/compatibility.test.js`
- Mobile: `app/app/match/consent-snapshot.tsx`, `app/app/match/[id].tsx`, `app/data/mockConsentProfiles.ts`, `app/lib/consentSnapshotView.ts`, `app/lib/consentSnapshotView.test.ts`, `app/data/mock.ts`
- Documentation: `docs/adr/0002-legacy-profile-adapter.md`, `docs/ARCHITECTURE.md`, `docs/CHANGELOG.md`, `docs/KNOWN_LIMITATIONS.md`, `docs/CHAPTER_3_COMPLETION.md`

## 12. Remaining blockers

- No Docker on this machine, so local Supabase, RLS, and integration tests remain unverified (pre-existing, unchanged by this chapter).
- No independent trauma-informed, safeguarding, legal, or accessibility review has occurred for any consent-engine explanation or UI copy.
- The legacy `/api/consent/overlap` route has no client migration plan beyond deprecation marking.

## 13. Recommended first task for Chapter 4

The human directing this work has stated the concrete near-term goal is a build they can run on their own iPhone via Expo Go. The blocking issue is not Chapter 4's session-lifecycle state machine — it is that `AuthContext` unconditionally redirects any signed-out visitor to `/auth/sign-in`, and sign-in requires a live Supabase instance that Docker cannot provide on this machine. `docs/roadmap/PHONE_VISIBLE_VERTICAL_SLICE.md` already specifies the fix: a clearly labeled demo-mode entry point that requires no backend. The first Chapter 4 task is implementing that demo-mode path (an ADR-documented auth-state addition, a sign-in-screen entry point, and adjusting the two onboarding screens that currently no-op when there is no signed-in user) so the existing mock tap-through path — quiz, result, touch language, discovery, consent snapshot, active session, wrap-up, trust ledger — becomes reachable on a physical device without any backend at all. Session-lifecycle state-machine work should follow once that concrete, human-facing goal is met.
