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
  defaultNeurodivergentPrefs,
  effectiveReducedStimulation,
  neurodivergentPreference,
  type NeurodivergentPrefs,
  type PaceMode,
} from "../services/neurodivergentPreference";
import { neuroTextScale } from "../lib/neuroStyleScale";

type NeuroState = {
  prefs: NeurodivergentPrefs;
  ready: boolean;
  enabled: boolean;
  reducedStimulation: boolean;
  textScale: number;
  oneAtATime: boolean;
  voiceAids: boolean;
  easySaves: boolean;
  /** Progressive disclosure of extra detail. */
  progressiveDisclosure: boolean;
  /** Easy break / leave-and-save affordances. */
  easyBreaks: boolean;
  paceMode: PaceMode;
  /** null = wait for Continue; number = auto-advance delay ms. */
  autoAdvanceDelayMs: number | null;
  setEnabled: (enabled: boolean) => Promise<void>;
  setPaceMode: (pace: PaceMode) => Promise<void>;
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
      await hapticService.setEnabled(false);
    }
  }, []);

  const setPaceMode = useCallback(async (pace: PaceMode) => {
    const next = await neurodivergentPreference.setPaceMode(pace);
    setPrefs(next);
  }, []);

  const value = useMemo<NeuroState>(() => {
    const enabled = prefs.enabled;
    return {
      prefs,
      ready,
      enabled,
      reducedStimulation: effectiveReducedStimulation(
        prefs,
        systemReduceMotion,
      ),
      textScale: neuroTextScale(enabled),
      oneAtATime: enabled || prefs.easyNavigation,
      voiceAids: enabled || prefs.voiceInputAids || prefs.readAloud,
      easySaves: true,
      progressiveDisclosure: prefs.progressiveDisclosure || enabled,
      easyBreaks: prefs.easyBreaks || enabled,
      paceMode: prefs.paceMode,
      autoAdvanceDelayMs: autoAdvanceDelayMs(prefs),
      setEnabled,
      setPaceMode,
    };
  }, [prefs, ready, setEnabled, setPaceMode, systemReduceMotion]);

  return (
    <NeurodivergentContext.Provider value={value}>
      {children}
    </NeurodivergentContext.Provider>
  );
}

export function useNeurodivergent(): NeuroState {
  const ctx = useContext(NeurodivergentContext);
  if (!ctx) {
    return {
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
      setEnabled: async () => {},
      setPaceMode: async () => {},
    };
  }
  return ctx;
}
