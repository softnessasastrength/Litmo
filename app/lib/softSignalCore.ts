/**
 * Soft Signal — canonical product meaning for in-app and future hardware.
 *
 * Invariants:
 * - Stopping never requires mutual agreement.
 * - No explanation is required at stop time.
 * - Soft Signal is success (safe exit), never punishment.
 * - Local stop is authoritative even if network fails.
 * - Personal log is private; never a public score or peer shaming tool.
 */

export const SOFT_SIGNAL_LOG_VERSION = 1 as const;

/** Where Soft Signal was triggered. */
export type SoftSignalSource =
  | "active_session"
  | "pre_activation"
  | "consent_review"
  | "practice"
  | "hardware_device"
  | "system_test";

/** Local outcome after Soft Signal. */
export type SoftSignalOutcome =
  | "stopped_local"
  | "stopped_synced"
  | "pending_sync"
  | "practice_only"
  | "already_ended";

/**
 * Personal Soft Signal record — for the user's private history only.
 * Never includes peer blame language, public scores, or required reasons.
 */
export type SoftSignalLogEntry = {
  version: typeof SOFT_SIGNAL_LOG_VERSION;
  id: string;
  /** ISO timestamp of the local stop decision. */
  firedAt: string;
  source: SoftSignalSource;
  outcome: SoftSignalOutcome;
  /** Opaque session id if any; may be empty for demo/practice. */
  sessionId: string | null;
  /**
   * Optional note the user adds *after* stopping for personal records.
   * Never prompted as a required field at Soft Signal time.
   */
  privateJournalNote: string | null;
  /** Device surface that fired. */
  surface: "mobile_app" | "hardware_device" | "unknown";
  /** Always true — Soft Signal is not crisis services. */
  notEmergencyServices: true;
  /** Always true — no explanation was required. */
  noExplanationRequired: true;
};

export type SoftSignalFireRequest = {
  source: SoftSignalSource;
  sessionId?: string | null;
  surface?: SoftSignalLogEntry["surface"];
  /**
   * When true, does not call remote withdrawal (demo / practice / hardware sim).
   */
  practiceOnly?: boolean;
};

export type SoftSignalFireResult = {
  /** Local UI must treat session as ended immediately. */
  localEnded: true;
  outcome: SoftSignalOutcome;
  logEntry: SoftSignalLogEntry;
  /** Haptic event name for the semantic haptic service. */
  hapticEvent: "softSignal";
  /** Human copy — calm, non-punitive. */
  userMessage: string;
  /** Hardware command for future device firmware. */
  hardwareCommand: SoftSignalHardwareCommand;
};

/**
 * Contract for the future Litmo hardware Soft Signal control.
 * Phone implements a no-op or sim; firmware implements drive patterns.
 */
export type SoftSignalHardwareCommand = {
  v: 1;
  kind: "soft_signal";
  /** Emotionally safe curtain / warm descent — see HARDWARE/HAPTICS.md */
  patternId: "warmDescent" | "breathLeave";
  intensity: "primary" | "gentle";
  /** Preempt all other haptics immediately. */
  preempt: true;
  /** Firmware must not block on network. */
  localOnly: true;
  /** LED / UI: calm cream field, not alarm red (unless user chose high-contrast). */
  visualHint: "calm_end_field";
  firedAt: string;
};

export const SOFT_SIGNAL_COPY = {
  button: "Soft Signal — end now",
  buttonStopping: "Stopping…",
  buttonStopped: "Stopped safely",
  hint: "Ends the session immediately. No explanation needed. No penalty. Not emergency or crisis services.",
  bannerTitle: "Soft Signal",
  bannerBody:
    "You can stop anytime. Soft Signal is success — a safe exit — never failure or blame.",
  endedTitle: "You stopped safely.",
  endedBody:
    "The session has ended. You do not owe an explanation. Soft Signal is never a penalty.",
  pendingSync:
    "Stopped on this device. Litmo will sync privately when the network returns. The session cannot resume.",
  practiceTitle: "Practice Soft Signal",
  practiceBody:
    "Feel the stop without a real peer. Practice never starts a session or notifies anyone.",
  logEmpty: "No Soft Signal records on this device yet.",
  logPrivacy:
    "These notes are private to you on this device. They are not a score, not shared with partners, and never required when you stop.",
  notEmergency:
    "Litmo is not emergency response or crisis services. If you are in danger, use local emergency services.",
} as const;

export function createLogEntry(
  partial: Omit<
    SoftSignalLogEntry,
    "version" | "notEmergencyServices" | "noExplanationRequired"
  >,
): SoftSignalLogEntry {
  return {
    ...partial,
    version: 1,
    notEmergencyServices: true,
    noExplanationRequired: true,
    privateJournalNote: partial.privateJournalNote?.trim().slice(0, 500) || null,
    sessionId: partial.sessionId || null,
  };
}

export function parseLogEntry(raw: unknown): SoftSignalLogEntry | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (o.version !== 1) return null;
  if (typeof o.id !== "string" || typeof o.firedAt !== "string") return null;
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
  if (!sources.includes(o.source as SoftSignalSource)) return null;
  if (!outcomes.includes(o.outcome as SoftSignalOutcome)) return null;
  const surface =
    o.surface === "mobile_app" || o.surface === "hardware_device"
      ? o.surface
      : "unknown";
  return createLogEntry({
    id: o.id,
    firedAt: o.firedAt,
    source: o.source as SoftSignalSource,
    outcome: o.outcome as SoftSignalOutcome,
    sessionId: typeof o.sessionId === "string" ? o.sessionId : null,
    privateJournalNote:
      typeof o.privateJournalNote === "string" ? o.privateJournalNote : null,
    surface,
  });
}

export function parseLog(raw: unknown): SoftSignalLogEntry[] {
  if (!Array.isArray(raw)) return [];
  const out: SoftSignalLogEntry[] = [];
  for (const item of raw) {
    const parsed = parseLogEntry(item);
    if (parsed) out.push(parsed);
  }
  // Newest first
  return out.sort((a, b) => (a.firedAt < b.firedAt ? 1 : -1));
}

export function buildHardwareCommand(
  intensity: "primary" | "gentle" = "primary",
  firedAt = new Date().toISOString(),
): SoftSignalHardwareCommand {
  return {
    v: 1,
    kind: "soft_signal",
    patternId: intensity === "gentle" ? "breathLeave" : "warmDescent",
    intensity,
    preempt: true,
    localOnly: true,
    visualHint: "calm_end_field",
    firedAt,
  };
}

export function userMessageForOutcome(outcome: SoftSignalOutcome): string {
  switch (outcome) {
    case "pending_sync":
      return SOFT_SIGNAL_COPY.pendingSync;
    case "practice_only":
      return SOFT_SIGNAL_COPY.practiceBody;
    case "already_ended":
      return "This session was already ended. You are safe to leave.";
    case "stopped_synced":
    case "stopped_local":
    default:
      return SOFT_SIGNAL_COPY.endedBody;
  }
}

export function newSoftSignalId(): string {
  return `ss_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}
