<div align="center">

# Litmo

### Touch is not a transaction — it is a language.

**A consent-centered, trauma-informed platform for safe, non-sexual, platonic physical connection between consenting adults.**

[Why Litmo exists](docs/philosophy/00_Founding_Thesis.md) · [Consent flow](docs/CONSENT_FLOW.md) · [Trust system](docs/TRUST_SYSTEM.md) · [Architecture](docs/ARCHITECTURE.md) · [Guided learning](docs/LEARNING_SYSTEM.md)

</div>

---

## What Litmo is

Litmo is an attempt to build the social infrastructure that safe platonic touch has always lacked.

It is **not** a dating app, therapy platform, or substitute for emergency or clinical care. It is a structured way for adults to describe what safe touch means to them, discover compatible boundaries, confirm consent explicitly, and stop immediately without explanation.

> **Litmo is not trying to optimize touch. It is trying to protect it.**

## The core experience

```text
Welcome → Vibe Quiz → Vibe Profile → Touch Language
→ Learn → Discover → Match Detail → Consent Snapshot
→ Active Session → Wrap-Up → Trust Ledger
```

### Touch Language Profile

Describe preferred hold types, pressure, duration, body zones, environment, and nervous-system context before meeting anyone.

### Guided Learning

Short, step-by-step modules explain Consent Snapshots, the Soft Signal, and Touch Language through plain-language instruction and fictional scenarios. Progress is private and device-local in the current implementation.

### Backend-free demo (Expo Go)

A clearly labeled **demo mode** (`docs/adr/0003-demo-mode-entry-point.md`) runs the full fictional tap-through path on a physical iPhone through Expo Go with no Supabase, Docker, or `.env`. Face ID is mandatory only for real account sessions (ADR 0007 amendment). From the welcome screen: **Explore the prototype** → **Enter the fictional demo**. Real accounts still need local Supabase and a Face ID development or standalone build — see `docs/LOCAL_DEVELOPMENT.md`.

### Consent Snapshot

Both participants review and affirm the exact intersection of their current boundaries. Nothing is inferred from a match, prior interaction, profile, or trust history.

### Soft Signal

End a session immediately. No explanation required. No social negotiation. No penalty for stopping.

### Trust Ledger

Support gradual accountability through affirmed session history without ever certifying that a person is universally safe.

## Safety is product logic

Litmo treats consent as session-specific and revocable at every moment.

- Consent is never inferred.
- The strictest compatible boundary always wins.
- Both participants must confirm the same immutable Consent Snapshot.
- A session cannot become active before mutual confirmation.
- The Soft Signal ends the interaction immediately.
- Trust history supports context, not certainty.
- Reports and uncomfortable outcomes require careful human review.

Read the full [Consent Flow](docs/CONSENT_FLOW.md), [Trust System](docs/TRUST_SYSTEM.md), and [Consent Withdrawal and Emergency Stop](docs/CONSENT_WITHDRAWAL_AND_EMERGENCY_STOP.md).

## Current build

Litmo currently includes:

- a complete tap-through prototype and backend-free demo mode;
- Expo Router navigation and a native iOS development build path;
- Supabase-backed authentication, device registration, and persistent profiles;
- passkey-first authentication architecture and mandatory Face ID for real account sessions (demo path remains Expo Go–friendly);
- owner-only row-level security and database-enforced session transitions;
- immutable touch profiles and Consent Snapshots;
- private session requests, realtime updates, unilateral withdrawal, emergency stop, and private wrap-ups;
- device-bound sensitive-data protection and privacy-safe notifications;
- a framework-independent consent compatibility engine with property-based safety tests;
- guided learning modules with private local progress and resume behavior;
- and documented release, privacy, security, and TestFlight boundaries.

Some discovery content and trust-history presentation remain synthetic or beta-oriented while real-world moderation, reporting, accessibility validation, and operational safeguards are developed.

> **Repository status:** Advanced private-beta foundation. Not production-ready. Do not use the current build to arrange real-world sessions with strangers.

## Architecture

| Layer | Technology |
| --- | --- |
| Mobile app | React Native · Expo SDK 55 · TypeScript |
| Navigation | Expo Router |
| Authentication | Supabase Auth · native passkey module · LocalAuthentication |
| Domain boundary | TypeScript · Zod |
| API | Node.js · Express |
| Database | Supabase PostgreSQL |
| Realtime | Supabase Realtime |
| Notifications | Expo Notifications |
| Local protected state | SecureStore · AsyncStorage for non-sensitive learning progress |

