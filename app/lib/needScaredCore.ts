/**
 * I Need You But I'm Scared You'll Leave — dual-bind Attachment Repair ritual.
 *
 * WHAT: Granular need pole + fear pole, both/and holding, optional ask, ledger.
 * WHY: Hold the dual bind so it is less likely to dump raw onto Renn.
 * CONSENT: Not Consent Snapshot. Soft Signal free. Ask line never auto-sent.
 * NEVER: Public scores; force partner; collapse into only-need or only-fear.
 * SEE: docs/NEED_SCARED_LEAVE.md · docs/ATTACHMENT_REPAIR_PROTOCOL.md
 */

export const NEED_SCARED_VERSION = "0.1" as const;
export const NEED_SCARED_CORE_VERSION = 1 as const;

export type NeedPoleId =
  | "proximity"
  | "words"
  | "body_hold"
  | "time"
  | "proof"
  | "co_silence"
  | "check_in"
  | "repair"
  | "other"
  | "undecided";

export type FearPoleId =
  | "leave_if_ask"
  | "leave_if_need"
  | "leave_if_real"
  | "leave_if_stop"
  | "leave_if_too_much"
  | "leave_if_conflict"
  | "replace"
  | "gradual_fade"
  | "other"
  | "undecided";

export type BodySpot =
  | "chest"
  | "throat"
  | "stomach"
  | "jaw"
  | "everywhere"
  | "numb"
  | "unknown";

export type NeedScaredMoveId =
  | "hold_both"
  | "soft_signal"
  | "ask_later"
  | "alone_with_both"
  | "link_too_much"
  | "link_cathedral"
  | "none";

export type PoleOption = {
  id: string;
  label: string;
  blurb: string;
};

export const NEED_POLES: readonly PoleOption[] = [
  {
    id: "proximity",
    label: "Proximity",
    blurb: "Be near me. Same room / same bed energy.",
  },
  {
    id: "words",
    label: "Words",
    blurb: "Say the soft true things out loud.",
  },
  {
    id: "body_hold",
    label: "Body hold",
    blurb: "Weight, spoon, arms — Soft-Signalable.",
  },
  {
    id: "time",
    label: "Unhurried time",
    blurb: "Not rushed. Presence with a clock that isn't panicking.",
  },
  {
    id: "proof",
    label: "Explicit “I'm not leaving”",
    blurb: "Clear words for the abandonment detector.",
  },
  {
    id: "co_silence",
    label: "Quiet together",
    blurb: "No performance conversation. Shared quiet.",
  },
  {
    id: "check_in",
    label: "Planned check-in",
    blurb: "A when/how we'll reconnect so silence isn't a void.",
  },
  {
    id: "repair",
    label: "Repair after friction",
    blurb: "Come back to the mess without discarding me.",
  },
  {
    id: "other",
    label: "Other (name it)",
    blurb: "Maximum granularity: your words.",
  },
  { id: "undecided", label: "Not sealed", blurb: "Fail-closed." },
] as const;

export const FEAR_POLES: readonly PoleOption[] = [
  {
    id: "leave_if_ask",
    label: "Leave if I ask",
    blurb: "Request = rejection sequence in the brain.",
  },
  {
    id: "leave_if_need",
    label: "Leave if I need",
    blurb: "Need itself is the crime.",
  },
  {
    id: "leave_if_real",
    label: "Leave if I'm fully real",
    blurb: "The unperformed self is unlovable (story).",
  },
  {
    id: "leave_if_stop",
    label: "Leave if I stop performing",
    blurb: "If I drop the act, they go.",
  },
  {
    id: "leave_if_too_much",
    label: "Leave because I'm too much",
    blurb: "Intensity as eviction notice.",
  },
  {
    id: "leave_if_conflict",
    label: "Leave after conflict",
    blurb: "Friction ends the bond (story).",
  },
  {
    id: "replace",
    label: "Be replaced",
    blurb: "Someone easier is waiting (story).",
  },
  {
    id: "gradual_fade",
    label: "Gradual fade / quiet discard",
    blurb: "Not a fight — a slow vanishing.",
  },
  {
    id: "other",
    label: "Other (name it)",
    blurb: "Name the exact exile fantasy.",
  },
  { id: "undecided", label: "Not sealed", blurb: "Fail-closed." },
] as const;

