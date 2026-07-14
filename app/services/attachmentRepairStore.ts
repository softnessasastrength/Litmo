/**
 * Device-local Attachment Repair history. Never synced. Never a skill score.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  parseRepairHistory,
  type RepairHistoryEntry,
} from "../lib/attachmentRepairCore.ts";

export const ATTACHMENT_REPAIR_HISTORY_KEY =
  "litmo.attachment_repair.history.v1";

export const attachmentRepairStore = {
  async load(): Promise<RepairHistoryEntry[]> {
    try {
      const raw = await AsyncStorage.getItem(ATTACHMENT_REPAIR_HISTORY_KEY);
      if (!raw) return [];
      return parseRepairHistory(JSON.parse(raw));
    } catch {
      return [];
    }
  },

  async append(entry: RepairHistoryEntry): Promise<void> {
    try {
      const prev = await this.load();
      const next = [entry, ...prev].slice(0, 50);
      await AsyncStorage.setItem(
        ATTACHMENT_REPAIR_HISTORY_KEY,
        JSON.stringify(next),
      );
    } catch {
      // Session still usable in memory.
    }
    const { privateDebriefStore } = await import("./privateDebriefStore.ts");
    const { debriefFromRepair } = await import(
      "../lib/protocolDebriefBridge.ts"
    );
    void privateDebriefStore.ingest(debriefFromRepair(entry));
  },
};
