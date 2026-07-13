/**
 * Runtime configuration — environment × build mode × public URLs.
 *
 * WHAT: Single runtimeConfig object for env, demo/diagnostics gates, backend URL,
 *       and dual-mode (Maximum vs App Store Safe) feature + mode exports.
 * WHY:  Screens already import runtimeConfig; mode must not be a second secret path.
 * CONSENT: allowDemo also requires features.demoModeSurface (App Store production
 *       cannot enter fictional demo even if someone sets APP_ENV wrong on device
 *       after a mis-build — defense in depth).
 * SEE: buildMode.ts, features.ts, docs/BUILD_MODES.md.
 */

import {
  BUILD_MODE_LABELS,
  IS_APP_STORE_BUILD,
  IS_MAXIMUM_BUILD,
  LITMO_BUILD_MODE,
  type LitmoBuildMode,
} from "./buildMode.ts";
import { features, type LitmoFeatureFlags } from "./features.ts";

export type AppEnvironment = "development" | "staging" | "production";

const value = process.env.EXPO_PUBLIC_APP_ENV ?? "development";
if (!(["development", "staging", "production"] as string[]).includes(value))
  throw new Error("invalid_app_environment");

const environment = value as AppEnvironment;

/**
 * Demo requires BOTH development environment AND mode feature surface.
 * App Store production: features.demoModeSurface false → no demo card.
 * Maximum development: both true → demo allowed.
 */
const allowDemoByEnv = environment === "development";
const allowDemo = allowDemoByEnv && features.demoModeSurface;

export const runtimeConfig = {
  environment,
  allowDemo,
  /** Diagnostics only outside production AND when mode allows the panel. */
  allowDiagnostics: environment !== "production" && features.diagnosticsPanel,
  isProduction: environment === "production",
  /**
   * Base URL of the Express backend (backend/server.js) that hosts the
   * privileged session-snapshot endpoint. Null when unset: on a physical
   * device this must be the development computer's LAN address, since
   * "127.0.0.1" would point at the phone itself. See
   * docs/LOCAL_DEVELOPMENT.md.
   */
  backendUrl: process.env.EXPO_PUBLIC_BACKEND_URL ?? null,

  // ── Dual-mode architecture ──────────────────────────────────────────────
  /**
   * maximum = full autistic consent experience (macOS/Linux/internal).
   * app_store = review-sanitized iOS store binary.
   */
  buildMode: LITMO_BUILD_MODE as LitmoBuildMode,
  buildModeLabel: BUILD_MODE_LABELS[LITMO_BUILD_MODE],
  isMaximumBuild: IS_MAXIMUM_BUILD,
  isAppStoreBuild: IS_APP_STORE_BUILD,
  /** Feature matrix for this binary — import or use runtimeConfig.features. */
  features: features as LitmoFeatureFlags,
};

export type RuntimeConfig = typeof runtimeConfig;
