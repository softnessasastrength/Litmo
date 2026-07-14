/**
 * I'm Too Much / Fear of Abandonment Protocol v0.2 — maximum autism panic room.
 *
 * WHAT: Expanded triggers, dual containment tracks, adaptive reassurance,
 *   co-trigger notes, long-term pattern analytics + recommended next protocol.
 * WHY: Hold abandonment / “too much” spiral so it dumps less raw onto Renn.
 * CONSENT: Not Consent Snapshot. Soft Signal free. Patterns private never scored.
 * NEVER: Public neediness score; clinical diagnosis; partner surveillance.
 * SEE: docs/TOO_MUCH_ABANDONMENT.md · docs/ATTACHMENT_REPAIR_PROTOCOL.md
 */

export const TOO_MUCH_VERSION = "0.2" as const;
export const TOO_MUCH_CORE_VERSION = 2 as const;

export type TooMuchTriggerId =
  | "delayed_reply"
  | "after_i_asked"
  | "after_i_shared"
  | "after_conflict"
  | "after_soft_signal"
  | "morning_exit"
  | "quiet_room"
  | "praise_trap"
  | "they_seem_fine"
  | "i_took_space"
  | "plan_change"
  | "preemptive_exit"
  | "comparison_spiral"
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
  | "link_cathedral"
  | "link_interest_re"
  | "none";

export type TooMuchTrigger = {
  id: TooMuchTriggerId;
  label: string;
  blurb: string;
  detect: string;
  /** Autistic-precision: what system is firing */
  system: string;
};

export type TooMuchIntensity = {
  id: TooMuchIntensityId;
  label: string;
  blurb: string;
  /** Immediate room protocol id */
  containmentTrack: "standard" | "flood";
};

export const TOO_MUCH_TRIGGERS: readonly TooMuchTrigger[] = [
  {
    id: "delayed_reply",
    label: "Delayed / cold reply",
    blurb: "Silence that the brain turns into a verdict.",
    detect: "They haven’t texted back and the story is already writing itself.",
    system: "Abandonment radar · unanswered ping",
  },
  {
    id: "after_i_asked",
    label: "After I asked for something",
    blurb: "Need = evidence I will be punished.",
    detect: "I made a request and now I’m scanning for rejection.",
    system: "Need → shame → preemptive exile",
  },
  {
    id: "after_i_shared",
    label: "After I shared a lot",
    blurb: "Vulnerability hangover. “I said too much.”",
    detect: "I opened up and now I want to delete the version of me they met.",
    system: "Exposure hangover · delete-self urge",
  },
  {
    id: "after_conflict",
    label: "After conflict / tension",
    blurb: "Friction equals abandonment math.",
    detect: "We had friction and my system is preparing for the end.",
    system: "Conflict = end-of-bond calculator",
  },
  {
    id: "after_soft_signal",
    label: "After Soft Signal / exit",
    blurb: "Using the exit → fear they’ll leave forever.",
    detect: "I stopped something and now I fear I ruined everything.",
    system: "Sacred exit misread as catastrophe",
  },
  {
    id: "morning_exit",
    label: "Morning exit / leaving bed",
    blurb: "Day starts = connection ends.",
    detect: "Getting up feels like being left (or leaving).",
    system: "Separation at dawn · co-regulation cliff",
  },
  {
    id: "quiet_room",
    label: "Quiet room (they’re fine)",
    blurb: "Neutral calm misread as cold.",
    detect: "Nothing is wrong and my body is sure something is wrong.",
    system: "False-positive threat · ambient silence",
  },
  {
    id: "praise_trap",
    label: "Praise that feels like a trap",
    blurb: "Love lands as “now I must not mess up.”",
    detect: "Good moment → panic about losing it.",
    system: "Positive valence → loss anticipation",
  },
  {
    id: "they_seem_fine",
    label: "They seem fine / I’m spiraling alone",
    blurb: "Asymmetry of nervous systems as proof I’m broken.",
    detect: "They look regulated and I feel like a malfunction.",
    system: "Co-regulation envy · self as defective unit",
  },
  {
    id: "i_took_space",
    label: "I took space / went quiet",
    blurb: "My own boundary → fear they’ll replace me.",
    detect: "I needed alone time and now I’m sure I’ve ruined us.",
    system: "Autonomy-shame · boundary as abandonment of them",
  },
  {
    id: "plan_change",
    label: "Plan change / cancelled hang",
    blurb: "Logistics read as personal discard.",
    detect: "Plans shifted and my body filed it under rejection.",
    system: "Schedule change → attachment threat",
  },
  {
    id: "preemptive_exit",
    label: "Urge to pre-abandon",
    blurb: "Leave first so it hurts less.",
    detect: "I’m planning the exit speech before anything is wrong.",
    system: "Preemptive exile · control via leaving",
  },
  {
    id: "comparison_spiral",
    label: "Comparison / I’m too intense vs others",
    blurb: "Other people seem easier to love.",
    detect: "I’m measuring myself against a calmer fictional rival.",
    system: "Ranked worthiness · intensity as liability",
  },
  {
    id: "custom",
    label: "Custom trigger",
    blurb: "Name the detector.",
    detect: "Something specific lit the “too much” fuse.",
    system: "User-named detector",
  },
  {
    id: "undecided",
    label: "Not sealed",
    blurb: "Fail-closed.",
    detect: "—",
    system: "—",
  },
] as const;

