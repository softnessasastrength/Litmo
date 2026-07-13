/**
 * Local-first product principles — pure types and helpers.
 * Personal data is authoritative on-device. Network is optional.
 *
 * Product philosophy:
 * - Touch Language, consent history, Soft Signal logs, quiz results live in local vault first
 * - Backup is opt-in encrypted restore aid — never partner E2E key material
 * - Private history is never a public score and never consent authority
 * - privateNote fields must not be logged or auto-shared
 *
 * SEE: docs/LITMO_CONSTITUTION.md (III privacy default, IV agency) ·
 *      docs/CODE_COMMENT_STANDARD.md
 */

/**
 * WHAT: Domains that live in the personal local vault first.
 * WHY: Enumerate which product surfaces must remain usable offline / without network authority.
 * CONSENT: consent_* domains store prepare/history state — Soft Signal still free offline.
 * NEVER: Promote network as source of truth over local for these domains without explicit restore UX.
 */
export type LocalVaultDomain =
  | "touch_language"
  | "consent_declaration"
  | "consent_mutual"
  | "soft_signal_log"
  | "private_history"
  | "learning_progress"
  | "quiz_results"
  | "backup_prefs";

/**
 * WHAT: Ordered list of all local vault domains.
 * WHY: Iteration / UI inventory without hardcoding strings elsewhere.
 * CONSENT: Listing domains is not a consent surface.
 * NEVER: Auto-upload all domains because they appear in this list.
 */
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

/**
 * WHAT: Domains eligible for optional encrypted cloud backup (never partner E2E keys).
 * WHY: backup_prefs itself is meta-config and is intentionally excluded from backup payload.
 * CONSENT: Eligibility ≠ enabled; user must opt in via EncryptedBackupPrefs.enabled.
 * NEVER: Include partner session keys or Soft Signal peer-permission gates in backup.
 */
export const BACKUP_ELIGIBLE_DOMAINS = [
  "touch_language",
  "consent_declaration",
  "consent_mutual",
  "soft_signal_log",
  "private_history",
  "learning_progress",
  "quiz_results",
] as const satisfies readonly LocalVaultDomain[];

/**
 * WHAT: Domain type subset that may appear in encrypted backup.
 * WHY: Type-level guard against backing up ineligible domains (e.g. backup_prefs circularly).
 */
export type BackupEligibleDomain = (typeof BACKUP_ELIGIBLE_DOMAINS)[number];

/**
 * WHAT: Where the current in-memory/value authority came from.
 * WHY: UI can label demo/restore paths without pretending remote is always truth.
 * CONSENT: remote_restore never auto-grants session consent.
 * NEVER: merged_remote must not silently overwrite a stricter local boundary without UX.
 */
export type LocalAuthority = "local" | "merged_remote" | "remote_restore";

/**
 * WHAT: Sync/backup state machine labels for local-first UX.
 * WHY: Users need honest offline / failed backup language without payload leaks.
 * CONSENT: offlineCapable writes remain valid Soft Signal / TL sources without backup_ok.
 * NEVER: backup_failed must not block Soft Signal or local TL edits.
 */
export type SyncState =
  | "local_only"
  | "backup_pending"
  | "backup_ok"
  | "backup_failed"
  | "restore_ok"
  | "restore_failed"
  | "offline";

/**
 * WHAT: Result wrapper asserting a write is locally authoritative and offline-capable.
 * WHY: Callers must not wait on network for consent-critical local persistence.
 * CONSENT: Soft Signal / TL saves use this shape so stop and preferences work offline.
 * NEVER: Require backup_ok before treating Soft Signal local commit as authoritative.
 */
export type LocalFirstWriteResult<T> = {
  value: T;
  authority: "local";
  syncState: SyncState;
  offlineCapable: true;
};

/**
 * WHAT: User opt-in preferences for encrypted cloud backup.
 * WHY: Privacy default off; track last success/error without storing payload.
 * CONSENT: enabled false means no auto-share of intimate vault domains.
 * NEVER: lastErrorCode must never embed private note or recovery-code plaintext.
 */
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

/**
 * WHAT: Factory for default backup prefs (disabled, no domains ok).
 * WHY: Constitution III — sharing/backup requires explicit action; default off.
 * CONSENT: Not a consent surface for touch; privacy-default for vault data.
 * EDGE CASES: none — pure factory.
 * NEVER: Default enabled true.
 */
export const defaultBackupPrefs = (): EncryptedBackupPrefs => ({
  version: 1,
  enabled: false,
  lastBackupAt: null,
  lastErrorCode: null,
  domainsOk: [],
  recoveryCodeAcknowledged: false,
  updatedAt: new Date(0).toISOString(),
});

/**
 * WHAT: Parses untrusted storage into EncryptedBackupPrefs or null.
 * WHY: Fail-closed version/enabled shape; filter domainsOk to eligible set only.
 * CONSENT: enabled must be boolean — missing enabled rejects parse (no implicit opt-in).
 * EDGE CASES:
 *   - non-object / wrong version / non-boolean enabled → null
 *   - unknown domainsOk entries filtered out
 *   - lastBackupAt/lastErrorCode accept string or null only
 * NEVER: Coerce missing enabled to true; never store payload in lastErrorCode.
 * SEE: defaultBackupPrefs · isBackupEligible
 */
