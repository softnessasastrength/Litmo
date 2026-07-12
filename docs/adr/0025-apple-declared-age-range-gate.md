# ADR 0025: Apple Declared Age Range adult eligibility gate

**Status:** Accepted  
**Date:** 2026-07-12

## Context

Litmo is adults-only. Demo onboarding only self-attested age in UI. Real
matching must fail closed without inventing a trust score or storing ID
documents. Apple’s Declared Age Range API provides a privacy-preserving
device/account age-range signal (ranges, not DOB) suitable as the primary
iPhone path.

## Decision

- Native Expo module `litmo-age-range` wraps Declared Age Range (`ageGates: 18`).
- Persist only coarse fields on `profiles`: status, source, optional
  lower/upper bounds, timestamp — never DOB or ID images.
- `record_age_signal` + `is_adult_eligible` are the server authority.
- `discovery_profiles` and `request_session` require adult status for the
  relevant parties (composed with one-way blocks from ADR 0024).
- Auth status `age_gate` after onboarding until adult is recorded.
- Demo mode skips the gate entirely.
- When the native API is unavailable (Expo Go, older iOS, missing
  entitlement), **production fails closed**; **development** may use
  `development_self_attest` only outside production builds.
- Age is **eligibility**, not a discovery trust badge.

## Alternatives considered

- Client-only age checkbox. Rejected: not server-enforced.
- Full KYC vendor first. Deferred: higher friction/cost; Apple signal first.
- Face ID as age proof. Rejected: device owner ≠ age.

## Consequences

Real accounts need adult confirmation before discovery/requests. Seed and
integration tests record a development adult signal. Physical verification
requires a development/standalone build with the Declared Age Range
capability on a supported iOS version.

## Follow-up work

- Vendor KYC where law requires stronger than declared range.
- Re-check signal on Significant Change / parental revocation when required.
- Android Play Age Signals parallel path.