export const TOO_MUCH_INTENSITIES: readonly TooMuchIntensity[] = [
  {
    id: "whisper",
    label: "Whisper",
    blurb: "Story starting. Still room to choose.",
    containmentTrack: "standard",
  },
  {
    id: "activated",
    label: "Activated",
    blurb: "Body online. Words getting sticky.",
    containmentTrack: "standard",
  },
  {
    id: "high",
    label: "High",
    blurb: "Hard to think. Need the panic room.",
    containmentTrack: "standard",
  },
  {
    id: "flooded",
    label: "Flooded",
    blurb: "Soft Signal free. Minimal words. Body only.",
    containmentTrack: "flood",
  },
  {
    id: "undecided",
    label: "Not sealed",
    blurb: "Fail-closed.",
    containmentTrack: "standard",
  },
] as const;

/** Standard track — full autistic precision. */
export const CONTAINMENT_SCRIPT_STANDARD: readonly string[] = [
  "DOOR SEALED. You are in the panic room. Soft Signal is free and does not mean you failed.",
  "Orient: name five things you can see (or feel under the blanket). No performance.",
  "Feet on floor or weight on mattress. Gravity is allowed to hold you.",
  "Name the detector out loud or in text: “My brain says I am too much / they will leave.”",
  "Separate: detector ≠ court verdict. Stories can fire without being true.",
  "Breathe out longer than in, three times, if you can. Skip if you can’t — no grade.",
  "Hands: press palms together or hold a pillow. Deep pressure is a tool, not a personality.",
  "You do not have to fix the relationship, send the perfect text, or become smaller in this minute.",
  "Optional: place the phone face-down for 60 seconds. The room still holds.",
  "Exit when ready: Soft Signal, reassurance ritual, or stay. All valid.",
] as const;

/** Flood track — minimal cognitive load. */
export const CONTAINMENT_SCRIPT_FLOOD: readonly string[] = [
  "Flood track. Soft Signal is free. No essays required.",
  "Blanket. Weight. Floor. Pick one.",
  "Story can wait. Body first.",
  "Out-breath if available. Skip if not.",
  "You are allowed to stop everything with Soft Signal.",
  "When words return: name the detector. Until then: stay.",
] as const;

/** @deprecated use CONTAINMENT_SCRIPT_STANDARD */
export const CONTAINMENT_SCRIPT = CONTAINMENT_SCRIPT_STANDARD;

