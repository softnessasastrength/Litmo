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

type NeuroState = {
  prefs: NeurodivergentPrefs;
  ready: boolean;
  /** Combined ND reducedStimulation + system Reduce Motion. */
  reducedStimulation: boolean;
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

  const value = useMemo<NeuroState>(
    () => ({
      prefs,
      ready,
      reducedStimulation: effectiveReducedStimulation(
        prefs,
        systemReduceMotion,
      ),
      setEnabled,
    }),
    [prefs, ready, setEnabled, systemReduceMotion],
  );

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
      reducedStimulation: false,
      setEnabled: async () => {},
    };
  }
  return ctx;
}
