import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  defaultFirstRitualProgress,
  parseFirstRitualProgress,
  type FirstRitualProgress,
} from "../lib/firstRitualCore.ts";

export const FIRST_RITUAL_KEY = "litmo.first_ritual.progress.v1";

export const firstRitualStore = {
  async load(): Promise<FirstRitualProgress> {
    try {
      const raw = await AsyncStorage.getItem(FIRST_RITUAL_KEY);
      if (!raw) return defaultFirstRitualProgress();
      return parseFirstRitualProgress(JSON.parse(raw)) ?? defaultFirstRitualProgress();
    } catch {
      return defaultFirstRitualProgress();
    }
  },

  async save(progress: FirstRitualProgress): Promise<void> {
    try {
      await AsyncStorage.setItem(FIRST_RITUAL_KEY, JSON.stringify(progress));
    } catch {
      // ignore — local-only, never blocks the ritual
    }
  },

  async clear(): Promise<void> {
    try {
      await AsyncStorage.removeItem(FIRST_RITUAL_KEY);
    } catch {
      // ignore
    }
  },
};
