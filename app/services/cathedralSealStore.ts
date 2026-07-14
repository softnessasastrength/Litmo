import * as SecureStore from "expo-secure-store";
import {
  createSeal,
  parseSeal,
  type CathedralSeal,
} from "../lib/cathedralSealCore.ts";

export const CATHEDRAL_SEAL_KEY = "litmo.cathedral_seal.v1";

export const cathedralSealStore = {
  async load(): Promise<CathedralSeal | null> {
    try {
      const raw = await SecureStore.getItemAsync(CATHEDRAL_SEAL_KEY);
      if (!raw) return null;
      return parseSeal(JSON.parse(raw));
    } catch {
      return null;
    }
  },

  async isSealed(): Promise<boolean> {
    return (await this.load()) !== null;
  },

  /** Idempotent: creates the seal only if one doesn't already exist. */
  async ensureSealed(): Promise<CathedralSeal> {
    const existing = await this.load();
    if (existing) return existing;
    const seal = createSeal();
    try {
      await SecureStore.setItemAsync(CATHEDRAL_SEAL_KEY, JSON.stringify(seal));
    } catch {
      // Best-effort — if SecureStore is unavailable, the ritual will simply
      // treat the device as already unsealed rather than failing loudly.
    }
    return seal;
  },

  /** The ritual's first deliberate act. Idempotent — removing twice is fine. */
  async removeSeal(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(CATHEDRAL_SEAL_KEY);
    } catch {
      // ignore — absence is the goal either way
    }
  },
};
