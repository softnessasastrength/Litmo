import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  NEURO_PREF_KEY,
  parseNeurodivergentPrefs,
  setNeurodivergentEnabled,
  type NeurodivergentPrefs,
} from "./neurodivergentPreferenceCore.ts";

export type { NeurodivergentPrefs };
export {
  defaultNeurodivergentPrefs,
  optimizedNeurodivergentPrefs,
  effectiveReducedStimulation,
  setNeurodivergentEnabled,
} from "./neurodivergentPreferenceCore.ts";

export const neurodivergentPreference = {
  async load(): Promise<NeurodivergentPrefs> {
    try {
      return parseNeurodivergentPrefs(await AsyncStorage.getItem(NEURO_PREF_KEY));
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
};
