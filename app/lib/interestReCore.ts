/**
 * Interest Reverse Engineering v0.1 — “want vs should vs fawn” containment.
 *
 * WHAT: Signal inventory, honesty label, move choice, Soft Signal, debrief ledger.
 * WHY: Externalize ambiguous desire so performance-yes is less likely to hit Renn raw.
 * CONSENT: This is NOT a Consent Snapshot. Interest ≠ consent. Soft Signal free.
 * NEVER: Public scores; weaponize against partner; clinical diagnosis claims.
 * SEE: docs/INTEREST_REVERSE_ENGINEERING.md · docs/REAL_PURPOSE.md
 */

export const INTEREST_RE_VERSION = "0.1" as const;
export const INTEREST_RE_CORE_VERSION = 1 as const;

export type InterestTargetKind =
  | "closeness"
  | "cuddle"
  | "plan"
  | "conversation"
  | "other"
  | "undecided";

export type HonestyLabel =
  | "clear_yes"
  | "clear_no"
  | "performing"
  | "flooded_unknown"
  | "mixed";

export type InterestMoveId =
  | "real_yes"
  | "soft_no"
  | "pause"
  | "soft_signal"
  | "dont_know_yet"
  | "none";

export type InterestTarget = {
  id: InterestTargetKind;
  label: string;
  blurb: string;
};

export const INTEREST_TARGETS: readonly InterestTarget[] = [
  {
    id: "closeness",
    label: "Closeness / intimacy energy",
    blurb: "Being near, held, chosen — not necessarily a specific act.",
  },
  {
    id: "cuddle",
    label: "Cuddle / spoon / morning hold",
    blurb: "Physical co-regulation request.",
  },
  {
    id: "plan",
    label: "A plan / outing / shared future bit",
    blurb: "Calendar desire vs people-pleasing yes.",
  },
  {
    id: "conversation",
    label: "A hard conversation",
    blurb: "Want to talk vs fear of being bad if I don’t.",
  },
  {
    id: "other",
    label: "Other (name it)",
    blurb: "Free-text target.",
  },
  {
    id: "undecided",
    label: "Not sealed",
    blurb: "Fail-closed.",
  },
] as const;

export type InterestSignals = {
  /** Body feels pull / warmth / ease */
  bodyWant: boolean;
  /** Mind is curious / interested without panic */
  mindWant: boolean;
  /** “I should want this” */
  shouldWant: boolean;
  /** Fear of abandonment / being cold / disappointing if I say no */
  fearIfNo: boolean;
  /** Already flooded / shut down */
  flooded: boolean;
  /** Performing for approval */
  performingSuspected: boolean;
  bodyNote: string;
  shouldNote: string;
};

export type InterestSealDraft = {
  targetKind: InterestTargetKind;
  targetNote: string;
  softSignalAcknowledged: boolean;
  signals: InterestSignals;
};

export type HonestyRead = {
  label: HonestyLabel;
  title: string;
  advice: string;
  /** 0–1 rough confidence for UI only — not a score of personhood */
  confidence: number;
};

export type InterestSnapshot = {
  id: string;
  protocolVersion: typeof INTEREST_RE_VERSION;
  sealedAt: string;
  targetKind: Exclude<InterestTargetKind, "undecided">;
  targetNote: string;
  signals: InterestSignals;
  softSignalAcknowledged: true;
  honesty: HonestyRead;
};

export type InterestEndReason =
  | "completed"
  | "soft_signal"
  | "abandoned";

export type InterestDebrief = {
  clarity: number | null;
  note: string;
  ledgerNamedShould: boolean;
  ledgerAllowedDontKnow: boolean;
  ledgerSoftSignalOk: boolean;
  ledgerNotGotcha: boolean;
};

export type InterestHistoryEntry = {
  snapshot: InterestSnapshot;
  moveId: InterestMoveId;
  endedAt: string;
  endReason: InterestEndReason;
  debrief: InterestDebrief | null;
};

export const INTEREST_COPY = {
  banner:
    "This is currently a personal emotional containment system, not a public product.",
  title: "Interest Reverse Engineering v0.1",
  tagline:
    "Because “I want to” and “I should want to” both say “sure” with the same mouth.",
  purpose:
    "Sort body / mind / should / fear so a performance-yes is less likely to hit {{PARTNER}} without a map. Interest is not consent. Soft Signal free.",
  softSignal: "Soft Signal ends the sim. No TED talk. No proof you are cold.",
  comedy:
    "I reverse-engineered my own interest because vibes were lying. Comedy gold. Also load-bearing.",
  notConsent:
    "This protocol does not grant touch, plans, or conversation. It only names signals.",
} as const;

