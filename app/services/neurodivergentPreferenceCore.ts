/**
 * Device-local Neurodivergent Mode preferences.
 * Pure logic for unit tests. Never sends data to servers.
 *
 * Inclusive design patterns (not a diagnosis or competence score):
 * progressive disclosure, customizable pace, reduced motion, voice aids,
 * clear progress, easy breaks. Never gates consent or matching.
 */

export type PaceMode = "auto" | "confirm" | "slow";

export type NeurodivergentPrefs = {
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
   * - confirm: wait for Continue (default when ND on — customizable pace)
   * - slow: longer pause then advance
   */
  paceMode: PaceMode;
  /** Collapse extra detail until the person opens it. */
  progressiveDisclosure: boolean;
  /** Surface easy break / save-and-leave actions. */
  easyBreaks: boolean;
};

export const NEURO_PREF_KEY = "litmo.neurodivergent.prefs.v2";

export const defaultNeurodivergentPrefs: NeurodivergentPrefs = {
  enabled: false,
  reducedStimulation: false,
  clearLanguage: false,
  easyNavigation: false,
  saveResume: false,
  readAloud: false,
  voiceInputAids: false,
  paceMode: "auto",
  progressiveDisclosure: false,
  easyBreaks: false,
};

/** When master mode turns on, enable the full inclusive bundle. */
export function optimizedNeurodivergentPrefs(): NeurodivergentPrefs {
  return {
    enabled: true,
    reducedStimulation: true,
    clearLanguage: true,
    easyNavigation: true,
    saveResume: true,
    readAloud: true,
    voiceInputAids: true,
    paceMode: "confirm",
    progressiveDisclosure: true,
    easyBreaks: true,
  };
}

function parsePaceMode(raw: unknown): PaceMode | null {
  if (raw === "auto" || raw === "confirm" || raw === "slow") return raw;
  return null;
}

export function parseNeurodivergentPrefs(raw: string | null): NeurodivergentPrefs {
  if (!raw) return { ...defaultNeurodivergentPrefs };
  try {
    const parsed = JSON.parse(raw) as Partial<NeurodivergentPrefs>;
    if (typeof parsed !== "object" || parsed === null) {
      return { ...defaultNeurodivergentPrefs };
    }
    const base = parsed.enabled
      ? optimizedNeurodivergentPrefs()
      : { ...defaultNeurodivergentPrefs };
    const pace = parsePaceMode(parsed.paceMode) ?? base.paceMode;
    return {
      enabled: Boolean(parsed.enabled),
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
        typeof parsed.readAloud === "boolean"
          ? parsed.readAloud
          : base.readAloud,
      voiceInputAids:
        typeof parsed.voiceInputAids === "boolean"
          ? parsed.voiceInputAids
          : base.voiceInputAids,
      paceMode: pace,
      progressiveDisclosure:
        typeof parsed.progressiveDisclosure === "boolean"
          ? parsed.progressiveDisclosure
          : base.progressiveDisclosure,
      easyBreaks:
        typeof parsed.easyBreaks === "boolean"
          ? parsed.easyBreaks
          : base.easyBreaks,
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

/** Effective reduced-stimulation: ND mode or system Reduce Motion. */
export function effectiveReducedStimulation(
  prefs: NeurodivergentPrefs,
  systemReduceMotion: boolean,
): boolean {
  return prefs.reducedStimulation || systemReduceMotion || prefs.enabled;
}

/** Delay before auto-advance (ms). confirm → null (wait for user). */
export function autoAdvanceDelayMs(prefs: NeurodivergentPrefs): number | null {
  if (prefs.paceMode === "confirm") return null;
  if (prefs.paceMode === "slow") return 600;
  // auto: reduced stimulation skips artificial pause
  if (prefs.reducedStimulation || prefs.enabled) return 0;
  return 140;
}
