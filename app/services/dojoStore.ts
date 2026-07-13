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

/** Device-local AsyncStorage key — must stay in wipe EXTRA_ASYNC_KEYS. */
export const DOJO_STATE_STORAGE_KEY = "litmo.dojo.state.v1";

export const dojoStore = {
  async load(): Promise<DojoLocalState> {
    try {
      const raw = await AsyncStorage.getItem(DOJO_STATE_STORAGE_KEY);
      if (!raw) return defaultDojoState();
      return parseDojoState(JSON.parse(raw));
    } catch {
      return defaultDojoState();
    }
  },

  async save(state: DojoLocalState): Promise<void> {
    try {
      await AsyncStorage.setItem(
        DOJO_STATE_STORAGE_KEY,
        JSON.stringify(state),
      );
    } catch {
      // In-memory still usable for the session via screen state.
    }
  },

  /** Presence only — does not parse urge text into inventory callers. */
  async hasStoredState(): Promise<boolean> {
    try {
      const raw = await AsyncStorage.getItem(DOJO_STATE_STORAGE_KEY);
      return raw != null && raw.length > 0;
    } catch {
      return false;
    }
  },
};
