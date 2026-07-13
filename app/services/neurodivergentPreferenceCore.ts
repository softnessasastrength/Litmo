/**
 * Device-local Neurodivergent Mode preferences.
 * Pure logic for unit tests. Never sends data to servers.
 *
 * Constitution: accessibility is not a competence score. These settings never
 * gate consent, matching, or session authority.
 */

export type NeurodivergentPrefs = {
  /** Master switch — optimizes quiz, partner, and learning surfaces. */
  enabled: boolean;
  /** No motion flourishes, denser calm layout, quieter chrome. */
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
};

export const NEURO_PREF_KEY = "litmo.neurodivergent.prefs.v1";

export const defaultNeurodivergentPrefs: NeurodivergentPrefs = {
  enabled: false,
  reducedStimulation: false,
  clearLanguage: false,
  easyNavigation: false,
  saveResume: false,
  readAloud: false,
  voiceInputAids: false,
};

/** When master mode turns on, enable the full optimized bundle. */
export function optimizedNeurodivergentPrefs(): NeurodivergentPrefs {
  return {
    enabled: true,
    reducedStimulation: true,
    clearLanguage: true,
    easyNavigation: true,
    saveResume: true,
    readAloud: true,
    voiceInputAids: true,
  };
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
    };
  } catch {
    return { ...defaultNeurodivergentPrefs };
  }
}

export function setNeurodivergentEnabled(
  current: NeurodivergentPrefs,
  enabled: boolean,
): NeurodivergentPrefs {
  if (enabled) return optimizedNeurodivergentPrefs();
  return { ...defaultNeurodivergentPrefs };
}

/** Effective reduced-stimulation: ND mode or system Reduce Motion. */
export function effectiveReducedStimulation(
  prefs: NeurodivergentPrefs,
  systemReduceMotion: boolean,
): boolean {
  return prefs.reducedStimulation || systemReduceMotion || prefs.enabled;
}