export function parseBackupPrefs(raw: unknown): EncryptedBackupPrefs | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const o = raw as Record<string, unknown>;
  if (o.version !== 1) return null;
  // Explicit boolean required — missing/enabled:"yes" must not opt the user in.
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

/**
 * WHAT: Type guard for backup-eligible domain strings.
 * WHY: Call sites must not invent backup of ineligible domains.
 * CONSENT: Eligibility is not user opt-in; still need EncryptedBackupPrefs.enabled.
 * EDGE CASES: unknown string → false
 * NEVER: true means "must backup now."
 */
export function isBackupEligible(
  domain: string,
): domain is BackupEligibleDomain {
  return (BACKUP_ELIGIBLE_DOMAINS as readonly string[]).includes(domain);
}

/**
 * Private trust / session history entry — device-local first.
 * Never a public score; never consent authority.
 *
 * WHAT: One private history row (session/Soft Signal/snapshot/wrap-up/practice/note).
 * WHY: Local trust memory for the user without public ranking.
 * CONSENT: notScore / notConsent always true on append/parse.
 * NEVER: Treat entries as safety certificate or substitute for Consent Snapshot.
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

/**
 * WHAT: Versioned bag of private history entries.
 * WHY: Local vault document for private trust history screen.
 * CONSENT: Document never grants touch; Soft Signal entries are stops, not penalties.
 * NEVER: Publish as feed or ranking.
 */
export type PrivateHistoryDocument = {
  version: 1;
  entries: PrivateHistoryEntry[];
  updatedAt: string;
};

/**
 * WHAT: Max retained private history entries (count).
 * WHY: Bound on-device storage; older entries drop when appending past cap.
 * CONSENT: Cap is storage hygiene — not a shame limit on Soft Signal use.
 * NEVER: Refuse Soft Signal because history is full (drop oldest instead).
 */
export const PRIVATE_HISTORY_MAX = 300;

/**
 * WHAT: Creates an empty private history document.
 * WHY: First-run vault seed.
 * CONSENT: Empty history is not "unsafe user"; not a consent surface.
 * EDGE CASES: none — pure factory.
 * NEVER: Seed with fake positive trust scores.
 */
export function createEmptyPrivateHistory(): PrivateHistoryDocument {
  return {
    version: 1,
    entries: [],
    updatedAt: new Date().toISOString(),
  };
}

/**
 * WHAT: Parses untrusted storage into PrivateHistoryDocument or null.
 * WHY: Fail-closed; unknown kinds skipped; invariants re-stamped; cap applied.
 * CONSENT: notScore/notConsent forced true on every accepted entry.
 * EDGE CASES:
 *   - wrong version / non-array entries → null
 *   - missing id/occurredAt/summary → skip row
 *   - unknown kind → skip (do not invent session_complete)
 *   - summary max 200; privateNote max 500; list sliced to PRIVATE_HISTORY_MAX
 * NEVER: Log privateNote bodies; never promote history into public safety score.
 * SEE: appendPrivateHistoryEntry · PRIVATE_HISTORY_MAX
 */
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
    // Fail closed on unknown kinds — no free-form "verified_safe" history rows.
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
      // Re-stamp: storage cannot claim score or consent authority.
      notScore: true,
      notConsent: true,
    });
  }
  return {
    version: 1,
    // Cap at parse time so bloated blobs cannot overwhelm list UI.
    entries: entries.slice(0, PRIVATE_HISTORY_MAX),
    updatedAt:
      typeof o.updatedAt === "string" ? o.updatedAt : new Date().toISOString(),
  };
}

/**
 * WHAT: Prepends a private history entry, dedupes by id, enforces cap and invariants.
 * WHY: Session wrap-up / Soft Signal logging needs pure local append.
 * CONSENT: Forces notScore and notConsent true; Soft Signal kind is not a penalty score.
 * EDGE CASES:
 *   - same id replaces prior position (filter then prepend)
 *   - summary/privateNote length caps
 *   - list truncated to PRIVATE_HISTORY_MAX (newest first)
 * NEVER: Block append on network; never omit notScore/notConsent for "richer" scoring.
 * SEE: PrivateHistoryEntry · PRIVATE_HISTORY_MAX
 */
export function appendPrivateHistoryEntry(
  doc: PrivateHistoryDocument,
  entry: Omit<PrivateHistoryEntry, "notScore" | "notConsent">,
): PrivateHistoryDocument {
  const next: PrivateHistoryEntry = {
    ...entry,
    summary: entry.summary.slice(0, 200),
    privateNote: entry.privateNote?.slice(0, 500) ?? null,
    // Forced invariants: private history is never ranking or consent authority.
    notScore: true,
    notConsent: true,
  };
  // Newest first; drop older overflow; id collision replaces rather than doubles.
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