export const REASSURANCE_LINES: readonly string[] = [
  "Needing connection does not make you too much.",
  "A real partner can hold “I need reassurance” without vanishing.",
  "You are allowed to take up space in a room and in a bond.",
  "Fear of abandonment is information, not a prophecy.",
  "Soft Signal is not proof you ruined love.",
  "You can be intense and still be worthy of staying-for.",
  "Asking for more hold is not a character flaw; it is data.",
  "“Too much” is often “not enough safety yet.”",
  "Your nervous system is doing protection math. That is not the same as truth.",
  "You can be messy mid-spiral and still be lovable mid-spiral.",
] as const;

export const REASSURANCE_FLOOD: readonly string[] = [
  "Soft Signal free. You are not required to be articulate.",
  "Intensity is not a crime.",
  "Stay. Or leave with Soft Signal. Both allowed.",
  "You are not too much for needing a room.",
] as const;

export type RecommendedProtocol =
  | "attachment-repair"
  | "interest-re"
  | "spooning"
  | "conflict-sim"
  | "soft-signal"
  | "none";

export const TOO_MUCH_COPY = {
  banner:
    "This is currently a personal emotional containment system, not a public product.",
  title: "I'm Too Much / Fear of Abandonment",
  tagline:
    "Because “too much” is a story the body tells when it is afraid of being left.",
  purpose:
    "Maximum autism on the abandonment detector: dense triggers, dual containment tracks, adaptive reassurance, private pattern analytics — so raw spiral is less likely to hit Renn first.",
  softSignal:
    "Soft Signal is God Mode in this room. Lit at all times. No questions. No TED talk.",
  panicRoom:
    "Safe panic room: sealed door, soft walls, Soft Signal always lit, no performance required to stay.",
  doorSeal: "DOOR SEALED · PANIC ROOM ACTIVE · SOFT SIGNAL LIT",
  comedy:
    "I built a panic room with pattern analytics for my abandonment detector. That’s either broken or brilliant. Both fine.",
  notScore:
    "Pattern tracking is local and private. It is never a neediness score, never discovery-visible, never proof you are “too much.”",
} as const;

export type TooMuchSealDraft = {
  triggerId: TooMuchTriggerId;
  /** Optional secondary co-triggers (max useful: a few) */
  coTriggers: TooMuchTriggerId[];
  intensityId: TooMuchIntensityId;
  bodySpot: TooMuchBodySpot;
  storySentence: string;
  customTriggerNote: string;
  softSignalAcknowledged: boolean;
  /** “I will not send a raw dump for 20 minutes” voluntary delay */
  delayDumpPledge: boolean;
};

export type TooMuchSnapshot = {
  id: string;
  protocolVersion: typeof TOO_MUCH_VERSION;
  sealedAt: string;
  triggerId: Exclude<TooMuchTriggerId, "undecided">;
  coTriggers: TooMuchTriggerId[];
  intensityId: Exclude<TooMuchIntensityId, "undecided">;
  bodySpot: TooMuchBodySpot;
  storySentence: string;
  customTriggerNote: string;
  softSignalAcknowledged: true;
  delayDumpPledge: boolean;
  containmentTrack: "standard" | "flood";
};

export type TooMuchEndReason = "completed" | "soft_signal" | "abandoned";

export type TooMuchDebrief = {
  stillFlooded: boolean;
  note: string;
  ledgerNamedStory: boolean;
  ledgerDidNotDumpRaw: boolean;
  ledgerSoftSignalOk: boolean;
  ledgerNotTooMuchVerdict: boolean;
  ledgerUsedRoomWithoutShame: boolean;
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
  no_dump_count: number;
  top_triggers: { id: TooMuchTriggerId; count: number; label: string }[];
  last_7_days: number;
  last_30_days: number;
  /** Consecutive recent runs that named story without dump (capped lookback) */
  named_without_dump_streak: number;
  recommended_protocol: RecommendedProtocol;
  recommended_reason: string;
};

