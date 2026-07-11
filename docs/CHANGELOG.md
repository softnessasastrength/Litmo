# Changelog

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
