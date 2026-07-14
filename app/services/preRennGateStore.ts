import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  parsePreRennHistory,
  type PreRennEntry,
} from "../lib/preRennGateCore.ts";

export const PRE_RENN_GATE_KEY = "litmo.pre_renn_gate.history.v1";

export const preRennGateStore = {
  async load(): Promise<PreRennEntry[]> {
    try {
      const raw = await AsyncStorage.getItem(PRE_RENN_GATE_KEY);
      if (!raw) return [];
      return parsePreRennHistory(JSON.parse(raw));
    } catch {
      return [];
    }
  },
  async append(entry: PreRennEntry): Promise<void> {
    try {
      const prev = await this.load();
      await AsyncStorage.setItem(
        PRE_RENN_GATE_KEY,
        JSON.stringify([entry, ...prev].slice(0, 80)),
      );
    } catch {
      // ignore
    }
    const { privateDebriefStore } = await import("./privateDebriefStore.ts");
    const { debriefFromPreRenn } = await import(
      "../lib/protocolDebriefBridge.ts"
    );
    void privateDebriefStore.ingest(debriefFromPreRenn(entry));
  },
};
