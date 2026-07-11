# Local development

## Prerequisites

- Node.js 20.19 or newer
- npm 10 or newer
- Docker Desktop running
- The current Expo Go app for device review

The Supabase CLI is installed through the root lockfile; a separate global install is not required.

## First setup

```bash
npm ci
npm run db:start
npm run db:reset
npx supabase status
cp app/.env.example app/.env
```

Copy the local API URL and anon key printed by `supabase status` into `app/.env`. Never place the service-role key in an `EXPO_PUBLIC_` variable or in mobile source.

Start the application:

```bash
npm run dev
```

Start only one service when needed:

```bash
npm run mobile
npm run api
```

On a physical iPhone, `127.0.0.1` points to the phone rather than the development computer. Replace the URL host in `app/.env` with the computer's trusted LAN address. Do not expose local Supabase to an untrusted network.

## Demo accounts

The reset seed creates two synthetic local-only accounts:

- `maya.demo@litmo.local`
- `eli.demo@litmo.local`

Both use `LitmoDemo123!`. These credentials are deliberately non-production and must never be deployed.

## Database lifecycle

```bash
npm run db:start
npm run db:reset
npm run db:lint
npx supabase test db
npm run test:integration
npm run db:stop
```

`db:reset` applies every ordered migration and recreates the synthetic seed. Integration tests also create disposable `example.test` users and should run only against local Supabase.

## Required checks

```bash
npm run lint
npm run typecheck
npm test
npm run test:integration
npm run build
```

## Deterministic mobile smoke path

1. Reset the database and start Expo.
2. Launch the app and confirm it redirects to Sign In.
3. Create an account with a synthetic `example.test` email.
4. Complete the Vibe Quiz and Touch Language steps.
5. Confirm Discover appears.
6. Close Expo Go completely and reopen the project.
7. Confirm the authenticated Discover screen returns without signing in again.
8. Open Edit Profile, change the introduction, save, and reopen it.
9. Complete Touch Language again and confirm a new version row exists without changing the prior row.
10. Navigate through the mock session to Trust Ledger and sign out.
11. Confirm protected content redirects to Sign In.

## Troubleshooting

- A configuration screen means `app/.env` is absent or invalid.
- A network state means Supabase is stopped or the device cannot reach the configured host.
- Run `npx supabase status` before integration tests.
- Run `npm run db:reset` after migration changes.
