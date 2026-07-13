/**
 * Neurodivergent + trauma-informed accommodation law (second level).
 *
 * WHAT: Pure helpers for sensory profiles, motion/haptics gates, language
 *       preference packs, pacing, and overload exits — device-local only.
 * WHY: Inclusive design must be product logic, not decorative copy (Art V).
 * CONSENT: Accommodations never grant, deny, or replace consent / Soft Signal.
 * EDGE: Demo-strength defaults are calm-first; user can reconfigure anytime.
 * NEVER: Export as profile type, matching trait, safety score, or diagnosis.
 * SEE: neurodivergentPreferenceCore · clearLanguage · TRAUMA_INFORMED_SAFETY ·
 *      NEURODIVERGENT_MODE.md · Living Constitution V
 */

export const NEURO_ACCOMMODATION_VERSION = 2 as const;

/** Sensory load preference for chrome density and auto-advance aggressiveness. */
export const SENSORY_PROFILES = ["low", "balanced", "variable"] as const;
export type SensoryProfile = (typeof SENSORY_PROFILES)[number];

/** Haptic intensity — Soft Signal may still use minimal if master haptics on. */
export const HAPTIC_INTENSITIES = ["off", "minimal", "standard"] as const;
export type HapticIntensity = (typeof HAPTIC_INTENSITIES)[number];

/** Motion preference (also ORs with system Reduce Motion). */
export const MOTION_PREFERENCES = ["reduced", "standard"] as const;
export type MotionPreference = (typeof MOTION_PREFERENCES)[number];

/**
 * Language preference for chrome density — never rewrites legal/consent meaning.
 * plain = shortest clear sentences; detailed = more explainer text.
 */
export const LANGUAGE_PREFERENCES = ["plain", "standard", "detailed"] as const;
export type LanguagePreference = (typeof LANGUAGE_PREFERENCES)[number];

/**
 * Overload exit strength when someone needs out of a flow without shame.
 * break = leave with save; home = root tabs; panic_cover = Soft Signal path UI.
 */
export const OVERLOAD_EXIT_MODES = ["break", "home", "panic_cover"] as const;
export type OverloadExitMode = (typeof OVERLOAD_EXIT_MODES)[number];

export type PaceMode = "auto" | "confirm" | "slow";

/**
 * WHAT: Full second-level accommodation surface (device-local product law).
 * WHY: Master ND toggle turns this on as a calm bundle; each axis is reconfigurable.
 * CONSENT: Not a consent surface; Soft Signal remains free regardless of settings.
 */
export type AccommodationBundle = {
  sensoryProfile: SensoryProfile;
  hapticIntensity: HapticIntensity;
  motionPreference: MotionPreference;
  languagePreference: LanguagePreference;
  overloadExitMode: OverloadExitMode;
  paceMode: PaceMode;
  /** Even in auto/slow, require Continue on consent / Soft Signal related steps. */
  alwaysConfirmCritical: boolean;
  lowVisualDensity: boolean;
  explicitProgress: boolean;
  progressiveDisclosure: boolean;
  easyBreaks: boolean;
  clearLanguage: boolean;
  reducedStimulation: boolean;
};

/**
 * WHAT: Demo-strength calm defaults (used when ND turns on or demo entry).
 * WHY: Phone-visible path should feel protective without configuration homework.
 * CONSENT: Demo strength does not auto-consent or silence Soft Signal.
 * NEVER: Ship demo-strength as a public “ND type” badge.
 */
export function demoStrengthAccommodations(): AccommodationBundle {
  return {
    sensoryProfile: "low",
    hapticIntensity: "off",
    motionPreference: "reduced",
    languagePreference: "plain",
    overloadExitMode: "break",
    paceMode: "confirm",
    alwaysConfirmCritical: true,
    lowVisualDensity: true,
    explicitProgress: true,
    progressiveDisclosure: true,
    easyBreaks: true,
    clearLanguage: true,
    reducedStimulation: true,
  };
}

/**
 * WHAT: Quieter non-ND defaults (app chrome standard).
 * WHY: Off means no forced accommodations; system Reduce Motion still honored separately.
 */
export function standardAccommodations(): AccommodationBundle {
  return {
    sensoryProfile: "balanced",
    hapticIntensity: "standard",
    motionPreference: "standard",
    languagePreference: "standard",
    overloadExitMode: "break",
    paceMode: "auto",
    alwaysConfirmCritical: true, // critical consent paths always confirm
    lowVisualDensity: false,
    explicitProgress: false,
    progressiveDisclosure: false,
    easyBreaks: false,
    clearLanguage: false,
    reducedStimulation: false,
  };
}

/**
 * WHAT: Effective motion reduction (prefs OR system Reduce Motion).
 * WHY: Respect OS accessibility; never force animation through ND off.
 */
export function effectiveMotionReduced(
  motionPreference: MotionPreference,
  systemReduceMotion: boolean,
  reducedStimulation: boolean,
): boolean {
  return (
    systemReduceMotion ||
    motionPreference === "reduced" ||
    reducedStimulation
  );
}

/**
 * WHAT: Whether a semantic haptic may play under current intensity.
 * WHY: Low-sensory profiles need off/minimal; Soft Signal still may use minimal
 *      when intensity is minimal so stop feedback exists without buzz storms.
 * CONSENT: Haptic is not consent or peer presence.
 * EDGE: intensity off → never; minimal → only softSignal/emergencyStop;
 *       standard → all events.
 */
