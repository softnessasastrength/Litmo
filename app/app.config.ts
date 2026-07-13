/**
 * Expo app config — environment + dual build mode injection.
 *
 * WHAT: Selects bundle id / associated domains from APP_ENV and stamps
 *       extra.litmoBuildMode + EXPO_PUBLIC_LITMO_BUILD_MODE into the binary.
 * WHY:  iOS App Store builds must ship App Store Safe Mode; macOS/Linux Maximum
 *       Mode must keep the full experience. Mode is compile-time, not a user toggle.
 * CONSENT: Mode never removes Soft Signal stop or age gate entitlements.
 * SEE: docs/BUILD_MODES.md, docs/adr/0060-dual-build-modes.md, config/buildMode.ts
 */

import base from "./app.json";
import { resolveBuildMode, type LitmoBuildMode } from "./config/buildMode.ts";

const environment = process.env.EXPO_PUBLIC_APP_ENV ?? "development";
const settings = {
  development: {
    bundleIdentifier: "com.litmo.app.dev",
    domain: "dev.softnessasastrength.com",
  },
  staging: {
    bundleIdentifier: "com.litmo.app.staging",
    domain: "staging.softnessasastrength.com",
  },
  production: {
    bundleIdentifier: "com.litmo.app",
    domain: "softnessasastrength.com",
  },
} as const;
if (!(environment in settings))
  throw new Error(`Unsupported APP_ENV: ${environment}`);
const selected = settings[environment as keyof typeof settings];

// Associated Domains (required for passkey sign-in, ADR 0010) is not
// supported by a free Apple "Personal Team" -- only the paid Apple Developer
// Program. Local builds signed with a Personal Team must omit it to build
// and install at all, at the cost of passkey sign-in not working in that
// build (demo mode and everything else still does). Real dev/staging/
// production builds (EAS, a paid team) keep it by default; set
// LITMO_FREE_TIER_BUILD=1 only for local Personal Team builds.
const freeTierBuild = process.env.LITMO_FREE_TIER_BUILD === "1";

/**
 * Dual-mode resolution at config time.
 * - Explicit EXPO_PUBLIC_LITMO_BUILD_MODE wins (set by EAS profiles).
 * - Else heuristic: iOS+staging/production → app_store; else maximum.
 * Platform for config-time heuristic: prefer EXPO_PUBLIC_LITMO_PLATFORM,
 * else assume ios when EAS_BUILD_PLATFORM=ios, else host OS.
 */
const easPlatform = process.env.EAS_BUILD_PLATFORM; // ios | android when on EAS
const platformHint =
  process.env.EXPO_PUBLIC_LITMO_PLATFORM ??
  (easPlatform === "ios"
    ? "ios"
    : easPlatform === "android"
      ? "android"
      : process.platform === "darwin"
        ? "macos"
        : process.platform === "linux"
          ? "linux"
          : "unknown");

const litmoBuildMode: LitmoBuildMode = resolveBuildMode({
  envMode: process.env.EXPO_PUBLIC_LITMO_BUILD_MODE,
  appEnvironment: environment as "development" | "staging" | "production",
  platform: platformHint,
});

// Force public env so Metro inlines the same mode into JS (single source).
process.env.EXPO_PUBLIC_LITMO_BUILD_MODE = litmoBuildMode;
process.env.EXPO_PUBLIC_LITMO_PLATFORM =
  process.env.EXPO_PUBLIC_LITMO_PLATFORM ?? platformHint;

const {
  associatedDomains: _unusedBaseAssociatedDomains,
  ...baseIosWithoutAssociatedDomains
} = base.expo.ios;

const displayName =
  environment === "production"
    ? litmoBuildMode === "app_store"
      ? "Litmo"
      : "Litmo Max"
    : `Litmo ${environment}${litmoBuildMode === "maximum" ? " Max" : ""}`;

export default {
  ...base.expo,
  name: displayName,
  ios: {
    ...baseIosWithoutAssociatedDomains,
    bundleIdentifier: selected.bundleIdentifier,
    ...(freeTierBuild
      ? {}
      : { associatedDomains: [`webcredentials:${selected.domain}`] }),
    // Declared Age Range capability (ADR 0025). Requires a paid team /
    // matching provisioning profile for a real device signal; without it
    // the native module returns "unavailable" and development self-attest
    // may be used outside production.
    entitlements: {
      ...(base.expo.ios as { entitlements?: Record<string, unknown> })
        ?.entitlements,
      "com.apple.developer.declared-age-range": true,
    },
  },
  extra: {
    ...base.expo.extra,
    appEnvironment: environment,
    /** Dual-mode stamp for Constants.expoConfig.extra at runtime. */
    litmoBuildMode,
    litmoBuildModeLabel:
      litmoBuildMode === "maximum"
        ? "Maximum Mode (full consent experience)"
        : "App Store Safe Mode (review-sanitized)",
  },
};
