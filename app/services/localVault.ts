/**
 * Unified local vault — Secure Store preferred, AsyncStorage fallback.
 * Authoritative personal data for offline-first operation.
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import type { LocalVaultDomain } from "../lib/localFirstCore.ts";

export type VaultKeyPair = {
  secure: string;
  async: string;
  /** Prefer Secure Store (sensitive personal data). */
  sensitive: boolean;
};

/**
 * Canonical key registry. Wipe / inventory / backup must use these.
 * Includes legacy keys so existing installs migrate without data loss.
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

/** Extra secure keys managed by vault (master key, not JSON domains). */
export const VAULT_SECRET_KEYS = {
  backupMaster: "litmo.backup.master.secure.v1",
} as const;

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

async function removePair(pair: VaultKeyPair): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(pair.secure);
  } catch {
    // ignore
  }
  await AsyncStorage.removeItem(pair.async);
}

export type VaultPresence = {
  domain: LocalVaultDomain;
  present: boolean;
  storage: "secure" | "async" | "absent";
  bytesApprox: number;
};

export const localVault = {
  keys: VAULT_KEYS,

  async getRaw(domain: LocalVaultDomain): Promise<string | null> {
    return readPair(VAULT_KEYS[domain]);
  },

  async setRaw(domain: LocalVaultDomain, value: string): Promise<void> {
    await writePair(VAULT_KEYS[domain], value);
  },

  async getJson<T = unknown>(domain: LocalVaultDomain): Promise<T | null> {
    const raw = await this.getRaw(domain);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  },

  async setJson(domain: LocalVaultDomain, value: unknown): Promise<void> {
    await this.setRaw(domain, JSON.stringify(value));
  },

  async remove(domain: LocalVaultDomain): Promise<void> {
    await removePair(VAULT_KEYS[domain]);
  },

  async has(domain: LocalVaultDomain): Promise<boolean> {
    return (await this.getRaw(domain)) != null;
  },

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

  /** Wipe all registered vault domains (not backup master — call clearMaster separately). */
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

  async getBackupMasterKeyRaw(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(VAULT_SECRET_KEYS.backupMaster);
    } catch {
      return null;
    }
  },

  async setBackupMasterKeyRaw(value: string): Promise<void> {
    await SecureStore.setItemAsync(VAULT_SECRET_KEYS.backupMaster, value);
  },

  async clearBackupMasterKey(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(VAULT_SECRET_KEYS.backupMaster);
    } catch {
      // ignore
    }
  },
};
