/**
 * I'm Too Much / Fear of Abandonment Protocol v0.1
 *
 * WHAT: Trigger detection, panic-room containment, reassurance, local pattern stats.
 * WHY: Hold abandonment / “too much” spiral so it is less likely to dump onto Renn.
 * CONSENT: Not a Consent Snapshot. Soft Signal free. Pattern data is private.
 * NEVER: Public “neediness score”; clinical diagnosis; partner surveillance.
 * SEE: docs/TOO_MUCH_ABANDONMENT.md · docs/ATTACHMENT_REPAIR_PROTOCOL.md
 */

export const TOO_MUCH_VERSION = "0.1" as const;
export const TOO_MUCH_CORE_VERSION = 1 as const;

export type TooMuchTriggerId =
  | "delayed_reply"
  | "after_i_asked"
  | "after_i_shared"
  | "after_conflict"
  | "after_soft_signal"
  | "morning_exit"
  | "quiet_room"
  | "praise_trap"
  | "custom"
  | "undecided";

export type TooMuchIntensityId =
  | "whisper"
  | "activated"
  | "high"
  | "flooded"
  | "undecided";

export type TooMuchBodySpot =
  | "chest"
  | "throat"
  | "stomach"
  | "jaw"
  | "everywhere"
  | "numb"
  | "unknown";

export type TooMuchMoveId =
  | "stay_in_room"
  | "reassurance"
  | "soft_signal"
  | "reach_small"
  | "alone_ok"
  | "none";

export type TooMuchTrigger = {
  id: TooMuchTriggerId;
  label: string;
  blurb: string;
  /** Short detection hint */
  detect: string;
};

export type TooMuchIntensity = {
  id: TooMuchIntensityId;
  label: string;
  blurb: string;
};

export const TOO_MUCH_TRIGGERS: readonly TooMuchTrigger[] = [
  {
    id: "delayed_reply",
    label: "Delayed / cold reply",
    blurb: "Silence that the brain turns into a verdict.",
    detect: "They haven’t texted back and the story is already writing itself.",
  },
  {
    id: "after_i_asked",
    label: "After I asked for something",
    blurb: "Need = evidence I will be punished.",
    detect: "I made a request and now I’m scanning for rejection.",
  },
  {
    id: "after_i_shared",
    label: "After I shared a lot",
    blurb: "Vulnerability hangover. “I said too much.”",
    detect: "I opened up and now I want to delete the version of me they met.",
  },
  {
    id: "after_conflict",
    label: "After conflict / tension",
    blurb: "Friction equals abandonment math.",
    detect: "We had friction and my system is preparing for the end.",
  },
  {
    id: "after_soft_signal",
    label: "After Soft Signal / exit",
    blurb: "Using the exit → fear they’ll leave forever.",
    detect: "I stopped something and now I fear I ruined everything.",
  },
  {
    id: "morning_exit",
    label: "Morning exit / leaving bed",
    blurb: "Day starts = connection ends.",
    detect: "Getting up feels like being left (or leaving).",
  },
  {
    id: "quiet_room",
    label: "Quiet room (they’re fine)",
    blurb: "Neutral calm misread as cold.",
    detect: "Nothing is wrong and my body is sure something is wrong.",
  },
  {
    id: "praise_trap",
    label: "Praise that feels like a trap",
    blurb: "Love lands as “now I must not mess up.”",
    detect: "Good moment → panic about losing it.",
  },
  {
    id: "custom",
    label: "Custom trigger",
    blurb: "Name the detector.",
    detect: "Something specific lit the “too much” fuse.",
  },
  {
    id: "undecided",
    label: "Not sealed",
    blurb: "Fail-closed.",
    detect: "—",
  },
] as const;

