/**
 * Device-local Conflict Navigation Simulator history.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  parseConflictHistory,
  type ConflictHistoryEntry,
} from "../lib/conflictSimCore.ts";

export const CONFLICT_SIM_HISTORY_KEY = "litmo.conflict_sim.history.v1";

export const conflictSimStore = {
  async load(): Promise<ConflictHistoryEntry[]> {
    try {
      const raw = await AsyncStorage.getItem(CONFLICT_SIM_HISTORY_KEY);
      if (!raw) return [];
      return parseConflictHistory(JSON.parse(raw));
    } catch {
      return [];
    }
  },

  async append(entry: ConflictHistoryEntry): Promise<void> {
    try {
      const prev = await this.load();
      const next = [entry, ...prev].slice(0, 50);
      await AsyncStorage.setItem(
        CONFLICT_SIM_HISTORY_KEY,
        JSON.stringify(next),
      );
    } catch {
      // in-memory still ok
    }
    const { privateDebriefStore } = await import("./privateDebriefStore.ts");
    const { debriefFromConflict } = await import(
      "../lib/protocolDebriefBridge.ts"
    );
    void privateDebriefStore.ingest(debriefFromConflict(entry));
  },
};
