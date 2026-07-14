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
| **LitmoWatchWidgets** | Soft Signal · Reassurance · Dual-bind complications (no social chrome) |

Depends on `packages/LitmoWatchHaptics` (Swift Taptic language).

## Companion phone

- Bundle id expectation: `WKCompanionAppBundleIdentifier` = `com.litmo.app` (Expo iOS app).
- Wire `WatchConnectivity` on phone via `litmo-watch-haptics` + `watchHapticBridge`.
- Soft Signal on phone already raises haptic interrupt; delivery to Watch is best-effort and must never block stop.

## Build (simulator)

```bash
export DEVELOPER_DIR=/Volumes/SSD/Xcode-beta.app/Contents/Developer   # or your Xcode
cd watch && xcodegen generate
xcodebuild -project LitmoWatch.xcodeproj -scheme LitmoWatch \
  -sdk watchsimulator -destination 'generic/platform=watchOS Simulator' build
xcodebuild -project LitmoWatch.xcodeproj -scheme LitmoWatchExtension \
  -sdk watchsimulator -destination 'generic/platform=watchOS Simulator' build
```

Simulator proves compile; **physical Watch + paired iPhone** is still required for Taptic feel QA.
Physical deploy needs signing, companion app id `com.litmo.app`, and a real device.

## Status

- **2026-07-13:** Simulator build **SUCCEEDED** for LitmoWatch + LitmoWatchExtension (Xcode 27 beta).
- Complications: Soft Signal, Reassurance, Dual Bind (WidgetBundle).
- Physical Watch deploy + Taptic feel validation still open (signing + paired device).
