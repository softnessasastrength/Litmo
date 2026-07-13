/**
 * Soft Signal — canonical product meaning for in-app and future hardware.
 *
 * Soft Signal is the sacred, one-sided stop: end touch / session now without
 * peer agreement, explanation, dwell, or network success. It is success (safe
 * exit), never punishment, never emergency services, never a public score.
 *
 * Constitutional invariants (must not drift in any caller):
 * - Stopping never requires mutual agreement.
 * - No explanation is required at stop time.
 * - Soft Signal is success (safe exit), never punishment.
 * - Local stop is authoritative even if network fails.
 * - Personal log is private; never a public score or peer shaming tool.
 * - Stop must be faster than grant (constitution I.4 / consent micro-grammar).
 *
 * SEE:
 * - docs/CONSENT_MICROINTERACTIONS.md (weight 100, softSignalLocalCommitMs === 0)
 * - docs/LITMO_CONSTITUTION.md (body freedom before beauty)
 * - docs/CODE_COMMENT_STANDARD.md (this file is consent-critical)
 * - HARDWARE/HAPTICS.md (warm descent / breath leave patterns)
 * - docs/BUILD_MODES.md (Maximum vs App Store Soft Signal copy)
 */

// Mode-aware copy — Maximum sacred voice vs App Store review-safe strings.
import { softSignalCopy as modeAwareSoftSignalCopy } from "../config/copy/index.ts";

/**
 * WHAT: Schema version for SoftSignalLogEntry persistence.
 * WHY: Bump only when on-disk shape changes; parseLogEntry rejects other versions
 *      so corrupt or future-incompatible rows fail closed (dropped) rather than
 *      half-parsed into product meaning.
 * CONSENT: Not a consent surface by itself; protects private stop records integrity.
 * EDGE CASES: unknown version → parse returns null → entry excluded from history.
 * NEVER: Treat version match as proof the stop was justified or peer-approved.
 */
export const SOFT_SIGNAL_LOG_VERSION = 1 as const;

/**
 * WHAT: Product enum for *where* Soft Signal was fired in the journey.
 * WHY: Private history and analytics-of-self need context without blame language;
 *      source is not eligibility, not severity, not a trust score input.
 * CONSENT: Source records the surface of withdrawal/practice only. It never
 *      re-authorizes contact or implies the peer consented to anything.
 * EDGE CASES:
 *   - practice / system_test → no real peer, no remote withdrawal expected
 *   - hardware_device → same stop authority as app; surface differs for log only
 *   - unknown raw string on parse → entry rejected (fail closed)
 * NEVER: Infer danger level, fault, or “more serious stop” from source alone.
 *        Never show source as a public badge or matching signal.
 *
 * Variants (product language):
 * - active_session: live session; full local-end + optional remote withdraw path
 * - pre_activation: before session becomes active; still ends readiness immediately
 * - consent_review: snapshot/review UI; withdraw before seal or after review
 * - practice: muscle-memory fire; no peer notify, practice_only outcome
 * - hardware_device: physical Litmo Soft Signal control
 * - system_test: automated/diagnostic; must not be treated as user crisis
 */
export type SoftSignalSource =
  | "active_session"
  | "pre_activation"
  | "consent_review"
  | "practice"
  | "hardware_device"
  | "system_test";

/**
 * WHAT: Local product outcome after Soft Signal was processed on this device.
 * WHY: UI copy and log need to distinguish practice, synced stop, offline stop,
 *      and already-ended without implying failure or blame.
 * CONSENT: Outcome describes *stop plumbing*, not whether the person “should”
 *      have stopped. Every terminal outcome is dignified exit language.
 * EDGE CASES:
 *   - pending_sync → local end still authoritative; resume forbidden
 *   - already_ended → second fire is no-op for session truth; still safe leave
 *   - practice_only → never calls remote withdrawal
 * NEVER: Map outcome to a penalty, public score, or required debrief.
 *        Never treat pending_sync as “session still live.”
 *
 * Variants:
 * - stopped_local: local end committed; remote not confirmed (or N/A path)
 * - stopped_synced: remote withdraw acknowledged
 * - pending_sync: remote failed or explicitly pending; local still ended
 * - practice_only: no real session remote; practice log only
 * - already_ended: session was already terminal when fire ran
 */
