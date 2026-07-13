# Litmo Watch (watchOS)

Soft co-regulation companion. **Not** a notification feed.

## Principles

- Soft Signal is free, offline-first, no explanation.
- Haptics never mean peer consent or remote presence.
- Complications: Soft Signal / calm only — no streaks or unread counts.
- Phone proposes patterns; Watch previews and affirms (domain: ADR 0064).

## Generate & open

```bash
cd watch
# Requires XcodeGen: brew install xcodegen
xcodegen generate
open LitmoWatch.xcodeproj
```

Pair a physical Apple Watch for Taptic feel validation. Simulator is not acceptance proof.

## Targets

| Target | Role |
| ------ | ---- |
| **LitmoWatch** | Main app: Soft Signal, presence, co-regulation, check-in |
| **LitmoWatchWidgets** | Soft Signal complication (no social chrome) |

Depends on `packages/LitmoWatchHaptics` (Swift Taptic language).

## Companion phone

- Bundle id expectation: `WKCompanionAppBundleIdentifier` = `com.litmo.app` (Expo iOS app).
- Wire `WatchConnectivity` on phone via `litmo-watch-haptics` + `watchHapticBridge`.
- Soft Signal on phone already raises haptic interrupt; delivery to Watch is best-effort and must never block stop.

## Status

Scaffold for development. Full App Store / TestFlight Watch binary needs signing, companion entitlement, and paired device QA.
