# Chapter 2 completion report

## Status

Implementation is complete on `agent/chapter-2-foundation`. Static checks, unit tests, and iOS bundle validation pass.

**Update, 2026-07-12**: Docker was installed on this machine and the previously-blocked database acceptance criteria have now actually been run and verified locally — see the updated tables below. Running them for the first time surfaced and fixed a real bug: migration 005's RLS policies existed with no underlying table-level `GRANT` to `authenticated` on `profiles`, `onboarding_progress`, `touch_profile_versions`, or `consent_preference_versions`, so every signed-in user got "permission denied" — not just in the pgTAP suite, in the real app too. Fixed in migration `006_grant_authenticated_table_privileges.sql`. Hosted CI (GitHub Actions) still has not been run from this branch.

## 1. Initial repository condition

Chapter 1 was a polished, mock-only Expo flow. App type checking, quiz tests, formatting, and backend consent tests passed. The repository had no root package manifest, root commands, authentication, persistence, runtime domain validation, local Supabase configuration, RLS integration tests, comprehensive CI, or Chapter 2 architecture/security documentation. The detailed command record is in `CHAPTER_2_BASELINE.md`.

## 2. Material changes

- Added root npm workspaces, lockfile-based installation, normalized commands, environment validation, and a local Supabase CLI dependency.
- Added `@litmo/domain` with canonical enums, TypeScript types, Zod runtime schemas, and serialization tests.
- Added real Supabase signup, sign-in, sign-out, session restoration, expired-session behavior, protected routing, and onboarding routing.
- Added persistent onboarding drafts, completed profile persistence, general profile editing, and transactional immutable touch/consent versions.
- Added typed repositories with timeouts, stable safe errors, and redacted structured development logs.
- Added explicit loading, empty, validation, network/permission, unexpected-failure, and retry components plus a root error boundary.
- Added local Supabase config, synthetic seed users, Chapter 2 tables, constraints, indexes, RLS, a safe discovery function, immutable-version triggers, pgTAP policy tests, and a two-client integration scenario.
- Replaced backend-only CI with repository-wide static/build checks and a database job.
- Added local development, architecture, security, and data-classification documentation.

## 3. Architecture decisions

- Zod is the runtime source of truth because TypeScript types do not validate database or network data.
- `AuthContext` is the single client authority for authentication and route decisions.
- UI components use repositories rather than direct Supabase queries.
- General profile, onboarding drafts, touch preferences, consent boundaries, and private nervous-system notes remain structurally separate.
- Material touch and consent edits append paired versions in one transaction under a per-user advisory lock.
- Existing consent/session code is preserved; Chapter 3 and Chapter 4 behavior was not implemented.

## 4. Security decisions

- Mobile configuration accepts only URL and anon key. No service-role credential exists in mobile source.
- Every new user-data table enables RLS.
- Private reads and writes are owner-scoped; history tables are append/select only and mutation triggers provide defense in depth.
- Discovery uses an allowlisted safe-field function and omits touch, consent, and private-note data.
- Raw database errors are mapped to stable public codes.
- Log fields with consent, body zone, nervous-system, note, password, token, secret, or session names are redacted.
- AsyncStorage restores Expo Go sessions but is not hardware-encrypted; production secure storage remains a documented requirement.

## 5. Tests added

- 6 shared domain validation and serialization tests.
- 6 auth restoration and protected-route transition tests.
- 3 auth operation tests: signup, invalid credentials, and logout.
- 3 public error-mapping tests.
- 8 pgTAP RLS/immutability assertions (grew to 8 on 2026-07-12; see the update note above).
- 1 two-client integration scenario covering signup, progress persistence, two profile versions, RLS isolation, restoration, and logout.
- Existing 3 quiz and 6 backend consent tests remain intact.

## 6. Commands run and exact results

### Passed

- `npm run lint` — passed both app and shared Prettier checks.
- `npm run typecheck` — passed shared and Expo TypeScript checks.
- `npm test` — passed 6 shared, 15 app, and 6 backend tests; 27 total.
- `env HOME=/tmp EXPO_NO_TELEMETRY=1 npm run build` — passed shared TypeScript build and iOS Expo export; 1,180 modules bundled.
- `env EXPO_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321 EXPO_PUBLIC_SUPABASE_ANON_KEY=synthetic-public-key npm run env:check` — passed without logging values.
- `env HOME=/tmp npx supabase --version` — passed; version `2.109.1`.
- `git diff --check` — passed.
- Mobile secret-name scan outside the example environment file — no service-role or JWT-secret references found.

### Previously blocked, now passed (2026-07-12, Docker installed)

