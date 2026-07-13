/**
 * Device-local persistence for Exorcism Dojo state (urge log, burn gates).
 * Never synced. Never a product analytics surface.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  defaultDojoState,
  parseDojoState,
  type DojoLocalState,
} from "../lib/dojoCore.ts";

const KEY = "litmo.dojo.state.v1";

export const dojoStore = {
  async load(): Promise<DojoLocalState> {
    try {
      const raw = await AsyncStorage.getItem(KEY);
      if (!raw) return defaultDojoState();
      return parseDojoState(JSON.parse(raw));
    } catch {
      return defaultDojoState();
    }
  },

  async save(state: DojoLocalState): Promise<void> {
    try {
      await AsyncStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      // In-memory still usable for the session via screen state.
    }
  },
};
