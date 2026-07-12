# Litmo Authentication Plan

This branch is reserved for the secure authentication foundation so the stable `main` branch remains untouched while the work is developed and tested.

## Goals

- Sign in with Apple for initial account establishment
- Passkeys as the primary ongoing authentication method
- Keychain-backed session storage
- Face ID / Touch ID app lock using LocalAuthentication
- Privacy screen when the app enters the background
- Associated Domains and relying-party configuration
- Clear account recovery and multi-device enrollment behavior

## Security rules

- No email/password authentication
- Passkey registration and login must use server-issued challenges
- Passkey private keys remain in the user's credential provider
- Only public credential material is stored server-side
- Tokens and secrets must never be stored in UserDefaults
- Sensitive data is private by default
- Authentication and cloud-data changes must be tested with at least two separate Apple Accounts

## Planned implementation order

1. Add Sign in with Apple capability and account bootstrap flow
2. Add Keychain session storage
3. Add LocalAuthentication app lock and app-switcher privacy cover
4. Configure Associated Domains and the apple-app-site-association file
5. Add passkey registration and authentication flows
6. Add backend challenge verification and token issuance
7. Add recovery, multi-device enrollment, tests, and documentation

## Branch policy

Do not merge this branch into `main` until the app builds cleanly, the existing experience still works, and authentication has been tested on physical devices.
