/**
 * Post-Fight Reconciliation Simulator — 5 repair archetypes.
 * Soft Signal free. Practice only; not a real partner negotiation seal.
 */
export const RECONCILE_VERSION = "0.1" as const;

export type RepairArchetypeId =
  | "accountable_repair"
  | "soft_return"
  | "structured_pause"
  | "body_first"
  | "comic_relief"
  | "undecided";

export type RepairArchetype = {
  id: RepairArchetypeId;
  label: string;
  blurb: string;
  steps: readonly string[];
  sampleLine: string;
};

export const REPAIR_ARCHETYPES: readonly RepairArchetype[] = [
  {
    id: "accountable_repair",
    label: "Accountable Repair",
    blurb: "Name impact without self-annihilation or prosecution.",
    steps: [
      "Soft Signal free for both.",
      "Name the friction in one sentence (no character assassination).",
      "Own your slice only — not the whole weather system.",
      "Ask what would help now (time, words, space).",
      "Confirm Soft Signal still free after the ask.",
    ],
    sampleLine:
      "I see that hurt. Here's my part. What would help you feel safer with me right now?",
  },
  {
    id: "soft_return",
    label: "Soft Return",
    blurb: "Come back after freeze without a trial.",
    steps: [
      "I'm back. Soft Signal free.",
      "No full postmortem required to re-enter.",
      "One sentence of care.",
      "Optional later talk time-box.",
      "Exit if flooded.",
    ],
    sampleLine:
      "I'm back. I care about us. We can talk later if we want — Soft Signal free either way.",
  },
  {
    id: "structured_pause",
    label: "Structured Pause",
    blurb: "Stop the fight without ghosting the bond.",
    steps: [
      "Name: we are pausing, not ending.",
      "Set a when (or Soft Signal forever free).",
      "Each person gets a regulation job (walk, water, alone).",
      "No scorekeeping texts mid-pause.",
      "Return ritual: one check-in question only.",
    ],
    sampleLine:
      "I need a pause so I don't say something cruel. Can we return at ___? Soft Signal free.",
  },
  {
    id: "body_first",
    label: "Body-First Repair",
    blurb: "Regulate before narrative (non-touch or consented touch).",
    steps: [
      "No debate until bodies are less flooded.",
      "Parallel silence / water / feet on floor.",
      "Optional consented proximity (not assumed).",
      "Then one sentence each.",
      "Soft Signal free entire time.",
    ],
    sampleLine:
      "I can't do words well yet. Can we sit near each other quietly for five minutes first?",
  },
  {
    id: "comic_relief",
    label: "Comic Relief Repair",
    blurb: "Humor as de-escalation — never as mockery of pain.",
    steps: [
      "Consent to humor (or skip).",
      "Name the absurdity of the fight, not the person.",
      "One joke that includes yourself.",
      "Return to care sentence.",
      "If humor fails: Soft Signal, switch archetype.",
    ],
    sampleLine:
      "We just built a small civil war over ___ and I still want you. Soft Signal free. Want a reset?",
  },
  {
    id: "undecided",
    label: "Not sealed",
    blurb: "Fail-closed.",
    steps: [],
    sampleLine: "",
  },
] as const;

export type ReconcileDraft = {
  archetypeId: RepairArchetypeId;
  fightNote: string;
  softSignalAcknowledged: boolean;
};

export type ReconcileSnapshot = {
  id: string;
  version: typeof RECONCILE_VERSION;
  sealedAt: string;
  archetypeId: Exclude<RepairArchetypeId, "undecided">;
  fightNote: string;
};

export type ReconcileEntry = {
  snapshot: ReconcileSnapshot;
  stepsDone: number;
  endedAt: string;
  endReason: "completed" | "soft_signal" | "abandoned";
  note: string;
};

export function findArchetype(id: RepairArchetypeId): RepairArchetype {
  return (
    REPAIR_ARCHETYPES.find((a) => a.id === id) ??
    REPAIR_ARCHETYPES[REPAIR_ARCHETYPES.length - 1]!
  );
}

export function canSealReconcile(d: ReconcileDraft): {
  ok: boolean;
  reason: string;
} {
  if (!d.softSignalAcknowledged)
    return { ok: false, reason: "Soft Signal must be free." };
  if (d.archetypeId === "undecided")
    return { ok: false, reason: "Pick a repair archetype." };
  if (d.fightNote.trim().length < 2)
    return { ok: false, reason: "Name the fight in a short note (even messy)." };
  return { ok: true, reason: "Ready." };
}

export function sealReconcile(d: ReconcileDraft): ReconcileSnapshot | null {
  if (!canSealReconcile(d).ok || d.archetypeId === "undecided") return null;
  return {
    id: `reconcile-${Date.now()}`,
    version: RECONCILE_VERSION,
    sealedAt: new Date().toISOString(),
    archetypeId: d.archetypeId,
    fightNote: d.fightNote.trim().slice(0, 400),
  };
}

export function parseReconcileHistory(raw: unknown): ReconcileEntry[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (x) => x && typeof x === "object" && (x as ReconcileEntry).snapshot,
  ) as ReconcileEntry[];
}

export function summarizeReconcile(entries: ReconcileEntry[]) {
  const by = new Map<string, number>();
  for (const e of entries) {
    by.set(e.snapshot.archetypeId, (by.get(e.snapshot.archetypeId) ?? 0) + 1);
  }
  return {
    total: entries.length,
    soft_signal: entries.filter((e) => e.endReason === "soft_signal").length,
    by_archetype: [...by.entries()].map(([id, count]) => ({
      id,
      count,
      label: findArchetype(id as RepairArchetypeId).label,
    })),
  };
}