export function defaultSignals(): InterestSignals {
  return {
    bodyWant: false,
    mindWant: false,
    shouldWant: false,
    fearIfNo: false,
    flooded: false,
    performingSuspected: false,
    bodyNote: "",
    shouldNote: "",
  };
}

export function defaultInterestDraft(): InterestSealDraft {
  return {
    targetKind: "undecided",
    targetNote: "",
    softSignalAcknowledged: false,
    signals: defaultSignals(),
  };
}

export function defaultInterestDebrief(): InterestDebrief {
  return {
    clarity: null,
    note: "",
    ledgerNamedShould: true,
    ledgerAllowedDontKnow: false,
    ledgerSoftSignalOk: true,
    ledgerNotGotcha: true,
  };
}

export function canSealInterest(draft: InterestSealDraft): {
  ok: boolean;
  reason: string;
} {
  if (draft.targetKind === "undecided") {
    return { ok: false, reason: "Name what you are reverse-engineering." };
  }
  if (
    draft.targetKind === "other" &&
    draft.targetNote.trim().length < 2
  ) {
    return { ok: false, reason: "Other needs a short name." };
  }
  if (!draft.softSignalAcknowledged) {
    return {
      ok: false,
      reason: "Acknowledge Soft Signal is free before sealing.",
    };
  }
  const s = draft.signals;
  const any =
    s.bodyWant ||
    s.mindWant ||
    s.shouldWant ||
    s.fearIfNo ||
    s.flooded ||
    s.performingSuspected ||
    s.bodyNote.trim().length > 0 ||
    s.shouldNote.trim().length > 0;
  if (!any) {
    return {
      ok: false,
      reason: "Mark at least one signal (even “flooded” counts).",
    };
  }
  return { ok: true, reason: "Ready to reverse-engineer." };
}

/**
 * WHAT: Map signal inventory → honesty label (deterministic, conservative).
 * WHY: Prefer naming performance / flood over forcing a fake clear yes.
 */
export function computeHonesty(signals: InterestSignals): HonestyRead {
  if (signals.flooded) {
    return {
      label: "flooded_unknown",
      title: "Flooded — unknown",
      advice:
        "Body is too loud to reverse-engineer cleanly. Soft Signal / pause. Knowing can wait.",
      confidence: 0.75,
    };
  }

  const pull = (signals.bodyWant ? 1 : 0) + (signals.mindWant ? 1 : 0);
  const pressure =
    (signals.shouldWant ? 1 : 0) +
    (signals.fearIfNo ? 1 : 0) +
    (signals.performingSuspected ? 1 : 0);

  if (pull === 0 && pressure >= 1) {
    return {
      label: "performing",
      title: "Performing interest suspected",
      advice:
        "Should/fear is doing the talking. A soft no or pause protects both of you more than a fake yes.",
      confidence: 0.7,
    };
  }

  if (pull === 0 && pressure === 0) {
    return {
      label: "clear_no",
      title: "No clear want signal",
      advice:
        "Nothing is lighting up as want. “No” or “not now” is information, not cruelty.",
      confidence: 0.55,
    };
  }

  if (pull >= 1 && pressure === 0) {
    return {
      label: "clear_yes",
      title: "Clear-ish yes",
      advice:
        "Body/mind pull without heavy should/fear. Still not automatic consent — name the ask specifically.",
      confidence: 0.65,
    };
  }

  if (pull >= 1 && pressure >= 1) {
    // Mixed: real pull + pressure
    if (signals.performingSuspected && !signals.bodyWant) {
      return {
        label: "performing",
        title: "Mind may be performing",
        advice:
          "Mind or should is active without body. Slow down. Don’t ship a yes from the approval department alone.",
        confidence: 0.6,
      };
    }
    return {
      label: "mixed",
      title: "Mixed parts",
      advice:
        "Want and should/fear are both online. Time-box: decide later, or choose a smaller yes. Ambiguity allowed.",
      confidence: 0.5,
    };
  }

  return {
    label: "mixed",
    title: "Mixed / incomplete",
    advice: "Not enough clarity. Pause is a valid move.",
    confidence: 0.4,
  };
}

