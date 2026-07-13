/**
 * Private personal Soft Signal history — local vault only, never a score.
 *
 * Stores SoftSignalLogEntry[] under vault key soft_signal_log. Append also
 * mirrors a non-sensitive summary into privateHistoryStore (no journal body).
 * Fail-closed parse on load; invalid append entry is ignored.
 *
 * SEE:
 * - app/lib/softSignalCore.ts (parseLog, createLogEntry, SoftSignalLogEntry)
 * - docs/CODE_COMMENT_STANDARD.md
 * - SOFT_SIGNAL_COPY.logPrivacy (product framing)
 */

import {
  parseLog,
  parseLogEntry,
  type SoftSignalLogEntry,
} from "../lib/softSignalCore.ts";
import { localVault } from "./localVault.ts";
import { localFirstCoordinator } from "./localFirstCoordinator.ts";
import { privateHistoryStore } from "./privateHistoryStore.ts";

/**
 * WHAT: Max Soft Signal log entries retained on device.
 * WHY: Cap vault growth; oldest drop via slice after newest-first prepend.
 *      200 is generous for private alpha personal history without unbounded growth.
 * CONSENT: Cap is storage hygiene, not a penalty for stopping often.
 * EDGE CASES: 201st append drops oldest; never drops for “too many stops” messaging.
 * NEVER: Use cap as a rate limit that blocks Soft Signal fire (fire path ignores full log).
 */
const MAX_ENTRIES = 200;

/**
 * WHAT: Vault-backed Soft Signal personal log API (load/append/updateNote/clear).
 * WHY: Isolate private stop history from session engines and peer-facing stores.
 * CONSENT: Not a consent surface — records past unilateral stops; notes optional post-hoc.
 * EDGE CASES: parse failures → []; invalid append → load() without write.
 * NEVER: Publish entries as public safety scores or partner-shared “why they stopped.”
 *        Log privateJournalNote contents to analytics or console.
 * SEE: softSignalService.loadPersonalLog / addJournalNote
 */
export const softSignalLogStore = {
  /**
   * WHAT: Load and parse Soft Signal log from local vault.
   * WHY: Screens need newest-first private history offline.
   * CONSENT: Not a consent surface; empty is safe default.
   * EDGE CASES:
   *   - missing key → []
   *   - parseLog throw → [] (fail closed)
   *   - corrupt array items → dropped by parseLog
   * NEVER: Fetch peer devices’ Soft Signal logs. Infer untrustworthiness from count.
   * SEE: parseLog; localVault.getJson
   */
  async load(): Promise<SoftSignalLogEntry[]> {
    const raw = await localVault.getJson<unknown>("soft_signal_log");
    // Missing vault key: no history yet — not an error and not a score of “never stopped.”
    if (!raw) return [];
    try {
      return parseLog(raw);
    } catch {
      // Fail closed: unreadable vault payload becomes empty private history.
      return [];
    }
  },

  /**
   * WHAT: Append (or replace-by-id) a Soft Signal entry; cap at MAX_ENTRIES.
   * WHY: Persist stop after fire without blocking freedom if this throws (core catches).
   * CONSENT: Append is post-stop recordkeeping — never requires reason; note null at fire.
   * EDGE CASES:
   *   - parseLogEntry fails → return current load, no write (reject bad rows)
   *   - same id → replace existing (idempotent re-append)
   *   - practice source → privateHistory kind "practice" with practice summary
   *   - non-practice → kind "soft_signal"; privateNote always null in mirror
   * NEVER: Put privateJournalNote into privateHistoryStore mirror (privacy).
   *        Block Soft Signal because log is full (caller fire path does not await as gate).
   * SEE: localFirstCoordinator.afterLocalWrite; privateHistoryStore.append
   */
  async append(entry: SoftSignalLogEntry): Promise<SoftSignalLogEntry[]> {
    // Fail closed: only schema-valid constitutional entries enter the vault.
    const parsed = parseLogEntry(entry);
    if (!parsed) return this.load();
    const current = await this.load();
    // Newest first; dedupe by id; hard cap — storage hygiene, not anti-stop policy.
    const next = [parsed, ...current.filter((e) => e.id !== parsed.id)].slice(
      0,
      MAX_ENTRIES,
    );
    await localVault.setJson("soft_signal_log", next);
    // Local-first sync hint — never required for Soft Signal authority.
    void localFirstCoordinator.afterLocalWrite("soft_signal_log");
    // Mirror summary only: no journal body, no peer-facing score language.
    void privateHistoryStore.append({
      id: `ss-${parsed.id}`,
      kind: parsed.source === "practice" ? "practice" : "soft_signal",
      occurredAt: parsed.firedAt,
      summary:
        parsed.source === "practice"
          ? "Soft Signal practice (local)"
          : "Soft Signal — session ended (local)",
      // Privacy: never copy privateJournalNote into the shared private-history shape.
      privateNote: null,
      sessionId: parsed.sessionId ?? null,
    });
    return next;
  },

  /**
   * WHAT: Update optional private journal note for an existing Soft Signal id.
   * WHY: Reflection after stop is allowed; must remain device-private and optional.
   * CONSENT: Post-hoc only — product must not require this at Soft Signal time.
   * EDGE CASES:
   *   - unknown id → list unchanged (map no-op)
   *   - note trim/slice 500; empty → null
   *   - does not re-mirror privateHistoryStore note body (still null policy at append)
   * NEVER: Require non-null note. Sync note to peer or moderators by default.
   * SEE: softSignalService.addJournalNote; createLogEntry note hygiene
   */
  async updateNote(
    id: string,
    privateJournalNote: string | null,
  ): Promise<SoftSignalLogEntry[]> {
    const current = await this.load();
    const next = current.map((e) =>
      e.id === id
        ? {
            ...e,
            // Same hygiene as createLogEntry — empty optional note is null, not "".
            privateJournalNote: privateJournalNote?.trim().slice(0, 500) || null,
          }
        : e,
    );
    await localVault.setJson("soft_signal_log", next);
    void localFirstCoordinator.afterLocalWrite("soft_signal_log");
    return next;
  },

  /**
   * WHAT: Remove Soft Signal log key from local vault entirely.
   * WHY: Account/device reset or explicit clear paths; not a normal stop outcome.
   * CONSENT: Not a consent surface; clearing history does not re-open sessions.
   * EDGE CASES: missing key → vault remove should be idempotent at storage layer.
   * NEVER: Call clear as punishment for using Soft Signal. Clear peer’s data remotely.
   * SEE: localVault.remove
   */
  async clear(): Promise<void> {
    await localVault.remove("soft_signal_log");
  },
};
