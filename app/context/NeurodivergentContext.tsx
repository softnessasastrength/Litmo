/**
 * Neurodivergent Mode + second-level accommodation context.
 * Device-local only. Never consent/matching authority.
 */
import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useReducedMotion } from "../hooks/useReducedMotion";
import { hapticService } from "../services/hapticService";
import {
  autoAdvanceDelayMs,
  cycleHapticIntensity,
  cycleLanguagePreference,
  cycleMotionPreference,
  cycleOverloadExitMode,
  cyclePaceMode,
  cycleSensoryProfile,
  defaultNeurodivergentPrefs,
  effectiveReducedStimulation,
  neurodivergentPreference,
  type HapticIntensity,
  type LanguagePreference,
  type MotionPreference,
  type NeurodivergentPrefs,
  type OverloadExitMode,
  type PaceMode,
  type SensoryProfile,
} from "../services/neurodivergentPreference";
import { neuroTextScale } from "../lib/neuroStyleScale";
import {
  effectiveMotionReduced,
  languageDensity,
  overloadExitHref,
  sensoryDensityLevel,
} from "../lib/neuroAccommodationCore";

type NeuroState = {
  prefs: NeurodivergentPrefs;
  ready: boolean;
  enabled: boolean;
  reducedStimulation: boolean;
  textScale: number;
  oneAtATime: boolean;
  voiceAids: boolean;
  easySaves: boolean;
  progressiveDisclosure: boolean;
  easyBreaks: boolean;
  paceMode: PaceMode;
  /** null = wait for Continue; number = auto-advance delay ms. */
  autoAdvanceDelayMs: number | null;
  // Second-level projections
  sensoryProfile: SensoryProfile;
  hapticIntensity: HapticIntensity;
  motionPreference: MotionPreference;
  languagePreference: LanguagePreference;
  overloadExitMode: OverloadExitMode;
  alwaysConfirmCritical: boolean;
  lowVisualDensity: boolean;
  explicitProgress: boolean;
  motionReduced: boolean;
  languageDensity: "short" | "medium" | "long";
  sensoryDensity: 0 | 1 | 2;
  setEnabled: (enabled: boolean) => Promise<void>;
  setPaceMode: (pace: PaceMode) => Promise<void>;
  patchPrefs: (
    patch: Partial<Omit<NeurodivergentPrefs, "version">>,
  ) => Promise<void>;
  cyclePace: () => Promise<void>;
  cycleSensory: () => Promise<void>;
  cycleHaptics: () => Promise<void>;
  cycleLanguage: () => Promise<void>;
  cycleOverloadExit: () => Promise<void>;
  cycleMotion: () => Promise<void>;
  overloadExitFor: (
    context: "quiz" | "learning" | "session" | "general",
  ) => ReturnType<typeof overloadExitHref>;
  /** Auto-advance for critical consent steps always null when alwaysConfirmCritical. */
  autoAdvanceForStep: (isCritical: boolean) => number | null;
};

const NeurodivergentContext = createContext<NeuroState | null>(null);

