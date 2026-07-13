/**
 * Litmo dual-mode architecture — compile-time build mode resolution.
 *
 * WHAT: Resolves whether this binary is Maximum Mode or App Store Safe Mode,
 *       and exposes frozen constants for feature gates and copy selection.
 * WHY:  One repository holds the full autistic consent experience. iOS App
 *       Review builds must auto-tame risky surfaces and sensitive strings
 *       without forking the consent engine or deleting Maximum code.
 * CONSENT: Mode never disables Soft Signal stop authority, dual-seal
 *       fail-closed rules, age eligibility, or “profile ≠ consent” truth.
 *       Mode only changes presentation intensity and optional discovery
 *       surfaces that increase App Review risk (proximity RF, NFC, etc.).
 * EDGE CASES:
 *   - Explicit EXPO_PUBLIC_LITMO_BUILD_MODE wins over heuristics.
 *   - Unknown mode string throws at module load (fail loud, not silent max).
 *   - iOS + production/staging defaults to app_store when unset.
 *   - macOS / Linux / web / android / development default to maximum.
 * NEVER: Runtime user toggle to “upgrade” App Store binary into Maximum
 *       (would violate store binary integrity). Ship separate builds.
 * SEE: docs/BUILD_MODES.md, docs/adr/0060-dual-build-modes.md,
 *      app/config/features.ts, app/config/copy/*
 */

/**
 * WHAT: Closed set of product build modes.
 * WHY:  Orthogonal to AppEnvironment (dev/staging/prod).
 * CONSENT: maximum = full grammar; app_store = same safety core, tamer skin.
 */
export type LitmoBuildMode = "maximum" | "app_store";

/**
 * WHAT: Human labels for diagnostics and Settings about-this-build.
 * WHY:  Reviewers and founders must see which binary they hold.
 * NEVER: Label is not a trust or safety score.
 */
export const BUILD_MODE_LABELS: Record<LitmoBuildMode, string> = {
  maximum: "Maximum Mode (full consent experience)",
  app_store: "App Store Safe Mode (review-sanitized)",
};

/**
 * WHAT: Parse explicit env override.
 * WHY:  CI and EAS must pin mode without relying on platform heuristics.
 * EDGE CASES: empty/undefined → null (use heuristic); invalid → throw.
 * CONSENT: Misconfiguration fails the build rather than shipping wrong mode.
 */
export function parseBuildModeEnv(
  raw: string | undefined | null,
): LitmoBuildMode | null {
  if (raw == null || raw === "") return null;
  const normalized = raw.trim().toLowerCase();
  // Accept aliases so CI scripts stay readable.
  if (
    normalized === "maximum" ||
    normalized === "max" ||
    normalized === "full" ||
    normalized === "unhinged"
  ) {
    return "maximum";
  }
  if (
    normalized === "app_store" ||
    normalized === "appstore" ||
    normalized === "app-store" ||
    normalized === "store" ||
    normalized === "ios_safe" ||
    normalized === "review"
  ) {
    return "app_store";
  }
  throw new Error(
    `invalid_litmo_build_mode:${raw} (expected maximum|app_store)`,
  );
}

/**
 * WHAT: Platform + environment heuristic when env override is absent.
 * WHY:  Local Expo on Mac should feel Maximum; EAS iOS production should
 *       default Safe without every engineer remembering the flag.
 * CONSENT: Heuristic never turns off Soft Signal — only mode for copy/features.
 * EDGE CASES:
 *   - platform ios + production|staging → app_store
 *   - platform ios + development → maximum (internal device builds stay full)
 *   - macos, linux, web, android, unknown → maximum
 * NEVER: Use heuristic to hide that production iOS store must set env explicitly
 *       in EAS (we still set it in eas.json for auditability).
 */
export function resolveBuildMode(input: {
  envMode: string | undefined | null;
  appEnvironment: "development" | "staging" | "production";
  /**
   * Platform string: ios | android | web | macos | linux | windows | unknown.
   * From EXPO_PUBLIC_LITMO_PLATFORM or Platform.OS at runtime fallback.
   */
  platform: string;
}): LitmoBuildMode {
  const fromEnv = parseBuildModeEnv(input.envMode);
  if (fromEnv) return fromEnv;

  const platform = input.platform.toLowerCase();
  // iOS release-class environments auto-tame unless explicitly overridden.
  if (
    platform === "ios" &&
    (input.appEnvironment === "production" ||
      input.appEnvironment === "staging")
  ) {
    return "app_store";
  }
  // macOS, Linux desktop, Android, web, and iOS development stay Maximum.
  return "maximum";
}

/**
 * Compile-time / bundle-time inputs.
 * EXPO_PUBLIC_* is inlined by Metro for client bundles.
 */
const appEnvironmentRaw = process.env.EXPO_PUBLIC_APP_ENV ?? "development";
const appEnvironment = (
  ["development", "staging", "production"] as const
).includes(appEnvironmentRaw as "development")
  ? (appEnvironmentRaw as "development" | "staging" | "production")
  : "development";

/**
 * Platform hint for static resolution in Node (tests, app.config).
 * At RN runtime, prefer Platform.OS via resolveBuildModeRuntime().
 */
const platformHint =
  process.env.EXPO_PUBLIC_LITMO_PLATFORM ??
  process.env.LITMO_PLATFORM ??
  // Node host when evaluating app.config / tests on a Mac CI box.
  (typeof process !== "undefined" && process.platform === "darwin"
    ? "macos"
    : typeof process !== "undefined" && process.platform === "linux"
      ? "linux"
      : "unknown");

/**
 * WHAT: Frozen build mode for this JS bundle (primary export).
 * WHY:  Feature matrix and copy facades import one constant.
 * CONSENT: See resolveBuildMode.
 */
export const LITMO_BUILD_MODE: LitmoBuildMode = resolveBuildMode({
  envMode: process.env.EXPO_PUBLIC_LITMO_BUILD_MODE,
  appEnvironment,
  platform: platformHint,
});

/** True when full unhinged consent experience is active. */
export const IS_MAXIMUM_BUILD: boolean = LITMO_BUILD_MODE === "maximum";

/** True when App Store Safe sanitization is active. */
export const IS_APP_STORE_BUILD: boolean = LITMO_BUILD_MODE === "app_store";

/**
 * WHAT: Runtime re-resolve using React Native Platform.OS when available.
 * WHY:  app.config / Node may say macos while the phone simulator is ios;
 *       screens can re-check for diagnostics. Bundle env still wins if set.
 * CONSENT: Same rules as resolveBuildMode.
 * EDGE CASES: Platform import optional so Node tests do not need RN.
 */
export function resolveBuildModeRuntime(
  platformOs: string = platformHint,
): LitmoBuildMode {
  return resolveBuildMode({
    envMode: process.env.EXPO_PUBLIC_LITMO_BUILD_MODE,
    appEnvironment,
    platform: platformOs,
  });
}

/**
 * WHAT: Assert mode is one of the allowed set (CI guard).
 * WHY:  release:check and unit tests can fail closed on drift.
 */
export function assertValidBuildMode(mode: string): asserts mode is LitmoBuildMode {
  if (mode !== "maximum" && mode !== "app_store") {
    throw new Error(`invalid_litmo_build_mode:${mode}`);
  }
}
