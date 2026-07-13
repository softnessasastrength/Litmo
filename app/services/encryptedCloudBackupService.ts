/**
 * Optional encrypted cloud backup of personal vault domains.
 * - Local vault always authoritative and works offline.
 * - Cloud stores opaque ciphertext only (owner RLS).
 * - Master key stays on device (Secure Store); recovery code for restore.
 * - Never backs up partner E2E keys or device secrets.
 */

import {
  BACKUP_ELIGIBLE_DOMAINS,
  defaultBackupPrefs,
  parseBackupPrefs,
  type BackupEligibleDomain,
  type EncryptedBackupPrefs,
} from "../lib/localFirstCore.ts";
import {
  createBackupMasterKey,
  exportRecoveryCode,
  importRecoveryCode,
  openPersonalBackup,
  parseBackupEnvelope,
  sealPersonalBackup,
  serializeBackupEnvelope,
  type PersonalBackupEnvelope,
} from "./encryptedBackupCore.ts";
import { mapExternalError } from "./errors.ts";
import { localVault } from "./localVault.ts";
import { safeLog } from "./logger.ts";
import { environmentError, supabase } from "./supabase.ts";
import { b64url, fromB64url } from "./localShareCore.ts";

const TIMEOUT_MS = 12_000;

export type BackupDomainResult = {
  ok: boolean;
  domain: BackupEligibleDomain;
  errorCode?: string;
  skipped?: "empty" | "disabled" | "no_auth" | "no_config";
};

export type RestoreDomainResult = {
  ok: boolean;
  domain: BackupEligibleDomain;
  errorCode?: string;
  restored: boolean;
};

async function withTimeout<T>(operation: PromiseLike<T>): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;
  try {
    return await Promise.race([
      Promise.resolve(operation),
      new Promise<never>((_, reject) => {
        timer = setTimeout(
          () => reject(new Error("request_timeout")),
          TIMEOUT_MS,
        );
      }),
    ]);
  } finally {
    clearTimeout(timer!);
  }
}

async function tryAuthenticatedUserId(): Promise<string | null> {
  if (environmentError) return null;
  try {
    const { data, error } = await withTimeout(supabase.auth.getSession());
    if (error) return null;
    return data.session?.user?.id ?? null;
  } catch {
    return null;
  }
}

async function loadPrefs(): Promise<EncryptedBackupPrefs> {
  const raw = await localVault.getJson<unknown>("backup_prefs");
  return parseBackupPrefs(raw) ?? defaultBackupPrefs();
}

async function savePrefs(
  prefs: EncryptedBackupPrefs,
): Promise<EncryptedBackupPrefs> {
  const next = { ...prefs, updatedAt: new Date().toISOString() };
  await localVault.setJson("backup_prefs", next);
  return next;
}

async function getOrCreateMasterKey(): Promise<Uint8Array> {
  const existing = await localVault.getBackupMasterKeyRaw();
  if (existing) {
    try {
      const key = fromB64url(existing);
      if (key.length === 32) return key;
    } catch {
      // recreate
    }
  }
  const key = createBackupMasterKey();
  await localVault.setBackupMasterKeyRaw(b64url(key));
  return key;
}

async function loadMasterKey(): Promise<Uint8Array | null> {
  const existing = await localVault.getBackupMasterKeyRaw();
  if (!existing) return null;
  try {
    const key = fromB64url(existing);
    return key.length === 32 ? key : null;
  } catch {
    return null;
  }
}

