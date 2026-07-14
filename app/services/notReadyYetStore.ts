/**
 * Device-local I'm Not Ready Yet history.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  parseNotReadyHistory,
  type NotReadyHistoryEntry,
} from "../lib/notReadyYetCore.ts";

export const NOT_READY_YET_HISTORY_KEY = "litmo.not_ready_yet.history.v1";

export const notReadyYetStore = {
  async load(): Promise<NotReadyHistoryEntry[]> {
    try {
      const raw = await AsyncStorage.getItem(NOT_READY_YET_HISTORY_KEY);
      if (!raw) return [];
      return parseNotReadyHistory(JSON.parse(raw));
    } catch {
      return [];
    }
  },

  async append(entry: NotReadyHistoryEntry): Promise<void> {
    try {
      const prev = await this.load();
      const next = [entry, ...prev].slice(0, 50);
      await AsyncStorage.setItem(
        NOT_READY_YET_HISTORY_KEY,
        JSON.stringify(next),
      );
    } catch {
      // ignore
    }
    const { privateDebriefStore } = await import("./privateDebriefStore.ts");
    const { debriefFromNotReady } = await import(
      "../lib/protocolDebriefBridge.ts"
    );
    void privateDebriefStore.ingest(debriefFromNotReady(entry));
  },
};