export function defaultTooMuchDraft(): TooMuchSealDraft {
  return {
    triggerId: "undecided",
    coTriggers: [],
    intensityId: "undecided",
    bodySpot: "unknown",
    storySentence: "",
    customTriggerNote: "",
    softSignalAcknowledged: false,
    delayDumpPledge: true,
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
    ledgerUsedRoomWithoutShame: true,
  };
}

export function containmentScriptFor(
  track: "standard" | "flood",
): readonly string[] {
  return track === "flood"
    ? CONTAINMENT_SCRIPT_FLOOD
    : CONTAINMENT_SCRIPT_STANDARD;
}

export function reassuranceFor(
  track: "standard" | "flood",
): readonly string[] {
  return track === "flood" ? REASSURANCE_FLOOD : REASSURANCE_LINES;
}

export function canEnterPanicRoom(draft: TooMuchSealDraft): {
  ok: boolean;
  reason: string;
} {
  if (!draft.softSignalAcknowledged) {
    return {
      ok: false,
      reason: "Acknowledge Soft Signal is free before sealing the door.",
    };
  }
  if (draft.triggerId === "undecided") {
    return { ok: false, reason: "Name the primary detection trigger." };
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
  if (
    draft.intensityId !== "flooded" &&
    draft.storySentence.trim().length < 3
  ) {
    return {
      ok: false,
      reason: "One sentence story: “My brain says…” (flooded can skip).",
    };
  }
  return { ok: true, reason: "Door can seal. Soft Signal lit." };
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
  const intensity = findIntensity(draft.intensityId);
  const story =
    draft.intensityId === "flooded" && draft.storySentence.trim().length < 3
      ? "(flooded — story unnamed)"
      : draft.storySentence.trim().slice(0, 500);
  const co = draft.coTriggers
    .filter((t) => t !== "undecided" && t !== draft.triggerId)
    .slice(0, 4);
  return {
    id: opts?.id ?? `too-much-${Date.now()}`,
    protocolVersion: TOO_MUCH_VERSION,
    sealedAt: opts?.sealedAt ?? new Date().toISOString(),
    triggerId: draft.triggerId,
    coTriggers: co,
    intensityId: draft.intensityId,
    bodySpot: draft.bodySpot,
    storySentence: story,
    customTriggerNote: draft.customTriggerNote.trim().slice(0, 300),
    softSignalAcknowledged: true,
    delayDumpPledge: Boolean(draft.delayDumpPledge),
    containmentTrack: intensity.containmentTrack,
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
    case "link_cathedral":
      return "Open Attachment Repair Cathedral";
    case "link_interest_re":
      return "Open Interest Reverse Engineering";
    default:
      return "None";
  }
}

export function suggestedMoves(
  intensity: TooMuchIntensityId,
  trigger: TooMuchTriggerId,
): TooMuchMoveId[] {
  const base: TooMuchMoveId[] =
    intensity === "flooded"
      ? ["soft_signal", "stay_in_room", "alone_ok"]
      : intensity === "high"
        ? ["stay_in_room", "reassurance", "soft_signal", "alone_ok"]
        : [
            "reassurance",
            "stay_in_room",
            "alone_ok",
            "reach_small",
            "soft_signal",
          ];
  if (
    trigger === "after_i_asked" ||
    trigger === "after_i_shared" ||
    trigger === "praise_trap"
  ) {
    return [...base, "link_cathedral"];
  }
  if (trigger === "after_conflict" || trigger === "preemptive_exit") {
    return [...base, "link_interest_re", "link_cathedral"];
  }
  return base;
}

export function toggleCoTrigger(
  list: TooMuchTriggerId[],
  id: TooMuchTriggerId,
): TooMuchTriggerId[] {
  if (id === "undecided" || id === "custom") return list;
  if (list.includes(id)) return list.filter((x) => x !== id);
  return [...list, id].slice(0, 4);
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
          ledgerUsedRoomWithoutShame: Boolean(
            debrief.ledgerUsedRoomWithoutShame,
          ),
        }
      : null,
  };
}

