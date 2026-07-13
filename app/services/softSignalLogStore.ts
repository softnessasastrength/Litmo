import {
  parseLog,
  parseLogEntry,
  type SoftSignalLogEntry,
} from "../lib/softSignalCore.ts";
import { localVault } from "./localVault.ts";
import { localFirstCoordinator } from "./localFirstCoordinator.ts";
import { privateHistoryStore } from "./privateHistoryStore.ts";

const MAX_ENTRIES = 200;

/** Private personal Soft Signal history — local vault, never a score. */
export const softSignalLogStore = {
  async load(): Promise<SoftSignalLogEntry[]> {
    const raw = await localVault.getJson<unknown>("soft_signal_log");
    if (!raw) return [];
    try {
      return parseLog(raw);
    } catch {
      return [];
    }
  },

  async append(entry: SoftSignalLogEntry): Promise<SoftSignalLogEntry[]> {
    const parsed = parseLogEntry(entry);
    if (!parsed) return this.load();
    const current = await this.load();
    const next = [parsed, ...current.filter((e) => e.id !== parsed.id)].slice(
      0,
      MAX_ENTRIES,
    );
    await localVault.setJson("soft_signal_log", next);
    void localFirstCoordinator.afterLocalWrite("soft_signal_log");
    void privateHistoryStore.append({
      id: `ss-${parsed.id}`,
      kind: parsed.source === "practice" ? "practice" : "soft_signal",
      occurredAt: parsed.firedAt,
      summary:
        parsed.source === "practice"
          ? "Soft Signal practice (local)"
          : "Soft Signal — session ended (local)",
      privateNote: null,
      sessionId: parsed.sessionId ?? null,
    });
    return next;
  },

  async updateNote(
    id: string,
    privateJournalNote: string | null,
  ): Promise<SoftSignalLogEntry[]> {
    const current = await this.load();
    const next = current.map((e) =>
      e.id === id
        ? {
            ...e,
            privateJournalNote: privateJournalNote?.trim().slice(0, 500) || null,
          }
        : e,
    );
    await localVault.setJson("soft_signal_log", next);
    void localFirstCoordinator.afterLocalWrite("soft_signal_log");
    return next;
  },

  async clear(): Promise<void> {
    await localVault.remove("soft_signal_log");
  },
};
