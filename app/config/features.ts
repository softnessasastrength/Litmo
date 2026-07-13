/**
 * Feature matrix — Maximum Mode vs App Store Safe Mode.
 *
 * WHAT: Boolean + policy flags for every product surface that differs by mode.
 * WHY:  Screens import `features.proximityRadar` instead of scattering
 *       `if (IS_MAXIMUM)` guesses. One table is the audit surface for Review.
 * CONSENT:
 *   - Safety core flags are ALWAYS true in both modes (Soft Signal, dual seal,
 *     age gate, profile≠consent, fail closed).
 *   - Optional discovery/RF/hardware intensity may be false in app_store.
 * EDGE CASES: Unknown feature key should not exist — TypeScript closes the set.
 * NEVER: Disable Soft Signal stop, consent engine, or age gate for review.
 * SEE: docs/BUILD_MODES.md, config/buildMode.ts.
 */

import { IS_APP_STORE_BUILD, IS_MAXIMUM_BUILD, type LitmoBuildMode } from "./buildMode.ts";

/**
 * WHAT: Complete feature policy for one build mode.
 * WHY:  Readable table for founders, agents, and App Review prep.
 */
export type LitmoFeatureFlags = {
  // ── Safety core (never false) ───────────────────────────────────────────
  /** Soft Signal may fire; local end authoritative. */
  softSignalStop: true;
  /** Dual-seal / mutual affirm grammar. */
  consentDualSeal: true;
  /** Adult eligibility gate for real accounts. */
  ageGate: true;
  /** Profile / vibe / map never equal consent. */
  profileIsNotConsent: true;
  /** Unset zones / missing data fail closed. */
  failClosedBoundaries: true;

  // ── Experience intensity ────────────────────────────────────────────────
  /** Full CONSENT_POINTS catalog surfaces, arm dwell UI, edge matrix copy. */
  consentMicrogrammarFull: boolean;
  /** Expanded body-zone map including soft_limit first-class language. */
  expandedBodyMap: boolean;
  /** soft_limit status in TL and snapshots. */
  softLimitZoneStatus: boolean;
  /** Autistic-depth learning modules (full catalog). */
  guidedLearningFull: boolean;
  /** Campfire / practice circles. */
  campfirePractice: boolean;
  /** Trauma safety: panic cover, quick exit, timeout, verify, reflect. */
  traumaSafetyToolkit: boolean;
  /** Private Soft Signal journal log screen. */
  softSignalPrivateLog: boolean;
  /** Soft Signal practice without a peer. */
  softSignalPractice: boolean;

  // ── Review-sensitive optional surfaces ──────────────────────────────────
  /** Anonymous proximity radar / Multipeer interest. */
  proximityRadar: boolean;
  /** NFC careful-connect post-tap accept. */
  nfcCarefulConnect: boolean;
  /** Nearby Multipeer profile/snapshot share. */
  localMultipeerShare: boolean;
  /** Hardware Soft Signal bridge / device OS language. */
  hardwareSoftSignal: boolean;
  /** Diagnostics / constitution self-check screens. */
  diagnosticsPanel: boolean;
  /** Fictional demo mode entry (also gated by environment). */
  demoModeSurface: boolean;
  /** Deep 100-scene vibe in onboarding for real accounts. */
  deepVibeOnboarding: boolean;
  /** Partner quiz E2E compare flows. */
  partnerQuizE2e: boolean;
  /** Explicit safeword vocabulary UI (stop/slow/ok). */
  safewordVocabularyUi: boolean;
  /** Aftercare option pickers on prepare. */
  aftercarePrepareUi: boolean;
  /** Maximum-intensity Soft Signal “sacred stop” voice. */
  softSignalSacredCopy: boolean;
  /** App Review–safe Soft Signal voice (calm end, still no reason). */
  softSignalReviewCopy: boolean;
  /** Show build mode badge on entry/settings. */
  showBuildModeBadge: boolean;
};

/**
 * WHAT: Feature table for Maximum Mode — full unhinged consent experience.
 * WHY:  macOS + Linux + internal iOS dev builds; no App Review compromise.
 * CONSENT: Every optional surface on; safety core still true.
 */