/** Both/and holding script — refuses either/or collapse. */
export const BOTH_AND_SCRIPT: readonly string[] = [
  "Seal: both poles are present. Need and fear are both allowed in the room.",
  "Say (or type): “I need ___ and I am scared you will leave if ___.”",
  "Neither pole cancels the other. Need does not erase fear. Fear does not erase need.",
  "Soft Signal is free. You can stop the ritual without proving the fear true.",
  "If you collapse to only-fear: you pre-abandon. If only-need: you may fawn. Both/and is the third path.",
  "Body: notice where each pole lives (need may be different from fear).",
  "Optional: one breath for need, one breath for fear. Skip if flooded.",
  "You may keep both poles without sending anything to a partner yet.",
  "If you craft an ask later, it can be small, specific, and Soft-Signalable.",
  "End holding: both poles named is already a form of honesty.",
] as const;

export const NEED_REASSURANCE: readonly string[] = [
  "Needing someone is not a character flaw.",
  "A clear need is kinder than a silent test.",
  "You can need and still respect their Soft Signal.",
] as const;

export const FEAR_REASSURANCE: readonly string[] = [
  "Fear of leaving is a detector, not a prophecy.",
  "Naming “I'm scared you'll leave” is not the same as making them leave.",
  "Soft Signal freeness applies to them too — and that is not proof you are disposable.",
] as const;

export const NEED_SCARED_COPY = {
  banner:
    "This is currently a personal emotional containment system, not a public product.",
  title: "I Need You But I'm Scared You'll Leave",
  tagline:
    "Both poles are true. The ritual is holding them without collapsing.",
  purpose:
    "Maximum granularity dual-bind attachment repair: name need, name fear, hold both/and, optional small ask — so the bind is less likely to dump raw onto {{PARTNER}}.",
  softSignal:
    "Soft Signal is God Mode. Stopping the ritual does not prove the fear.",
  notConsent:
    "This is not a Consent Snapshot and not a demand. Optional ask lines are never auto-sent.",
  comedy:
    "I built a dual-pole state machine for “I need you / please don’t go.” Comedy gold. Also load-bearing.",
} as const;

export type NeedScaredDraft = {
  needId: NeedPoleId;
  needNote: string;
  needIntensity: 1 | 2 | 3 | 4 | 5 | null;
  fearId: FearPoleId;
  fearNote: string;
  fearIntensity: 1 | 2 | 3 | 4 | 5 | null;
  bodyNeed: BodySpot;
  bodyFear: BodySpot;
  softSignalAcknowledged: boolean;
  dualBindAdmitted: boolean;
};

export type NeedScaredSnapshot = {
  id: string;
  protocolVersion: typeof NEED_SCARED_VERSION;
  sealedAt: string;
  needId: Exclude<NeedPoleId, "undecided">;
  needNote: string;
  needIntensity: 1 | 2 | 3 | 4 | 5;
  fearId: Exclude<FearPoleId, "undecided">;
  fearNote: string;
  fearIntensity: 1 | 2 | 3 | 4 | 5;
  bodyNeed: BodySpot;
  bodyFear: BodySpot;
  softSignalAcknowledged: true;
  dualBindAdmitted: true;
  dualSentence: string;
  optionalAsk: string;
};

export type NeedScaredEndReason = "completed" | "soft_signal" | "abandoned";

export type NeedScaredDebrief = {
  bothPolesStillPresent: boolean;
  note: string;
  ledgerHeldBoth: boolean;
  ledgerDidNotPreAbandon: boolean;
  ledgerDidNotFawnOnly: boolean;
  ledgerSoftSignalOk: boolean;
  ledgerAskNotAutoSent: boolean;
};

export type NeedScaredHistoryEntry = {
  snapshot: NeedScaredSnapshot;
  moveId: NeedScaredMoveId;
  endedAt: string;
  endReason: NeedScaredEndReason;
  bothAndStepsDone: number;
  debrief: NeedScaredDebrief | null;
};

export function defaultNeedScaredDraft(): NeedScaredDraft {
  return {
    needId: "undecided",
    needNote: "",
    needIntensity: null,
    fearId: "undecided",
    fearNote: "",
    fearIntensity: null,
    bodyNeed: "unknown",
    bodyFear: "unknown",
    softSignalAcknowledged: false,
    dualBindAdmitted: false,
  };
}

export function defaultNeedScaredDebrief(): NeedScaredDebrief {
  return {
    bothPolesStillPresent: true,
    note: "",
    ledgerHeldBoth: true,
    ledgerDidNotPreAbandon: true,
    ledgerDidNotFawnOnly: true,
    ledgerSoftSignalOk: true,
    ledgerAskNotAutoSent: true,
  };
}

export function findNeed(id: NeedPoleId): PoleOption {
  return NEED_POLES.find((p) => p.id === id) ?? NEED_POLES[NEED_POLES.length - 1]!;
}

export function findFear(id: FearPoleId): PoleOption {
  return FEAR_POLES.find((p) => p.id === id) ?? FEAR_POLES[FEAR_POLES.length - 1]!;
}

