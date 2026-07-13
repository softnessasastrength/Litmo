# Passkey-first authentication

> **Start here for product overview:** [AUTHENTICATION.md](AUTHENTICATION.md)

## Decision

Litmo's account interface is passwordless. Apple passkeys stored and synced by
iCloud Keychain are the primary and only routine sign-in credential. The iOS
client uses AuthenticationServices directly and Supabase Auth's experimental
passkey API for WebAuthn challenge issuance and verification. See ADR 0010.

The relying-party ID is `softnessasastrength.com`. Changing it invalidates all
existing credentials and requires a reviewed migration.

## Account and session lifecycle

1. Account creation sends a one-time email ownership code. The code establishes
   only a restricted bootstrap session and is not a reusable sign-in method.
2. The client immediately requests passkey registration with user verification
   required. Cancellation or failure signs out the bootstrap session.
3. After server verification, Litmo registers the installation with a random
   device secret and begins onboarding.
4. Routine sign-in is discoverable passkey authentication: no email or password
   is requested. Apple requires Face ID, Touch ID, or device-owner authentication.
5. Supabase rotates/refreshes the session. Expired tokens become `expired`; an
   invalid or revoked installation becomes `revoked`. Both states fail closed.
6. Sign-out removes the local session. Security settings require the existing
   `SensitiveAccessGate` reauthentication before they render.

`AuthContext` exposes explicit `locked`, `authenticating`, `registering`,
`onboarding`, `authenticated`, `expired`, `revoked`, and `error` states. All
passkey ceremonies are serialized in `authServiceCore`; a second request is
rejected rather than racing or cancelling the authoritative request.

## Credential and device storage

- Passkey private keys and biometric templates remain under Apple control.
  Litmo receives only signed WebAuthn ceremony results.
- Supabase refresh/access session material is stored with Expo SecureStore in
  the iOS Keychain using `kSecAttrAccessibleWhenPasscodeSetThisDeviceOnly`.
- The random installation ID and 256-bit-equivalent secret use the same
  non-migrating Keychain protection. They are not included in backups.
- `auth_devices` stores only SHA-256 device-secret digests plus user-visible
  device metadata. Row-level security permits owners to read metadata; writes
  occur only through constrained security-definer functions.
- Credential values must never be logged, attached to analytics, copied to
  crash reports, or placed in AsyncStorage. The native bridge contains no
  credential logging and does not persist ceremony values.

## Multiple, restored, lost, and offline devices

iCloud Keychain may sync the same passkey to multiple Apple devices. Each Litmo
installation separately registers a non-synced device secret. A replacement or
restored phone can authenticate with the synced passkey, then receives a new
device registration. A successful passkey sign-in may rotate and restore that
installation's revoked registration; revoking the current installation clears
its local secret and signs out immediately. A restored Supabase token without the device secret is
rejected. Owners can view and revoke registrations under Settings.

Offline sign-in, account creation, passkey registration, device registration,
and revocation fail closed because the relying party must verify the challenge.
An already authenticated app may retain its current server session until its
next validation/expiry; the mandatory local biometric lock continues to cover
sensitive content.

## Recovery model

Recovery never downgrades to email plus password or an email-only magic link.
The first recovery path is a synced passkey on another trusted Apple device.
If none remains, the app directs the person to a delayed, human-reviewed support
process. A production recovery operator must revoke existing sessions/devices,
record the review without private consent content, and authorize exactly one
short-lived replacement enrollment. That operator workflow is not yet deployed;
until it is, recovery is intentionally unavailable and the account remains
locked. Email alone is never sufficient evidence.

## Threat model

Protected against: password phishing/reuse, extraction of app session tokens
from ordinary app storage or device backups, accidental credential logging,
replay of expired WebAuthn challenges, restored-token use on a different phone,
duplicate native ceremonies, and casual exposure of authenticated screens.

Relied upon: Apple platform/keychain integrity, the Apple Account and iCloud
Keychain recovery model, TLS/DNS integrity for the relying-party domain,
Supabase challenge/session correctness, server-side RLS/functions, and the
device owner's passcode/biometric security.

Out of scope: a fully compromised unlocked OS, malicious accessibility tooling
with device-owner privileges, Apple Account compromise, coerced device-owner
authentication, screenshots intentionally taken after successful unlock, and
server/operator compromise. Litmo minimizes screenshot exposure with the
background privacy shield but iOS does not offer a universal screenshot ban.

## Deployment requirements

1. Serve `docs/deployment/apple-app-site-association`, unchanged and without a
   redirect, at
   `https://softnessasastrength.com/.well-known/apple-app-site-association`
   with `application/json` content type.
2. Keep Apple application ID `FHZSE6U4R5.com.litmo.app` and Associated Domains
   entitlement `webcredentials:softnessasastrength.com` aligned.
3. Enable Supabase passkeys/WebAuthn with the values in `supabase/config.toml`.
4. Apply migration `010_passkey_devices.sql`.
5. Use an iOS development or distribution build. Expo Go cannot contain the
   Litmo native passkey bridge.

After changing native authentication dependencies, regenerate and verify Pods:

```bash
cd app
npx pod-install
cd ios
xcodebuild -project Pods/Pods.xcodeproj -target LitmoPasskeys -sdk iphonesimulator -configuration Debug CODE_SIGNING_ALLOWED=NO build
```

## Known platform limitations

Supabase labels its passkey API experimental, so upgrades require integration
testing. Apple controls passkey sync, UI, availability, and device-owner fallback
copy. A device registration revocation does not itself delete the synchronized
passkey from Apple Passwords. Conversely, deleting a passkey from Apple may not
notify Litmo until the next ceremony. Remote device revocation is enforced on
the next Litmo device validation; a still-valid Supabase JWT presented outside
the app remains valid until server expiration unless separately revoked by a
trusted backend. Production must use short session lifetimes and implement the
documented operator revocation endpoint before public launch.
