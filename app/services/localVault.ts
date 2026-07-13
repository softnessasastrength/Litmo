/**
 * Unified local vault — Secure Store preferred, AsyncStorage fallback.
 * Authoritative personal data for offline-first operation.
 *
 * WHAT: Read/write/remove JSON and raw strings per LocalVaultDomain; inventory; wipe.
 * WHY: One key registry so wipe/backup/inventory cannot miss domains or dual-write wrongly.
 * CONSENT: Vault stores declarations and Soft Signal logs locally — does not seal mutual consent alone.
 * EDGE CASES: Secure Store unavailable → AsyncStorage; sensitive prefer secure then clear async.
 * NEVER: Log vault payloads; treat presence as peer consent or safety score.
 * SEE: localFirstCore LocalVaultDomain · localDataWipe · encrypted backup
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import type { LocalVaultDomain } from "../lib/localFirstCore.ts";

/**
 * WHAT: Dual storage keys for one domain (secure + async) with sensitivity flag.
 * WHY: Migration and Secure Store fallback need both keys registered forever.
 * CONSENT: Not a consent surface — key metadata only.
 * EDGE CASES: sensitive true prefers Secure Store write/read.
 * NEVER: Reuse keys across domains; put secrets under non-sensitive domains casually.
 */
export type VaultKeyPair = {
  secure: string;
  async: string;
  /** Prefer Secure Store (sensitive personal data). */
  sensitive: boolean;
};

/**
 * Canonical key registry. Wipe / inventory / backup must use these.
 * Includes legacy keys so existing installs migrate without data loss.
 *
 * WHAT: Map every LocalVaultDomain to its durable key pair.
 * WHY: Single inventory for wipe/export; prevents orphan keys.
 * CONSENT: Domains include consent_declaration/mutual and soft_signal_log — local authority only.
 * EDGE CASES: learning_progress/backup_prefs mark sensitive false.
 * NEVER: Add a domain without wipe coverage; invent ad-hoc storage keys outside registry.
 */
export const VAULT_KEYS: Record<LocalVaultDomain, VaultKeyPair> = {
  touch_language: {
    secure: "litmo.touch_language.doc.secure.v1",
    async: "litmo.touch_language.doc.v1",
    sensitive: true,
  },
  consent_declaration: {
    secure: "litmo.consent_snapshot.declaration.secure.v1",
    async: "litmo.consent_snapshot.declaration.v1",
    sensitive: true,
  },
  consent_mutual: {
    secure: "litmo.consent_snapshot.mutual.secure.v1",
    async: "litmo.consent_snapshot.mutual.v1",
    sensitive: true,
  },
  soft_signal_log: {
    secure: "litmo.soft_signal.log.secure.v1",
    async: "litmo.soft_signal.log.v1",
    sensitive: true,
  },
  private_history: {
    secure: "litmo.private_history.doc.secure.v1",
    async: "litmo.private_history.doc.v1",
    sensitive: true,
  },
  learning_progress: {
    secure: "litmo.learning.progress.secure.v1",
    async: "litmo.learning.progress.v1",
    sensitive: false,
  },
  quiz_results: {
    secure: "litmo.quizzes.results.secure.v1",
    async: "litmo.quizzes.results.v1",
    sensitive: true,
  },
  backup_prefs: {
    secure: "litmo.backup.prefs.secure.v1",
    async: "litmo.backup.prefs.v1",
    sensitive: false,
  },
};

/**
 * WHAT: Extra secure keys managed by vault (master key, not JSON domains).
 * WHY: Backup master material must not live in domain JSON wipe gaps.
 * CONSENT: Not a consent surface.
 * EDGE CASES: clearBackupMasterKey is separate from wipeAllDomains.
 * NEVER: Persist master key in AsyncStorage.
 */
export const VAULT_SECRET_KEYS = {
  backupMaster: "litmo.backup.master.secure.v1",
} as const;

/**
 * WHAT: Read secure-first then async fallback for a key pair.
 * WHY: Sensitive data prefers Secure Store; web/tests may only have AsyncStorage.
 * CONSENT: Read-only retrieval — not mutual consent seal.
 * EDGE CASES: Secure Store throw → fall through to async; both empty → null.
 * NEVER: Log returned raw strings (may contain private notes).
 */
