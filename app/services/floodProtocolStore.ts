import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  parseFloodHistory,
  type FloodEntry,
} from "../lib/floodProtocolCore.ts";

export const FLOOD_PROTOCOL_KEY = "litmo.flood_protocol.history.v1";

export const floodProtocolStore = {
  async load(): Promise<FloodEntry[]> {
    try {
      const raw = await AsyncStorage.getItem(FLOOD_PROTOCOL_KEY);
      if (!raw) return [];
      return parseFloodHistory(JSON.parse(raw));
    } catch {
      return [];
    }
  },
  async append(entry: FloodEntry): Promise<void> {
    try {
      const prev = await this.load();
      await AsyncStorage.setItem(
        FLOOD_PROTOCOL_KEY,
        JSON.stringify([entry, ...prev].slice(0, 80)),
      );
    } catch {
      // ignore
    }
    const { privateDebriefStore } = await import("./privateDebriefStore.ts");
    const { debriefFromFlood } = await import(
      "../lib/protocolDebriefBridge.ts"
    );
    void privateDebriefStore.ingest(debriefFromFlood(entry));
  },
};