export function sealInterest(
  draft: InterestSealDraft,
  opts?: { id?: string; sealedAt?: string },
): InterestSnapshot | null {
  const gate = canSealInterest(draft);
  if (!gate.ok) return null;
  if (draft.targetKind === "undecided" || !draft.softSignalAcknowledged) {
    return null;
  }
  const signals: InterestSignals = {
    ...draft.signals,
    bodyNote: draft.signals.bodyNote.trim().slice(0, 400),
    shouldNote: draft.signals.shouldNote.trim().slice(0, 400),
  };
  return {
    id: opts?.id ?? `interest-${Date.now()}`,
    protocolVersion: INTEREST_RE_VERSION,
    sealedAt: opts?.sealedAt ?? new Date().toISOString(),
    targetKind: draft.targetKind,
    targetNote: draft.targetNote.trim().slice(0, 300),
    signals,
    softSignalAcknowledged: true,
    honesty: computeHonesty(signals),
  };
}

export function suggestedMoves(label: HonestyLabel): InterestMoveId[] {
  switch (label) {
    case "clear_yes":
      return ["real_yes", "pause", "dont_know_yet", "soft_signal"];
    case "clear_no":
      return ["soft_no", "pause", "dont_know_yet", "soft_signal"];
    case "performing":
      return ["soft_no", "pause", "dont_know_yet", "soft_signal"];
    case "flooded_unknown":
      return ["soft_signal", "pause", "dont_know_yet"];
    case "mixed":
      return ["pause", "dont_know_yet", "real_yes", "soft_no", "soft_signal"];
    default:
      return ["pause", "soft_signal"];
  }
}

export function moveLabel(id: InterestMoveId): string {
  switch (id) {
    case "real_yes":
      return "Real yes (still needs specific ask)";
    case "soft_no":
      return "Soft no / not now";
    case "pause":
      return "Pause — decide later";
    case "soft_signal":
      return "Soft Signal · exit sim";
    case "dont_know_yet":
      return "I don’t know yet (valid)";
    default:
      return "None";
  }
}

export function completeInterest(
  snapshot: InterestSnapshot,
  moveId: InterestMoveId,
  endReason: InterestEndReason,
  debrief: InterestDebrief | null,
): InterestHistoryEntry {
  return {
    snapshot,
    moveId,
    endedAt: new Date().toISOString(),
    endReason,
    debrief: debrief
      ? {
          clarity:
            debrief.clarity != null
              ? Math.max(1, Math.min(10, Math.round(debrief.clarity)))
              : null,
          note: debrief.note.trim().slice(0, 500),
          ledgerNamedShould: Boolean(debrief.ledgerNamedShould),
          ledgerAllowedDontKnow: Boolean(debrief.ledgerAllowedDontKnow),
          ledgerSoftSignalOk: Boolean(debrief.ledgerSoftSignalOk),
          ledgerNotGotcha: Boolean(debrief.ledgerNotGotcha),
        }
      : null,
  };
}

export function findTarget(id: InterestTargetKind): InterestTarget {
  return (
    INTEREST_TARGETS.find((t) => t.id === id) ??
    INTEREST_TARGETS[INTEREST_TARGETS.length - 1]!
  );
}

export function summarizeInterestHistory(entries: InterestHistoryEntry[]): {
  total: number;
  performing: number;
  soft_signal: number;
  dont_know: number;
  named_should: number;
} {
  return {
    total: entries.length,
    performing: entries.filter((e) => e.snapshot.honesty.label === "performing")
      .length,
    soft_signal: entries.filter((e) => e.endReason === "soft_signal").length,
    dont_know: entries.filter((e) => e.moveId === "dont_know_yet").length,
    named_should: entries.filter((e) => e.debrief?.ledgerNamedShould).length,
  };
}

export function parseInterestHistory(raw: unknown): InterestHistoryEntry[] {
  if (!Array.isArray(raw)) return [];
  const out: InterestHistoryEntry[] = [];
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
    const honesty = snap.honesty as Record<string, unknown> | undefined;
    out.push({
      snapshot: {
        id: snap.id,
        protocolVersion: INTEREST_RE_VERSION,
        sealedAt:
          typeof snap.sealedAt === "string"
            ? snap.sealedAt
            : new Date(0).toISOString(),
        targetKind:
          (snap.targetKind as InterestSnapshot["targetKind"]) ?? "other",
        targetNote:
          typeof snap.targetNote === "string"
            ? snap.targetNote.slice(0, 300)
            : "",
        signals: defaultSignals(),
        softSignalAcknowledged: true,
        honesty: {
          label: (honesty?.label as HonestyLabel) ?? "mixed",
          title: typeof honesty?.title === "string" ? honesty.title : "mixed",
          advice:
            typeof honesty?.advice === "string" ? honesty.advice : "",
          confidence:
            typeof honesty?.confidence === "number" ? honesty.confidence : 0.4,
        },
      },
      moveId: (e.moveId as InterestMoveId) ?? "none",
      endedAt: e.endedAt,
      endReason,
      debrief: null,
    });
  }
  return out.slice(0, 50);
}
