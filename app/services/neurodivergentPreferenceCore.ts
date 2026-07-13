/**
 * Device-local Neurodivergent Mode preferences (v3 second-level accommodations).
 *
 * WHAT: Pure parse/set for ND master toggle + sensory, motion, haptics language,
 *       pacing, overload exits. Never sent to servers.
 * WHY: Inclusive design patterns as product logic (Art V), configurable, demo-strong.
 * CONSENT: Never gates consent, Soft Signal, matching, or trust. Not a diagnosis.
 * EDGE: v1/v2 storage loads; missing fields fill from demo-strength when enabled.
 * NEVER: Export as profile trait; invent clinical labels; delay Soft Signal.
 * SEE: neuroAccommodationCore · NEURODIVERGENT_MODE.md · TRAUMA_INFORMED_SAFETY.md
 */

import {
  demoStrengthAccommodations,
  standardAccommodations,
  type HapticIntensity,
  type LanguagePreference,
  type MotionPreference,
  type OverloadExitMode,
  type SensoryProfile,
} from "../lib/neuroAccommodationCore.ts";

export type PaceMode = "auto" | "confirm" | "slow";

export type {
  HapticIntensity,
  LanguagePreference,
  MotionPreference,
  OverloadExitMode,
  SensoryProfile,
};

/**
 * WHAT: Full device-local ND preference document (v3).
 * WHY: Master switch + second-level axes for sensory, motion, haptics, language, exits.
 */
export type NeurodivergentPrefs = {
  /** Schema version for parse gates. */
  version: 3;
  /** Master switch — optimizes app-wide + quiz + learning. */
  enabled: boolean;
  /** No motion flourishes, quieter chrome, honor system Reduce Motion. */
  reducedStimulation: boolean;
  /** Prefer plain, short sentences in chrome and helpers. */
  clearLanguage: boolean;
  /** Jump lists, larger steps, explicit prev/next, progress always named. */
  easyNavigation: boolean;
  /** Persist mid-quiz progress on device for later resume. */
  saveResume: boolean;
  /** Offer read-aloud / spoken announcements for prompts. */
  readAloud: boolean;
  /** Offer keyboard-dictation friendly number entry for answers. */
  voiceInputAids: boolean;
  /**
   * Pace control:
   * - auto: brief pause then advance
   * - confirm: wait for Continue (default when ND on)
   * - slow: longer pause then advance
   */
  paceMode: PaceMode;
  /** Collapse extra detail until the person opens it. */
  progressiveDisclosure: boolean;
  /** Surface easy break / save-and-leave actions. */
  easyBreaks: boolean;
  // ── Second-level accommodations (v3) ─────────────────────────────────
  sensoryProfile: SensoryProfile;
  hapticIntensity: HapticIntensity;
  motionPreference: MotionPreference;
  languagePreference: LanguagePreference;
  overloadExitMode: OverloadExitMode;
  alwaysConfirmCritical: boolean;
  lowVisualDensity: boolean;
  explicitProgress: boolean;
};

export const NEURO_PREF_KEY = "litmo.neurodivergent.prefs.v3";
export const NEURO_PREF_KEY_V2 = "litmo.neurodivergent.prefs.v2";
export const NEURO_PREF_KEY_V1 = "litmo.neurodivergent.prefs.v1";

export const defaultNeurodivergentPrefs: NeurodivergentPrefs = {
  version: 3,
  enabled: false,
  ...mapBundle(standardAccommodations()),
  easyNavigation: false,
  saveResume: false,
  readAloud: false,
  voiceInputAids: false,
};

/** When master mode turns on, enable the full inclusive demo-strength bundle. */
export function optimizedNeurodivergentPrefs(): NeurodivergentPrefs {
  const demo = demoStrengthAccommodations();
  return {
    version: 3,
    enabled: true,
    ...mapBundle(demo),
    easyNavigation: true,
    saveResume: true,
    readAloud: true,
    voiceInputAids: true,
  };
}

/** Alias — demo entry and ND on share the same calm-first bundle. */
export function demoStrengthNeurodivergentPrefs(): NeurodivergentPrefs {
  return optimizedNeurodivergentPrefs();
}

