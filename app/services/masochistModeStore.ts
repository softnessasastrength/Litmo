import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  defaultMasochistPrefs,
  parseMasochistPrefs,
  type MasochistPrefs,
} from "../lib/masochistModeCore.ts";

export const MASOCHIST_MODE_KEY = "litmo.masochist_mode.v1";

export const masochistModeStore = {
  async load(): Promise<MasochistPrefs> {
    try {
      const raw = await AsyncStorage.getItem(MASOCHIST_MODE_KEY);
      if (!raw) return defaultMasochistPrefs();
      return parseMasochistPrefs(JSON.parse(raw));
    } catch {
      return defaultMasochistPrefs();
    }
  },
  async save(prefs: MasochistPrefs): Promise<void> {
    try {
      await AsyncStorage.setItem(
        MASOCHIST_MODE_KEY,
        JSON.stringify({
          ...prefs,
          updatedAt: new Date().toISOString(),
        }),
      );
    } catch {
      // ignore
    }
  },
};
