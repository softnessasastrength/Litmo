import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  parseDebriefLog,
  type UnifiedDebriefEntry,
} from "../lib/privateDebriefCore.ts";

export const PRIVATE_DEBRIEF_KEY = "litmo.private_debrief.log.v1";

export const privateDebriefStore = {
  async load(): Promise<UnifiedDebriefEntry[]> {
    try {
      const raw = await AsyncStorage.getItem(PRIVATE_DEBRIEF_KEY);
      if (!raw) return [];
      return parseDebriefLog(JSON.parse(raw));
    } catch {
      return [];
    }
  },
  async append(entry: UnifiedDebriefEntry): Promise<void> {
    try {
      const prev = await this.load();
      await AsyncStorage.setItem(
        PRIVATE_DEBRIEF_KEY,
        JSON.stringify([entry, ...prev].slice(0, 200)),
      );
    } catch {
      // ignore
    }
  },
};
