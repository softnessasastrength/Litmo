/**
 * Conflict Navigation Simulator v0.1 — shame-of-conflict containment.
 *
 * WHAT: Mode seal, issue name, body check, I-statement draft, moves, Soft Signal, ledger.
 * WHY: Terror of conflict + “I’ve never done this well” shame → runnable practice.
 * CONSENT: Solo sim. Soft Signal free. Not a real partner negotiation seal.
 * NEVER: Grade skill; require winning; public scores; clinical claims.
 * SEE: docs/CONFLICT_NAVIGATION_SIMULATOR.md · docs/REAL_PURPOSE.md
 */

export const CONFLICT_SIM_VERSION = "0.1" as const;
export const CONFLICT_SIM_CORE_VERSION = 1 as const;

export type ConflictModeId =
  | "solo_rehearsal"
  | "soft_signal_first"
  | "flood"
  | "repair_script"
  | "undecided";

export type ConflictIntensityId =
  | "whisper"
  | "normal"
  | "charged"
  | "flooded"
  | "undecided";

export type ConflictMoveId =
  | "ask"
  | "pause_yellow"
  | "soft_signal"
  | "reschedule"
  | "none";

export type ConflictBodySpot =
  | "chest"
  | "throat"
  | "stomach"
  | "jaw"
  | "everywhere"
  | "numb"
  | "unknown";

export type ConflictMode = {
  id: ConflictModeId;
  label: string;
  blurb: string;
};

export type ConflictIntensity = {
  id: ConflictIntensityId;
  label: string;
  blurb: string;
};

export const CONFLICT_MODES: readonly ConflictMode[] = [
  {
    id: "solo_rehearsal",
    label: "Solo Rehearsal",
    blurb: "Practice alone before a real talk. Pillow can play {{PARTNER}} if needed.",
  },
  {
    id: "soft_signal_first",
    label: "Soft Signal First",
    blurb: "Priority is exit/pause, not winning. Leaving is success.",
  },
  {
    id: "flood",
    label: "Flood Protocol",
    blurb: "Already flooded. Minimal steps. Soft Signal free. No essays.",
  },
  {
    id: "repair_script",
    label: "Repair Script",
    blurb: "After a mess: I’m back / I care / I need a do-over.",
  },
  {
    id: "undecided",
    label: "Not sealed",
    blurb: "Fail-closed.",
  },
] as const;

export const CONFLICT_INTENSITIES: readonly ConflictIntensity[] = [
  {
    id: "whisper",
    label: "Whisper",
    blurb: "Low stakes practice. Still counts.",
  },
  {
    id: "normal",
    label: "Normal",
    blurb: "Everyday friction. Scary enough.",
  },
  {
    id: "charged",
    label: "Charged",
    blurb: "Attachment alarms on. Soft Signal armed.",
  },
  {
    id: "flooded",
    label: "Flooded",
    blurb: "Body first. Words optional. Soft Signal God Mode.",
  },
  {
    id: "undecided",
    label: "Not sealed",
    blurb: "Fail-closed.",
  },
] as const;

export const CONFLICT_BODY_SPOTS: readonly {
  id: ConflictBodySpot;
  label: string;
}[] = [
  { id: "chest", label: "Chest" },
  { id: "throat", label: "Throat" },
  { id: "stomach", label: "Stomach" },
  { id: "jaw", label: "Jaw" },
  { id: "everywhere", label: "Everywhere" },
  { id: "numb", label: "Numb / nowhere" },
  { id: "unknown", label: "Unknown" },
];

export type ConflictSealDraft = {
  modeId: ConflictModeId;
  intensityId: ConflictIntensityId;
  softSignalAcknowledged: boolean;
  issueSentence: string;
};

export type ConflictSnapshot = {
  id: string;
  protocolVersion: typeof CONFLICT_SIM_VERSION;
  sealedAt: string;
  modeId: Exclude<ConflictModeId, "undecided">;
  intensityId: Exclude<ConflictIntensityId, "undecided">;
  softSignalAcknowledged: true;
  issueSentence: string;
};

export type ConflictSimState = {
  snapshot: ConflictSnapshot;
  bodySpot: ConflictBodySpot;
  iStatement: string;
  moveId: ConflictMoveId;
  step:
    | "body"
    | "statement"
    | "move"
    | "done";
};

export type ConflictEndReason =
  | "completed"
  | "soft_signal"
  | "reschedule"
  | "abandoned";