export const encryptedCloudBackupService = {
  async getPrefs(): Promise<EncryptedBackupPrefs> {
    return loadPrefs();
  },

  /**
   * Enable backup. Creates master key if needed.
   * Returns recovery code once — user must save it offline.
   */
  async enable(): Promise<{ prefs: EncryptedBackupPrefs; recoveryCode: string }> {
    const key = await getOrCreateMasterKey();
    const recoveryCode = exportRecoveryCode(key);
    const prefs = await savePrefs({
      ...(await loadPrefs()),
      enabled: true,
      lastErrorCode: null,
      recoveryCodeAcknowledged: false,
    });
    return { prefs, recoveryCode };
  },

  async acknowledgeRecoveryCode(): Promise<EncryptedBackupPrefs> {
    return savePrefs({
      ...(await loadPrefs()),
      recoveryCodeAcknowledged: true,
    });
  },

  async disable(options?: { wipeCloud?: boolean }): Promise<EncryptedBackupPrefs> {
    if (options?.wipeCloud) {
      try {
        await this.deleteAllCloudBackups();
      } catch (error) {
        safeLog("backup_cloud_wipe_failed", {
          errorCode: mapExternalError(error).code,
        });
      }
    }
    return savePrefs({
      ...(await loadPrefs()),
      enabled: false,
      lastErrorCode: null,
    });
  },

  /** Re-show recovery code (requires local master key). */
  async exportRecoveryCodeNow(): Promise<string | null> {
    const key = await loadMasterKey();
    if (!key) return null;
    return exportRecoveryCode(key);
  },

  /**
   * Install a recovery code (new device restore). Does not auto-download.
   */
  async installRecoveryCode(code: string): Promise<boolean> {
    const key = importRecoveryCode(code);
    if (!key) return false;
    await localVault.setBackupMasterKeyRaw(b64url(key));
    return true;
  },

  async backupDomain(domain: BackupEligibleDomain): Promise<BackupDomainResult> {
    const prefs = await loadPrefs();
    if (!prefs.enabled) {
      return { ok: true, domain, skipped: "disabled" };
    }
    if (environmentError) {
      return { ok: false, domain, skipped: "no_config", errorCode: "no_config" };
    }
    const userId = await tryAuthenticatedUserId();
    if (!userId) {
      return { ok: false, domain, skipped: "no_auth", errorCode: "no_auth" };
    }

    const plaintext = await localVault.getRaw(domain);
    if (plaintext == null) {
      return { ok: true, domain, skipped: "empty" };
    }

    try {
      const masterKey = await getOrCreateMasterKey();
      const envelope = sealPersonalBackup(domain, plaintext, masterKey);
      const { error } = await withTimeout(
        supabase.rpc("upsert_own_encrypted_backup", {
          p_domain: domain,
          p_ciphertext: serializeBackupEnvelope(envelope),
          p_key_hint: "recovery-code-v1",
        }),
      );
      if (error) throw error;

      const domainsOk = prefs.domainsOk.includes(domain)
        ? prefs.domainsOk
        : [...prefs.domainsOk, domain];
      await savePrefs({
        ...prefs,
        lastBackupAt: new Date().toISOString(),
        lastErrorCode: null,
        domainsOk,
      });
      return { ok: true, domain };
    } catch (error) {
      const code = mapExternalError(error).code;
      await savePrefs({
        ...prefs,
        lastErrorCode: code,
      });
      return { ok: false, domain, errorCode: code };
    }
  },

  async backupAll(): Promise<BackupDomainResult[]> {
    const results: BackupDomainResult[] = [];
    for (const domain of BACKUP_ELIGIBLE_DOMAINS) {
      results.push(await this.backupDomain(domain));
    }
    return results;
  },

  async restoreDomain(
    domain: BackupEligibleDomain,
  ): Promise<RestoreDomainResult> {
    if (environmentError) {
      return {
        ok: false,
        domain,
        restored: false,
        errorCode: "no_config",
      };
    }
    const userId = await tryAuthenticatedUserId();
    if (!userId) {
      return { ok: false, domain, restored: false, errorCode: "no_auth" };
    }
    const masterKey = await loadMasterKey();
    if (!masterKey) {
      return {
        ok: false,
        domain,
        restored: false,
        errorCode: "no_master_key",
      };
    }

    try {
      const { data, error } = await withTimeout(
        supabase
          .from("personal_encrypted_backups")
          .select("ciphertext")
          .eq("domain", domain)
          .maybeSingle(),
      );
      if (error) throw error;
      if (!data?.ciphertext) {
        return { ok: true, domain, restored: false };
      }
      const envelope = parseBackupEnvelope(JSON.parse(String(data.ciphertext)));
      if (!envelope || envelope.domain !== domain) {
        return {
          ok: false,
          domain,
          restored: false,
          errorCode: "envelope_invalid",
        };
      }
      const plain = openPersonalBackup(
        envelope as PersonalBackupEnvelope,
        masterKey,
      );
      if (plain == null) {
        return {
          ok: false,
          domain,
          restored: false,
          errorCode: "decrypt_failed",
        };
      }
      await localVault.setRaw(domain, plain);
      return { ok: true, domain, restored: true };
    } catch (error) {
      return {
        ok: false,
        domain,
        restored: false,
        errorCode: mapExternalError(error).code,
      };
    }
  },

  async restoreAll(): Promise<RestoreDomainResult[]> {
    const results: RestoreDomainResult[] = [];
    for (const domain of BACKUP_ELIGIBLE_DOMAINS) {
      results.push(await this.restoreDomain(domain));
    }
    return results;
  },

  async deleteAllCloudBackups(): Promise<void> {
    const userId = await tryAuthenticatedUserId();
    if (!userId || environmentError) return;
    const { error } = await withTimeout(
      supabase.from("personal_encrypted_backups").delete().eq("user_id", userId),
    );
    if (error) throw error;
  },

  /**
   * Offline-capable status for Settings. Never throws.
   */
  async status(): Promise<{
    enabled: boolean;
    offlineReady: true;
    hasMasterKey: boolean;
    lastBackupAt: string | null;
    lastErrorCode: string | null;
    domainsPresent: BackupEligibleDomain[];
    domainsBackedUp: BackupEligibleDomain[];
    recoveryCodeAcknowledged: boolean;
    authenticated: boolean;
  }> {
    const prefs = await loadPrefs();
    const hasMasterKey = (await loadMasterKey()) != null;
    const inv = await localVault.inventory();
    const domainsPresent = inv
      .filter(
        (i) =>
          i.present &&
          (BACKUP_ELIGIBLE_DOMAINS as readonly string[]).includes(i.domain),
      )
      .map((i) => i.domain as BackupEligibleDomain);
    const userId = await tryAuthenticatedUserId();
    return {
      enabled: prefs.enabled,
      offlineReady: true,
      hasMasterKey,
      lastBackupAt: prefs.lastBackupAt,
      lastErrorCode: prefs.lastErrorCode,
      domainsPresent,
      domainsBackedUp: prefs.domainsOk,
      recoveryCodeAcknowledged: prefs.recoveryCodeAcknowledged,
      authenticated: Boolean(userId),
    };
  },
};
