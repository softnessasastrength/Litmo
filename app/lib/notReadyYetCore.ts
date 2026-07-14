/**
 * I'm Not Ready To Get Up Yet v0.1 — morning exit / snooze containment.
 *
 * WHAT: Reason + snooze seal, timer, Soft Signal, exit script, debrief ledger.
 * WHY: Hold “I can’t start the day without more safety” so guilt dumps less on Renn.
 * CONSENT: Local practice. Soft Signal free. Not a partner auto-notify.
 * NEVER: Public scores; shame for needing more; clinical claims.
 * SEE: docs/IM_NOT_READY_YET.md · docs/MORNING_CUDDLE_PROTOCOL.md
 */

export const NOT_READY_YET_VERSION = "0.1" as const;
export const NOT_READY_YET_CORE_VERSION = 1 as const;

export type NotReadyReasonId =
  | "body_cold"
  | "want_hold"
  | "anxiety"
  | "dont_want_day"
  | "still_tired"
  | "other"
  | "undecided";

export type SnoozeMinutes = 2 | 5 | 10 | 15 | "open";

export type NotReadyReason = {
  id: NotReadyReasonId;
  label: string;
  blurb: string;
};

export const NOT_READY_REASONS: readonly NotReadyReason[] = [
  {
    id: "body_cold",
    label: "Body cold / nervous system",
    blurb: "Not enough co-regulation yet. Blanket nation.",
  },
  {
    id: "want_hold",
    label: "Want more hold",
    blurb: "Closeness request, not laziness.",
  },
  {
    id: "anxiety",
    label: "Anxiety spike",
    blurb: "Day feels like a court date. Bed is temporary asylum.",
  },
  {
    id: "dont_want_day",
    label: "Don’t want the day yet",
    blurb: "Honest. Time-box the resistance.",
  },
  {
    id: "still_tired",
    label: "Still tired",
    blurb: "Sleep debt is real. Snooze is data.",
  },
  {
    id: "other",
    label: "Other",
    blurb: "Name it.",
  },
  {
    id: "undecided",
    label: "Not sealed",
    blurb: "Fail-closed.",
  },
] as const;

export const SNOOZE_OPTIONS: readonly SnoozeMinutes[] = [
  2,
  5,
  10,
  15,
  "open",
];

export type NotReadySealDraft = {
  reasonId: NotReadyReasonId;
  reasonNote: string;
  snoozeMinutes: SnoozeMinutes | null;
  exitScript: string;
  partnerLine: string;
  softSignalAcknowledged: boolean;
};

export type NotReadySnapshot = {
  id: string;
  protocolVersion: typeof NOT_READY_YET_VERSION;
  sealedAt: string;
  reasonId: Exclude<NotReadyReasonId, "undecided">;
  reasonNote: string;
  snoozeMinutes: SnoozeMinutes;
  exitScript: string;
  partnerLine: string;
  softSignalAcknowledged: true;
};

export type NotReadyActiveSession = {
  snapshot: NotReadySnapshot;
  startedAt: string;
  elapsedSeconds: number;
  extendedOnce: boolean;
};

export type NotReadyEndReason =
  | "completed"
  | "soft_signal"
  | "im_up"
  | "abandoned";

export type NotReadyDebrief = {
  guilt: number | null;
  note: string;
  ledgerAskedWithoutSpiral: boolean;
  ledgerExitedWithScript: boolean;
  ledgerSoftSignalOk: boolean;
  ledgerNoSelfHate: boolean;
};

export type NotReadyHistoryEntry = {
  snapshot: NotReadySnapshot;
  startedAt: string;
  endedAt: string;
  endReason: NotReadyEndReason;
  extendedOnce: boolean;
  debrief: NotReadyDebrief | null;
};

export const NOT_READY_COPY = {
  banner:
    "This is currently a personal emotional containment system, not a public product.",
  title: "I'm Not Ready To Get Up Yet v0.1",
  tagline: "Because the day is a court date and the bed is a sovereign nation.",
  purpose:
    "Negotiate one more unit of safety before the day starts — without dumping neediness-guilt onto {{PARTNER}}. Soft Signal free.",
  softSignal: "Soft Signal ends the snooze. Day can start messy. No TED talk.",
  comedy:
    "I wrote a protocol for not getting up. That’s either pathetic or genius. Both fine before coffee.",
  defaultExit:
    "I’m getting up now. Thanks for the extra minutes — I really needed that.",
  defaultPartner:
    "Can I have a few more minutes of hold/quiet? I’ll get up after — soft exit promised.",
} as const;