function mapBundle(
  b: ReturnType<typeof demoStrengthAccommodations>,
): Omit<
  NeurodivergentPrefs,
  | "version"
  | "enabled"
  | "easyNavigation"
  | "saveResume"
  | "readAloud"
  | "voiceInputAids"
> {
  return {
    reducedStimulation: b.reducedStimulation,
    clearLanguage: b.clearLanguage,
    paceMode: b.paceMode,
    progressiveDisclosure: b.progressiveDisclosure,
    easyBreaks: b.easyBreaks,
    sensoryProfile: b.sensoryProfile,
    hapticIntensity: b.hapticIntensity,
    motionPreference: b.motionPreference,
    languagePreference: b.languagePreference,
    overloadExitMode: b.overloadExitMode,
    alwaysConfirmCritical: b.alwaysConfirmCritical,
    lowVisualDensity: b.lowVisualDensity,
    explicitProgress: b.explicitProgress,
  };
}

function parsePaceMode(raw: unknown): PaceMode | null {
  if (raw === "auto" || raw === "confirm" || raw === "slow") return raw;
  return null;
}

function parseSensory(raw: unknown): SensoryProfile | null {
  if (raw === "low" || raw === "balanced" || raw === "variable") return raw;
  return null;
}

function parseHaptic(raw: unknown): HapticIntensity | null {
  if (raw === "off" || raw === "minimal" || raw === "standard") return raw;
  return null;
}

function parseMotion(raw: unknown): MotionPreference | null {
  if (raw === "reduced" || raw === "standard") return raw;
  return null;
}

function parseLanguage(raw: unknown): LanguagePreference | null {
  if (raw === "plain" || raw === "standard" || raw === "detailed") return raw;
  return null;
}

function parseOverload(raw: unknown): OverloadExitMode | null {
  if (raw === "break" || raw === "home" || raw === "panic_cover") return raw;
  return null;
}

/**
 * WHAT: Parse storage JSON into v3 prefs with fail-closed defaults.
 * WHY: v1/v2/v3 documents must load without losing the master toggle.
 */
export function parseNeurodivergentPrefs(raw: string | null): NeurodivergentPrefs {
  if (!raw) return { ...defaultNeurodivergentPrefs };
  try {
    const parsed = JSON.parse(raw) as Partial<NeurodivergentPrefs> & {
      version?: number;
    };
    if (typeof parsed !== "object" || parsed === null) {
      return { ...defaultNeurodivergentPrefs };
    }
    const enabled = Boolean(parsed.enabled);
    const base = enabled
      ? optimizedNeurodivergentPrefs()
      : { ...defaultNeurodivergentPrefs };

    return {
      version: 3,
      enabled,
      reducedStimulation:
        typeof parsed.reducedStimulation === "boolean"
          ? parsed.reducedStimulation
          : base.reducedStimulation,
      clearLanguage:
        typeof parsed.clearLanguage === "boolean"
          ? parsed.clearLanguage
          : base.clearLanguage,
      easyNavigation:
        typeof parsed.easyNavigation === "boolean"
          ? parsed.easyNavigation
          : base.easyNavigation,
      saveResume:
        typeof parsed.saveResume === "boolean"
          ? parsed.saveResume
          : base.saveResume,
      readAloud:
        typeof parsed.readAloud === "boolean" ? parsed.readAloud : base.readAloud,
      voiceInputAids:
        typeof parsed.voiceInputAids === "boolean"
          ? parsed.voiceInputAids
          : base.voiceInputAids,
      paceMode: parsePaceMode(parsed.paceMode) ?? base.paceMode,
      progressiveDisclosure:
        typeof parsed.progressiveDisclosure === "boolean"
          ? parsed.progressiveDisclosure
          : base.progressiveDisclosure,
      easyBreaks:
        typeof parsed.easyBreaks === "boolean"
          ? parsed.easyBreaks
          : base.easyBreaks,
      sensoryProfile: parseSensory(parsed.sensoryProfile) ?? base.sensoryProfile,
      hapticIntensity: parseHaptic(parsed.hapticIntensity) ?? base.hapticIntensity,
      motionPreference:
        parseMotion(parsed.motionPreference) ?? base.motionPreference,
      languagePreference:
        parseLanguage(parsed.languagePreference) ?? base.languagePreference,
      overloadExitMode:
        parseOverload(parsed.overloadExitMode) ?? base.overloadExitMode,
      alwaysConfirmCritical:
        typeof parsed.alwaysConfirmCritical === "boolean"
          ? parsed.alwaysConfirmCritical
          : base.alwaysConfirmCritical,
      lowVisualDensity:
        typeof parsed.lowVisualDensity === "boolean"
          ? parsed.lowVisualDensity
          : base.lowVisualDensity,
      explicitProgress:
        typeof parsed.explicitProgress === "boolean"
          ? parsed.explicitProgress
          : base.explicitProgress,
    };
  } catch {
    return { ...defaultNeurodivergentPrefs };
  }
}