export type ConflictDebrief = {
  shameLevel: number | null;
  note: string;
  ledgerNamedWithoutGhosting: boolean;
  ledgerPauseWithoutSelfHate: boolean;
  ledgerSoftSignalOk: boolean;
  ledgerNotProsecutor: boolean;
};

export type ConflictHistoryEntry = {
  snapshot: ConflictSnapshot;
  bodySpot: ConflictBodySpot;
  iStatement: string;
  moveId: ConflictMoveId;
  endedAt: string;
  endReason: ConflictEndReason;
  debrief: ConflictDebrief | null;
};

export const CONFLICT_COPY = {
  banner:
    "This is currently a personal emotional containment system, not a public product.",
  title: "Conflict Navigation Simulator v0.1",
  tagline:
    "Because “we need to talk” still feels like a court summons issued by my childhood.",
  purpose:
    "Practice conflict without dumping raw freeze/fawn/flee onto {{PARTNER}} first. Shame lives here on purpose. Soft Signal free.",
  softSignal: "Soft Signal ends the sim (and the fantasy fight). No TED talk required.",
  comedy:
    "I’ve never successfully navigated conflict — so I built a simulator. That’s either growth or comedy. Both fine.",
  iTemplate:
    "When __ happens, I feel __ in my body, and I need __. I’m not saying you’re bad.",
  repairLines: [
    "I’m back. I care about us.",
    "I got flooded and left the conversation without a map.",
    "I need a do-over when we’re both less flooded.",
    "Soft Signal is allowed next time too.",
  ],
} as const;

export function defaultConflictDraft(): ConflictSealDraft {
  return {
    modeId: "undecided",
    intensityId: "undecided",
    softSignalAcknowledged: false,
    issueSentence: "",
  };
}

export function defaultConflictDebrief(): ConflictDebrief {
  return {
    shameLevel: null,
    note: "",
    ledgerNamedWithoutGhosting: true,
    ledgerPauseWithoutSelfHate: false,
    ledgerSoftSignalOk: true,
    ledgerNotProsecutor: true,
  };
}

export function canSealConflict(draft: ConflictSealDraft): {
  ok: boolean;
  reason: string;
} {
  if (draft.modeId === "undecided") {
    return { ok: false, reason: "Pick a mode (Solo / Soft Signal First / Flood / Repair)." };
  }
  if (draft.intensityId === "undecided") {
    return { ok: false, reason: "Pick intensity (Whisper → Flooded)." };
  }
  if (!draft.softSignalAcknowledged) {
    return {
      ok: false,
      reason: "Acknowledge Soft Signal is free before sealing.",
    };
  }
  if (draft.modeId === "flood") {
    // Flood can seal with almost no words.
    return { ok: true, reason: "Flood sealed. Soft Signal God Mode." };
  }
  if (draft.issueSentence.trim().length < 3) {
    return {
      ok: false,
      reason: "Name the issue in one sentence (even messy counts).",
    };
  }
  return { ok: true, reason: "Simulator sealed. Soft Signal armed." };
}

export function sealConflict(
  draft: ConflictSealDraft,
  opts?: { id?: string; sealedAt?: string },
): ConflictSnapshot | null {
  const gate = canSealConflict(draft);
  if (!gate.ok) return null;
  if (
    draft.modeId === "undecided" ||
    draft.intensityId === "undecided" ||
    !draft.softSignalAcknowledged
  ) {
    return null;
  }
  const issue =
    draft.modeId === "flood" && draft.issueSentence.trim().length < 3
      ? "(flood — issue unnamed)"
      : draft.issueSentence.trim().slice(0, 500);
  return {
    id: opts?.id ?? `conflict-${Date.now()}`,
    protocolVersion: CONFLICT_SIM_VERSION,
    sealedAt: opts?.sealedAt ?? new Date().toISOString(),
    modeId: draft.modeId,
    intensityId: draft.intensityId,
    softSignalAcknowledged: true,
    issueSentence: issue,
  };
}

export function startConflictSim(
  snapshot: ConflictSnapshot,
): ConflictSimState {
  return {
    snapshot,
    bodySpot: "unknown",
    iStatement: "",
    moveId: "none",
    step:
      snapshot.modeId === "flood" || snapshot.modeId === "soft_signal_first"
        ? "move"
        : "body",
  };
}

