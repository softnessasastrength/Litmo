/**
 * AsyncStorage adapter for Neurodivergent Mode prefs (v3 + v2/v1 load).
 * SEE: neurodivergentPreferenceCore.ts
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  NEURO_PREF_KEY,
  NEURO_PREF_KEY_V1,
  NEURO_PREF_KEY_V2,
  parseNeurodivergentPrefs,
  patchNeurodivergentPrefs,
  setNeurodivergentEnabled,
  setPaceMode as setPaceModeCore,
  type NeurodivergentPrefs,
  type PaceMode,
} from "./neurodivergentPreferenceCore.ts";

export type {
  NeurodivergentPrefs,
  PaceMode,
  HapticIntensity,
  LanguagePreference,
  MotionPreference,
  OverloadExitMode,
  SensoryProfile,
} from "./neurodivergentPreferenceCore.ts";
export {
  defaultNeurodivergentPrefs,
  optimizedNeurodivergentPrefs,
  demoStrengthNeurodivergentPrefs,
  effectiveReducedStimulation,
  setNeurodivergentEnabled,
  setPaceMode,
  patchNeurodivergentPrefs,
  autoAdvanceDelayMs,
  cyclePaceMode,
  cycleSensoryProfile,
  cycleHapticIntensity,
  cycleLanguagePreference,
  cycleOverloadExitMode,
  cycleMotionPreference,
} from "./neurodivergentPreferenceCore.ts";

export const neurodivergentPreference = {
  async load(): Promise<NeurodivergentPrefs> {
    try {
      const raw =
        (await AsyncStorage.getItem(NEURO_PREF_KEY)) ??
        (await AsyncStorage.getItem(NEURO_PREF_KEY_V2)) ??
        (await AsyncStorage.getItem(NEURO_PREF_KEY_V1));
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

  async patch(
    patch: Partial<Omit<NeurodivergentPrefs, "version">>,
  ): Promise<NeurodivergentPrefs> {
    const current = await this.load();
    const next = patchNeurodivergentPrefs(current, patch);
    await this.save(next);
    return next;
  },
};
