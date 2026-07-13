/**
 * Device-local Morning Cuddle history. Never synced. Never a skill score.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  parseMorningHistory,
  type MorningHistoryEntry,
} from "../lib/morningCuddleCore.ts";

export const MORNING_CUDDLE_HISTORY_KEY = "litmo.morning_cuddle.history.v1";

export const morningCuddleStore = {
  async load(): Promise<MorningHistoryEntry[]> {
    try {
      const raw = await AsyncStorage.getItem(MORNING_CUDDLE_HISTORY_KEY);
      if (!raw) return [];
      return parseMorningHistory(JSON.parse(raw));
    } catch {
      return [];
    }
  },

  async append(entry: MorningHistoryEntry): Promise<void> {
    try {
      const prev = await this.load();
      const next = [entry, ...prev].slice(0, 50);
      await AsyncStorage.setItem(
        MORNING_CUDDLE_HISTORY_KEY,
        JSON.stringify(next),
      );
    } catch {
      // Session still usable in memory.
    }
  },
};