export function setNeurodivergentEnabled(
  _current: NeurodivergentPrefs,
  enabled: boolean,
): NeurodivergentPrefs {
  if (enabled) return optimizedNeurodivergentPrefs();
  return { ...defaultNeurodivergentPrefs };
}

export function setPaceMode(
  current: NeurodivergentPrefs,
  paceMode: PaceMode,
): NeurodivergentPrefs {
  return { ...current, paceMode };
}

/** Patch any second-level field without forcing master off. */
export function patchNeurodivergentPrefs(
  current: NeurodivergentPrefs,
  patch: Partial<Omit<NeurodivergentPrefs, "version">>,
): NeurodivergentPrefs {
  const next = { ...current, ...patch, version: 3 as const };
  // Master off: keep patched fields but clear enabled if explicitly set false.
  if (patch.enabled === false) {
    return { ...defaultNeurodivergentPrefs, ...patch, enabled: false, version: 3 };
  }
  if (patch.enabled === true && !current.enabled) {
    return { ...optimizedNeurodivergentPrefs(), ...patch, enabled: true, version: 3 };
  }
  return next;
}

/** Effective reduced-stimulation: ND flag, sensory low, or system Reduce Motion. */
export function effectiveReducedStimulation(
  prefs: NeurodivergentPrefs,
  systemReduceMotion: boolean,
): boolean {
  return (
    prefs.reducedStimulation ||
    systemReduceMotion ||
    prefs.enabled ||
    prefs.motionPreference === "reduced" ||
    prefs.sensoryProfile === "low"
  );
}

/** Delay before auto-advance (ms). confirm → null (wait for user). */
export function autoAdvanceDelayMs(
  prefs: NeurodivergentPrefs,
  isCriticalStep = false,
): number | null {
  if (isCriticalStep && prefs.alwaysConfirmCritical) return null;
  if (prefs.paceMode === "confirm") return null;
  if (prefs.paceMode === "slow") {
    return prefs.sensoryProfile === "low" ? 900 : 600;
  }
  if (
    prefs.reducedStimulation ||
    prefs.enabled ||
    prefs.sensoryProfile === "low"
  ) {
    return 0;
  }
  if (prefs.sensoryProfile === "variable") return 220;
  return 140;
}

export function cyclePaceMode(pace: PaceMode): PaceMode {
  if (pace === "confirm") return "slow";
  if (pace === "slow") return "auto";
  return "confirm";
}

export function cycleSensoryProfile(p: SensoryProfile): SensoryProfile {
  if (p === "low") return "balanced";
  if (p === "balanced") return "variable";
  return "low";
}

export function cycleHapticIntensity(h: HapticIntensity): HapticIntensity {
  if (h === "off") return "minimal";
  if (h === "minimal") return "standard";
  return "off";
}

export function cycleLanguagePreference(l: LanguagePreference): LanguagePreference {
  if (l === "plain") return "standard";
  if (l === "standard") return "detailed";
  return "plain";
}

export function cycleOverloadExitMode(m: OverloadExitMode): OverloadExitMode {
  if (m === "break") return "home";
  if (m === "home") return "panic_cover";
  return "break";
}

export function cycleMotionPreference(m: MotionPreference): MotionPreference {
  return m === "reduced" ? "standard" : "reduced";
}
