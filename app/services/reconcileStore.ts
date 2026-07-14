import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  parseReconcileHistory,
  type ReconcileEntry,
} from "../lib/reconcileCore.ts";

export const RECONCILE_KEY = "litmo.reconcile.history.v1";

export const reconcileStore = {
  async load(): Promise<ReconcileEntry[]> {
    try {
      const raw = await AsyncStorage.getItem(RECONCILE_KEY);
      if (!raw) return [];
      return parseReconcileHistory(JSON.parse(raw));
    } catch {
      return [];
    }
  },
  async append(entry: ReconcileEntry): Promise<void> {
    try {
      const prev = await this.load();
      await AsyncStorage.setItem(
        RECONCILE_KEY,
        JSON.stringify([entry, ...prev].slice(0, 50)),
      );
    } catch {
      // ignore
    }
  },
};
