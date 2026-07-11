# Local development

## Backend-free demo mode (no Docker required)

If Docker Desktop is unavailable, or you just want to see the app without setting up Supabase, you can still launch on a physical iPhone:

```bash
npm ci
npm --workspace app run start
```

Scan the QR code with Expo Go. Litmo will show a "No local service is configured" screen (or, if `app/.env` already points at an unreachable Supabase instance, the ordinary sign-in screen). Either way, tap **"Continue without an account (demo mode)"**. This runs the full Chapter 1 tap-through path — Welcome → Vibe Quiz → Vibe Profile → Touch Language → Discover → Match Detail → Consent Snapshot → Active Session → Wrap-Up → Trust Ledger — using only local, synthetic data. Nothing is saved, no account is created, and demo mode does not persist across an app restart. See `docs/adr/0003-demo-mode-entry-point.md` for what is and is not exercised in this mode (Chapter 2's real Supabase-backed screens, such as editing your general profile, are unavailable and say so plainly rather than failing silently).

## Standalone iOS build (installs directly on a physical device, no Expo Go)

This produces a real, installable `.ipa` for your own device using EAS Build's free cloud build service, signed with your Apple Developer Program membership. It requires:

- A free Expo/EAS account (sign up at expo.dev).
- An active Apple Developer Program membership ($99/year) so EAS can create a device-registered provisioning profile. Without one, EAS can only build for the iOS Simulator, not a physical phone.

Steps (all interactive — EAS build needs to manage your Apple credentials and provisioning directly, so run these yourself rather than through an automated agent):

```bash
cd app
npx eas-cli login
npx eas-cli build:configure   # links this project to your EAS account; only needs to run once
npx eas-cli build --platform ios --profile preview
```

`eas build:configure` will ask for a bundle identifier; `app/app.json` currently has a placeholder (`com.litmo.app`) — change it if you want something under your own naming convention before your first build. The `preview` build profile (`app/eas.json`) produces an ad-hoc, internally-distributed build: no App Store review, no TestFlight. The first time you build for a new device, EAS will prompt you to register that device's UDID (usually by visiting a link on the phone itself) so Apple's provisioning profile can include it.

When the build finishes, EAS prints an install link and QR code. Open it on the iPhone (Safari, not Expo Go) and install directly — this is a real standalone app icon, not a Metro-connected dev session. It still uses demo mode or Supabase exactly as described above, since none of that behavior depends on how the app was installed.

Re-run `npx eas build --platform ios --profile preview` any time you want an updated build; each run produces a new install link.

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
