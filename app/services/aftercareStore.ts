import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  parseAftercareHistory,
  type AftercareEntry,
} from "../lib/aftercareCore.ts";

export const AFTERCARE_HISTORY_KEY = "litmo.aftercare.history.v1";

export const aftercareStore = {
  async load(): Promise<AftercareEntry[]> {
    try {
      const raw = await AsyncStorage.getItem(AFTERCARE_HISTORY_KEY);
      if (!raw) return [];
      return parseAftercareHistory(JSON.parse(raw));
    } catch {
      return [];
    }
  },
  async append(entry: AftercareEntry): Promise<void> {
    try {
      const prev = await this.load();
      await AsyncStorage.setItem(
        AFTERCARE_HISTORY_KEY,
        JSON.stringify([entry, ...prev].slice(0, 80)),
      );
    } catch {
      // ignore
    }
    const { privateDebriefStore } = await import("./privateDebriefStore.ts");
    const { debriefFromAftercare } = await import(
      "../lib/protocolDebriefBridge.ts"
    );
    void privateDebriefStore.ingest(debriefFromAftercare(entry));
  },
};