export type SoftSignalOutcome =
  | "stopped_local"
  | "stopped_synced"
  | "pending_sync"
  | "practice_only"
  | "already_ended";

/**
 * WHAT: Personal Soft Signal record for the user’s private history only.
 * WHY: Lets someone review their own safe exits later; optional journal note is
 *      *after* stop, never a gate at fire time.
 * CONSENT: Logging is not consent; notes are optional and post-hoc. Storing a
 *      record does not re-open session, notify peers of note content, or score.
 * EDGE CASES:
 *   - sessionId null → practice/demo/no session context
 *   - privateJournalNote null → normal; never required
 *   - notEmergencyServices / noExplanationRequired always true at write
 * NEVER: Include peer blame language, public scores, required reasons, or crisis
 *        dispatch metadata. Never ship this record to matching or peer profiles.
 * SEE: softSignalLogStore (vault); SOFT_SIGNAL_COPY.logPrivacy
 */
export type SoftSignalLogEntry = {
  version: typeof SOFT_SIGNAL_LOG_VERSION;
  id: string;
  /** ISO timestamp of the local stop *decision* (authoritative local clock). */
  firedAt: string;
  source: SoftSignalSource;
  outcome: SoftSignalOutcome;
  /** Opaque session id if any; may be empty/null for demo/practice. */
  sessionId: string | null;
  /**
   * Optional note the user adds *after* stopping for personal records.
   * NEVER prompted as a required field at Soft Signal time.
   * Max length enforced at create/update (500 chars) for vault hygiene.
   */
  privateJournalNote: string | null;
  /** Device surface that fired — app vs hardware vs unknown parse fallback. */
  surface: "mobile_app" | "hardware_device" | "unknown";
  /**
   * Always true on valid entries — Soft Signal is not crisis / emergency services.
   * Fail-closed parse: if not strictly true, entry is rejected.
   */
  notEmergencyServices: true;
  /**
   * Always true on valid entries — no explanation was required to stop.
   * Fail-closed parse: if not strictly true, entry is rejected.
   */
  noExplanationRequired: true;
};

/**
 * WHAT: Input contract for Soft Signal fire (UI, practice, hardware sim).
 * WHY: Callers must not invent ad-hoc flags; practiceOnly and missing sessionId
 *      both force non-remote practice semantics so stop cannot hang on network.
 * CONSENT: Requesting fire is unilateral withdrawal/practice — never mutual.
 * EDGE CASES:
 *   - practiceOnly true → no remote withdraw even if sessionId present
 *   - sessionId null/undefined → treated as practice-only path in service core
 *   - surface omitted → defaults to mobile_app in orchestration
 * NEVER: Require a reason field on this type (intentionally absent).
 *        Never treat fire request as consent to start or continue contact.
 */
export type SoftSignalFireRequest = {
  source: SoftSignalSource;
  sessionId?: string | null;
  surface?: SoftSignalLogEntry["surface"];
  /**
   * When true, does not call remote withdrawal (demo / practice / hardware sim).
   * WHY: Isolation — practice must never notify a peer or depend on backend.
   */
  practiceOnly?: boolean;
};

/**
 * WHAT: Result of a Soft Signal fire for UI + side-effect consumers.
 * WHY: Single return carries local-end guarantee, log entry, haptic token,
 *      user-facing calm copy, and hardware command so UI never waits on a
 *      second round-trip to “confirm” freedom.
 * CONSENT: localEnded is always true on success path of fire — session UI must
 *      treat contact/session as over immediately (stop faster than grant).
 * EDGE CASES:
 *   - outcome varies; localEnded stays true (including pending_sync)
 *   - log append / haptic / hardware may have failed silently upstream
 * NEVER: Infer that remote peer was notified from localEnded alone.
 *        Infer emergency dispatch from hapticEvent or hardwareCommand.
 */
