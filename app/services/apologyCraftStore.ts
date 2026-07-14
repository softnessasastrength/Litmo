import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  parseApologyHistory,
  type ApologyEntry,
} from "../lib/apologyCraftCore.ts";

export const APOLOGY_CRAFT_KEY = "litmo.apology_craft.history.v1";

export const apologyCraftStore = {
  async load(): Promise<ApologyEntry[]> {
    try {
      const raw = await AsyncStorage.getItem(APOLOGY_CRAFT_KEY);
      if (!raw) return [];
      return parseApologyHistory(JSON.parse(raw));
    } catch {
      return [];
    }
  },
  async append(entry: ApologyEntry): Promise<void> {
    try {
      const prev = await this.load();
      await AsyncStorage.setItem(
        APOLOGY_CRAFT_KEY,
        JSON.stringify([entry, ...prev].slice(0, 50)),
      );
    } catch {
      // ignore
    }
    const { privateDebriefStore } = await import("./privateDebriefStore.ts");
    const { debriefFromApology } = await import(
      "../lib/protocolDebriefBridge.ts"
    );
    void privateDebriefStore.ingest(debriefFromApology(entry));
  },
};
