/**
 * Device-local Spooning Protocol history. Never synced. Never a skill score.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  parseSpoonHistory,
  type SpoonHistoryEntry,
} from "../lib/spooningCore.ts";

export const SPOONING_HISTORY_KEY = "litmo.spooning.history.v1";

export const spooningStore = {
  async load(): Promise<SpoonHistoryEntry[]> {
    try {
      const raw = await AsyncStorage.getItem(SPOONING_HISTORY_KEY);
      if (!raw) return [];
      return parseSpoonHistory(JSON.parse(raw));
    } catch {
      return [];
    }
  },

  async append(entry: SpoonHistoryEntry): Promise<void> {
    try {
      const prev = await this.load();
      const next = [entry, ...prev].slice(0, 50);
      await AsyncStorage.setItem(SPOONING_HISTORY_KEY, JSON.stringify(next));
    } catch {
      // Session still usable in memory.
    }
    const { privateDebriefStore } = await import("./privateDebriefStore.ts");
    const { debriefFromSpoon } = await import(
      "../lib/protocolDebriefBridge.ts"
    );
    void privateDebriefStore.ingest(debriefFromSpoon(entry));
  },

  async hasHistory(): Promise<boolean> {
    try {
      const raw = await AsyncStorage.getItem(SPOONING_HISTORY_KEY);
      return raw != null && raw.length > 2;
    } catch {
      return false;
    }
  },
};
