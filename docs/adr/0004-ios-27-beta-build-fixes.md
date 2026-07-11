# ADR 0004: iOS 27 beta Scene-lifecycle and pod deployment-target fixes

**Status:** Accepted
**Date:** 2026-07-11

## Context

Getting Litmo running as a standalone (non-Expo-Go) build on a physical iPhone running an early Xcode 27 / iOS 27 beta surfaced two problems neither Expo SDK 55 nor React Native 0.83.6 account for yet, since both predate this OS:

1. **Instant launch crash.** Every Release build installed and immediately crashed with `EXC_BREAKPOINT` / `SIGTRAP` inside `___UIApplicationEvaluateRuntimeIssueForNoSceneLifecycleAdoption_block_invoke`. This reproduced identically whether launched through Xcode, `devicectl`, or by tapping the app icon directly on the home screen — it is not a debugger-only diagnostic. Expo's default template uses the classic `AppDelegate`-only lifecycle (no `UIApplicationSceneManifest`, no `SceneDelegate`), which iOS has tolerated for years as a legacy compatibility mode. This iOS 27 beta instead traps on it.
2. **Release build failure across pods.** Building for Release (not Debug) failed compiling several third-party pods (`SDWebImageWebPCoder`'s `AsyncStorage-AsyncStorage_resources` target, etc.) with `The iOS deployment target 'IPHONEOS_DEPLOYMENT_TARGET' is set to 9.0/13.0, but the range of supported deployment target versions is 15.0 to 27.0.x.` Xcode 27's SDK dropped support for anything below iOS 15 entirely; these pods' own podspecs still declare older per-target minimums that Xcode now refuses outright.

Both were confirmed as real, reproducible build/runtime issues — not local machine misconfiguration — by manually testing each fix in isolation (raw `xcodebuild`, `pod install`, and a from-scratch `rm -rf ios && expo prebuild` cycle) before wrapping them into a config plugin.

## Decision

Add `app/plugins/withIOSXcode27Fixes.cjs`, an Expo config plugin (registered in `app/app.json`) applying three mods so both fixes survive any future `expo prebuild` regeneration instead of living only in the (regenerated, mostly-untracked) `ios/` folder:

- **`withInfoPlist`**: adds a minimal `UIApplicationSceneManifest` declaring one non-multi-scene window configuration pointing at a `SceneDelegate` class.
- **`withAppDelegate`**: inserts `application(_:configurationForConnecting:options:)` into the generated `AppDelegate.swift`, referencing that `SceneDelegate`, and moves the direct `UIWindow` creation out of `didFinishLaunchingWithOptions` into a new `SceneDelegate.scene(_:willConnectTo:options:)` — the window now belongs to the scene, matching what `UIApplicationSceneManifest` requires. `reactNativeFactory` stays on `AppDelegate` so `SceneDelegate` can reach it.
- **`withPodfile`**: appends a `post_install` step forcing every pod target's `IPHONEOS_DEPLOYMENT_TARGET` up to a floor (currently `17.0`) whenever a pod declares something lower, rather than failing the build.

Each mod checks for its own marker text first (`class SceneDelegate`, `IPHONEOS_DEPLOYMENT_TARGET pod floor fix`) so re-running prebuild is idempotent, and each logs a clear warning instead of silently corrupting output if Expo's underlying templates change enough that the expected insertion points disappear.

The plugin was verified end-to-end: `rm -rf ios && expo prebuild --platform ios` regenerates `AppDelegate.swift`, `Info.plist`, and `Podfile` with all three changes applied automatically, and a subsequent Release build installs and launches successfully on the physical device without the crash.

## Alternatives considered

- Hand-editing the generated `ios/` files after every `expo prebuild` was rejected: it is exactly the kind of manual step that gets forgotten, and this repo's `AGENTS.md` durable-agent rule explicitly asks that the repository remain usable without private, undocumented steps.
- Waiting for upstream Expo/React Native to ship official Scene-lifecycle and deployment-target fixes was rejected for this immediate goal: Xcode 27 is a beta, and the concrete near-term need (a build the founder can run on their own phone today) does not depend on an upstream release schedule.
- Bumping the main app target's own `IPHONEOS_DEPLOYMENT_TARGET` (not just pods') via `expo-build-properties` was tried first, but that package's presence broke npm workspace hoisting for `expo-router` in this monorepo badly enough to crash the Metro dev server entirely (`Cannot find module 'expo-router/_ctx-shared'`). It was removed; the app target's own deployment target remains the Expo default (15.1, within Xcode 27's accepted 15.0+ range), and only third-party pods needed the explicit floor.

## Consequences

Future `expo prebuild` runs (including `--clean`) now regenerate a native iOS project that builds and launches correctly on this iOS 27 beta without manual intervention. If Expo or React Native ship their own fix for either issue in a later SDK release, this plugin's marker-text guards mean it will simply no-op rather than double-apply or conflict — though at that point removing it entirely would be the cleaner move.

## Follow-up work

- Revisit whether the `17.0` pod deployment-target floor should track the app's own configured minimum instead of being hardcoded, if that minimum ever changes.
- Remove this plugin once Expo/React Native ship official Scene-lifecycle support and corrected pod deployment targets for whatever iOS SDK Xcode 27 ships as stable.
- This was investigated and fixed for a personal prototype build, not through EAS; `docs/LOCAL_DEVELOPMENT.md`'s EAS build path has not been re-verified against Xcode 27 specifically.
