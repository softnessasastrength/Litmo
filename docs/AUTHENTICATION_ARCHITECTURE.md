# Litmo Authentication Architecture

## Status

This document defines the intended passwordless authentication and local privacy architecture for Litmo. Implementation work should remain isolated on the `feature/secure-auth-foundation` branch until it has been tested on real devices and reviewed before merge.

## Goals

- No email/password login flow.
- Sign in with Apple for initial account establishment and recovery.
- Passkeys as the primary ongoing authentication method.
- Keychain-backed session storage.
- Face ID or Touch ID for local app locking.
- Private-by-default user data.
- No silent downgrade to insecure local identity.

## Authentication layers

### 1. Account identity

Use Sign in with Apple to establish the Litmo account and provide a stable Apple user identifier. The user may conceal their real email address.

### 2. Passkey authentication

Use `AuthenticationServices` and platform passkeys for ordinary sign-in. Passkey registration and authentication must use server-issued, single-use cryptographic challenges.

The app must not create or verify passkey challenges locally.

Required backend operations:

- `POST /auth/passkey/register/options`
- `POST /auth/passkey/register/verify`
- `POST /auth/passkey/login/options`
- `POST /auth/passkey/login/verify`

The backend stores only public credential material, credential identifiers, counters or equivalent replay-protection metadata where applicable, and account associations.

### 3. Session storage

After successful server authentication, store session credentials in Keychain only.

Recommended model:

- Short-lived access token.
- Rotating refresh token or equivalent revocable session credential.
- No tokens in `UserDefaults`, SwiftData, Core Data, logs, analytics payloads, or plain files.

### 4. Local app lock

Use `LocalAuthentication` to protect access to the app after launch or return from the background.

Recommended behavior:

- Lock when the app leaves the active scene.
- Display a neutral privacy screen before iOS captures the app-switcher snapshot.
- Prefer `deviceOwnerAuthentication` so device passcode recovery remains available unless product requirements explicitly require biometrics only.
- Never treat Face ID or Touch ID as cloud account authentication.

## Platform configuration

### Associated Domains

The app will require the Associated Domains capability with an entry in this form:

```text
webcredentials:<owned-domain>
```

### Apple App Site Association

The owned domain must host:

```text
https://<owned-domain>/.well-known/apple-app-site-association
```

The file must correctly associate the domain with the Apple Developer Team ID and Litmo bundle identifier.

### Face ID usage description

The app must include an `NSFaceIDUsageDescription` string that clearly explains that biometrics protect private Litmo content.

## Intended onboarding flow

1. User opens Litmo.
2. User chooses Continue with Apple.
3. Litmo establishes the backend account.
4. Litmo immediately offers passkey creation.
5. The passkey ceremony is verified by the backend.
6. The backend issues a session.
7. Session credentials are stored in Keychain.
8. Local app access is protected by Face ID, Touch ID, or device passcode according to policy.

## Recovery and multi-device behavior

- Sign in with Apple remains the account recovery anchor.
- A user must be able to enroll a new passkey after proving account ownership.
- The app must handle deleted passkeys, unavailable credential providers, lost devices, and iCloud Keychain changes without creating duplicate accounts.
- Account linking must be explicit and auditable.

## Privacy and security requirements

- Private content must never appear in app-switcher snapshots.
- Authentication secrets must never be logged.
- Passkey challenges must expire quickly and be single use.
- Sessions must be revocable.
- Logout must remove local session material from Keychain.
- Authentication failure must not expose cached private content.
- No automatic sharing of logs or relationship data.
- Face ID protects local access; backend authorization protects remote data.

## Testing checklist

- Fresh install and first Sign in with Apple flow.
- Passkey creation succeeds on a physical device.
- Passkey sign-in succeeds after logout and reinstall.
- Multi-device sign-in works as intended.
- Deleted or unavailable passkey recovery works.
- App locks after backgrounding.
- App-switcher snapshot reveals no private content.
- Keychain items survive expected app lifecycle events and are removed on logout.
- User A cannot access User B data.
- Failed and replayed passkey challenges are rejected.
- Expired or revoked sessions are rejected.

## Merge policy

Do not merge this branch into `main` until:

- The app builds cleanly.
- Existing launch and navigation flows remain intact.
- Authentication has been tested on at least two physical devices or accounts where practical.
- Security-sensitive configuration values are documented but not committed as secrets.
- A pull request has been reviewed and CI passes.
