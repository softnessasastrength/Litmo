/**
 * Aftercare Protocol — post-anything regulation without partner tax.
 * Containment job: land the plane after touch/conflict/flood/good news.
 * Soft Signal free. Optional partner line never auto-sent.
 */
export const AFTERCARE_VERSION = "0.1" as const;

export type AftercareModeId =
  | "after_touch"
  | "after_conflict"
  | "after_flood"
  | "after_good_thing"
  | "after_build_spiral"
  | "undecided";

export type AftercareMode = {
  id: AftercareModeId;
  label: string;
  blurb: string;
  steps: readonly string[];
  denserSteps: readonly string[];
};

export const AFTERCARE_MODES: readonly AftercareMode[] = [
  {
    id: "after_touch",
    label: "After touch / closeness",
    blurb: "Bodies were near. Nervous systems need landing gear.",
    steps: [
      "Soft Signal free — aftercare is not a trap.",
      "Water / bathroom / blanket without apology.",
      "One sentence of what felt good (or skip).",
      "Name capacity for more talk: now · later · not today.",
      "Exit without making distance a verdict.",
    ],
    denserSteps: [
      "Ceremony: hand on heart — I am allowed to land.",
      "Optional: thank the body without scoring the scene.",
      "If shame arrives: name it as weather, not proof.",
    ],
  },
  {
    id: "after_conflict",
    label: "After conflict / hard talk",
    blurb: "Words happened. Bodies may still be braced.",
    steps: [
      "Soft Signal free. No forced postmortem.",
      "Feet on floor. Longer exhale than inhale ×3.",
      "One care sentence or silence — both valid.",
      "If still flooded: Structured Pause, not more essays.",
      "Book repair later if needed (time-boxed).",
    ],
    denserSteps: [
      "Name: conflict ≠ exile.",
      "Release prosecutor-brain for 10 minutes on purpose.",
      "Optional Soft Return line saved offline, never auto-sent.",
    ],
  },
  {
    id: "after_flood",
    label: "After flood / too-much spiral",
    blurb: "You went underwater. Landing is the win.",
    steps: [
      "Soft Signal free. You already survived the peak.",
      "No processing essays for 20 minutes.",
      "Water · food · cold face · lo-fi — pick one.",
      "Delay-dump pledge: no raw dump while flooded.",
      "When quieter: optional debrief in the Lab.",
    ],
    denserSteps: [
      "Name: intensity ≠ unlovable.",
      "If urge to text peaks: Pre-Renn Gate first.",
    ],
  },
  {
    id: "after_good_thing",
    label: "After a good thing",
    blurb: "Joy can also dysregulate. Landing still matters.",
    steps: [
      "Soft Signal free even after good news.",
      "Let the good land without immediately auditing it.",
      "Optional: one gratitude sentence to self.",
      "Notice urge to sabotage / pre-abandon.",
      "Rest is allowed after joy.",
    ],
    denserSteps: [
      "Ceremony: I can receive good without earning it.",
      "If fear-of-loss arrives: dual-bind ritual is available.",
    ],
  },
  {
    id: "after_build_spiral",
    label: "After build spiral (Option A hangover)",
    blurb: "You poured fear into code. Now re-enter the body.",
    steps: [
      "Soft Signal free from the cathedral too.",
      "Close the laptop on purpose for N minutes.",
      "Name: building was containment, not failure.",
      "One non-code need (water, walk, stretch, food).",
      "Optional: urge log in Dojo, then stop.",
    ],
    denserSteps: [
      "Bless the work without making it the only self.",
      "If {{PARTNER}}-adjacent guilt: Pre-Renn Gate, not a dump essay.",
    ],
  },
  {
    id: "undecided",
    label: "Not sealed",
    blurb: "Fail-closed.",
    steps: [],
    denserSteps: [],
  },
] as const;

export type AftercareDraft = {
  modeId: AftercareModeId;
  softSignalAcknowledged: boolean;
  partnerLine: string;
};

export type AftercareSnapshot = {
  id: string;
  version: typeof AFTERCARE_VERSION;
  sealedAt: string;
  modeId: Exclude<AftercareModeId, "undecided">;
  denser: boolean;
  partnerLine: string;
};

export type AftercareEntry = {
  snapshot: AftercareSnapshot;
  stepsDone: number;
  endedAt: string;
  endReason: "completed" | "soft_signal" | "abandoned";
  feltSettled: boolean;
  note: string;
};

export function findAftercare(id: AftercareModeId): AftercareMode {
  return (
    AFTERCARE_MODES.find((m) => m.id === id) ??
    AFTERCARE_MODES[AFTERCARE_MODES.length - 1]!
  );
}

export function resolveAftercareSteps(
  mode: AftercareMode,
  denser: boolean,
): readonly string[] {
  if (!denser || mode.denserSteps.length === 0) return mode.steps;
  return [...mode.steps, ...mode.denserSteps];
}

export function canSealAftercare(d: AftercareDraft): {
  ok: boolean;
  reason: string;
} {
  if (!d.softSignalAcknowledged)
    return { ok: false, reason: "Soft Signal free required." };
  if (d.modeId === "undecided")
    return { ok: false, reason: "Pick an aftercare mode." };
  return { ok: true, reason: "Ready." };
}

export function sealAftercare(
  d: AftercareDraft,
  denser = false,
): AftercareSnapshot | null {
  if (!canSealAftercare(d).ok || d.modeId === "undecided") return null;
  return {
    id: `aftercare-${Date.now()}`,
    version: AFTERCARE_VERSION,
    sealedAt: new Date().toISOString(),
    modeId: d.modeId,
    denser: Boolean(denser),
    partnerLine: d.partnerLine.trim().slice(0, 400),
  };
}

export function parseAftercareHistory(raw: unknown): AftercareEntry[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (x) => x && typeof x === "object" && (x as AftercareEntry).snapshot,
  ) as AftercareEntry[];
}

export function summarizeAftercare(entries: AftercareEntry[]) {
  return {
    total: entries.length,
    soft_signal: entries.filter((e) => e.endReason === "soft_signal").length,
    settled: entries.filter((e) => e.feltSettled).length,
  };
}
