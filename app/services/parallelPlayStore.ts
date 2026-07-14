import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  parseParallelHistory,
  type ParallelEntry,
} from "../lib/parallelPlayCore.ts";

export const PARALLEL_PLAY_KEY = "litmo.parallel_play.history.v1";

export const parallelPlayStore = {
  async load(): Promise<ParallelEntry[]> {
    try {
      const raw = await AsyncStorage.getItem(PARALLEL_PLAY_KEY);
      if (!raw) return [];
      return parseParallelHistory(JSON.parse(raw));
    } catch {
      return [];
    }
  },
  async append(entry: ParallelEntry): Promise<void> {
    try {
      const prev = await this.load();
      await AsyncStorage.setItem(
        PARALLEL_PLAY_KEY,
        JSON.stringify([entry, ...prev].slice(0, 50)),
      );
    } catch {
      // ignore
    }
  },
};
