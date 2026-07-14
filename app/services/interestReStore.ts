/**
 * Device-local Interest Reverse Engineering history.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  parseInterestHistory,
  type InterestHistoryEntry,
} from "../lib/interestReCore.ts";

export const INTEREST_RE_HISTORY_KEY = "litmo.interest_re.history.v1";

export const interestReStore = {
  async load(): Promise<InterestHistoryEntry[]> {
    try {
      const raw = await AsyncStorage.getItem(INTEREST_RE_HISTORY_KEY);
      if (!raw) return [];
      return parseInterestHistory(JSON.parse(raw));
    } catch {
      return [];
    }
  },

  async append(entry: InterestHistoryEntry): Promise<void> {
    try {
      const prev = await this.load();
      const next = [entry, ...prev].slice(0, 50);
      await AsyncStorage.setItem(
        INTEREST_RE_HISTORY_KEY,
        JSON.stringify(next),
      );
    } catch {
      // ignore
    }
    const { privateDebriefStore } = await import("./privateDebriefStore.ts");
    const { debriefFromInterest } = await import(
      "../lib/protocolDebriefBridge.ts"
    );
    void privateDebriefStore.ingest(debriefFromInterest(entry));
  },
};