export function canSealNeedScared(draft: NeedScaredDraft): {
  ok: boolean;
  reason: string;
} {
  if (!draft.softSignalAcknowledged) {
    return { ok: false, reason: "Acknowledge Soft Signal is free." };
  }
  if (!draft.dualBindAdmitted) {
    return {
      ok: false,
      reason: "Admit the dual bind: need and fear are both here.",
    };
  }
  if (draft.needId === "undecided" || draft.fearId === "undecided") {
    return { ok: false, reason: "Seal both poles (need + fear)." };
  }
  if (draft.needIntensity == null || draft.fearIntensity == null) {
    return { ok: false, reason: "Rate intensity 1–5 on each pole." };
  }
  if (draft.needId === "other" && draft.needNote.trim().length < 2) {
    return { ok: false, reason: "Other need needs a short name." };
  }
  if (draft.fearId === "other" && draft.fearNote.trim().length < 2) {
    return { ok: false, reason: "Other fear needs a short name." };
  }
  return { ok: true, reason: "Dual bind sealed. Soft Signal free." };
}

export function buildDualSentence(draft: NeedScaredDraft): string {
  const need =
    draft.needId === "other"
      ? draft.needNote.trim() || "…"
      : findNeed(draft.needId).label.toLowerCase();
  const fear =
    draft.fearId === "other"
      ? draft.fearNote.trim() || "…"
      : findFear(draft.fearId).label.toLowerCase();
  return `I need ${need}, and I am scared you will leave if ${fear}.`;
}

export function buildOptionalAsk(snapshot: NeedScaredSnapshot): string {
  const need =
    snapshot.needId === "other"
      ? snapshot.needNote || "support"
      : findNeed(snapshot.needId).label.toLowerCase();
  return `When you have capacity: I need ${need}. I'm also scared of being left for needing it — Soft Signal is free for both of us.`;
}

export function sealNeedScared(
  draft: NeedScaredDraft,
  opts?: { id?: string; sealedAt?: string; optionalAsk?: string },
): NeedScaredSnapshot | null {
  const gate = canSealNeedScared(draft);
  if (!gate.ok) return null;
  if (
    draft.needId === "undecided" ||
    draft.fearId === "undecided" ||
    draft.needIntensity == null ||
    draft.fearIntensity == null ||
    !draft.softSignalAcknowledged ||
    !draft.dualBindAdmitted
  ) {
    return null;
  }
  const dual = buildDualSentence(draft);
  const snap: NeedScaredSnapshot = {
    id: opts?.id ?? `need-scared-${Date.now()}`,
    protocolVersion: NEED_SCARED_VERSION,
    sealedAt: opts?.sealedAt ?? new Date().toISOString(),
    needId: draft.needId,
    needNote: draft.needNote.trim().slice(0, 400),
    needIntensity: draft.needIntensity,
    fearId: draft.fearId,
    fearNote: draft.fearNote.trim().slice(0, 400),
    fearIntensity: draft.fearIntensity,
    bodyNeed: draft.bodyNeed,
    bodyFear: draft.bodyFear,
    softSignalAcknowledged: true,
    dualBindAdmitted: true,
    dualSentence: dual,
    optionalAsk: "",
  };
  snap.optionalAsk =
    (opts?.optionalAsk ?? buildOptionalAsk(snap)).trim().slice(0, 500);
  return snap;
}

export function moveLabel(id: NeedScaredMoveId): string {
  switch (id) {
    case "hold_both":
      return "Keep holding both poles";
    case "soft_signal":
      return "Soft Signal · exit";
    case "ask_later":
      return "Save ask for later (not auto-sent)";
    case "alone_with_both":
      return "I can hold both alone for now";
    case "link_too_much":
      return "Open Too Much panic room";
    case "link_cathedral":
      return "Open Attachment Repair Cathedral";
    default:
      return "None";
  }
}

export function suggestedMoves(
  needI: number,
  fearI: number,
): NeedScaredMoveId[] {
  const base: NeedScaredMoveId[] = [
    "hold_both",
    "alone_with_both",
    "ask_later",
    "soft_signal",
  ];
  if (fearI >= 4) base.push("link_too_much");
  if (needI >= 4) base.push("link_cathedral");
  return base;
}

