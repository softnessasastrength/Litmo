# Local development

Setting up a machine from scratch (new laptop, wiped disk, disaster recovery)? See `docs/MACHINE_SETUP.md` first, or run `npm run bootstrap`.

## Backend-free demo mode (no Docker required)

If Docker Desktop is unavailable, demo mode still needs no backend. Mandatory Face ID requires an iOS development or standalone build on a Face ID iPhone; Expo Go cannot evaluate Face ID:

```bash
npm ci
cd app
npx expo run:ios --device
```

Unlock the installed development build with Face ID, then tap **"Continue without an account (demo mode)"**. This runs the full synthetic path locally. Expo Go fails closed because Apple does not expose Face ID evaluation to it; this is expected, not a reason to bypass the gate.

Real account creation and sign-in additionally require the Associated Domains entitlement, the AASA file, and Supabase experimental passkeys described in `docs/PASSKEY_AUTHENTICATION.md`. Local builds can compile the native bridge, but a complete ceremony requires the configured HTTPS relying-party domain; demo mode remains the backend-free device-review path.

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
- A Face ID iPhone and an iOS development or standalone build for device review

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

The canonical session-snapshot endpoint is a privileged backend operation. To exercise it locally, create `backend/.env` from the documented template and copy the local values printed by `npx supabase status`:

```bash
cp backend/.env.example backend/.env
npx supabase status
npm run api
```

Set `SUPABASE_URL` to the local API URL and `SUPABASE_SERVICE_ROLE_KEY` to the local `service_role` key. This key bypasses row-level security: keep it only in `backend/.env`, never use an `EXPO_PUBLIC_` name, never copy it into `app/.env`, and never commit it. Without both variables, `POST /api/sessions/:sessionId/snapshot` returns `snapshot_service_unavailable` and persists nothing.

On a physical iPhone, `127.0.0.1` points to the phone rather than the development computer. Replace the URL host in `app/.env` with the computer's trusted LAN address (find it with `ipconfig getifaddr en0` on macOS). Do not expose local Supabase to an untrusted network. Set `EXPO_PUBLIC_BACKEND_URL` in `app/.env` the same way (default port 3001, `npm run api` to start it) — it's a separate host replacement from `EXPO_PUBLIC_SUPABASE_URL` since they're different processes.

## Demo accounts

The reset seed creates four synthetic local-only accounts, matching `app/data/mockConsentProfiles.ts`'s mock discovery personas (`docs/adr/0015-session-request-creation-and-recipient-authorization.md`'s seeding addendum):

- `maya.demo@litmo.local` (the "self" persona's account)
- `eli.demo@litmo.local` (the "maya" mock-discovery persona, despite the email — the two labels predate the persona mapping and don't line up)
- `eli-persona.demo@litmo.local` (the "eli" persona)
- `jonah-persona.demo@litmo.local` (the "jonah" persona)

**Sign-in is passkey-only (ADR 0010) — there is no password sign-in anymore.** The `crypt(...)` password set in `supabase/seed.sql` is a vestige of the pre-passkey schema and cannot be used to sign in through the app. To actually sign in as one of these accounts on a physical device, you must complete a real passkey registration ceremony (Face ID) for it — there is no scripted way to do this. In practice this means: verifying a single-participant flow (sending a request, viewing your own screens) needs only your own signed-in account; verifying a flow that requires **two** independent participants (e.g. both sides confirming the same Consent Snapshot) requires either a second physical device signed in as a different account, or manually registering a second passkey identity on the same device and switching between them.

Each of the four accounts also has version-1000 `touch_profile_versions`/`consent_preference_versions` rows seeded (matching `mockConsentProfiles.ts`'s fixtures) so `POST /api/sessions/:sessionId/snapshot` can compute a real snapshot for them without a manual onboarding pass first.

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
6. Close the installed development build completely and reopen it; confirm Face ID is required.
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