export type SoftSignalFireResult = {
  /** Local UI must treat session as ended immediately — always true on fire result. */
  localEnded: true;
  outcome: SoftSignalOutcome;
  logEntry: SoftSignalLogEntry;
  /** Haptic event name for the semantic haptic service (softSignal). */
  hapticEvent: "softSignal";
  /** Human copy — calm, non-punitive; never interrogative. */
  userMessage: string;
  /** Hardware command for future device firmware (localOnly, preempt). */
  hardwareCommand: SoftSignalHardwareCommand;
};

/**
 * WHAT: Contract for the future Litmo hardware Soft Signal control.
 * WHY: Phone implements no-op/sim; firmware implements drive patterns without
 *      inventing product meaning. Fixed fields encode safety (preempt, localOnly).
 * CONSENT: Hardware Soft Signal has the same stop authority as in-app — unilateral.
 * EDGE CASES:
 *   - intensity gentle → breathLeave pattern; primary → warmDescent
 *   - visualHint is calm end field, not alarm red (unless user high-contrast theme elsewhere)
 * NEVER: Block firmware on network. Emit alarm/siren semantics. Require peer OK.
 * SEE: HARDWARE/HAPTICS.md; softSignalHardware bridge
 */
export type SoftSignalHardwareCommand = {
  v: 1;
  kind: "soft_signal";
  /** Emotionally safe curtain / warm descent — see HARDWARE/HAPTICS.md */
  patternId: "warmDescent" | "breathLeave";
  intensity: "primary" | "gentle";
  /** Preempt all other haptics immediately — stop must win any race. */
  preempt: true;
  /** Firmware must not block on network — local actuator only. */
  localOnly: true;
  /** LED / UI: calm cream field, not alarm red (unless user chose high-contrast). */
  visualHint: "calm_end_field";
  firedAt: string;
};

/**
 * WHAT: Soft Signal user-facing copy for *this binary* (mode-aware).
 * WHY: Maximum Mode keeps sacred stop language; App Store Safe Mode uses calmer
 *      “end session” strings while preserving no-reason / not-emergency / not-penalty.
 * CONSENT: Both packs affirm unilateral stop; neither requires explanation.
 * EDGE CASES: Selected at bundle time via EXPO_PUBLIC_LITMO_BUILD_MODE / heuristics.
 * NEVER: Import raw maximumCopy in App Store binary UI without going through this.
 * SEE: app/config/copy/maximumCopy.ts, appStoreCopy.ts, docs/BUILD_MODES.md
 */
export const SOFT_SIGNAL_COPY = modeAwareSoftSignalCopy;

/**
 * WHAT: Normalize a partial log row into a full SoftSignalLogEntry.
 * WHY: Guarantees constitutional flags (notEmergencyServices, noExplanationRequired),
 *      schema version, null sessionId, and note length/trim at the single write boundary.
 * CONSENT: Creating a log entry is not consent to share; note is private and optional.
 * EDGE CASES:
 *   - privateJournalNote whitespace-only → null (no empty-string notes as “content”)
 *   - note longer than 500 → sliced (vault hygiene; never a gate at fire time)
 *   - sessionId falsy → null
 * NEVER: Accept caller override of notEmergencyServices or noExplanationRequired
 *        (intentionally omitted from partial input).
 *        Never log peer names, blame, or required “reason for stop” fields.
 * SEE: SoftSignalLogEntry; softSignalLogStore.append
 */
