/**
 * Local-first write coordinator.
 * Always treats local vault as authority. Optional encrypted backup is
 * best-effort and never blocks local success.
 */

import type { BackupEligibleDomain, SyncState } from "../lib/localFirstCore.ts";
import { isBackupEligible } from "../lib/localFirstCore.ts";
import { safeLog } from "./logger.ts";
import { encryptedCloudBackupService } from "./encryptedCloudBackupService.ts";

export type AfterWriteResult = {
  syncState: SyncState;
  backupAttempted: boolean;
};

/**
 * Call after any successful personal-data local write.
 * Fire-and-forget safe: callers may void this.
 */
async function afterLocalWrite(
  domain: string,
): Promise<AfterWriteResult> {
  if (!isBackupEligible(domain)) {
    return { syncState: "local_only", backupAttempted: false };
  }
  try {
    const prefs = await encryptedCloudBackupService.getPrefs();
    if (!prefs.enabled) {
      return { syncState: "local_only", backupAttempted: false };
    }
    const result = await encryptedCloudBackupService.backupDomain(
      domain as BackupEligibleDomain,
    );
    if (result.ok) {
      return { syncState: "backup_ok", backupAttempted: true };
    }
    safeLog("local_first_backup_failed", {
      domain,
      errorCode: result.errorCode ?? "unknown",
    });
    return { syncState: "backup_failed", backupAttempted: true };
  } catch {
    return { syncState: "backup_failed", backupAttempted: true };
  }
}

export const localFirstCoordinator = {
  afterLocalWrite,
};