export const TOO_MUCH_INTENSITIES: readonly TooMuchIntensity[] = [
  {
    id: "whisper",
    label: "Whisper",
    blurb: "Story starting. Still room to choose.",
  },
  {
    id: "activated",
    label: "Activated",
    blurb: "Body online. Words getting sticky.",
  },
  {
    id: "high",
    label: "High",
    blurb: "Hard to think. Need the panic room.",
  },
  {
    id: "flooded",
    label: "Flooded",
    blurb: "Soft Signal free. Containment only. No essays.",
  },
  {
    id: "undecided",
    label: "Not sealed",
    blurb: "Fail-closed.",
  },
] as const;

export const CONTAINMENT_SCRIPT: readonly string[] = [
  "You are in the panic room. Soft Signal is free.",
  "Feet on floor or blanket on body. You are not required to perform calm.",
  "Name the story: “My brain says I am too much / they will leave.”",
  "That story is a detector, not a court verdict.",
  "Breathe out longer than in, three times, if you can. Skip if you can’t.",
  "You do not have to fix the relationship in this minute.",
] as const;

export const REASSURANCE_LINES: readonly string[] = [
  "Needing connection does not make you too much.",
  "A real partner can hold “I need reassurance” without vanishing.",
  "You are allowed to take up space in a room and in a bond.",
  "Fear of abandonment is information, not a prophecy.",
  "Soft Signal is not proof you ruined love.",
  "You can be intense and still be worthy of staying-for.",
] as const;

export const TOO_MUCH_COPY = {
  banner:
    "This is currently a personal emotional containment system, not a public product.",
  title: "I'm Too Much / Fear of Abandonment",
  tagline: "Because “too much” is a story the body tells when it is afraid of being left.",
  purpose:
    "Maximum autism on the abandonment detector: name the trigger, enter the panic room, run reassurance, track patterns privately — so raw spiral is less likely to hit Renn first.",
  softSignal: "Soft Signal is God Mode in this room. No questions. No TED talk.",
  panicRoom:
    "Safe panic room: soft walls, Soft Signal always lit, no performance required to stay.",
  comedy:
    "I built a panic room with pattern analytics for my abandonment detector. That’s either broken or brilliant. Both fine.",
  notScore:
    "Pattern tracking is local and private. It is never a neediness score, never discovery-visible, never proof you are “too much.”",
} as const;

export type TooMuchSealDraft = {
  triggerId: TooMuchTriggerId;
  intensityId: TooMuchIntensityId;
  bodySpot: TooMuchBodySpot;
  storySentence: string;
  customTriggerNote: string;
  softSignalAcknowledged: boolean;
};

export type TooMuchSnapshot = {
  id: string;
  protocolVersion: typeof TOO_MUCH_VERSION;
  sealedAt: string;
  triggerId: Exclude<TooMuchTriggerId, "undecided">;
  intensityId: Exclude<TooMuchIntensityId, "undecided">;
  bodySpot: TooMuchBodySpot;
  storySentence: string;
  customTriggerNote: string;
  softSignalAcknowledged: true;
};

export type TooMuchEndReason =
  | "completed"
  | "soft_signal"
  | "abandoned";

export type TooMuchDebrief = {
  stillFlooded: boolean;
  note: string;
  ledgerNamedStory: boolean;
  ledgerDidNotDumpRaw: boolean;
  ledgerSoftSignalOk: boolean;
  ledgerNotTooMuchVerdict: boolean;
};

export type TooMuchHistoryEntry = {
  snapshot: TooMuchSnapshot;
  moveId: TooMuchMoveId;
  endedAt: string;
  endReason: TooMuchEndReason;
  containmentStepsDone: number;
  reassuranceStepsDone: number;
  debrief: TooMuchDebrief | null;
};

export type TooMuchPatternSummary = {
  total: number;
  flooded_count: number;
  soft_signal_count: number;
  named_story_count: number;
  top_triggers: { id: TooMuchTriggerId; count: number; label: string }[];
  last_7_days: number;
  last_30_days: number;
};

