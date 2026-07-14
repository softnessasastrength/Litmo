/**
 * Device-local Too Much / Abandonment history. Never synced. Never a score.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  parseTooMuchHistory,
  type TooMuchHistoryEntry,
} from "../lib/tooMuchCore.ts";

export const TOO_MUCH_HISTORY_KEY = "litmo.too_much.history.v1";

export const tooMuchStore = {
  async load(): Promise<TooMuchHistoryEntry[]> {
    try {
      const raw = await AsyncStorage.getItem(TOO_MUCH_HISTORY_KEY);
      if (!raw) return [];
      return parseTooMuchHistory(JSON.parse(raw));
    } catch {
      return [];
    }
  },

  async append(entry: TooMuchHistoryEntry): Promise<void> {
    try {
      const prev = await this.load();
      const next = [entry, ...prev].slice(0, 100);
      await AsyncStorage.setItem(TOO_MUCH_HISTORY_KEY, JSON.stringify(next));
    } catch {
      // ignore
    }
    const { privateDebriefStore } = await import("./privateDebriefStore.ts");
    const { debriefFromTooMuch } = await import(
      "../lib/protocolDebriefBridge.ts"
    );
    void privateDebriefStore.ingest(debriefFromTooMuch(entry));
  },
};
