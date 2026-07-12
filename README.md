<div align="center">

# Litmo

### Touch is not a transaction — it is a language.

**A consent-centered, trauma-informed platform for safe, non-sexual, platonic physical connection between consenting adults.**

[Why Litmo exists](docs/philosophy/00_Founding_Thesis.md) · [Consent flow](docs/CONSENT_FLOW.md) · [Trust system](docs/TRUST_SYSTEM.md) · [Architecture](docs/ARCHITECTURE.md)

</div>

---

## What Litmo is

Litmo is an attempt to build the social infrastructure that safe platonic touch has always lacked.

It is **not** a dating app, therapy platform, or substitute for emergency or clinical care. It is a structured way for adults to describe what safe touch means to them, discover compatible boundaries, confirm consent explicitly, and stop immediately without explanation.

> **Litmo is not trying to optimize touch. It is trying to protect it.**

## The core experience

```text
Welcome → Vibe Quiz → Vibe Profile → Touch Language
→ Discover → Match Detail → Consent Snapshot
→ Active Session → Wrap-Up → Trust Ledger
```

### Touch Language Profile

Describe preferred hold types, pressure, duration, body zones, environment, and nervous-system context before meeting anyone.

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

Read the full [Consent Flow](docs/CONSENT_FLOW.md) and [Trust System](docs/TRUST_SYSTEM.md).

## Current build

Litmo currently includes:

- a complete tap-through prototype for founder review;
- Expo Router navigation;
- Supabase-backed authentication and persistent profiles;
- owner-only row-level security;
- immutable touch and consent profile versions;
- a framework-independent consent compatibility engine;
- property-based safety tests;
- and a backend-free demo mode for physical-device testing.

The discovery people, matches, sessions, and trust history remain synthetic while the safety and persistence foundations are developed.

> **Repository status:** Early application foundation. Not production-ready. Do not use the current build to arrange real-world sessions.

## Architecture

| Layer | Technology |
| --- | --- |
| Mobile app | React Native · Expo SDK 55 · TypeScript |
| Navigation | Expo Router |
| Authentication | Supabase Auth |
| Domain boundary | TypeScript · Zod |
| API | Node.js · Express |
| Database | Supabase PostgreSQL |
| Realtime | Supabase Realtime |
| Notifications | Expo Notifications |

```text
Litmo/
├── app/          Mobile application
├── backend/      Express API and domain logic
├── supabase/     Schema, policies, and migrations
├── docs/         Product, safety, and architecture documents
└── .env.example
```

## Run locally

### Requirements

- Node.js 20.19+
- npm 10+
- Docker Desktop
- Expo Go on an iPhone

### Setup

```bash
npm ci
npm run db:start
npm run db:reset
cp app/.env.example app/.env
npm run dev
```

Copy the local Supabase URL and anon key from `npx supabase status` into `app/.env`, then scan Expo's QR code.

See [Local Development](docs/LOCAL_DEVELOPMENT.md) for full instructions, including physical-device hostname configuration.

### Verify the repository

```bash
npm run lint
npm run typecheck
npm test
npm run test:integration
npm run build
```

Integration tests require local Supabase to be running.

## Core session lifecycle

```text
requested
  → consent_pending
  → consented
  → active
  → completed | exited | cancelled
```

A session cannot become `active` until both users affirm the same immutable Consent Snapshot.

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

- [Founding Thesis](docs/philosophy/00_Founding_Thesis.md)
- [Concept](docs/CONCEPT.md)
- [First Playable](docs/FIRST_PLAYABLE.md)
- [Consent Flow](docs/CONSENT_FLOW.md)
- [Trust System](docs/TRUST_SYSTEM.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Security Model](docs/SECURITY_MODEL.md)
- [Data Classification](docs/DATA_CLASSIFICATION.md)

## Roadmap

See [`ROADMAP.md`](ROADMAP.md) for chapter status and [`docs/roadmap/README.md`](docs/roadmap/README.md) for the full chapter sequence. Chapter 3 (Consent Engine) is complete (`docs/CHAPTER_3_COMPLETION.md`); Chapter 4 (Session Lifecycle) is active. Passkey behavior and deployment requirements are documented in [`docs/PASSKEY_AUTHENTICATION.md`](docs/PASSKEY_AUTHENTICATION.md).

## Contributing

Contributions should preserve Litmo's core principle:

> **Safety logic is product logic, not decorative copy.**

Read the [Founding Thesis](docs/philosophy/00_Founding_Thesis.md) and [Concept](docs/CONCEPT.md) before changing product behavior.

## License

No license has been selected yet. Until one is added, all rights are reserved.