export function createLogEntry(
  partial: Omit<
    SoftSignalLogEntry,
    "version" | "notEmergencyServices" | "noExplanationRequired"
  >,
): SoftSignalLogEntry {
  return {
    ...partial,
    // Schema pin — parseLogEntry rejects any other version.
    version: 1,
    // Constitutional: Soft Signal is never crisis dispatch.
    notEmergencyServices: true,
    // Constitutional: stop requires no explanation.
    noExplanationRequired: true,
    // Privacy + hygiene: trim/slice after stop only; empty becomes null.
    privateJournalNote: partial.privateJournalNote?.trim().slice(0, 500) || null,
    // Missing session is valid (practice/demo) — store explicit null, not "".
    sessionId: partial.sessionId || null,
  };
}

/**
 * WHAT: Fail-closed parse of unknown vault/JSON into SoftSignalLogEntry or null.
 * WHY: Corrupt, partial, or hostile rows must not become product meaning; drop
 *      rather than invent flags that would imply emergency semantics or coercion.
 * CONSENT: Not a consent surface — validates private history integrity only.
 * EDGE CASES:
 *   - non-object / null → null
 *   - version !== 1 → null (fail closed)
 *   - missing id/firedAt strings → null
 *   - notEmergencyServices / noExplanationRequired not strictly true → null
 *     (prevents replaying rows that violate Soft Signal non-claims)
 *   - unknown source/outcome → null
 *   - unknown surface → coerced to "unknown" (not null) so valid stops still load
 *   - sessionId / privateJournalNote wrong type → null for those fields via createLogEntry path
 * NEVER: Return a half-valid entry that omits constitutional flags.
 *        Never parse peer-facing score fields into this type.
 * SEE: parseLog; softSignalLogStore.load
 */
export function parseLogEntry(raw: unknown): SoftSignalLogEntry | null {
  // Fail closed: garbage or non-objects never become stop history.
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  // Unknown schema versions are dropped — do not best-effort coerce.
  if (o.version !== 1) return null;
  if (typeof o.id !== "string" || typeof o.firedAt !== "string") return null;
  // Constitutional flags must be present and true — refuse soft violations.
  if (o.notEmergencyServices !== true || o.noExplanationRequired !== true)
    return null;
  const sources: SoftSignalSource[] = [
    "active_session",
    "pre_activation",
    "consent_review",
    "practice",
    "hardware_device",
    "system_test",
  ];
  const outcomes: SoftSignalOutcome[] = [
    "stopped_local",
    "stopped_synced",
    "pending_sync",
    "practice_only",
    "already_ended",
  ];
  // Unknown enums → drop entry (fail closed) rather than invent product meaning.
  if (!sources.includes(o.source as SoftSignalSource)) return null;
  if (!outcomes.includes(o.outcome as SoftSignalOutcome)) return null;
  // Surface is softer: invalid values map to "unknown" so the stop still shows.
  const surface =
    o.surface === "mobile_app" || o.surface === "hardware_device"
      ? o.surface
      : "unknown";
  return createLogEntry({
    id: o.id,
    firedAt: o.firedAt,
    source: o.source as SoftSignalSource,
    outcome: o.outcome as SoftSignalOutcome,
    // Non-string sessionId becomes null — no opaque object ids in vault.
    sessionId: typeof o.sessionId === "string" ? o.sessionId : null,
    // Non-string notes discarded; createLogEntry still trims/slices if string.
    privateJournalNote:
      typeof o.privateJournalNote === "string" ? o.privateJournalNote : null,
    surface,
  });
}

/**
 * WHAT: Parse a vault array into SoftSignalLogEntry[], newest first.
 * WHY: Load path must skip corrupt rows and present stable reverse-chronology
 *      for the private log UI without throwing.
 * CONSENT: Not a consent surface; empty on bad input is safer than fabricated history.
 * EDGE CASES:
 *   - non-array raw → [] (fail closed empty, not throw)
 *   - mixed valid/invalid items → only valid kept
 *   - equal firedAt → sort stability not guaranteed beyond comparison (acceptable)
 * NEVER: Invent entries to “fill” an empty log. Never sort by outcome severity.
 * SEE: softSignalLogStore.load
 */