export function buildIStatement(input: {
  when: string;
  feel: string;
  need: string;
}): string {
  const when = input.when.trim() || "…";
  const feel = input.feel.trim() || "…";
  const need = input.need.trim() || "…";
  return `When ${when} happens, I feel ${feel} in my body, and I need ${need}. I’m not saying you’re bad.`;
}

export function canCompleteSim(state: ConflictSimState): {
  ok: boolean;
  reason: string;
} {
  if (state.moveId === "none") {
    return { ok: false, reason: "Pick a move (ask / pause / Soft Signal / reschedule)." };
  }
  if (
    state.snapshot.modeId === "solo_rehearsal" &&
    state.moveId === "ask" &&
    state.iStatement.trim().length < 8
  ) {
    return {
      ok: false,
      reason: "If the move is ask, draft an I-statement first (template is fine).",
    };
  }
  return { ok: true, reason: "Sim complete-able." };
}

export function completeConflict(
  state: ConflictSimState,
  endReason: ConflictEndReason,
  debrief: ConflictDebrief | null,
): ConflictHistoryEntry {
  return {
    snapshot: state.snapshot,
    bodySpot: state.bodySpot,
    iStatement: state.iStatement.trim().slice(0, 800),
    moveId: state.moveId,
    endedAt: new Date().toISOString(),
    endReason,
    debrief: debrief
      ? {
          shameLevel:
            debrief.shameLevel != null
              ? Math.max(1, Math.min(10, Math.round(debrief.shameLevel)))
              : null,
          note: debrief.note.trim().slice(0, 500),
          ledgerNamedWithoutGhosting: Boolean(
            debrief.ledgerNamedWithoutGhosting,
          ),
          ledgerPauseWithoutSelfHate: Boolean(
            debrief.ledgerPauseWithoutSelfHate,
          ),
          ledgerSoftSignalOk: Boolean(debrief.ledgerSoftSignalOk),
          ledgerNotProsecutor: Boolean(debrief.ledgerNotProsecutor),
        }
      : null,
  };
}

export function findMode(id: ConflictModeId): ConflictMode {
  return (
    CONFLICT_MODES.find((m) => m.id === id) ??
    CONFLICT_MODES[CONFLICT_MODES.length - 1]!
  );
}

export function findIntensity(id: ConflictIntensityId): ConflictIntensity {
  return (
    CONFLICT_INTENSITIES.find((i) => i.id === id) ?? CONFLICT_INTENSITIES[0]!
  );
}

export function summarizeConflictHistory(entries: ConflictHistoryEntry[]): {
  total: number;
  soft_signal: number;
  reschedule: number;
  named_without_ghosting: number;
  not_prosecutor: number;
} {
  return {
    total: entries.length,
    soft_signal: entries.filter((e) => e.endReason === "soft_signal").length,
    reschedule: entries.filter((e) => e.endReason === "reschedule").length,
    named_without_ghosting: entries.filter(
      (e) => e.debrief?.ledgerNamedWithoutGhosting,
    ).length,
    not_prosecutor: entries.filter((e) => e.debrief?.ledgerNotProsecutor)
      .length,
  };
}

export function parseConflictHistory(raw: unknown): ConflictHistoryEntry[] {
  if (!Array.isArray(raw)) return [];
  const out: ConflictHistoryEntry[] = [];
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
      endReason !== "reschedule" &&
      endReason !== "abandoned"
    ) {
      continue;
    }
    out.push({
      snapshot: {
        id: snap.id,
        protocolVersion: CONFLICT_SIM_VERSION,
        sealedAt:
          typeof snap.sealedAt === "string"
            ? snap.sealedAt
            : new Date(0).toISOString(),
        modeId: (snap.modeId as ConflictSnapshot["modeId"]) ?? "solo_rehearsal",
        intensityId:
          (snap.intensityId as ConflictSnapshot["intensityId"]) ?? "normal",
        softSignalAcknowledged: true,
        issueSentence:
          typeof snap.issueSentence === "string"
            ? snap.issueSentence.slice(0, 500)
            : "",
      },
      bodySpot: (e.bodySpot as ConflictBodySpot) ?? "unknown",
      iStatement:
        typeof e.iStatement === "string" ? e.iStatement.slice(0, 800) : "",
      moveId: (e.moveId as ConflictMoveId) ?? "none",
      endedAt: e.endedAt,
      endReason,
      debrief: null,
    });
  }
  return out.slice(0, 50);
}