async function readPair(pair: VaultKeyPair): Promise<string | null> {
  if (pair.sensitive || pair.secure) {
    try {
      const secure = await SecureStore.getItemAsync(pair.secure);
      if (secure != null) return secure;
    } catch {
      // Secure Store unavailable (web/tests) — fall through.
    }
  }
  return AsyncStorage.getItem(pair.async);
}

/**
 * WHAT: Write value to Secure Store when sensitive and available; else AsyncStorage.
 * WHY: Avoid dual-dwell of sensitive plaintext when secure write succeeds.
 * CONSENT: Local persistence only; mutual consent still needs dual seal flows.
 * EDGE CASES:
 *   - secure success → remove async copy
 *   - secure fail → async write + best-effort delete stale secure
 * NEVER: Leave sensitive data in both stores after successful secure write.
 */
async function writePair(pair: VaultKeyPair, value: string): Promise<void> {
  if (pair.sensitive) {
    let secured = false;
    try {
      await SecureStore.setItemAsync(pair.secure, value);
      secured = true;
    } catch {
      secured = false;
    }
    if (secured) {
      // Single store of truth after secure success — drop plaintext async copy.
      await AsyncStorage.removeItem(pair.async);
      return;
    }
  }
  await AsyncStorage.setItem(pair.async, value);
  // Best-effort clear stale secure copy if we fell back.
  if (pair.sensitive) {
    try {
      await SecureStore.deleteItemAsync(pair.secure);
    } catch {
      // ignore
    }
  }
}

/**
 * WHAT: Delete both secure and async keys for a pair.
 * WHY: Wipe/remove must clear both backends so data cannot resurrect from fallback.
 * CONSENT: Local delete only — not server account deletion.
 * EDGE CASES: Secure delete throw ignored; async remove still attempted.
 * NEVER: Claim complete account erasure from vault remove alone.
 */
async function removePair(pair: VaultKeyPair): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(pair.secure);
  } catch {
    // ignore
  }
  await AsyncStorage.removeItem(pair.async);
}

/**
 * WHAT: Inventory row for one domain (presence, backend, approximate bytes).
 * WHY: Local data settings UI and wipe previews without reading full payloads into UI state.
 * CONSENT: Metadata only — never dump private note bodies into inventory.
 * EDGE CASES: absent when both stores empty; bytesApprox is string length not exact disk.
 * NEVER: Use inventory presence as proof of dual consent or peer trust.
 */
export type VaultPresence = {
  domain: LocalVaultDomain;
  present: boolean;
  storage: "secure" | "async" | "absent";
  bytesApprox: number;
};