export function recommendProtocol(
  entries: TooMuchHistoryEntry[],
): { protocol: RecommendedProtocol; reason: string } {
  if (entries.length === 0) {
    return {
      protocol: "none",
      reason: "No runs yet. Panic room is available without homework.",
    };
  }
  const recent = entries.slice(0, 8);
  const counts = new Map<TooMuchTriggerId, number>();
  for (const e of recent) {
    counts.set(
      e.snapshot.triggerId,
      (counts.get(e.snapshot.triggerId) ?? 0) + 1,
    );
  }
  let top: TooMuchTriggerId = recent[0]!.snapshot.triggerId;
  let topN = 0;
  for (const [id, n] of counts) {
    if (n > topN) {
      top = id;
      topN = n;
    }
  }
  if (top === "after_conflict" || top === "preemptive_exit") {
    return {
      protocol: "conflict-sim",
      reason: `Recent pattern: ${findTrigger(top).label} — Conflict Sim may help rehearse without dumping.`,
    };
  }
  if (
    top === "after_i_asked" ||
    top === "after_i_shared" ||
    top === "morning_exit"
  ) {
    return {
      protocol: "attachment-repair",
      reason: `Recent pattern: ${findTrigger(top).label} — Cathedral reassurance may fit.`,
    };
  }
  if (top === "praise_trap" || top === "comparison_spiral") {
    return {
      protocol: "interest-re",
      reason: `Recent pattern: ${findTrigger(top).label} — reverse-engineer want vs should.`,
    };
  }
  if (top === "after_soft_signal") {
    return {
      protocol: "soft-signal",
      reason: "Soft Signal hangover is common — practice freeness without shame.",
    };
  }
  if (top === "quiet_room" || top === "delayed_reply") {
    return {
      protocol: "spooning",
      reason: "Connection hunger with silence — Spooning / hold protocols may co-regulate.",
    };
  }
  return {
    protocol: "attachment-repair",
    reason: "Default cross-link: Attachment Repair for abandonment / too-much themes.",
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
  let noDump = 0;
  let last7 = 0;
  let last30 = 0;

  for (const e of entries) {
    const id = e.snapshot.triggerId;
    triggerCounts.set(id, (triggerCounts.get(id) ?? 0) + 1);
    if (e.snapshot.intensityId === "flooded") flooded += 1;
    if (e.endReason === "soft_signal") soft += 1;
    if (e.debrief?.ledgerNamedStory) named += 1;
    if (e.debrief?.ledgerDidNotDumpRaw) noDump += 1;
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
    .slice(0, 6);

  let streak = 0;
  for (const e of entries) {
    if (e.debrief?.ledgerNamedStory && e.debrief?.ledgerDidNotDumpRaw) {
      streak += 1;
    } else {
      break;
    }
  }

  const rec = recommendProtocol(entries);

  return {
    total: entries.length,
    flooded_count: flooded,
    soft_signal_count: soft,
    named_story_count: named,
    no_dump_count: noDump,
    top_triggers: top,
    last_7_days: last7,
    last_30_days: last30,
    named_without_dump_streak: streak,
    recommended_protocol: rec.protocol,
    recommended_reason: rec.reason,
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
    const intensityId =
      (snap.intensityId as TooMuchSnapshot["intensityId"]) ?? "activated";
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
        coTriggers: Array.isArray(snap.coTriggers)
          ? (snap.coTriggers as TooMuchTriggerId[]).slice(0, 4)
          : [],
        intensityId,
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
        delayDumpPledge: snap.delayDumpPledge !== false,
        containmentTrack:
          snap.containmentTrack === "flood"
            ? "flood"
            : findIntensity(intensityId).containmentTrack,
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