export function NeurodivergentProvider({ children }: PropsWithChildren) {
  const systemReduceMotion = useReducedMotion();
  const [prefs, setPrefs] = useState<NeurodivergentPrefs>(
    defaultNeurodivergentPrefs,
  );
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void neurodivergentPreference.load().then((loaded) => {
      if (cancelled) return;
      setPrefs(loaded);
      setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const setEnabled = useCallback(async (enabled: boolean) => {
    const next = await neurodivergentPreference.setEnabled(enabled);
    setPrefs(next);
    if (enabled) {
      // Demo-strength: quiet haptics globally when ND turns on.
      await hapticService.setEnabled(false);
    }
  }, []);

  const setPaceMode = useCallback(async (pace: PaceMode) => {
    const next = await neurodivergentPreference.setPaceMode(pace);
    setPrefs(next);
  }, []);

  const patchPrefs = useCallback(
    async (patch: Partial<Omit<NeurodivergentPrefs, "version">>) => {
      const next = await neurodivergentPreference.patch(patch);
      setPrefs(next);
      if (patch.hapticIntensity === "off") {
        await hapticService.setEnabled(false);
      } else if (
        patch.hapticIntensity === "minimal" ||
        patch.hapticIntensity === "standard"
      ) {
        await hapticService.setEnabled(true);
      }
    },
    [],
  );

  const cyclePace = useCallback(async () => {
    await setPaceMode(cyclePaceMode(prefs.paceMode));
  }, [prefs.paceMode, setPaceMode]);

  const cycleSensory = useCallback(async () => {
    await patchPrefs({
      sensoryProfile: cycleSensoryProfile(prefs.sensoryProfile),
    });
  }, [prefs.sensoryProfile, patchPrefs]);

  const cycleHaptics = useCallback(async () => {
    await patchPrefs({
      hapticIntensity: cycleHapticIntensity(prefs.hapticIntensity),
    });
  }, [prefs.hapticIntensity, patchPrefs]);

  const cycleLanguage = useCallback(async () => {
    await patchPrefs({
      languagePreference: cycleLanguagePreference(prefs.languagePreference),
      clearLanguage:
        cycleLanguagePreference(prefs.languagePreference) === "plain" ||
        prefs.clearLanguage,
    });
  }, [prefs.languagePreference, prefs.clearLanguage, patchPrefs]);

  const cycleOverloadExit = useCallback(async () => {
    await patchPrefs({
      overloadExitMode: cycleOverloadExitMode(prefs.overloadExitMode),
    });
  }, [prefs.overloadExitMode, patchPrefs]);

  const cycleMotion = useCallback(async () => {
    const next = cycleMotionPreference(prefs.motionPreference);
    await patchPrefs({
      motionPreference: next,
      reducedStimulation: next === "reduced" ? true : prefs.reducedStimulation,
    });
  }, [prefs.motionPreference, prefs.reducedStimulation, patchPrefs]);

  const value = useMemo<NeuroState>(() => {
    const enabled = prefs.enabled;
    const motionReduced = effectiveMotionReduced(
      prefs.motionPreference,
      systemReduceMotion,
      prefs.reducedStimulation || enabled,
    );
    return {
      prefs,
      ready,
      enabled,
      reducedStimulation: effectiveReducedStimulation(
        prefs,
        systemReduceMotion,
      ),
      textScale: neuroTextScale(enabled || prefs.lowVisualDensity),
      oneAtATime: enabled || prefs.easyNavigation,
      voiceAids: enabled || prefs.voiceInputAids || prefs.readAloud,
      easySaves: true,
      progressiveDisclosure: prefs.progressiveDisclosure || enabled,
      easyBreaks: prefs.easyBreaks || enabled,
      paceMode: prefs.paceMode,
      autoAdvanceDelayMs: autoAdvanceDelayMs(prefs),
      sensoryProfile: prefs.sensoryProfile,
      hapticIntensity: prefs.hapticIntensity,
      motionPreference: prefs.motionPreference,
      languagePreference: prefs.languagePreference,
      overloadExitMode: prefs.overloadExitMode,
      alwaysConfirmCritical: prefs.alwaysConfirmCritical,
      lowVisualDensity: prefs.lowVisualDensity || enabled,
      explicitProgress: prefs.explicitProgress || enabled,
      motionReduced,
      languageDensity: languageDensity(prefs.languagePreference),
      sensoryDensity: sensoryDensityLevel(
        prefs.sensoryProfile,
        prefs.lowVisualDensity || enabled,
      ),
      setEnabled,
      setPaceMode,
      patchPrefs,
      cyclePace,
      cycleSensory,
      cycleHaptics,
      cycleLanguage,
      cycleOverloadExit,
      cycleMotion,
      overloadExitFor: (context) =>
        overloadExitHref(prefs.overloadExitMode, context),
      autoAdvanceForStep: (isCritical) => autoAdvanceDelayMs(prefs, isCritical),
    };
  }, [
    prefs,
    ready,
    setEnabled,
    setPaceMode,
    patchPrefs,
    cyclePace,
    cycleSensory,
    cycleHaptics,
    cycleLanguage,
    cycleOverloadExit,
    cycleMotion,
    systemReduceMotion,
  ]);

  return (
    <NeurodivergentContext.Provider value={value}>
      {children}
    </NeurodivergentContext.Provider>
  );
}

const FALLBACK: NeuroState = {
  prefs: defaultNeurodivergentPrefs,
  ready: true,
  enabled: false,
  reducedStimulation: false,
  textScale: 1,
  oneAtATime: false,
  voiceAids: false,
  easySaves: true,
  progressiveDisclosure: false,
  easyBreaks: false,
  paceMode: "auto",
  autoAdvanceDelayMs: 140,
  sensoryProfile: "balanced",
  hapticIntensity: "standard",
  motionPreference: "standard",
  languagePreference: "standard",
  overloadExitMode: "break",
  alwaysConfirmCritical: true,
  lowVisualDensity: false,
  explicitProgress: false,
  motionReduced: false,
  languageDensity: "medium",
  sensoryDensity: 2,
  setEnabled: async () => {},
  setPaceMode: async () => {},
  patchPrefs: async () => {},
  cyclePace: async () => {},
  cycleSensory: async () => {},
  cycleHaptics: async () => {},
  cycleLanguage: async () => {},
  cycleOverloadExit: async () => {},
  cycleMotion: async () => {},
  overloadExitFor: (context) => overloadExitHref("break", context),
  autoAdvanceForStep: () => 140,
};

export function useNeurodivergent(): NeuroState {
  const ctx = useContext(NeurodivergentContext);
  return ctx ?? FALLBACK;
}