export function defaultTooMuchDraft(): TooMuchSealDraft {
  return {
    triggerId: "undecided",
    intensityId: "undecided",
    bodySpot: "unknown",
    storySentence: "",
    customTriggerNote: "",
    softSignalAcknowledged: false,
  };
}

export function defaultTooMuchDebrief(): TooMuchDebrief {
  return {
    stillFlooded: false,
    note: "",
    ledgerNamedStory: true,
    ledgerDidNotDumpRaw: true,
    ledgerSoftSignalOk: true,
    ledgerNotTooMuchVerdict: true,
  };
}

export function canEnterPanicRoom(draft: TooMuchSealDraft): {
  ok: boolean;
  reason: string;
} {
  if (!draft.softSignalAcknowledged) {
    return {
      ok: false,
      reason: "Acknowledge Soft Signal is free before entering the room.",
    };
  }
  if (draft.triggerId === "undecided") {
    return { ok: false, reason: "Name the detection trigger (even custom)." };
  }
  if (draft.intensityId === "undecided") {
    return { ok: false, reason: "Name intensity (whisper → flooded)." };
  }
  if (
    draft.triggerId === "custom" &&
    draft.customTriggerNote.trim().length < 2
  ) {
    return { ok: false, reason: "Custom trigger needs a short name." };
  }
  // Flooded: allow empty story
  if (
    draft.intensityId !== "flooded" &&
    draft.storySentence.trim().length < 3
  ) {
    return {
      ok: false,
      reason: "One sentence story: “My brain says…” (flooded can skip).",
    };
  }
  return { ok: true, reason: "Panic room open. Soft Signal lit." };
}

export function sealTooMuch(
  draft: TooMuchSealDraft,
  opts?: { id?: string; sealedAt?: string },
): TooMuchSnapshot | null {
  const gate = canEnterPanicRoom(draft);
  if (!gate.ok) return null;
  if (
    draft.triggerId === "undecided" ||
    draft.intensityId === "undecided" ||
    !draft.softSignalAcknowledged
  ) {
    return null;
  }
  const story =
    draft.intensityId === "flooded" && draft.storySentence.trim().length < 3
      ? "(flooded — story unnamed)"
      : draft.storySentence.trim().slice(0, 500);
  return {
    id: opts?.id ?? `too-much-${Date.now()}`,
    protocolVersion: TOO_MUCH_VERSION,
    sealedAt: opts?.sealedAt ?? new Date().toISOString(),
    triggerId: draft.triggerId,
    intensityId: draft.intensityId,
    bodySpot: draft.bodySpot,
    storySentence: story,
    customTriggerNote: draft.customTriggerNote.trim().slice(0, 300),
    softSignalAcknowledged: true,
  };
}

export function findTrigger(id: TooMuchTriggerId): TooMuchTrigger {
  return (
    TOO_MUCH_TRIGGERS.find((t) => t.id === id) ??
    TOO_MUCH_TRIGGERS[TOO_MUCH_TRIGGERS.length - 1]!
  );
}

export function findIntensity(id: TooMuchIntensityId): TooMuchIntensity {
  return (
    TOO_MUCH_INTENSITIES.find((i) => i.id === id) ?? TOO_MUCH_INTENSITIES[0]!
  );
}

export function moveLabel(id: TooMuchMoveId): string {
  switch (id) {
    case "stay_in_room":
      return "Stay in the panic room";
    case "reassurance":
      return "Run reassurance ritual";
    case "soft_signal":
      return "Soft Signal · exit";
    case "reach_small":
      return "Later: one small honest reach";
    case "alone_ok":
      return "I can hold this alone for now";
    default:
      return "None";
  }
}

export function suggestedMoves(intensity: TooMuchIntensityId): TooMuchMoveId[] {
  if (intensity === "flooded") {
    return ["soft_signal", "stay_in_room", "alone_ok"];
  }
  if (intensity === "high") {
    return ["stay_in_room", "reassurance", "soft_signal", "alone_ok"];
  }
  return [
    "reassurance",
    "stay_in_room",
    "alone_ok",
    "reach_small",
    "soft_signal",
  ];
}