export const localVault = {
  keys: VAULT_KEYS,

  /**
   * WHAT: Read raw string for a domain or null if missing.
   * WHY: Callers that own parse/validate stay above vault I/O.
   * CONSENT: Not a consent seal.
   * EDGE CASES: missing → null.
   * NEVER: Log raw value.
   */
  async getRaw(domain: LocalVaultDomain): Promise<string | null> {
    return readPair(VAULT_KEYS[domain]);
  },

  /**
   * WHAT: Write raw string for a domain via writePair policy.
   * WHY: Binary/string stores (if any) share the same sensitivity routing.
   * CONSENT: Local write only.
   * EDGE CASES: sensitive routing as writePair.
   * NEVER: Write without caller-owned schema validation for product JSON.
   */
  async setRaw(domain: LocalVaultDomain, value: string): Promise<void> {
    await writePair(VAULT_KEYS[domain], value);
  },

  /**
   * WHAT: Parse domain JSON as T, or null if missing/invalid JSON.
   * WHY: Soft fail on corrupt local data rather than crash private screens.
   * CONSENT: Invalid parse returns null — fail closed for “has declaration”.
   * EDGE CASES: parse throw → null (caller treats as absent).
   * NEVER: Return partial guessed objects on corrupt JSON.
   */
  async getJson<T = unknown>(domain: LocalVaultDomain): Promise<T | null> {
    const raw = await this.getRaw(domain);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      // Corrupt local JSON is treated as absent (fail closed for presence).
      return null;
    }
  },

  /**
   * WHAT: JSON.stringify and setRaw for a domain.
   * WHY: Canonical serialize path for documents.
   * CONSENT: Local only.
   * EDGE CASES: non-JSON-serializable values throw from stringify (caller handles).
   * NEVER: Stringify secrets into learning_progress casually.
   */
  async setJson(domain: LocalVaultDomain, value: unknown): Promise<void> {
    await this.setRaw(domain, JSON.stringify(value));
  },

  /**
   * WHAT: Remove one domain from both stores.
   * WHY: Selective clear (e.g. soft signal log) without full wipe.
   * CONSENT: Local only.
   * EDGE CASES: removePair best-effort secure.
   * NEVER: Skip async when secure delete fails.
   */
  async remove(domain: LocalVaultDomain): Promise<void> {
    await removePair(VAULT_KEYS[domain]);
  },

  /**
   * WHAT: True if domain has any stored raw value.
   * WHY: Gates UI “you have a declaration” without loading full doc when not needed.
   * CONSENT: Presence is not mutual seal or peer consent.
   * EDGE CASES: corrupt JSON still present at raw level until getJson fails.
   * NEVER: Infer adult age or account auth from vault presence.
   */
  async has(domain: LocalVaultDomain): Promise<boolean> {
    return (await this.getRaw(domain)) != null;
  },

  /**
   * WHAT: Build presence rows for every registered domain.
   * WHY: Settings inventory and wipe confirmation.
   * CONSENT: Metadata only — bytesApprox must not include note text in UI beyond size.
   * EDGE CASES: Secure Store errors skip to async check.
   * NEVER: Attach raw payload bodies to inventory results.
   */
  async inventory(): Promise<VaultPresence[]> {
    const out: VaultPresence[] = [];
    for (const domain of Object.keys(VAULT_KEYS) as LocalVaultDomain[]) {
      const pair = VAULT_KEYS[domain];
      let storage: VaultPresence["storage"] = "absent";
      let bytesApprox = 0;
      try {
        const secure = await SecureStore.getItemAsync(pair.secure);
        if (secure != null) {
          storage = "secure";
          bytesApprox = secure.length;
        }
      } catch {
        // ignore
      }
      if (storage === "absent") {
        const asyncVal = await AsyncStorage.getItem(pair.async);
        if (asyncVal != null) {
          storage = "async";
          bytesApprox = asyncVal.length;
        }
      }
      out.push({
        domain,
        present: storage !== "absent",
        storage,
        bytesApprox,
      });
    }
    return out;
  },

  /**
   * WHAT: Wipe all registered vault domains (not backup master — call clearMaster separately).
   * WHY: Local data clear / leave-device flows must enumerate VAULT_KEYS exhaustively.
   * CONSENT: Does not withdraw remote session consent; Soft Signal remote may still need reconcile.
   * EDGE CASES: Per-domain errors collected; others still cleared.
   * NEVER: Skip soft_signal_log or consent domains on wipe; claim server account deleted.
   * SEE: clearBackupMasterKey · localDataWipe
   */
  async wipeAllDomains(): Promise<{ cleared: LocalVaultDomain[]; errors: string[] }> {
    const cleared: LocalVaultDomain[] = [];
    const errors: string[] = [];
    for (const domain of Object.keys(VAULT_KEYS) as LocalVaultDomain[]) {
      try {
        await this.remove(domain);
        cleared.push(domain);
      } catch {
        errors.push(domain);
      }
    }
    return { cleared, errors };
  },

  /**
   * WHAT: Read backup master key material from Secure Store only.
   * WHY: Encrypted backup needs master key outside domain JSON.
   * CONSENT: Not a consent surface.
   * EDGE CASES: throw/missing → null.
   * NEVER: Fall back to AsyncStorage for master key.
   */
  async getBackupMasterKeyRaw(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(VAULT_SECRET_KEYS.backupMaster);
    } catch {
      return null;
    }
  },

  /**
   * WHAT: Store backup master key in Secure Store.
   * WHY: Durable local key for user-controlled encrypted backups.
   * CONSENT: Not a consent surface.
   * EDGE CASES: Secure Store required — throws if unavailable.
   * NEVER: Mirror master key into AsyncStorage or logs.
   */
  async setBackupMasterKeyRaw(value: string): Promise<void> {
    await SecureStore.setItemAsync(VAULT_SECRET_KEYS.backupMaster, value);
  },

  /**
   * WHAT: Best-effort delete backup master key from Secure Store.
   * WHY: Wipe/export-reset paths must clear crypto material separately from domains.
   * CONSENT: Not a consent surface.
   * EDGE CASES: delete throw ignored (idempotent clear).
   * NEVER: Leave master key when user requested full local wipe of crypto.
   */
  async clearBackupMasterKey(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(VAULT_SECRET_KEYS.backupMaster);
    } catch {
      // ignore
    }
  },
};
