import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  defaultSecondRitualProgress,
  parseSecondRitualProgress,
  type SecondRitualProgress,
} from "../lib/secondRitualCore.ts";

export const SECOND_RITUAL_KEY = "litmo.second_ritual.progress.v1";

export const secondRitualStore = {
  async load(): Promise<SecondRitualProgress> {
    try {
      const raw = await AsyncStorage.getItem(SECOND_RITUAL_KEY);
      if (!raw) return defaultSecondRitualProgress();
      return (
        parseSecondRitualProgress(JSON.parse(raw)) ?? defaultSecondRitualProgress()
      );
    } catch {
      return defaultSecondRitualProgress();
    }
  },

  async save(progress: SecondRitualProgress): Promise<void> {
    try {
      await AsyncStorage.setItem(SECOND_RITUAL_KEY, JSON.stringify(progress));
    } catch {
      // ignore — local-only, never blocks the ritual
    }
  },

  async clear(): Promise<void> {
    try {
      await AsyncStorage.removeItem(SECOND_RITUAL_KEY);
    } catch {
      // ignore
    }
  },
};