export function completeTooMuch(
  snapshot: TooMuchSnapshot,
  moveId: TooMuchMoveId,
  endReason: TooMuchEndReason,
  containmentStepsDone: number,
  reassuranceStepsDone: number,
  debrief: TooMuchDebrief | null,
): TooMuchHistoryEntry {
  return {
    snapshot,
    moveId,
    endedAt: new Date().toISOString(),
    endReason,
    containmentStepsDone,
    reassuranceStepsDone,
    debrief: debrief
      ? {
          stillFlooded: Boolean(debrief.stillFlooded),
          note: debrief.note.trim().slice(0, 500),
          ledgerNamedStory: Boolean(debrief.ledgerNamedStory),
          ledgerDidNotDumpRaw: Boolean(debrief.ledgerDidNotDumpRaw),
          ledgerSoftSignalOk: Boolean(debrief.ledgerSoftSignalOk),
          ledgerNotTooMuchVerdict: Boolean(debrief.ledgerNotTooMuchVerdict),
        }
      : null,
  };
}

export function summarizePatterns(
  entries: TooMuchHistoryEntry[],
  now = new Date(),
): TooMuchPatternSummary {
  const msDay = 86400000;
  const t7 = now.getTime() - 7 * msDay;
  const t30 = now.getTime() - 30 * msDay;

  const triggerCounts = new Map<TooMuchTriggerId, number>();
  let flooded = 0;
  let soft = 0;
  let named = 0;
  let last7 = 0;
  let last30 = 0;

  for (const e of entries) {
    const id = e.snapshot.triggerId;
    triggerCounts.set(id, (triggerCounts.get(id) ?? 0) + 1);
    if (e.snapshot.intensityId === "flooded") flooded += 1;
    if (e.endReason === "soft_signal") soft += 1;
    if (e.debrief?.ledgerNamedStory) named += 1;
    const ts = Date.parse(e.endedAt);
    if (!Number.isNaN(ts)) {
      if (ts >= t7) last7 += 1;
      if (ts >= t30) last30 += 1;
    }
  }

  const top = [...triggerCounts.entries()]
    .map(([id, count]) => ({
      id,
      count,
      label: findTrigger(id).label,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return {
    total: entries.length,
    flooded_count: flooded,
    soft_signal_count: soft,
    named_story_count: named,
    top_triggers: top,
    last_7_days: last7,
    last_30_days: last30,
  };
}

export function parseTooMuchHistory(raw: unknown): TooMuchHistoryEntry[] {
  if (!Array.isArray(raw)) return [];
  const out: TooMuchHistoryEntry[] = [];
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
        protocolVersion: TOO_MUCH_VERSION,
        sealedAt:
          typeof snap.sealedAt === "string"
            ? snap.sealedAt
            : new Date(0).toISOString(),
        triggerId:
          (snap.triggerId as TooMuchSnapshot["triggerId"]) ?? "custom",
        intensityId:
          (snap.intensityId as TooMuchSnapshot["intensityId"]) ?? "activated",
        bodySpot: (snap.bodySpot as TooMuchBodySpot) ?? "unknown",
        storySentence:
          typeof snap.storySentence === "string"
            ? snap.storySentence.slice(0, 500)
            : "",
        customTriggerNote:
          typeof snap.customTriggerNote === "string"
            ? snap.customTriggerNote.slice(0, 300)
            : "",
        softSignalAcknowledged: true,
      },
      moveId: (e.moveId as TooMuchMoveId) ?? "none",
      endedAt: e.endedAt,
      endReason,
      containmentStepsDone:
        typeof e.containmentStepsDone === "number"
          ? e.containmentStepsDone
          : 0,
      reassuranceStepsDone:
        typeof e.reassuranceStepsDone === "number"
          ? e.reassuranceStepsDone
          : 0,
      debrief: null,
    });
  }
  return out.slice(0, 100);
}
