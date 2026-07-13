/**
 * Local-first persistence for pre-session Consent Snapshot artifacts.
 *
 * WHAT (module): Load/save/clear personal declaration and mutual snapshot via localVault,
 * with local-first coordinator hooks and private history appends.
 * WHY: Prepare and mutual screens must survive offline; server is never required for demo seal.
 * CONSENT: Saving a declaration is prepare-only; saving mutual does not mean touch started.
 * Soft Signal and withdraw remain product rules in core, not disabled by persistence success.
 * NEVER: Do not log private aftercare note bodies; do not treat vault write as dual remote affirm.
 * SEE: sessionConsentSnapshotCore · docs/CODE_COMMENT_STANDARD.md
 */

import {
  parseDeclaration,
  parseMutualSnapshot,
  type MutualConsentSnapshot,
  type PreSessionDeclaration,
} from "../lib/sessionConsentSnapshotCore.ts";
import { localVault } from "./localVault.ts";
import { localFirstCoordinator } from "./localFirstCoordinator.ts";
import { privateHistoryStore } from "./privateHistoryStore.ts";

/**
 * WHAT: Store API for consent_declaration and consent_mutual vault keys.
 * WHY: Screens call one service instead of reaching into vault shapes.
 * CONSENT: All writes re-parse fail-closed; invalid packages throw and are not stored.
 * EDGE CASES: Missing keys → null; clear removes only the named key.
 * NEVER: History summaries must stay non-sensitive (no note bodies, no safeword content).
 */
export const sessionConsentSnapshotStore = {
  /**
   * WHAT: Load and parse the local pre-session declaration, or null if absent/invalid.
   * WHY: Prepare screen hydrates prior work; mutual screen requires a valid self side.
   * CONSENT: Loaded declaration alone is not mutual seal.
   * EDGE CASES: Raw present but parseDeclaration null → null (fail-closed drop of corrupt data).
   * NEVER: Do not auto-create a declaration on load.
   */
  async loadDeclaration(): Promise<PreSessionDeclaration | null> {
    const raw = await localVault.getJson<unknown>("consent_declaration");
    // Fail-closed: missing or unparseable → treat as no declaration.
    if (!raw) return null;
    return parseDeclaration(raw);
  },

  /**
   * WHAT: Validate, stamp protective flags, persist declaration, notify local-first + history.
   * WHY: Only packages that pass parseDeclaration may sit in the vault for later seal.
   * CONSENT: Forces notConsentAlone, forThisMomentOnly, version 1 on every save (prepare ≠ seal).
   * EDGE CASES: parse fails → throw declaration_invalid (UI must show error, not silent skip).
   * NEVER: Do not write unparsed input; privateNote in history is always null here.
   */
  async saveDeclaration(
    decl: PreSessionDeclaration,
  ): Promise<PreSessionDeclaration> {
    const parsed = parseDeclaration({
      ...decl,
      updatedAt: new Date().toISOString(),
      // Re-force constitutional flags on every persist path.
      notConsentAlone: true,
      forThisMomentOnly: true,
      version: 1,
    });
    // Fail-closed: invalid declaration never reaches vault.
    if (!parsed) throw new Error("declaration_invalid");
    await localVault.setJson("consent_declaration", parsed);
    void localFirstCoordinator.afterLocalWrite("consent_declaration");
    void privateHistoryStore.append({
      id: `decl-${parsed.id}-${parsed.updatedAt}`,
      kind: "snapshot_prepared",
      occurredAt: parsed.updatedAt,
      // Non-sensitive summary only — no safewords, notes, or boundary detail.
      summary: "Consent declaration prepared (local)",
      privateNote: null,
      sessionId: null,
    });
    return parsed;
  },

  /**
   * WHAT: Load and parse mutual snapshot from vault, or null.
   * WHY: Mutual screen can resume an unsealed/sealed package across focus.
   * CONSENT: Loaded seal state must still pass isSealed rules in core (withdraw wins).
   * EDGE CASES: Corrupt raw → null via parseMutualSnapshot.
   * NEVER: Do not invent a practice partner on load (UI does that when needed).
   */
  async loadMutual(): Promise<MutualConsentSnapshot | null> {
    const raw = await localVault.getJson<unknown>("consent_mutual");
    if (!raw) return null;
    return parseMutualSnapshot(raw);
  },

  /**
   * WHAT: Validate and persist mutual snapshot; append non-sensitive private history.
   * WHY: Seal and withdraw both persist through this path so offline state is coherent.
   * CONSENT: Persistence of sealedAt is not touch start; Soft Signal still always available.
   * EDGE CASES:
   *   - parse fails → throw mutual_snapshot_invalid
   *   - history occurredAt uses sealedAt when present else createdAt
   * NEVER: Summary must not claim remote dual-device proof; local seal only.
   */
  async saveMutual(
    snap: MutualConsentSnapshot,
  ): Promise<MutualConsentSnapshot> {
    const parsed = parseMutualSnapshot(snap);
    // Fail-closed: invalid mutual never reaches vault.
    if (!parsed) throw new Error("mutual_snapshot_invalid");
    await localVault.setJson("consent_mutual", parsed);
    void localFirstCoordinator.afterLocalWrite("consent_mutual");
    void privateHistoryStore.append({
      id: `mutual-${parsed.id}`,
      kind: "snapshot_mutual",
      occurredAt: parsed.sealedAt ?? parsed.createdAt,
      // Honest local wording — not “remote partner verified”.
      summary: "Mutual Consent Snapshot sealed (local)",
      privateNote: null,
      sessionId: null,
    });
    return parsed;
  },

  /**
   * WHAT: Remove mutual snapshot key from vault.
   * WHY: Explicit clear for logout/reset paths without deleting the personal declaration.
   * CONSENT: Clearing mutual unseals persistence; does not require peer.
   * EDGE CASES: Missing key is fine (vault remove is idempotent at service level).
   * NEVER: Do not silently clear declaration here.
   */
  async clearMutual(): Promise<void> {
    await localVault.remove("consent_mutual");
  },

  /**
   * WHAT: Remove personal declaration key from vault.
   * WHY: Reset prepare path or account wipe local step.
   * CONSENT: Prepare artifact only; does not end an active session by itself.
   * EDGE CASES: Missing key ok.
   * NEVER: Do not require reason text; do not log prior declaration body.
   */
  async clearDeclaration(): Promise<void> {
    await localVault.remove("consent_declaration");
  },
};
