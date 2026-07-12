# ADR 0013: Release environment boundaries

- Status: accepted
- Date: 2026-07-12

## Context

Litmo's local demo path, hosted beta data, and eventual production data must not
share authority or identifiers. A release build that silently falls back to
demo data or a local backend would conceal configuration mistakes in a
safety-sensitive flow.

## Decision

The Expo configuration has three explicit environments. Development uses
`com.litmo.app.dev` and may expose fictional, non-persistent demo mode. Staging
uses `com.litmo.app.staging`, is the only TestFlight-candidate environment, and
disables demo mode. Production uses `com.litmo.app` and disables demo mode and
diagnostics. Each environment has its own WebAuthn associated domain.

Backend URL and public anon key remain build-environment inputs. Release
validation rejects absent or local endpoints, privileged/placeholder keys,
profile mismatches, missing Apple privacy/passkey artifacts, local `.env`
release sources, probable embedded JWTs, and unreviewed console diagnostics.
Validation never prints configuration values.

The checked-in native Xcode project remains the production identifier source
for direct local Xcode builds. Staging candidates must be produced through the
documented Expo/EAS staging profile, whose resolved Expo configuration is
checked before signing. A direct Xcode archive is not a staging artifact.

## Consequences

- Synthetic demo data cannot be entered through staging or production UI.
- Diagnostics can expose only non-sensitive build/environment state and cannot
  be routed to in production.
- A build passing automated validation is only a candidate. Hosted AASA/RP
  behavior, signing, privacy-manifest aggregation, and physical-device scenarios
  still require manual verification before invitation.
- Build-service credentials and hosted environment provisioning are external
  operational dependencies and are not represented as repository readiness.
