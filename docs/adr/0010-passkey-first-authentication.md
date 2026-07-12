# ADR 0010: Passkey-first authentication

- Status: accepted
- Date: 2026-07-12

## Context

Passwords create phishing, reuse, recovery, and secret-handling risks that are
poorly matched to Litmo's private consent data. The iOS app already requires a
device-owner biometric gate for local privacy.

## Decision

Use Apple platform passkeys with user verification required, backed by Supabase
WebAuthn verification. Email OTP is permitted only for initial ownership
confirmation before mandatory passkey enrollment; it is not a routine sign-in
or recovery credential. Store sessions and installation secrets only in the
non-migrating, passcode-required iOS Keychain. Track each installation with a
server-side hashed secret so device state can fail closed independently of the
iCloud-synced passkey.

Use `softnessasastrength.com` as the immutable relying-party ID. Recovery without
a synced passkey requires reviewed operator intervention and never creates a
password.

## Consequences

The native iOS development build is required; Expo Go cannot exercise passkeys.
The service depends on Apple Associated Domains/AASA availability and an
experimental Supabase API. Device revocation and Apple passkey removal are
distinct actions. Users without a passkey-capable Apple environment cannot
create a production account; demo mode remains available without an account.
Installation IDs and secrets are generated with Expo Crypto, stored with the
same non-migrating Keychain policy as the session, and represented server-side
only by a digest and metadata. A new verified passkey session may rotate a
revoked installation secret; self-revocation clears local material and signs
out immediately.
