/**
 * Device-local dual-bind ritual history. Never synced. Never a score.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  parseNeedScaredHistory,
  type NeedScaredHistoryEntry,
} from "../lib/needScaredCore.ts";

export const NEED_SCARED_HISTORY_KEY = "litmo.need_scared.history.v1";

export const needScaredStore = {
  async load(): Promise<NeedScaredHistoryEntry[]> {
    try {
      const raw = await AsyncStorage.getItem(NEED_SCARED_HISTORY_KEY);
      if (!raw) return [];
      return parseNeedScaredHistory(JSON.parse(raw));
    } catch {
      return [];
    }
  },

  async append(entry: NeedScaredHistoryEntry): Promise<void> {
    try {
      const prev = await this.load();
      const next = [entry, ...prev].slice(0, 80);
      await AsyncStorage.setItem(NEED_SCARED_HISTORY_KEY, JSON.stringify(next));
    } catch {
      // ignore
    }
    const { privateDebriefStore } = await import("./privateDebriefStore.ts");
    const { debriefFromNeedScared } = await import(
      "../lib/protocolDebriefBridge.ts"
    );
    void privateDebriefStore.ingest(debriefFromNeedScared(entry));
  },
};
