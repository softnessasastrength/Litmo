import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  NEURO_PREF_KEY,
  parseNeurodivergentPrefs,
  setNeurodivergentEnabled,
  setPaceMode as setPaceModeCore,
  type NeurodivergentPrefs,
  type PaceMode,
} from "./neurodivergentPreferenceCore.ts";

export type { NeurodivergentPrefs, PaceMode } from "./neurodivergentPreferenceCore.ts";
export {
  defaultNeurodivergentPrefs,
  optimizedNeurodivergentPrefs,
  effectiveReducedStimulation,
  setNeurodivergentEnabled,
  setPaceMode,
  autoAdvanceDelayMs,
} from "./neurodivergentPreferenceCore.ts";

export const neurodivergentPreference = {
  async load(): Promise<NeurodivergentPrefs> {
    try {
      // Prefer v2 key; fall back to v1 so existing toggles still load.
      const raw =
        (await AsyncStorage.getItem(NEURO_PREF_KEY)) ??
        (await AsyncStorage.getItem("litmo.neurodivergent.prefs.v1"));
      return parseNeurodivergentPrefs(raw);
    } catch {
      return parseNeurodivergentPrefs(null);
    }
  },

  async save(prefs: NeurodivergentPrefs): Promise<void> {
    try {
      await AsyncStorage.setItem(NEURO_PREF_KEY, JSON.stringify(prefs));
    } catch {
      // In-memory preference still works for the session via context.
    }
  },

  async setEnabled(enabled: boolean): Promise<NeurodivergentPrefs> {
    const current = await this.load();
    const next = setNeurodivergentEnabled(current, enabled);
    await this.save(next);
    return next;
  },

  async setPaceMode(paceMode: PaceMode): Promise<NeurodivergentPrefs> {
    const current = await this.load();
    const next = setPaceModeCore(current, paceMode);
    await this.save(next);
    return next;
  },
};