- `npm run db:start` / `npm run db:reset` — pass; all six migrations apply cleanly (including the new `006_grant_authenticated_table_privileges.sql`) and the seed loads.
- `npm run db:lint` — passed, no schema errors.
- `npx supabase test db` — passed, 8/8 pgTAP assertions (`supabase/tests/rls.test.sql`; one assertion rewritten to check that a disallowed update affects zero rows rather than assuming it raises, since Postgres denies row visibility for a command with no matching RLS policy rather than throwing — see the file's comments).
- `npm run test:integration` — passed, the two-client signup/persistence/versioning/RLS-isolation scenario.

Running these for the first time surfaced a real bug, now fixed: migration 005 created RLS policies for `profiles`, `onboarding_progress`, `touch_profile_versions`, and `consent_preference_versions` with no underlying table-level `GRANT` to `authenticated`. Postgres denies access at the grant level before RLS is even evaluated, so every signed-in user got "permission denied" on all four tables — in the real app, not just in a test that had never been run.

### Still blocked or unverified

- GitHub Actions CI — workflow created but not run from this unpushed local branch.
- Physical iPhone smoke path against a real (non-demo-mode) Supabase-backed account — documented in `docs/LOCAL_DEVELOPMENT.md` but not run end-to-end on a device in this session; demo mode and standalone iOS builds against mock/local data have been verified separately (see `docs/adr/0003-demo-mode-entry-point.md`, `docs/adr/0004-ios-27-beta-build-fixes.md`).

## 7. Known limitations and acceptance criteria

| Acceptance criterion                 | Status                                                                  |
| ------------------------------------ | ----------------------------------------------------------------------- |
| Clean-clone configuration documented | Implemented; not independently rehearsed                                |
| Local services start                 | Passed (2026-07-12)                                                     |
| Signup, sign-in, sign-out            | Implemented, unit-tested, and passed live via the integration test      |
| Session restoration                  | Implemented, unit-tested, and passed live via the integration test      |
| Onboarding progress persists         | Implemented and passed live via the integration test                    |
| Touch Language Profile persists      | Implemented and passed live via the integration test                    |
| Material changes create versions     | Implemented with transaction/lock; passed live via the integration test |
| Cross-user private access rejected   | RLS and tests written; passed, 8/8 pgTAP assertions                     |
| No service-role key in mobile code   | Passed source scan                                                      |
| Loading and failure states usable    | Implemented; manual accessibility review outstanding                    |
| Lint                                 | Passed                                                                  |
| Type checking                        | Passed                                                                  |
| Unit tests                           | Passed, 90/90 (repo-wide, as of 2026-07-12)                             |
| Build validation                     | Passed                                                                  |
| CI                                   | Blocked until branch is pushed and workflow runs                        |
| No secrets committed                 | Passed source review; independent scanner not run                       |

Additional limitations: AsyncStorage token persistence needs production hardening; email confirmation is disabled locally; no independent security/accessibility reviewer participated; Expo/npm dependencies report 9 moderate transitive CLI-tooling advisories whose automated fix proposes an unsafe SDK downgrade.

## 8. Files materially changed

- Root: `package.json`, `package-lock.json`, `.env.example`, `ROADMAP.md`
- Scripts: `scripts/validate-env.mjs`, `scripts/run-integration.mjs`
- Shared domain: `shared/package.json`, TypeScript configs, `shared/src/index.ts`, `shared/src/domain.test.ts`
- Mobile config: `app/package.json`, `app/.env.example`, root layout
- Mobile auth: `app/context/AuthContext.tsx`, `authState.ts`, auth screens, auth/error tests and services
- Mobile persistence: `profileRepository.ts`, onboarding quiz, Touch Language, profile edit, Trust Ledger, Discover
- Mobile resilience: `AppErrorBoundary.tsx`, `AsyncState.tsx`, logger and error mapping
- Database: `supabase/config.toml`, migration `005_foundation_profiles.sql`, `seed.sql`, `tests/rls.test.sql`
- Integration/CI: `integration/foundation.test.mjs`, `.github/workflows/ci.yml`
- Documentation: `README.md`, `ROADMAP.md`, `CHAPTER_2_BASELINE.md`, `CHAPTER_2_COMPLETION.md`, `LOCAL_DEVELOPMENT.md`, `ARCHITECTURE.md`, `SECURITY_MODEL.md`, `DATA_CLASSIFICATION.md`

## 9. Recommended first task for Chapter 3

After Docker-backed checks and CI pass, begin Chapter 3 by defining the canonical, version-referencing consent compatibility input/output schema and negative invariants in `@litmo/domain`. Do not connect it to session activation until the explainable engine and tests are reviewed.
