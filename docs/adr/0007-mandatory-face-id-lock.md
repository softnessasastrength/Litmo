# ADR 0007: Mandatory Face ID lock

**Status:** Accepted
**Date:** 2026-07-12

## Context

Litmo displays consent preferences, private session state, and trust history. An authenticated Supabase session does not protect an unlocked phone handed to another person, nor does it prevent iOS multitasking snapshots from retaining sensitive pixels.

## Decision

The iOS app fails closed behind Face ID at every cold launch and after at least 30 seconds in the background. `expo-local-authentication` is configured with `disableDeviceFallback: true`, which maps to Apple's `.deviceOwnerAuthenticationWithBiometrics`; passcode fallback is deliberately unavailable. A dedicated provider owns availability checks, evaluation, lifecycle timing, in-flight deduplication, cancellation/error mapping, and late-result rejection. No biometric material is stored: Litmo receives only Apple's result.

React places a full-screen evergreen lock cover above the entire router before authentication. Native `SceneDelegate.sceneWillResignActive` adds a second opaque cream cover before iOS captures the app-switcher snapshot. Consent Snapshot, active-session, settings, and consent-history routes require a fresh step-up evaluation and block their content component until it succeeds.

## Threat model and limits

This mitigates casual access to an unlocked device, shoulder access after app switching, and sensitive app-switcher screenshots. It does not protect a compromised/jailbroken device, OS-level screen recording before the lifecycle callback, screenshots deliberately taken while unlocked, memory inspection, notification text, or a user coerced into authenticating. Face ID is device-owner authentication, not identity verification of a Litmo account holder.

If Face ID is absent, unenrolled, locked out, cancelled, unsupported, or fails, the app remains covered and explains the condition with a retry button. There is no in-app recovery or passcode bypass. Lockout recovery occurs outside Litmo through iOS. Face ID does not work inside Expo Go, so physical-device verification requires a development or standalone build.

## Alternatives considered

- Device-passcode fallback was rejected because the requirement is biometric-only policy evaluation.
- Per-screen LocalAuthentication calls were rejected because they create races and inconsistent failure handling.
- A React-only app-switcher cover was rejected because native scene lifecycle handling is earlier and more reliable for snapshot protection.

## Consequences

Devices without Face ID cannot open a **real authenticated** Litmo account session. The 30-second threshold is process-memory state; a process restart with a restored session always returns to the stricter cold-launch lock.

## Amendment (2026-07-12): demo and pre-account exploration

`docs/roadmap/PHONE_VISIBLE_VERTICAL_SLICE.md` requires a physical-iPhone path through Expo Go when compatible, using clearly labeled fictional demo data and no backend. Applying Face ID before any account exists made that path impossible: Expo Go cannot complete the same biometric policy, and demo mode never holds real private account data.

**Refinement (does not weaken real-account policy):**

- `biometricRequiredForAuthStatus(...)` returns true only for `authenticated`, `onboarding`, `authenticating`, and `registering`.
- Demo mode (`demo`), signed-out exploration (`locked`), and non-session error/expired/revoked states skip the full-screen Face ID cover and SensitiveAccessGate step-up.
- As soon as a real Supabase session is restored or an auth ceremony begins, Face ID is required again with the same fail-closed rules as this ADR originally defined (no passcode fallback).

Rationale: Face ID protects real consent preferences, session state, and wrap-ups. The fictional demo path uses local fixtures only and is already labeled non-account, non-production. Skipping biometrics there is not a recovery bypass for real sessions.

## Follow-up work

- Verify cold launch, 29/30-second background boundaries, lockout, cancellation, and app-switcher appearance on a physical Face ID iPhone with a real account.
- Confirm Expo Go can walk the full demo path without Face ID prompts.
- Review notification previews and screen-capture detection before private alpha.

## Verification performed

- `npm run lint` — passed.
- `npm run typecheck` — passed.
- `npm test` — passed: 59 domain, 30 mobile, and 8 backend tests (97 total); seven mobile tests cover biometric state, timing, failure, privacy, and late-result behavior.
- `npm run db:lint` — passed with no schema errors.
- `npx supabase test db` — passed 40/40 assertions.
- `npm run test:integration` — passed its account/persistence/RLS scenario.
- `npm run build` — passed the shared build and Expo iOS export (1,337 modules).
- `xcodebuild -workspace Litmo.xcworkspace -scheme Litmo -configuration Debug -sdk iphonesimulator -destination 'generic/platform=iOS Simulator' -derivedDataPath /tmp/LitmoDerivedData CODE_SIGNING_ALLOWED=NO build` — `BUILD SUCCEEDED`; compiled both simulator architectures, the SceneDelegate cover, and ExpoLocalAuthentication. Dependency warnings remain but no build errors occurred.
- Inspected the built app's Info.plist and confirmed `NSFaceIDUsageDescription` is present with the intended copy.

Physical Face ID, lockout, timing, and app-switcher behavior were not verified in this environment and must not be claimed as tested.
