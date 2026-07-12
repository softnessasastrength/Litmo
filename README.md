# Litmo

> **Touch is not a transaction — it is a language.**

Litmo is a consent-centered, trauma-informed platform for safe, non-sexual, platonic physical connection between consenting adults.

It is not a dating app, a therapy platform, or a substitute for emergency or clinical care. The proof of concept focuses on making consent explicit, matching conservative, and exits immediate.

## Current foundation

Chapter 1 is a local, synthetic-data experience designed for founder review in an iOS development or standalone build:

```text
Welcome → Vibe Quiz → Vibe Profile → Touch Language → Discover
→ Match Detail → Consent Snapshot → Active Session → Wrap-Up → Trust Ledger
```

Chapter 2 adds real local Supabase email/password authentication, session restoration, protected routes, persistent onboarding, editable general profiles, immutable touch/consent profile versions, owner-only RLS, typed data access, and repository-wide checks. Discovery people, matches, sessions, and trust history remain synthetic until their later roadmap chapters.

Chapter 3 adds a canonical, framework-independent, directional consent-compatibility engine (`@litmo/domain`) with property-based safety tests, a practical-effect preview for profile edits, and a documented adapter that bridges it to Chapter 2's persisted profiles and a live backend route. The mock Consent Snapshot screen now runs this real engine end to end.

A backend-free **demo mode** (`docs/adr/0003-demo-mode-entry-point.md`) lets the full Chapter 1 tap-through path run on a physical iPhone with no Supabase instance. Mandatory Face ID means Expo Go is no longer supported for end-to-end review; use a development or standalone build. From the welcome screen, tap "Explore the prototype" to reach a dedicated entry screen offering either "Enter the fictional demo" (no account, nothing saved) or real account sign-in.

Litmo also runs as a standalone iOS build (not just through Expo Go), including on very new Xcode/iOS betas — see `docs/adr/0004-ios-27-beta-build-fixes.md` and the standalone-build section of `docs/LOCAL_DEVELOPMENT.md`.

## Safety model

Litmo treats consent as session-specific and revocable at any moment.

- Consent is never inferred from a match, prior session, profile, or trust score.
- Session boundaries are computed from the strict intersection of both participants' preferences.
- The more restrictive pressure, duration, and body-zone rule always wins.
- Both participants must explicitly confirm the same Consent Snapshot before activation.
- The Soft Signal ends a session without requiring an explanation.
- Trust records support accountability but never certify that a person is safe.
- Reports and uncomfortable outcomes require human review; they do not trigger automatic public punishment.

See [`docs/CONSENT_FLOW.md`](docs/CONSENT_FLOW.md) and [`docs/TRUST_SYSTEM.md`](docs/TRUST_SYSTEM.md).

## Architecture

| Layer            | Technology                                                                                       |
| ---------------- | ------------------------------------------------------------------------------------------------ |
| Mobile prototype | React Native with Expo SDK 55 and TypeScript                                                     |
| Navigation       | Expo Router                                                                                      |
| Auth state       | One authoritative React Context backed by Supabase Auth, plus an explicit backend-free demo mode |
| Domain boundary  | Framework-independent TypeScript and Zod schemas                                                 |
| API              | Node.js and Express                                                                              |
| Database/Auth    | Supabase PostgreSQL and Auth                                                                     |
| Realtime         | Supabase Realtime                                                                                |
| Notifications    | Expo Notifications                                                                               |

```text
Litmo/
├── app/                 # Expo client
├── backend/             # Express API and domain logic
├── supabase/            # SQL schema and migrations
├── docs/                # Product, consent, and trust documentation
└── .env.example
```

## Local setup

### Run locally

- Node.js 20.19+
- npm 10+
- Docker Desktop
- A Face ID iPhone and an iOS development or standalone build

```bash
npm ci
npm run db:start
npm run db:reset
cp app/.env.example app/.env
npm run dev
```

Copy the local URL and anon key from `npx supabase status` into `app/.env`, then scan Expo's QR code. See [`docs/LOCAL_DEVELOPMENT.md`](docs/LOCAL_DEVELOPMENT.md), including the physical-device hostname note.

### Verification

```bash
npm run lint
npm run typecheck
npm test
npm run test:integration
npm run build
```

Integration tests require running local Supabase.

### Service commands

```bash
npm run mobile
npm run api
npm run db:start
npm run db:reset
npm run db:stop
```

## Core session lifecycle

```text
requested
  -> consent_pending
  -> consented
  -> active
  -> completed | exited | cancelled
```

A session cannot become `active` until both users have confirmed the same immutable Consent Snapshot.

## Repository status

This repository is an early application foundation. It is not production-ready and must not be used to arrange real-world sessions. Authentication and RLS reduce local-development risk but do not constitute a safety, privacy, legal, or safeguarding certification.

See [`docs/FIRST_PLAYABLE.md`](docs/FIRST_PLAYABLE.md) for the flow, accessibility decisions, and visual rationale.
See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md), [`docs/SECURITY_MODEL.md`](docs/SECURITY_MODEL.md), and [`docs/DATA_CLASSIFICATION.md`](docs/DATA_CLASSIFICATION.md) for Chapter 2 boundaries.

## Roadmap

See [`ROADMAP.md`](ROADMAP.md) for chapter status and [`docs/roadmap/README.md`](docs/roadmap/README.md) for the full chapter sequence. Chapter 3 (Consent Engine) is complete (`docs/CHAPTER_3_COMPLETION.md`); Chapter 4 (Session Lifecycle) is active. Well-specified future work not yet assigned to a chapter — including a passwordless Sign in with Apple + passkeys authentication redesign — is tracked in [`docs/TODO.md`](docs/TODO.md).

## Contributing

Start with [`docs/CONCEPT.md`](docs/CONCEPT.md). Contributions should preserve Litmo's core principle: safety logic is product logic, not decorative copy.

## License

No license has been selected yet. Until one is added, all rights are reserved.