export function defaultNotReadyDraft(): NotReadySealDraft {
  return {
    reasonId: "undecided",
    reasonNote: "",
    snoozeMinutes: null,
    exitScript: NOT_READY_COPY.defaultExit,
    partnerLine: NOT_READY_COPY.defaultPartner,
    softSignalAcknowledged: false,
  };
}

export function defaultNotReadyDebrief(): NotReadyDebrief {
  return {
    guilt: null,
    note: "",
    ledgerAskedWithoutSpiral: true,
    ledgerExitedWithScript: true,
    ledgerSoftSignalOk: true,
    ledgerNoSelfHate: true,
  };
}

export function canSealNotReady(draft: NotReadySealDraft): {
  ok: boolean;
  reason: string;
} {
  if (draft.reasonId === "undecided") {
    return { ok: false, reason: "Name why you’re not ready." };
  }
  if (draft.reasonId === "other" && draft.reasonNote.trim().length < 2) {
    return { ok: false, reason: "Other needs a short note." };
  }
  if (draft.snoozeMinutes == null) {
    return { ok: false, reason: "Pick a snooze unit (or open)." };
  }
  if (!draft.softSignalAcknowledged) {
    return {
      ok: false,
      reason: "Acknowledge Soft Signal is free before sealing.",
    };
  }
  if (draft.exitScript.trim().length < 3) {
    return {
      ok: false,
      reason: "Write a tiny exit script for when you do get up.",
    };
  }
  return { ok: true, reason: "Snooze sealed. Soft Signal armed." };
}

export function sealNotReady(
  draft: NotReadySealDraft,
  opts?: { id?: string; sealedAt?: string },
): NotReadySnapshot | null {
  const gate = canSealNotReady(draft);
  if (!gate.ok) return null;
  if (
    draft.reasonId === "undecided" ||
    draft.snoozeMinutes == null ||
    !draft.softSignalAcknowledged
  ) {
    return null;
  }
  return {
    id: opts?.id ?? `not-ready-${Date.now()}`,
    protocolVersion: NOT_READY_YET_VERSION,
    sealedAt: opts?.sealedAt ?? new Date().toISOString(),
    reasonId: draft.reasonId,
    reasonNote: draft.reasonNote.trim().slice(0, 400),
    snoozeMinutes: draft.snoozeMinutes,
    exitScript: draft.exitScript.trim().slice(0, 500),
    partnerLine: draft.partnerLine.trim().slice(0, 500),
    softSignalAcknowledged: true,
  };
}

export function startNotReadySession(
  snapshot: NotReadySnapshot,
): NotReadyActiveSession {
  return {
    snapshot,
    startedAt: new Date().toISOString(),
    elapsedSeconds: 0,
    extendedOnce: false,
  };
}

export function tickNotReady(
  session: NotReadyActiveSession,
  deltaSeconds = 1,
): NotReadyActiveSession {
  return {
    ...session,
    elapsedSeconds: session.elapsedSeconds + Math.max(0, Math.floor(deltaSeconds)),
  };
}

export function snoozeTargetSeconds(snooze: SnoozeMinutes): number | null {
  if (snooze === "open") return null;
  return snooze * 60;
}

export function isSnoozeComplete(session: NotReadyActiveSession): boolean {
  const t = snoozeTargetSeconds(session.snapshot.snoozeMinutes);
  if (t == null) return false;
  return session.elapsedSeconds >= t;
}

/** One free +5 minutes if original was timed (not open). */
export function canExtendOnce(session: NotReadyActiveSession): boolean {
  return (
    !session.extendedOnce && session.snapshot.snoozeMinutes !== "open"
  );
}

export function extendOnce(
  session: NotReadyActiveSession,
): NotReadyActiveSession | null {
  if (!canExtendOnce(session)) return null;
  return {
    ...session,
    extendedOnce: true,
    // Add 5 minutes of runway by rewinding effective elapsed vs target
    // Implement as reducing elapsed by 5 min (floor 0) so timer has more left.
    elapsedSeconds: Math.max(0, session.elapsedSeconds - 5 * 60),
  };
}

