# Getting Started

## Requirements

- Node.js 20.19 or newer
- npm 10 or newer
- Docker Desktop for local Supabase
- Xcode for iOS development builds
- Expo Go or a signed iOS development build on a physical iPhone

## Local setup

```bash
npm ci
npm run db:start
npm run db:reset
cp app/.env.example app/.env
npm run dev
```

Copy the local Supabase URL and anonymous key reported by `npx supabase status` into `app/.env`.

## Repository verification

```bash
npm run lint
npm run typecheck
npm test
npm run test:integration
npm run build
npm run state:check
```

Docker-backed integration and database checks require local Supabase to be running.

## Demo mode

The repository includes an explicitly isolated backend-free demo path for physical-device and founder review. Demo data must remain visibly synthetic and must never be confused with production data or real authorization.

## Before making changes

Read:

1. `README.md`
2. `AGENTS.md`
3. `CURRENT_STATE.md`
4. `TASKS.md`
5. `DECISIONS.md`
6. `project-state.json`
7. the relevant roadmap and ADR documents

Then inspect `git status`, the active branch, recent commits, and current test state.

## Important warning

Litmo is under active development and is not yet ready for arranging real-world sessions with strangers.