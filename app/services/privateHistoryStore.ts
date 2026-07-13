/**
 * Private trust / session history — device-local first.
 * Never a public score; never consent authority.
 */

import {
  appendPrivateHistoryEntry,
  createEmptyPrivateHistory,
  parsePrivateHistory,
  type PrivateHistoryDocument,
  type PrivateHistoryEntry,
} from "../lib/localFirstCore.ts";
import { localVault } from "./localVault.ts";
import { localFirstCoordinator } from "./localFirstCoordinator.ts";

export type { PrivateHistoryDocument, PrivateHistoryEntry };

export const privateHistoryStore = {
  async load(): Promise<PrivateHistoryDocument> {
    const raw = await localVault.getJson<unknown>("private_history");
    return parsePrivateHistory(raw) ?? createEmptyPrivateHistory();
  },

  async save(doc: PrivateHistoryDocument): Promise<PrivateHistoryDocument> {
    const parsed = parsePrivateHistory(doc) ?? createEmptyPrivateHistory();
    const next = {
      ...parsed,
      updatedAt: new Date().toISOString(),
      entries: parsed.entries.map((e) => ({
        ...e,
        notScore: true as const,
        notConsent: true as const,
      })),
    };
    await localVault.setJson("private_history", next);
    void localFirstCoordinator.afterLocalWrite("private_history");
    return next;
  },

  async append(
    entry: Omit<PrivateHistoryEntry, "notScore" | "notConsent">,
  ): Promise<PrivateHistoryDocument> {
    const current = await this.load();
    const next = appendPrivateHistoryEntry(current, entry);
    return this.save(next);
  },

  async clear(): Promise<void> {
    await localVault.remove("private_history");
  },
};
