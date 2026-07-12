# Track B — local two-account path

After Track A (demo) and Track C (accessibility), Track B proves **real**
request → Consent Snapshot → active → Soft Signal with two authenticated users.

## One-shot setup

```bash
# Docker Desktop must be running (this machine: /Volumes/SSD/Docker.app is fine)
bash scripts/setup-track-b-local.sh
npm run api      # terminal 1
npm run mobile   # terminal 2
```

The setup script ends by **password-logging in every seed email**. If that
step fails with HTTP 500 and a `confirmation_token` scan error, re-check
`supabase/seed.sql` token columns (must be `''`, not `NULL` — ADR 0041).

## Seed accounts

Password for all: `LitmoDemo123!`

| Email | Role |
|-------|------|
| `maya.demo@litmo.local` | Account A |
| `eli.demo@litmo.local` | Account B |
| `eli-persona.demo@litmo.local` | Extra discovery persona |
| `jonah-persona.demo@litmo.local` | Extra discovery persona |

Sign-in → **Sign in with seed account** (development only; ADR 0041).

## Physical phone

1. Copy `app/.env.lan.example` values into `app/.env` (LAN IP, not 127.0.0.1).  
2. Restart Metro.  
3. Face ID still required for real account privacy lock (ADR 0007).

## Automated proof (no UI)

With Docker + reset:

```bash
npm run test:integration   # Chapter 4 two-client lifecycle + snapshot
env HOME=/tmp npx supabase test db
```

## Checklist

Use B-rows in `docs/PHYSICAL_BETA_WALKTHROUGH.md`. Record in
`docs/PHYSICAL_BETA_WALKTHROUGH_RESULTS.md`.
