import {
  parseDeclaration,
  parseMutualSnapshot,
  type MutualConsentSnapshot,
  type PreSessionDeclaration,
} from "../lib/sessionConsentSnapshotCore.ts";
import { localVault } from "./localVault.ts";
import { localFirstCoordinator } from "./localFirstCoordinator.ts";
import { privateHistoryStore } from "./privateHistoryStore.ts";

/** Pre-session Consent Snapshot — local vault first, offline complete. */
export const sessionConsentSnapshotStore = {
  async loadDeclaration(): Promise<PreSessionDeclaration | null> {
    const raw = await localVault.getJson<unknown>("consent_declaration");
    if (!raw) return null;
    return parseDeclaration(raw);
  },

  async saveDeclaration(
    decl: PreSessionDeclaration,
  ): Promise<PreSessionDeclaration> {
    const parsed = parseDeclaration({
      ...decl,
      updatedAt: new Date().toISOString(),
      notConsentAlone: true,
      forThisMomentOnly: true,
      version: 1,
    });
    if (!parsed) throw new Error("declaration_invalid");
    await localVault.setJson("consent_declaration", parsed);
    void localFirstCoordinator.afterLocalWrite("consent_declaration");
    void privateHistoryStore.append({
      id: `decl-${parsed.id}-${parsed.updatedAt}`,
      kind: "snapshot_prepared",
      occurredAt: parsed.updatedAt,
      summary: "Consent declaration prepared (local)",
      privateNote: null,
      sessionId: null,
    });
    return parsed;
  },

  async loadMutual(): Promise<MutualConsentSnapshot | null> {
    const raw = await localVault.getJson<unknown>("consent_mutual");
    if (!raw) return null;
    return parseMutualSnapshot(raw);
  },

  async saveMutual(
    snap: MutualConsentSnapshot,
  ): Promise<MutualConsentSnapshot> {
    const parsed = parseMutualSnapshot(snap);
    if (!parsed) throw new Error("mutual_snapshot_invalid");
    await localVault.setJson("consent_mutual", parsed);
    void localFirstCoordinator.afterLocalWrite("consent_mutual");
    void privateHistoryStore.append({
      id: `mutual-${parsed.id}`,
      kind: "snapshot_mutual",
      occurredAt: parsed.sealedAt ?? parsed.createdAt,
      summary: "Mutual Consent Snapshot sealed (local)",
      privateNote: null,
      sessionId: null,
    });
    return parsed;
  },

  async clearMutual(): Promise<void> {
    await localVault.remove("consent_mutual");
  },

  async clearDeclaration(): Promise<void> {
    await localVault.remove("consent_declaration");
  },
};