export const FEATURES_MAXIMUM: LitmoFeatureFlags = {
  softSignalStop: true,
  consentDualSeal: true,
  ageGate: true,
  profileIsNotConsent: true,
  failClosedBoundaries: true,

  consentMicrogrammarFull: true,
  expandedBodyMap: true,
  softLimitZoneStatus: true,
  guidedLearningFull: true,
  campfirePractice: true,
  traumaSafetyToolkit: true,
  softSignalPrivateLog: true,
  softSignalPractice: true,

  proximityRadar: true,
  nfcCarefulConnect: true,
  localMultipeerShare: true,
  hardwareSoftSignal: true,
  diagnosticsPanel: true,
  demoModeSurface: true,
  deepVibeOnboarding: true,
  partnerQuizE2e: true,
  safewordVocabularyUi: true,
  aftercarePrepareUi: true,
  softSignalSacredCopy: true,
  softSignalReviewCopy: false,
  showBuildModeBadge: true,
};

/**
 * WHAT: Feature table for App Store Safe Mode — review-sanitized skin.
 * WHY:  iOS production/staging store binaries pass Review without deleting
 *       Maximum source from the monorepo.
 * CONSENT: Soft Signal stop, dual seal, age gate, fail-closed ALWAYS on.
 *       RF/NFC/hardware/demo intensity reduced; copy uses review voice.
 * NEVER: Claims the product became less consensual — only less “alarming”
 *       optional surfaces and softer strings.
 */
export const FEATURES_APP_STORE: LitmoFeatureFlags = {
  softSignalStop: true,
  consentDualSeal: true,
  ageGate: true,
  profileIsNotConsent: true,
  failClosedBoundaries: true,

  // Keep core consent UX; slightly less “nuclear catalog” chrome.
  consentMicrogrammarFull: true,
  expandedBodyMap: true,
  softLimitZoneStatus: true,
  guidedLearningFull: true,
  campfirePractice: true,
  // Panic cover stays — reworded as privacy cover in copy layer.
  traumaSafetyToolkit: true,
  softSignalPrivateLog: true,
  softSignalPractice: true,

  // Review-sensitive: off in store binary (code remains in repo, dead/gated).
  proximityRadar: false,
  nfcCarefulConnect: false,
  localMultipeerShare: false,
  hardwareSoftSignal: false,
  diagnosticsPanel: false,
  // Demo still env-gated; surface hidden in production app_store anyway.
  demoModeSurface: false,
  deepVibeOnboarding: true,
  partnerQuizE2e: true,
  safewordVocabularyUi: true,
  aftercarePrepareUi: true,
  softSignalSacredCopy: false,
  softSignalReviewCopy: true,
  showBuildModeBadge: false,
};

/**
 * WHAT: Active feature flags for this bundle.
 * WHY:  Single import for screens: `import { features } from '../config/features'`.
 */
export const features: LitmoFeatureFlags = IS_APP_STORE_BUILD
  ? FEATURES_APP_STORE
  : FEATURES_MAXIMUM;

/**
 * WHAT: Resolve feature table for an arbitrary mode (tests / diagnostics).
 * WHY:  Unit tests assert both matrices without reloading modules.
 */
export function featuresForMode(mode: LitmoBuildMode): LitmoFeatureFlags {
  return mode === "app_store" ? FEATURES_APP_STORE : FEATURES_MAXIMUM;
}

/**
 * WHAT: Guard helper — true if feature enabled in this binary.
 * WHY:  Readable call sites: if (featureEnabled('proximityRadar')).
 */
export function featureEnabled<K extends keyof LitmoFeatureFlags>(
  key: K,
): LitmoFeatureFlags[K] {
  return features[key];
}

/**
 * WHAT: List feature keys that differ between modes (audit).
 * WHY:  BUILD_MODES.md and release:check can print the delta.
 */
export function featureDelta(): Array<{
  key: keyof LitmoFeatureFlags;
  maximum: boolean | true;
  app_store: boolean | true;
}> {
  const keys = Object.keys(FEATURES_MAXIMUM) as Array<keyof LitmoFeatureFlags>;
  return keys
    .filter((k) => FEATURES_MAXIMUM[k] !== FEATURES_APP_STORE[k])
    .map((k) => ({
      key: k,
      maximum: FEATURES_MAXIMUM[k] as boolean,
      app_store: FEATURES_APP_STORE[k] as boolean,
    }));
}

/** Re-export mode booleans for convenience at call sites. */
export { IS_MAXIMUM_BUILD, IS_APP_STORE_BUILD };
