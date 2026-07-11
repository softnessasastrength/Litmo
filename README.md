# Litmo

> **Touch is not a transaction — it is a language.**

Litmo is a consent-centered, trauma-informed platform for safe, non-sexual, platonic physical connection between consenting adults.

It is not a dating app, a therapy platform, or a substitute for emergency or clinical care. The proof of concept focuses on making consent explicit, matching conservative, and exits immediate.

## POC goals

The first working vertical slice demonstrates:

1. Touch Language Profile onboarding
2. Body-zone consent setup
3. Compatibility-based discovery and session requests
4. A mutually confirmed Consent Snapshot
5. An active session timer with a Soft Signal exit
6. Independent session wrap-up
7. A private Trust Ledger

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

| Layer | Technology |
|---|---|
| Mobile | React Native with Expo and TypeScript |
| Navigation | Expo Router |
| Client state | Zustand |
| API | Node.js and Express |
| Database/Auth | Supabase PostgreSQL and Auth |
| Realtime | Supabase Realtime |
| Notifications | Expo Notifications |

```text
Litmo/
├── app/                 # Expo client
├── backend/             # Express API and domain logic
├── supabase/            # SQL schema and migrations
├── docs/                # Product, consent, and trust documentation
└── .env.example
```

## Local setup

### Prerequisites

- Node.js 20+
- npm 10+
- Expo Go or a mobile simulator
- A Supabase project
- Supabase CLI for applying migrations

### Environment

```bash
cp .env.example .env
```

Fill in the values described in `.env.example`. Never commit service-role keys or JWT secrets.

### Install and run the backend

```bash
cd backend
npm install
npm run dev
```

### Install and run the mobile app

```bash
cd app
npm install
npx expo start
```

### Apply the database migrations

```bash
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
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

This repository is an early proof of concept. It is not production-ready and must not be used to arrange real-world sessions without completing independent legal, security, safeguarding, moderation, accessibility, and clinical-risk reviews.

## Contributing

Start with [`docs/CONCEPT.md`](docs/CONCEPT.md). Contributions should preserve Litmo's core principle: safety logic is product logic, not decorative copy.

## License

No license has been selected yet. Until one is added, all rights are reserved.
