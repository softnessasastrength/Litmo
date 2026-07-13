/**
 * Litmo dual-mode architecture — compile-time build mode resolution.
 *
 * ============================================================================
 * PLATFORM → MODE (product law)
 * ============================================================================
 *
 *   macOS  ──────────────────────────────► MAXIMUM_MODE
 *   Linux  ──────────────────────────────► MAXIMUM_MODE
 *   iOS    ──────────────────────────────► APP_STORE_SAFE
 *   (android/web default maximum unless forced)
 *
 * Explicit EXPO_PUBLIC_LITMO_BUILD_MODE always wins (internal Maximum iOS
 * builds use production_maximum_internal EAS profile).
 *
 * Aliases exported for agents and native parity:
 *   MAXIMUM_MODE     === mode === "maximum"
 *   APP_STORE_SAFE   === mode === "app_store"
 *
 * WHAT: Resolve frozen build mode + boolean flags for the JS/TS client.
 * WHY:  One monorepo; iOS Review binary must auto-tame; desktop keeps full
 *       autistic consent system. No runtime “upgrade” toggle.
 * CONSENT: Mode never disables Soft Signal stop, dual-seal fail-closed,
 *       age gate, or profile≠consent. Mode changes copy + optional RF/NFC.
 * SEE: docs/DUAL_MODE_ARCHITECTURE.md, docs/BUILD_MODES.md, ADR 0060,
 *      packages/LitmoBuildMode (Swift SPM mirror).
 */

/**
 * Canonical mode ids (string form used in env + Expo extra).
 * Swift SPM uses the same raw values: "maximum" | "app_store".
 */
export type LitmoBuildMode = "maximum" | "app_store";

export const BUILD_MODE_LABELS: Record<LitmoBuildMode, string> = {
  maximum: "MAXIMUM_MODE — full unhinged consent system",
  app_store: "APP_STORE_SAFE — review-sanitized iOS binary",
};

/**
 * WHAT: Parse EXPO_PUBLIC_LITMO_BUILD_MODE / LITMO_BUILD_MODE.
 * WHY:  CI and EAS pin mode without heuristics.
 * EDGE CASES: empty → null; invalid → throw (fail loud).
 */
export function parseBuildModeEnv(
  raw: string | undefined | null,
): LitmoBuildMode | null {
  if (raw == null || raw === "") return null;
  const normalized = raw.trim().toLowerCase().replace(/-/g, "_");
  if (
    normalized === "maximum" ||
    normalized === "max" ||
    normalized === "full" ||
    normalized === "unhinged" ||
    normalized === "maximum_mode"
  ) {
    return "maximum";
  }
  if (
    normalized === "app_store" ||
    normalized === "appstore" ||
    normalized === "store" ||
    normalized === "ios_safe" ||
    normalized === "review" ||
    normalized === "app_store_safe" ||
    normalized === "appstoresafe"
  ) {
    return "app_store";
  }
  throw new Error(
    `invalid_litmo_build_mode:${raw} (expected maximum|app_store / MAXIMUM_MODE|APP_STORE_SAFE)`,
  );
}

/**
 * WHAT: Platform-primary mode resolution (product law).
 * WHY:  User rule: macOS/Linux = Maximum; iOS = App Store Safe automatically.
 * CONSENT: Heuristic never turns off Soft Signal.
 * EDGE CASES:
 *   - explicit envMode wins (internal Maximum iOS)
 *   - platform ios|iphoneos|iphonesimulator → app_store
 *   - macos|darwin|linux|android|web|unknown → maximum
 */
export function resolveBuildMode(input: {
  envMode: string | undefined | null;
  /**
   * Kept for logging / future env-specific gates; mode is platform-primary.
   * Staging vs production no longer flips iOS away from app_store.
   */
  appEnvironment: "development" | "staging" | "production";
  platform: string;
}): LitmoBuildMode {
  const fromEnv = parseBuildModeEnv(input.envMode);
  if (fromEnv) return fromEnv;

  const platform = input.platform.toLowerCase();
  // iOS family → App Store Safe unless explicit override above.
  if (
    platform === "ios" ||
    platform === "iphoneos" ||
    platform === "iphonesimulator" ||
    platform === "ipados" ||
    platform === "tvos"
  ) {
    return "app_store";
  }
  // macOS, Linux, Android, web, unknown → Maximum (full experience).
  return "maximum";
}

const appEnvironmentRaw = process.env.EXPO_PUBLIC_APP_ENV ?? "development";
const appEnvironment = (
  ["development", "staging", "production"] as const
).includes(appEnvironmentRaw as "development")
  ? (appEnvironmentRaw as "development" | "staging" | "production")
  : "development";

const platformHint =
  process.env.EXPO_PUBLIC_LITMO_PLATFORM ??
  process.env.LITMO_PLATFORM ??
  (typeof process !== "undefined" && process.platform === "darwin"
    ? "macos"
    : typeof process !== "undefined" && process.platform === "linux"
      ? "linux"
      : "unknown");

/** Frozen mode for this JS bundle. */
export const LITMO_BUILD_MODE: LitmoBuildMode = resolveBuildMode({
  envMode:
    process.env.EXPO_PUBLIC_LITMO_BUILD_MODE ?? process.env.LITMO_BUILD_MODE,
  appEnvironment,
  platform: platformHint,
});

/** True when full unhinged consent system is compiled in. */
export const IS_MAXIMUM_BUILD: boolean = LITMO_BUILD_MODE === "maximum";

/** True when App Store Safe sanitization is compiled in. */
export const IS_APP_STORE_BUILD: boolean = LITMO_BUILD_MODE === "app_store";

/**
 * Compile-time style aliases (requested product vocabulary).
 * Prefer these in new code for cross-language parity with Swift:
 *   #if MAXIMUM_MODE / #if APP_STORE_SAFE
 */
export const MAXIMUM_MODE: boolean = IS_MAXIMUM_BUILD;
export const APP_STORE_SAFE: boolean = IS_APP_STORE_BUILD;

/**
 * WHAT: Runtime re-resolve (diagnostics) using Platform.OS when available.
 * WHY:  Node app.config may say macos while simulator is ios.
 */
export function resolveBuildModeRuntime(
  platformOs: string = platformHint,
): LitmoBuildMode {
  return resolveBuildMode({
    envMode:
      process.env.EXPO_PUBLIC_LITMO_BUILD_MODE ?? process.env.LITMO_BUILD_MODE,
    appEnvironment,
    platform: platformOs,
  });
}

export function assertValidBuildMode(
  mode: string,
): asserts mode is LitmoBuildMode {
  if (mode !== "maximum" && mode !== "app_store") {
    throw new Error(`invalid_litmo_build_mode:${mode}`);
  }
}
