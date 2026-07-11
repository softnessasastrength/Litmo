# Litmo

> **Touch is not a transaction — it is a language.**

Litmo is a consent-centered, trauma-informed platform for safe, non-sexual, platonic physical connection between consenting adults.

It is not a dating app, a therapy platform, or a substitute for emergency or clinical care. The proof of concept focuses on making consent explicit, matching conservative, and exits immediate.

## First playable prototype

Chapter 1 is a local, synthetic-data experience designed for founder review in Expo Go:

```text
Welcome → Vibe Quiz → Vibe Profile → Touch Language → Discover
→ Match Detail → Consent Snapshot → Active Session → Wrap-Up → Trust Ledger
```

The prototype contains no authentication, networking, real matching, real location, or persistent personal data. All people, histories, sessions, and outcomes shown in the app are fictional.

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
| Mobile prototype | React Native with Expo SDK 55 and TypeScript |
| Navigation | Expo Router |
| Prototype state | React Context, in memory only |
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

### Run the first playable in Expo Go

- Node.js 20.19+
- npm 10+
- The current Expo Go app on an iPhone

```bash
cd app
npm install
npm start
```

Scan the QR code with the iPhone Camera app and open it in Expo Go. The prototype does not require `.env` configuration or a running backend.

### Verification

```bash
cd app
npm run typecheck
npm test
```

The existing consent-domain tests remain separate:

```bash
cd backend
npm install
npm test
```

Backend and Supabase files are retained as future architecture experiments but are not used by Chapter 1.

### Future backend environment

```bash
cp .env.example .env
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

This repository is an early, playable prototype. It is not production-ready and must not be used to arrange real-world sessions. Chapter 1 simulates safety behavior for evaluation; it does not provide operational safeguards.

See [`docs/FIRST_PLAYABLE.md`](docs/FIRST_PLAYABLE.md) for the flow, accessibility decisions, and visual rationale.

## Contributing

Start with [`docs/CONCEPT.md`](docs/CONCEPT.md). Contributions should preserve Litmo's core principle: safety logic is product logic, not decorative copy.

## License

No license has been selected yet. Until one is added, all rights are reserved.
