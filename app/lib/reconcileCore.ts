/**
 * Post-Fight Reconciliation Simulator — 5 repair archetypes.
 * Soft Signal free. Practice only; not a real partner negotiation seal.
 * v0.2: denser ceremony steps under Emotional Masochist Mode.
 */
export const RECONCILE_VERSION = "0.2" as const;

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
  /** When this archetype is the right tool */
  whenToUse: string;
  /** Anti-pattern — do not use this as */
  antiPattern: string;
  steps: readonly string[];
  /** Extra ceremony steps when Emotional Masochist Mode denserScripts is on */
  denserSteps: readonly string[];
  sampleLine: string;
};

export const REPAIR_ARCHETYPES: readonly RepairArchetype[] = [
  {
    id: "accountable_repair",
    label: "Accountable Repair",
    blurb: "Name impact without self-annihilation or prosecution.",
    whenToUse: "You can name your slice; the other person is regulated enough to hear it.",
    antiPattern: "Not a confession booth for total self-erasure. Not a trial.",
    steps: [
      "Soft Signal free for both.",
      "Name the friction in one sentence (no character assassination).",
      "Own your slice only — not the whole weather system.",
      "Ask what would help now (time, words, space).",
      "Confirm Soft Signal still free after the ask.",
    ],
    denserSteps: [
      "Hand on heart (yours): I am allowed to have a part without being the villain.",
      "Speak the impact you fear you caused — then stop before spiraling into infinite guilt essays.",
      "Offer one concrete repair action (not a personality transplant).",
      "Ask for one concrete need from them (not a test).",
      "Seal: both Soft Signal free · bond not on trial.",
    ],
    sampleLine:
      "I see that hurt. Here's my part. What would help you feel safer with me right now?",
  },
  {
    id: "soft_return",
    label: "Soft Return",
    blurb: "Come back after freeze without a trial.",
    whenToUse: "You disappeared into freeze/shutdown and need re-entry without a postmortem tax.",
    antiPattern: "Not a free pass forever. Not a demand that they pretend nothing happened.",
    steps: [
      "I'm back. Soft Signal free.",
      "No full postmortem required to re-enter.",
      "One sentence of care.",
      "Optional later talk time-box.",
      "Exit if flooded.",
    ],
    denserSteps: [
      "Name the freeze without drama: I went offline. I am online again.",
      "Offer a 10-minute re-entry window (or Soft Signal free to decline).",
      "One care sentence only — no essay.",
      "Book a later repair talk if needed (time-boxed).",
      "Bless the return: presence is allowed after absence.",
    ],
    sampleLine:
      "I'm back. I care about us. We can talk later if we want — Soft Signal free either way.",
  },
  {
    id: "structured_pause",
    label: "Structured Pause",
    blurb: "Stop the fight without ghosting the bond.",
    whenToUse: "Flooded, cruel words rising, or both of you are performing instead of connecting.",
    antiPattern: "Not silent discard. Not 'pause' as permanent exile.",
    steps: [
      "Name: we are pausing, not ending.",
      "Set a when (or Soft Signal forever free).",
      "Each person gets a regulation job (walk, water, alone).",
      "No scorekeeping texts mid-pause.",
      "Return ritual: one check-in question only.",
    ],
    denserSteps: [
      "Ceremony language: I call a sacred pause so love can catch up to nervous systems.",
      "Write the return time (or 'Soft Signal free, no forced return').",
      "Assign regulation jobs out loud.",
      "Swear off mid-pause prosecutions.",
      "Return with one question: What do you need before we continue?",
    ],
    sampleLine:
      "I need a pause so I don't say something cruel. Can we return at ___? Soft Signal free.",
  },
  {
    id: "body_first",
    label: "Body-First Repair",
    blurb: "Regulate before narrative (non-touch or consented touch).",
    whenToUse: "Words make it worse; bodies are flooded; you need co-regulation first.",
    antiPattern: "Not assumed touch. Not forced proximity as repair tax.",
    steps: [
      "No debate until bodies are less flooded.",
      "Parallel silence / water / feet on floor.",
      "Optional consented proximity (not assumed).",
      "Then one sentence each.",
      "Soft Signal free entire time.",
    ],
    denserSteps: [
      "Name: narrative is offline; body is online.",
      "Choose: water · feet on floor · same-room silence · Soft Signal alone.",
      "If proximity: explicit yes only. No is sacred.",
      "After 5 minutes, one sentence each max.",
      "If still flooded: Structured Pause, not harder words.",
    ],
    sampleLine:
      "I can't do words well yet. Can we sit near each other quietly for five minutes first?",
  },
  {
    id: "comic_relief",
    label: "Comic Relief Repair",
    blurb: "Humor as de-escalation — never as mockery of pain.",
    whenToUse: "You both can laugh; absurdity is safer than escalation; consent to humor exists.",
    antiPattern: "Not laughing at their pain. Not sarcasm as a knife.",
    steps: [
      "Consent to humor (or skip).",
      "Name the absurdity of the fight, not the person.",
      "One joke that includes yourself.",
      "Return to care sentence.",
      "If humor fails: Soft Signal, switch archetype.",
    ],
    denserSteps: [
      "Ask: Is humor welcome right now? Soft Signal free to say no.",
      "Roast the situation, never the attachment wound.",
      "Include yourself in the joke (shared absurdity).",
      "Land the plane with a care sentence.",
      "If it lands wrong: Soft Signal + Accountable Repair.",
    ],
    sampleLine:
      "We just built a small civil war over ___ and I still want you. Soft Signal free. Want a reset?",
  },
  {
    id: "undecided",
    label: "Not sealed",
    blurb: "Fail-closed.",
    whenToUse: "—",
    antiPattern: "—",
    steps: [],
    denserSteps: [],
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
  denser: boolean;
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

/** Resolve steps for a run; denser merges ceremony when masochist denserScripts. */
export function resolveReconcileSteps(
  arch: RepairArchetype,
  denser: boolean,
): readonly string[] {
  if (!denser || arch.denserSteps.length === 0) return arch.steps;
  // Interleave: base then denser ceremony — longer ritual without dropping safety steps.
  const out: string[] = [];
  const n = Math.max(arch.steps.length, arch.denserSteps.length);
  for (let i = 0; i < n; i++) {
    if (i < arch.steps.length) out.push(arch.steps[i]!);
    if (i < arch.denserSteps.length) out.push(arch.denserSteps[i]!);
  }
  return out;
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

export function sealReconcile(
  d: ReconcileDraft,
  denser = false,
): ReconcileSnapshot | null {
  if (!canSealReconcile(d).ok || d.archetypeId === "undecided") return null;
  return {
    id: `reconcile-${Date.now()}`,
    version: RECONCILE_VERSION,
    sealedAt: new Date().toISOString(),
    archetypeId: d.archetypeId,
    fightNote: d.fightNote.trim().slice(0, 400),
    denser: Boolean(denser),
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