export function parseLog(raw: unknown): SoftSignalLogEntry[] {
  // Fail closed: wrong container type yields empty private history, not a crash.
  if (!Array.isArray(raw)) return [];
  const out: SoftSignalLogEntry[] = [];
  for (const item of raw) {
    const parsed = parseLogEntry(item);
    // Drop unparseable rows; never throw mid-load (vault may have partial writes).
    if (parsed) out.push(parsed);
  }
  // Newest first for private log UX — not a ranking of “seriousness.”
  return out.sort((a, b) => (a.firedAt < b.firedAt ? 1 : -1));
}

/**
 * WHAT: Build a SoftSignalHardwareCommand for primary or gentle intensity.
 * WHY: Single factory keeps preempt/localOnly/visualHint fixed so callers cannot
 *      accidentally emit blocking or alarm-like commands.
 * CONSENT: Hardware command is stop acknowledgment only — never grant contact.
 * EDGE CASES:
 *   - intensity "gentle" → patternId breathLeave (softer practice-feel)
 *   - intensity "primary" (default) → warmDescent
 *   - firedAt default now() when omitted (same ISO clock as log when passed through)
 * NEVER: Set preempt/localOnly false. Use alarm visual hints. Block on network.
 * SEE: SoftSignalHardwareCommand; softSignalServiceCore emitHardware
 */
export function buildHardwareCommand(
  intensity: "primary" | "gentle" = "primary",
  firedAt = new Date().toISOString(),
): SoftSignalHardwareCommand {
  return {
    v: 1,
    kind: "soft_signal",
    // Gentle practice uses breathLeave; real/primary stop uses warmDescent curtain.
    patternId: intensity === "gentle" ? "breathLeave" : "warmDescent",
    intensity,
    // Order-matters product rule: Soft Signal preempts all other haptics.
    preempt: true,
    // Local actuators only — firmware must not wait on network to “finish” stop.
    localOnly: true,
    // Calm end field — not emergency red (high-contrast is a theme concern elsewhere).
    visualHint: "calm_end_field",
    firedAt,
  };
}

/**
 * WHAT: Map SoftSignalOutcome to calm, non-punitive user-facing message.
 * WHY: UI must not invent per-screen copy that reintroduces penalty or “why?” language.
 * CONSENT: Messages affirm exit dignity; pending_sync still ends resume possibility.
 * EDGE CASES:
 *   - pending_sync → private sync later; session cannot resume
 *   - practice_only → practiceBody (no peer notify claim)
 *   - already_ended → explicit safe-to-leave without re-blaming
 *   - stopped_synced / stopped_local / default → endedBody
 * NEVER: Return interrogation prompts, peer-permission language, or emergency scripts.
 * SEE: SOFT_SIGNAL_COPY
 */
export function userMessageForOutcome(outcome: SoftSignalOutcome): string {
  switch (outcome) {
    case "pending_sync":
      // Local end already happened — this is plumbing honesty, not “still live.”
      return SOFT_SIGNAL_COPY.pendingSync;
    case "practice_only":
      return SOFT_SIGNAL_COPY.practiceBody;
    case "already_ended":
      // Second fire: affirm safety without implying user failed or over-stopped.
      return "This session was already ended. You are safe to leave.";
    case "stopped_synced":
    case "stopped_local":
    default:
      return SOFT_SIGNAL_COPY.endedBody;
  }
}

/**
 * WHAT: Generate a client-side Soft Signal log id (ss_ + time + entropy).
 * WHY: Stable unique key for vault dedupe without requiring network UUID service
 *      at the moment of stop (local end must not depend on connectivity).
 * CONSENT: Not a consent surface; id is opaque private history key only.
 * EDGE CASES: clock skew / random collision extremely unlikely; append dedupes by id.
 * NEVER: Use this id as a public share token, legal evidence claim, or peer-visible handle.
 * SEE: createSoftSignalService fire path
 */
export function newSoftSignalId(): string {
  // Local-only id: stop path must work offline; no network for identity.
  return `ss_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}