export function formatClock(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, "0")}`;
}

export function remainingSeconds(
  session: NotReadyActiveSession,
): number | null {
  const t = snoozeTargetSeconds(session.snapshot.snoozeMinutes);
  if (t == null) return null;
  // If extended, target is original + 5 min effectively via elapsed reduction
  return Math.max(0, t - session.elapsedSeconds);
}

export function completeNotReady(
  session: NotReadyActiveSession,
  endReason: NotReadyEndReason,
  debrief: NotReadyDebrief | null,
): NotReadyHistoryEntry {
  return {
    snapshot: session.snapshot,
    startedAt: session.startedAt,
    endedAt: new Date().toISOString(),
    endReason,
    extendedOnce: session.extendedOnce,
    debrief: debrief
      ? {
          guilt:
            debrief.guilt != null
              ? Math.max(1, Math.min(10, Math.round(debrief.guilt)))
              : null,
          note: debrief.note.trim().slice(0, 500),
          ledgerAskedWithoutSpiral: Boolean(debrief.ledgerAskedWithoutSpiral),
          ledgerExitedWithScript: Boolean(debrief.ledgerExitedWithScript),
          ledgerSoftSignalOk: Boolean(debrief.ledgerSoftSignalOk),
          ledgerNoSelfHate: Boolean(debrief.ledgerNoSelfHate),
        }
      : null,
  };
}

export function findReason(id: NotReadyReasonId): NotReadyReason {
  return (
    NOT_READY_REASONS.find((r) => r.id === id) ??
    NOT_READY_REASONS[NOT_READY_REASONS.length - 1]!
  );
}

export function snoozeLabel(s: SnoozeMinutes): string {
  return s === "open" ? "Open (Soft-Signalable)" : `${s} min`;
}

export function summarizeNotReadyHistory(entries: NotReadyHistoryEntry[]): {
  total: number;
  soft_signal: number;
  im_up: number;
  extended: number;
  no_self_hate: number;
} {
  return {
    total: entries.length,
    soft_signal: entries.filter((e) => e.endReason === "soft_signal").length,
    im_up: entries.filter((e) => e.endReason === "im_up").length,
    extended: entries.filter((e) => e.extendedOnce).length,
    no_self_hate: entries.filter((e) => e.debrief?.ledgerNoSelfHate).length,
  };
}

export function parseNotReadyHistory(raw: unknown): NotReadyHistoryEntry[] {
  if (!Array.isArray(raw)) return [];
  const out: NotReadyHistoryEntry[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const e = item as Record<string, unknown>;
    const snap = e.snapshot as Record<string, unknown> | undefined;
    if (!snap || typeof snap.id !== "string") continue;
    if (typeof e.startedAt !== "string" || typeof e.endedAt !== "string") {
      continue;
    }
    const endReason = e.endReason;
    if (
      endReason !== "completed" &&
      endReason !== "soft_signal" &&
      endReason !== "im_up" &&
      endReason !== "abandoned"
    ) {
      continue;
    }
    out.push({
      snapshot: {
        id: snap.id,
        protocolVersion: NOT_READY_YET_VERSION,
        sealedAt:
          typeof snap.sealedAt === "string"
            ? snap.sealedAt
            : new Date(0).toISOString(),
        reasonId: (snap.reasonId as NotReadySnapshot["reasonId"]) ?? "other",
        reasonNote:
          typeof snap.reasonNote === "string"
            ? snap.reasonNote.slice(0, 400)
            : "",
        snoozeMinutes: (snap.snoozeMinutes as SnoozeMinutes) ?? 5,
        exitScript:
          typeof snap.exitScript === "string"
            ? snap.exitScript.slice(0, 500)
            : "",
        partnerLine:
          typeof snap.partnerLine === "string"
            ? snap.partnerLine.slice(0, 500)
            : "",
        softSignalAcknowledged: true,
      },
      startedAt: e.startedAt,
      endedAt: e.endedAt,
      endReason,
      extendedOnce: Boolean(e.extendedOnce),
      debrief: null,
    });
  }
  return out.slice(0, 50);
}
