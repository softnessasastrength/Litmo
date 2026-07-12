# Architecture

Litmo is organized as a mobile application, shared domain layer, backend API, and Supabase/PostgreSQL persistence boundary.

## Current stack

| Layer | Technology |
| --- | --- |
| Mobile client | React Native, Expo, TypeScript |
| Navigation | Expo Router |
| Authentication | Supabase Auth plus platform passkey work |
| Domain validation | TypeScript and Zod |
| Shared safety logic | Framework-independent TypeScript |
| Backend | Node.js and Express |
| Database | Supabase PostgreSQL |
| Realtime | Supabase Realtime |
| Notifications | Expo Notifications |

## Repository layout

```text
Litmo/
├── app/          Mobile application and native modules
├── backend/      API routes and server-side services
├── shared/       Canonical domain and consent semantics
├── supabase/     Migrations, policies, tests, and seed data
├── docs/         Philosophy, product, safety, and architecture
└── scripts/      Validation and development tooling
```

## Authority boundaries

- The shared package defines canonical domain semantics.
- The backend and database enforce authorization and lifecycle invariants.
- Clients present state but must not invent or weaken consent rules.
- Database functions, constraints, and row-level security remain effective even if client code is bypassed.

## Session lifecycle

```text
requested
  → consent_pending
  → consented
  → active
  → completed | exited | cancelled
```

Terminal sessions cannot be reactivated. Activation requires both participants to affirm the same valid Consent Snapshot.

## Architectural discipline

Meaningful changes should include implementation, tests, documentation, and an ADR where the decision has lasting architectural, product, privacy, safety, governance, or vendor consequences.