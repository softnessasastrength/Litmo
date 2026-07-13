/**
 * Local-first product principles — pure types and helpers.
 * Personal data is authoritative on-device. Network is optional.
 */

/** Domains that live in the personal local vault first. */
export type LocalVaultDomain =
  | "touch_language"
  | "consent_declaration"
  | "consent_mutual"
  | "soft_signal_log"
  | "private_history"
  | "learning_progress"
  | "quiz_results"
  | "backup_prefs";

export const LOCAL_VAULT_DOMAINS: readonly LocalVaultDomain[] = [
  "touch_language",
  "consent_declaration",
  "consent_mutual",
  "soft_signal_log",
  "private_history",
  "learning_progress",
  "quiz_results",
  "backup_prefs",
] as const;

/** Domains eligible for optional encrypted cloud backup (never partner E2E keys). */
export const BACKUP_ELIGIBLE_DOMAINS = [
  "touch_language",
  "consent_declaration",
  "consent_mutual",
  "soft_signal_log",
  "private_history",
  "learning_progress",
  "quiz_results",
] as const satisfies readonly LocalVaultDomain[];

export type BackupEligibleDomain = (typeof BACKUP_ELIGIBLE_DOMAINS)[number];

export type LocalAuthority = "local" | "merged_remote" | "remote_restore";

export type SyncState =
  | "local_only"
  | "backup_pending"
  | "backup_ok"
  | "backup_failed"
  | "restore_ok"
  | "restore_failed"
  | "offline";

export type LocalFirstWriteResult<T> = {
  value: T;
  authority: "local";
  syncState: SyncState;
  offlineCapable: true;
};

export type EncryptedBackupPrefs = {
  version: 1;
  /** User must explicitly opt in. Default false. */
  enabled: boolean;
  /** Last successful backup ISO time, if any. */
  lastBackupAt: string | null;
  /** Last error code (never payload). */
  lastErrorCode: string | null;
  /** Domains successfully backed up at least once. */
  domainsOk: BackupEligibleDomain[];
  /** Remind that recovery code must be saved offline. */
  recoveryCodeAcknowledged: boolean;
  updatedAt: string;
};

export const defaultBackupPrefs = (): EncryptedBackupPrefs => ({
  version: 1,
  enabled: false,
  lastBackupAt: null,
  lastErrorCode: null,
  domainsOk: [],
  recoveryCodeAcknowledged: false,
  updatedAt: new Date(0).toISOString(),
});

export function parseBackupPrefs(raw: unknown): EncryptedBackupPrefs | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const o = raw as Record<string, unknown>;
  if (o.version !== 1) return null;
  if (typeof o.enabled !== "boolean") return null;
  const domainsOk = Array.isArray(o.domainsOk)
    ? o.domainsOk.filter((d): d is BackupEligibleDomain =>
        (BACKUP_ELIGIBLE_DOMAINS as readonly string[]).includes(String(d)),
      )
    : [];
  return {
    version: 1,
    enabled: o.enabled,
    lastBackupAt:
      typeof o.lastBackupAt === "string" || o.lastBackupAt === null
        ? (o.lastBackupAt as string | null)
        : null,
    lastErrorCode:
      typeof o.lastErrorCode === "string" || o.lastErrorCode === null
        ? (o.lastErrorCode as string | null)
        : null,
    domainsOk,
    recoveryCodeAcknowledged: Boolean(o.recoveryCodeAcknowledged),
    updatedAt:
      typeof o.updatedAt === "string"
        ? o.updatedAt
        : new Date(0).toISOString(),
  };
}

export function isBackupEligible(
  domain: string,
): domain is BackupEligibleDomain {
  return (BACKUP_ELIGIBLE_DOMAINS as readonly string[]).includes(domain);
}

/**
 * Private trust / session history entry — device-local first.
 * Never a public score; never consent authority.
 */
export type PrivateHistoryEntry = {
  id: string;
  kind:
    | "session_complete"
    | "soft_signal"
    | "snapshot_prepared"
    | "snapshot_mutual"
    | "wrap_up"
    | "practice"
    | "note";
  occurredAt: string;
  /** Short non-sensitive label for list UI. */
  summary: string;
  privateNote: string | null;
  sessionId: string | null;
  /** Product invariant: never treated as score or safety proof. */
  notScore: true;
  notConsent: true;
};

export type PrivateHistoryDocument = {
  version: 1;
  entries: PrivateHistoryEntry[];
  updatedAt: string;
};

export const PRIVATE_HISTORY_MAX = 300;

export function createEmptyPrivateHistory(): PrivateHistoryDocument {
  return {
    version: 1,
    entries: [],
    updatedAt: new Date().toISOString(),
  };
}

export function parsePrivateHistory(raw: unknown): PrivateHistoryDocument | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const o = raw as Record<string, unknown>;
  if (o.version !== 1) return null;
  if (!Array.isArray(o.entries)) return null;
  const entries: PrivateHistoryEntry[] = [];
  for (const item of o.entries) {
    if (!item || typeof item !== "object") continue;
    const e = item as Record<string, unknown>;
    if (typeof e.id !== "string" || typeof e.occurredAt !== "string") continue;
    if (typeof e.summary !== "string") continue;
    const kind = e.kind;
    if (
      kind !== "session_complete" &&
      kind !== "soft_signal" &&
      kind !== "snapshot_prepared" &&
      kind !== "snapshot_mutual" &&
      kind !== "wrap_up" &&
      kind !== "practice" &&
      kind !== "note"
    ) {
      continue;
    }
    entries.push({
      id: e.id,
      kind,
      occurredAt: e.occurredAt,
      summary: e.summary.slice(0, 200),
      privateNote:
        typeof e.privateNote === "string"
          ? e.privateNote.slice(0, 500)
          : null,
      sessionId: typeof e.sessionId === "string" ? e.sessionId : null,
      notScore: true,
      notConsent: true,
    });
  }
  return {
    version: 1,
    entries: entries.slice(0, PRIVATE_HISTORY_MAX),
    updatedAt:
      typeof o.updatedAt === "string" ? o.updatedAt : new Date().toISOString(),
  };
}

export function appendPrivateHistoryEntry(
  doc: PrivateHistoryDocument,
  entry: Omit<PrivateHistoryEntry, "notScore" | "notConsent">,
): PrivateHistoryDocument {
  const next: PrivateHistoryEntry = {
    ...entry,
    summary: entry.summary.slice(0, 200),
    privateNote: entry.privateNote?.slice(0, 500) ?? null,
    notScore: true,
    notConsent: true,
  };
  const entries = [next, ...doc.entries.filter((e) => e.id !== next.id)].slice(
    0,
    PRIVATE_HISTORY_MAX,
  );
  return {
    version: 1,
    entries,
    updatedAt: new Date().toISOString(),
  };
}
