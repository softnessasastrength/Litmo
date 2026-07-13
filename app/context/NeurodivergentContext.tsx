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
  defaultNeurodivergentPrefs,
  effectiveReducedStimulation,
  neurodivergentPreference,
  type NeurodivergentPrefs,
} from "../services/neurodivergentPreference";
import { neuroTextScale } from "../lib/neuroStyleScale";

type NeuroState = {
  prefs: NeurodivergentPrefs;
  ready: boolean;
  /** Master Neurodivergent Mode switch. */
  enabled: boolean;
  /** Combined ND reducedStimulation + system Reduce Motion. */
  reducedStimulation: boolean;
  /** Larger text/tap scaling factor applied in useThemedStyles. */
  textScale: number;
  /** One question/step at a time (always true when ND on). */
  oneAtATime: boolean;
  /** Voice / dictation aids + read-aloud. */
  voiceAids: boolean;
  /** Easy device-local saves (quiz + learning progress). */
  easySaves: boolean;
  setEnabled: (enabled: boolean) => Promise<void>;
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
    // Quiet by default when ND mode turns on; user can re-enable haptics in Settings.
    if (enabled) {
      await hapticService.setEnabled(false);
    }
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
      easySaves: true, // quiz/learning always save; ND makes it explicit
      setEnabled,
    };
  }, [prefs, ready, setEnabled, systemReduceMotion]);

  return (
    <NeurodivergentContext.Provider value={value}>
      {children}
    </NeurodivergentContext.Provider>
  );
}

export function useNeurodivergent(): NeuroState {
  const ctx = useContext(NeurodivergentContext);
  if (!ctx) {
    // Fail soft outside provider (tests / storybook)
    return {
      prefs: defaultNeurodivergentPrefs,
      ready: true,
      enabled: false,
      reducedStimulation: false,
      textScale: 1,
      oneAtATime: false,
      voiceAids: false,
      easySaves: true,
      setEnabled: async () => {},
    };
  }
  return ctx;
}
