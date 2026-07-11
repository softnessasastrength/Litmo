# Chapter 2 baseline

Recorded on 2026-07-11 from commit `94cd136` on the dedicated branch `agent/chapter-2-foundation`.

## Current architecture

- `app/` is an Expo SDK 55 / React Native / TypeScript prototype using Expo Router, React Context, static synthetic data, and no network calls.
- `backend/` is a small Express service exposing a health endpoint and a conservative consent-overlap endpoint.
- `supabase/` contains four early SQL migrations for users, sessions, consent records, and a private append-only trust ledger. It has no local Supabase configuration or seed.
- The repository has no root package manifest or workspace command surface.
- GitHub Actions runs only the backend Node test suite and uses `npm install` rather than lockfile installation.

## Commands attempted

### Passed

- `cd app && npm run typecheck` — passed with no TypeScript errors.
- `cd app && npm test` — passed 3 of 3 deterministic quiz-scoring tests.
- `cd app && npm run format:check` — passed; all matched files were formatted.
- `cd backend && npm test` — passed 6 of 6 consent-overlap and hashing tests.

### Failed or unavailable

- Root `npm run dev`, `mobile`, `api`, `lint`, `typecheck`, `test`, `test:integration`, `build`, `db:start`, `db:reset`, and `db:stop` all failed with `ENOENT` because the repository had no root `package.json`.
- `supabase --version` failed because the Supabase CLI is not installed on the baseline machine.
- `docker --version` failed because Docker is not installed on the baseline machine.
- There was no existing lint command, integration test command, migration validation command, or application build command to run.

## Missing infrastructure

- Canonical framework-independent domain types and runtime schemas.
- Root workspace scripts and deterministic lockfile-based installation.
- Supabase client wiring, secure environment validation, and redacted logging.
- Email/password authentication, session restoration, protected navigation, and safe auth errors.
- Persistent onboarding, profile editing, and immutable touch/consent profile versions.
- Chapter 2 database tables, local Supabase configuration, safe seed data, and demonstrable RLS isolation.
- Loading, empty, permission, network, validation, and unexpected-failure UX states plus an error boundary.
- Unit tests for domain validation, auth transitions, serialization, onboarding, and error mapping.
- Integration tests for authentication, persistence, versioning, restoration, and cross-user isolation.
- Repository-wide CI, lint, build validation, and migration validation.
- Architecture, security, data-classification, local-development, and completion documentation.

## Major risks

1. Existing `users.touch_profile` stores an untyped mutable JSON object, which conflicts with immutable version requirements.
2. Existing migrations are not a complete local reset path and provide no safe automatic profile creation after signup.
3. Sensitive consent details and private nervous-system notes are not yet structurally separated.
4. The Chapter 1 navigation assumes every visitor may enter the mock flow; there is no authoritative auth or onboarding gate.
5. The root `.env.example` mixes client-safe and server-only variable names, increasing accidental secret-exposure risk.
6. Local RLS verification depends on Docker, which is absent from this machine.
7. Authentication and authorization are safety-critical, but implementation review will not be independent unless another reviewer is assigned.

## Proposed implementation order

1. Add root workspace commands, lint/build validation, environment validation, and lockfiles.
2. Add a shared TypeScript domain package with runtime schemas and tests.
3. Replace in-memory app authority with a single Supabase-backed auth state module and route guards.
4. Add typed data access, persistent onboarding/profile editing, safe error mapping, timeouts, and redacted logs.
5. Add orderly Chapter 2 migrations, RLS, discovery-safe projection, local config, and synthetic seeds.
6. Add unit and integration tests, resilient UX states, accessibility checks, and a deterministic smoke procedure.
7. Expand CI and complete architecture, security, data-classification, local-development, and completion documentation.

No production claims should be made until local database policy tests and an independent safety/security review have occurred.