export function mayPlayHaptic(
  intensity: HapticIntensity,
  event:
    | "presence"
    | "attention"
    | "confirmation"
    | "softSignal"
    | "emergencyStop",
): boolean {
  if (intensity === "off") return false;
  if (intensity === "standard") return true;
  // minimal: only stop-class feedback
  return event === "softSignal" || event === "emergencyStop";
}

/**
 * WHAT: Auto-advance delay with second-level pace + alwaysConfirmCritical.
 * WHY: Confirm mode and critical steps never race the user.
 * CONSENT: Critical consent UI must pass isCriticalStep=true so delay is null.
 * EDGE: confirm → null; critical → null; slow → 900ms (was 600); auto quiet → 0.
 */
export function accommodationAutoAdvanceMs(input: {
  paceMode: PaceMode;
  reducedStimulation: boolean;
  sensoryProfile: SensoryProfile;
  isCriticalStep: boolean;
  alwaysConfirmCritical: boolean;
}): number | null {
  if (input.isCriticalStep && input.alwaysConfirmCritical) return null;
  if (input.paceMode === "confirm") return null;
  if (input.paceMode === "slow") {
    return input.sensoryProfile === "low" ? 900 : 600;
  }
  // auto
  if (input.reducedStimulation || input.sensoryProfile === "low") return 0;
  if (input.sensoryProfile === "variable") return 220;
  return 140;
}

/**
 * WHAT: Expo-router style destination for overload exit.
 * WHY: One vocabulary for “I need out” without inventing shame copy.
 * CONSENT: panic_cover path is Soft Signal adjacent UI — still not emergency services.
 * NEVER: Overload exit as peer-visible status or trust signal.
 */
export function overloadExitHref(
  mode: OverloadExitMode,
  context: "quiz" | "learning" | "session" | "general",
): { href: string; label: string; hint: string } {
  switch (mode) {
    case "home":
      return {
        href: "/(tabs)",
        label: "Leave to Home",
        hint: "Leaves this screen. Progress is kept on this device when the flow supports saves.",
      };
    case "panic_cover":
      if (context === "session") {
        return {
          href: "/safety/panic-cover",
          label: "Stop and cover screen",
          hint: "Uses Soft Signal stop first, then a calm cover. Not emergency services.",
        };
      }
      return {
        href: "/safety",
        label: "Open calm safety tools",
        hint: "Opens safety tools. Soft Signal remains available in active sessions.",
      };
    case "break":
    default:
      if (context === "quiz") {
        return {
          href: "/(tabs)/quizzes",
          label: "Take a break — progress saved",
          hint: "Leaves the quiz. Your place stays on this device.",
        };
      }
      if (context === "learning") {
        return {
          href: "/(tabs)/learn",
          label: "Take a break — progress saved",
          hint: "Returns to Learn. Progress stays on this device.",
        };
      }
      if (context === "session") {
        return {
          href: "/session/wrap-up",
          label: "Quick exit to wrap-up",
          hint: "Ends via Soft Signal path into private wrap-up when in an active session.",
        };
      }
      return {
        href: "/(tabs)",
        label: "Take a break",
        hint: "Leaves this flow without penalty.",
      };
  }
}

/**
 * WHAT: Language density helper — short vs detailed chrome.
 * WHY: plain prefers fewer words; detailed adds orienting sentences.
 * CONSENT: Never softens consent/Soft Signal non-claims.
 */
export function languageDensity(
  preference: LanguagePreference,
): "short" | "medium" | "long" {
  if (preference === "plain") return "short";
  if (preference === "detailed") return "long";
  return "medium";
}

/**
 * WHAT: Pick a string by language preference with fail-closed plain fallback.
 * WHY: Callers supply plain/standard/detailed variants without branching everywhere.
 */
export function pickLanguageVariant(
  preference: LanguagePreference,
  variants: { plain: string; standard: string; detailed: string },
): string {
  if (preference === "detailed") return variants.detailed;
  if (preference === "standard") return variants.standard;
  return variants.plain;
}

/**
 * WHAT: Sensory density score for layout (0 low density … 2 fuller chrome).
 * WHY: lowVisualDensity + low sensory → less simultaneous chrome.
 */
export function sensoryDensityLevel(
  profile: SensoryProfile,
  lowVisualDensity: boolean,
): 0 | 1 | 2 {
  if (profile === "low" || lowVisualDensity) return 0;
  if (profile === "variable") return 1;
  return 2;
}

/**
 * WHAT: Constitution-style gate for accommodation features.
 * WHY: Prevent “ND mode as diagnosis” or matching trait product bugs.
 */
export function evaluateAccommodationFeature(input: {
  exportsAsProfileTrait: boolean;
  gatesConsentOrMatching: boolean;
  forcesDiagnosisLanguage: boolean;
  softSignalRequiresExtraStepsWhenOverload: boolean;
  documentsAccommodations: boolean;
}): { ok: true } | { ok: false; violations: string[] } {
  const violations: string[] = [];
  if (input.exportsAsProfileTrait) {
    violations.push("V: accommodations must not export as a public profile trait");
  }
  if (input.gatesConsentOrMatching) {
    violations.push("I/V: accommodations must not gate consent or matching");
  }
  if (input.forcesDiagnosisLanguage) {
    violations.push("V: no diagnostic or clinical framing for ND Mode");
  }
  if (input.softSignalRequiresExtraStepsWhenOverload) {
    violations.push("I.4: Soft Signal must stay easier than continue under overload");
  }
  if (!input.documentsAccommodations) {
    violations.push("VIII.6: accommodation changes require documentation");
  }
  return violations.length === 0 ? { ok: true } : { ok: false, violations };
}