export function completeNeedScared(
  snapshot: NeedScaredSnapshot,
  moveId: NeedScaredMoveId,
  endReason: NeedScaredEndReason,
  bothAndStepsDone: number,
  debrief: NeedScaredDebrief | null,
): NeedScaredHistoryEntry {
  return {
    snapshot,
    moveId,
    endedAt: new Date().toISOString(),
    endReason,
    bothAndStepsDone,
    debrief: debrief
      ? {
          bothPolesStillPresent: Boolean(debrief.bothPolesStillPresent),
          note: debrief.note.trim().slice(0, 500),
          ledgerHeldBoth: Boolean(debrief.ledgerHeldBoth),
          ledgerDidNotPreAbandon: Boolean(debrief.ledgerDidNotPreAbandon),
          ledgerDidNotFawnOnly: Boolean(debrief.ledgerDidNotFawnOnly),
          ledgerSoftSignalOk: Boolean(debrief.ledgerSoftSignalOk),
          ledgerAskNotAutoSent: Boolean(debrief.ledgerAskNotAutoSent),
        }
      : null,
  };
}

export function summarizeNeedScared(entries: NeedScaredHistoryEntry[]): {
  total: number;
  soft_signal: number;
  held_both: number;
  top_needs: { id: string; label: string; count: number }[];
  top_fears: { id: string; label: string; count: number }[];
  avg_need_intensity: number;
  avg_fear_intensity: number;
} {
  const needC = new Map<string, number>();
  const fearC = new Map<string, number>();
  let soft = 0;
  let held = 0;
  let needSum = 0;
  let fearSum = 0;
  for (const e of entries) {
    needC.set(
      e.snapshot.needId,
      (needC.get(e.snapshot.needId) ?? 0) + 1,
    );
    fearC.set(
      e.snapshot.fearId,
      (fearC.get(e.snapshot.fearId) ?? 0) + 1,
    );
    if (e.endReason === "soft_signal") soft += 1;
    if (e.debrief?.ledgerHeldBoth) held += 1;
    needSum += e.snapshot.needIntensity;
    fearSum += e.snapshot.fearIntensity;
  }
  const top = (
    m: Map<string, number>,
    find: (id: string) => string,
  ) =>
    [...m.entries()]
      .map(([id, count]) => ({ id, count, label: find(id) }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  const n = entries.length || 1;
  return {
    total: entries.length,
    soft_signal: soft,
    held_both: held,
    top_needs: top(needC, (id) => findNeed(id as NeedPoleId).label),
    top_fears: top(fearC, (id) => findFear(id as FearPoleId).label),
    avg_need_intensity: Math.round((needSum / n) * 10) / 10,
    avg_fear_intensity: Math.round((fearSum / n) * 10) / 10,
  };
}

export function parseNeedScaredHistory(
  raw: unknown,
): NeedScaredHistoryEntry[] {
  if (!Array.isArray(raw)) return [];
  const out: NeedScaredHistoryEntry[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const e = item as Record<string, unknown>;
    const snap = e.snapshot as Record<string, unknown> | undefined;
    if (!snap || typeof snap.id !== "string") continue;
    if (typeof e.endedAt !== "string") continue;
    const endReason = e.endReason;
    if (
      endReason !== "completed" &&
      endReason !== "soft_signal" &&
      endReason !== "abandoned"
    ) {
      continue;
    }
    out.push({
      snapshot: {
        id: snap.id,
        protocolVersion: NEED_SCARED_VERSION,
        sealedAt:
          typeof snap.sealedAt === "string"
            ? snap.sealedAt
            : new Date(0).toISOString(),
        needId: (snap.needId as NeedScaredSnapshot["needId"]) ?? "other",
        needNote:
          typeof snap.needNote === "string" ? snap.needNote.slice(0, 400) : "",
        needIntensity:
          typeof snap.needIntensity === "number"
            ? (Math.max(1, Math.min(5, snap.needIntensity)) as 1 | 2 | 3 | 4 | 5)
            : 3,
        fearId: (snap.fearId as NeedScaredSnapshot["fearId"]) ?? "other",
        fearNote:
          typeof snap.fearNote === "string" ? snap.fearNote.slice(0, 400) : "",
        fearIntensity:
          typeof snap.fearIntensity === "number"
            ? (Math.max(1, Math.min(5, snap.fearIntensity)) as 1 | 2 | 3 | 4 | 5)
            : 3,
        bodyNeed: (snap.bodyNeed as BodySpot) ?? "unknown",
        bodyFear: (snap.bodyFear as BodySpot) ?? "unknown",
        softSignalAcknowledged: true,
        dualBindAdmitted: true,
        dualSentence:
          typeof snap.dualSentence === "string"
            ? snap.dualSentence.slice(0, 500)
            : "",
        optionalAsk:
          typeof snap.optionalAsk === "string"
            ? snap.optionalAsk.slice(0, 500)
            : "",
      },
      moveId: (e.moveId as NeedScaredMoveId) ?? "none",
      endedAt: e.endedAt,
      endReason,
      bothAndStepsDone:
        typeof e.bothAndStepsDone === "number" ? e.bothAndStepsDone : 0,
      debrief: null,
    });
  }
  return out.slice(0, 80);
}