```text
Litmo/
├── app/          Mobile application
├── backend/      Express API and domain logic
├── shared/       Canonical domain and session rules
├── supabase/     Schema, policies, migrations, and pgTAP tests
├── docs/         Product, safety, architecture, and operations documents
├── documents/    Governance and design philosophy
├── wiki/         Publish-ready GitHub Wiki source
└── .env.example
```

## Run locally

### Requirements

- Node.js 20.19+
- npm 10+
- Docker Desktop for local Supabase and integration tests (not required for demo-only)
- Expo Go for the fictional demo path on an iPhone
- Xcode / Face ID development build for real accounts, passkeys, and release work

### Demo only (no Docker)

```bash
npm ci
npm run mobile
```

Scan the QR code in Expo Go → **Explore the prototype** → **Enter the fictional demo**.

### Full local stack (accounts + DB)

```bash
npm ci
npm run db:start
npm run db:reset
cp app/.env.example app/.env
npm run dev
```

Copy the local Supabase URL and anon key from `npx supabase status` into `app/.env`, then scan Expo's QR code or use the documented development-build path.

See [Local Development](docs/LOCAL_DEVELOPMENT.md), [Machine Setup](docs/MACHINE_SETUP.md), and [Passkey Authentication](docs/PASSKEY_AUTHENTICATION.md) for platform-specific setup.

### Verify the repository

```bash
npm run state:check
npm run lint
npm run typecheck
npm test
npm run test:integration
npm run db:lint
npm run build
```

Integration and database checks require local Supabase to be running. Native iOS and release verification require Xcode and appropriate signing configuration.

## Core session lifecycle

```text
requested
  → consent_pending
  → consented
  → active
  → completed | exited | cancelled | withdrawn
```

A session cannot become `active` until both users affirm the same immutable Consent Snapshot. Either participant may stop or withdraw unilaterally.

## Project philosophy

The project's philosophical order is:

```text
Founding Thesis
      ↓
Constitution
      ↓
Product Requirements
      ↓
Architecture
      ↓
Code
```

Start with the [Founding Thesis](docs/philosophy/00_Founding_Thesis.md): it explains why Litmo exists and why safety, privacy, consent, and human agency outrank growth or convenience.

## Documentation

- [Documentation Map](docs/DOCUMENTATION_MAP.md)
- [Founding Thesis](docs/philosophy/00_Founding_Thesis.md)
- [Litmo Constitution](docs/LITMO_CONSTITUTION.md)
- [Concept](docs/CONCEPT.md)
- [Consent Flow](docs/CONSENT_FLOW.md)
- [Trust System](docs/TRUST_SYSTEM.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Security Model](docs/SECURITY_MODEL.md)
- [Data Classification](docs/DATA_CLASSIFICATION.md)
- [Guided Learning System](docs/LEARNING_SYSTEM.md)
- [Known Limitations](docs/KNOWN_LIMITATIONS.md)
- [Release and TestFlight](docs/RELEASE_AND_TESTFLIGHT.md)

## Roadmap

See [`ROADMAP.md`](ROADMAP.md) for chapter status and [`docs/roadmap/README.md`](docs/roadmap/README.md) for the full chapter sequence. Chapters 1–4 are implemented at foundation level. Guided learning now has a first vertical slice; the next product work should focus on real-device validation, fictional two-person practice, accessibility review, moderation/reporting design, and invite-only beta operations.

## Contributing

Contributions should preserve Litmo's core principle:

> **Safety logic is product logic, not decorative copy.**

Read the [Founding Thesis](docs/philosophy/00_Founding_Thesis.md), [Constitution](docs/LITMO_CONSTITUTION.md), [Concept](docs/CONCEPT.md), and [current handoff](CURRENT_STATE.md) before changing product behavior.

## License

Except where otherwise noted, Litmo is licensed under the [Mozilla Public License 2.0](LICENSE) (`MPL-2.0`). MPL-2.0 is a file-level copyleft license: if you distribute modifications to covered files, those files must remain available under MPL-2.0 as required by the license. Third-party dependencies and assets retain their own licenses.

Licensing does not waive Litmo's safety requirements or grant trademark rights. See [ADR 0044](docs/adr/0044-mpl-2.0-project-license.md) for the decision and follow-up governance work.
