# ADR 0060: Dual build modes — Maximum vs App Store Safe

- **Status:** Accepted
- **Date:** 2026-07-14
- **Decision owners:** Founder and engineering

## Context

Litmo’s product voice is intentionally extreme about consent: Soft Signal as
sacred stop, expanded body maps, proximity RF, NFC careful-connect, hardware
contracts, and autistic-depth documentation. That full experience is correct
for macOS, Linux, and internal iOS development.

Shipping the same binary intensity to the public iOS App Store increases App
Review risk (nearby radio, NFC, crisis-adjacent framing, dense body-map language)
without improving consent safety. Forking the repository would double maintenance
and invite engine drift — the worst outcome for a consent product.

## Decision

Maintain **one monorepo** with **two compile-time product modes**:

| Mode | Intended hosts | Intent |
| ---- | -------------- | ------ |
| **Maximum** | macOS, Linux, internal iOS dev/TestFlight-max | Full unhinged consent experience |
| **App Store Safe** | iOS staging/production store binaries | Sanitized copy + gated RF/NFC/hardware; same safety core |

### Axes (orthogonal)

1. **App environment** — `development` | `staging` | `production` (`EXPO_PUBLIC_APP_ENV`)
2. **Build mode** — `maximum` | `app_store` (`EXPO_PUBLIC_LITMO_BUILD_MODE`)

### Resolution order (platform-primary — code is source of truth)

Implemented in `app/config/buildMode.ts` `resolveBuildMode`:

1. **Explicit** `EXPO_PUBLIC_LITMO_BUILD_MODE` / aliases always wins  
   (EAS profiles pin this; use for internal Maximum iOS)
2. Else if platform is **iOS family** (`ios` | `iphoneos` | `iphonesimulator` | `ipados` | `tvos`)  
   → `app_store`  
   (including development iOS — not only staging/production)
3. Else (**macOS**, **Linux**, Android, web, unknown) → `maximum`

**Note (G11 reconcile 2026-07-13):** Earlier ADR prose said “ios + staging|production
only.” That was superseded by product law: **any iOS family defaults to App Store
Safe** so a mis-set APP_ENV cannot ship Maximum RF to a phone. Staging vs production
no longer flips iOS mode.

### Non-negotiable in BOTH modes

- Soft Signal stop (local end authoritative, no reason required)
- Dual-seal / fail-closed consent engine
- Age gate for real accounts
- Profile / vibe / map ≠ consent
- Unset zones → off limits

### Gated only in App Store Safe

- Proximity radar continuous RF UI
- NFC careful-connect UI
- Multipeer local share (when flagged off)
- Hardware Soft Signal bridge language
- Demo mode surface
- Diagnostics panel
- “Sacred Soft Signal” copy intensity (replaced with calmer end-session copy)

### Implementation homes

- `app/config/buildMode.ts` — resolution
- `app/config/features.ts` — feature matrix
- `app/config/copy/*` — Maximum vs App Store strings
- `app/app.config.ts` — stamps mode into `extra` + env
- `app/eas.json` — profile env pins
- `docs/BUILD_MODES.md` — operator manual

## Alternatives considered

- **Two repos:** rejected — consent engine drift risk.
- **Runtime “unlock Maximum” toggle:** rejected — App Store binary integrity; review rejection.
- **Strip Maximum source at build with codegen delete:** rejected — harder audit; flags + dead UI gates are clearer.
- **Only change copy, leave all RF on:** rejected — insufficient Review risk reduction.

## Consequences

- Engineers develop against Maximum by default on Mac/Linux.
- `eas build --profile production` ships App Store Safe automatically.
- Internal Maximum iOS production-shaped builds use `production_maximum_internal`.
- Screens must import `runtimeConfig.features` / `modeCopy` rather than hardcoding.
- Future features require a row in the feature matrix (Maximum default on, App Store explicit decision).

## Follow-up

- Gate Multipeer share entry points with `localMultipeerShare`
- Settings “About this build” always shows mode label (even when badge hidden)
- CI job that fails if App Store profile lacks `EXPO_PUBLIC_LITMO_BUILD_MODE=app_store`
