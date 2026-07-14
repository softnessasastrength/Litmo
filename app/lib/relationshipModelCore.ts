/**
 * Relationship Model — living private map of a bond (not a score, not legal).
 *
 * Containment job: externalize "what is this relationship / how do we operate"
 * so fear of intimacy + conflict + abandonment has a structure instead of only
 * dumping onto Renn.
 *
 * Soft Signal freeness is never reduced by phase, heat, or history.
 * A model is not consent. Prior closeness is not consent. Scores are forbidden.
 */
export const RELATIONSHIP_MODEL_VERSION = 1 as const;

/** Operating phase — how the bond is currently being held. */
export type RelationshipPhase =
  | "forming"
  | "steady"
  | "repair_needed"
  | "paused"
  | "flood_protect"
  | "celebration"
  | "unknown";

/** How closeness is primarily practiced (not exclusive). */
export type ClosenessStyle =
  | "touch_primary"
  | "parallel_primary"
  | "words_primary"
  | "mixed"
  | "undecided";

/** Attachment weather of the bond (self-map, not partner grade). */
export type AttachmentWeather =
  | "secure_enough"
  | "anxious_heat"
  | "avoidant_cool"
  | "dual_bind"
  | "unknown";

export type RelationshipAxes = {
  /** Capacity for co-regulation 1–5 (bond climate, not a person score) */
  capacity: 1 | 2 | 3 | 4 | 5;
  /** Conflict climate 1 = frozen/exile-math, 5 = repair-capable */
  conflictClimate: 1 | 2 | 3 | 4 | 5;
  /** Closeness ease 1–5 */
  closenessEase: 1 | 2 | 3 | 4 | 5;
  /** Soft Signal culture 1 = hard to stop, 5 = stop is sacred/easy */
  softSignalCulture: 1 | 2 | 3 | 4 | 5;
};

export type RelationshipModel = {
  version: typeof RELATIONSHIP_MODEL_VERSION;
  id: string;
  /** Short name for this bond map (e.g. "me + Renn") */
  label: string;
  createdAt: string;
  updatedAt: string;
  phase: RelationshipPhase;
  closenessStyle: ClosenessStyle;
  attachmentWeather: AttachmentWeather;
  axes: RelationshipAxes;
  /** Living notes — never auto-sent */
  operatingNotes: string;
  /** Optional link to constitution title/id */
  constitutionRef: string | null;
  /** Soft Signal freeness always acknowledged for this model */
  softSignalAcknowledged: true;
  /** Explicit: model is not consent */
  modelIsNotConsent: true;
};

export type RelationshipModelDraft = {
  label: string;
  phase: RelationshipPhase;
  closenessStyle: ClosenessStyle;
  attachmentWeather: AttachmentWeather;
  axes: Partial<RelationshipAxes>;
  operatingNotes: string;
  softSignalAcknowledged: boolean;
};

export type RelationshipEventKind =
  | "phase_change"
  | "axes_update"
  | "note"
  | "repair_entered"
  | "soft_signal_culture_check"
  | "created"
  | "constitution_linked";

export type RelationshipEvent = {
  id: string;
  at: string;
  kind: RelationshipEventKind;
  summary: string;
  phaseAfter: RelationshipPhase;
};

export type RelationshipModelBundle = {
  model: RelationshipModel;
  events: RelationshipEvent[];
};

export const PHASES: readonly {
  id: RelationshipPhase;
  label: string;
  blurb: string;
  suggestHrefs: string[];
}[] = [
  {
    id: "forming",
    label: "Forming",
    blurb: "New or re-opening. High map-need. Soft Signal free.",
    suggestHrefs: ["/weather", "/interest-re", "/relationship-constitution"],
  },
  {
    id: "steady",
    label: "Steady",
    blurb: "Ordinary good / ordinary hard. Maintenance not trial.",
    suggestHrefs: ["/parallel-play", "/weather", "/field-notes"],
  },
  {
    id: "repair_needed",
    label: "Repair needed",
    blurb: "Friction or rupture. Prefer repair over exile math when safe.",
    suggestHrefs: ["/reconcile", "/apology-craft", "/aftercare", "/conflict-sim"],
  },
  {
    id: "paused",
    label: "Paused",
    blurb: "Structured pause — not ghost, not end. Soft Signal free.",
    suggestHrefs: ["/pre-renn", "/parallel-play", "/soft-signal/practice"],
  },
  {
    id: "flood_protect",
    label: "Flood protect",
    blurb: "Capacity offline. Protect both; delay dumps. Soft Signal free.",
    suggestHrefs: ["/flood", "/too-much", "/pre-renn", "/containment/lofi"],
  },
  {
    id: "celebration",
    label: "Celebration",
    blurb: "Joy can dysregulate too. Land the good. Soft Signal free.",
    suggestHrefs: ["/aftercare", "/field-notes", "/morning-cuddle"],
  },
  {
    id: "unknown",
    label: "Unknown",
    blurb: "Not sealed. Fail-closed: no assumed closeness.",
    suggestHrefs: ["/weather", "/containment"],
  },
] as const;

export const CLOSENESS_STYLES: readonly {
  id: ClosenessStyle;
  label: string;
  blurb: string;
}[] = [
  { id: "touch_primary", label: "Touch-primary", blurb: "Hold / spoon / proximity as main language." },
  { id: "parallel_primary", label: "Parallel-primary", blurb: "Co-presence without performance." },
  { id: "words_primary", label: "Words-primary", blurb: "Talk, check-ins, letters (never auto-sent)." },
  { id: "mixed", label: "Mixed", blurb: "Multiple languages; context picks." },
  { id: "undecided", label: "Undecided", blurb: "Not sealed." },
] as const;

export const ATTACHMENT_WEATHERS: readonly {
  id: AttachmentWeather;
  label: string;
  blurb: string;
}[] = [
  { id: "secure_enough", label: "Secure enough", blurb: "Need + space can coexist most days." },
  { id: "anxious_heat", label: "Anxious heat", blurb: "Proximity urgency high; pre-renn useful." },
  { id: "avoidant_cool", label: "Avoidant cool", blurb: "Space pulls; parallel play sacred." },
  { id: "dual_bind", label: "Dual bind", blurb: "Need ∧ leave-fear both true." },
  { id: "unknown", label: "Unknown", blurb: "Not named yet." },
] as const;

export function defaultAxes(): RelationshipAxes {
  return {
    capacity: 3,
    conflictClimate: 3,
    closenessEase: 3,
    softSignalCulture: 5,
  };
}

export function defaultDraft(): RelationshipModelDraft {
  return {
    label: "This bond",
    phase: "unknown",
    closenessStyle: "undecided",
    attachmentWeather: "unknown",
    axes: defaultAxes(),
    operatingNotes: "",
    softSignalAcknowledged: false,
  };
}

export function canSealModel(d: RelationshipModelDraft): {
  ok: boolean;
  reason: string;
} {
  if (!d.softSignalAcknowledged)
    return { ok: false, reason: "Soft Signal freeness must be acknowledged for this model." };
  if (d.label.trim().length < 1)
    return { ok: false, reason: "Name the bond map (even messy)." };
  if (d.phase === "unknown")
    return { ok: false, reason: "Pick an operating phase (or form/steady as starting point)." };
  return { ok: true, reason: "Ready." };
}

export function createModel(d: RelationshipModelDraft): RelationshipModel | null {
  if (!canSealModel(d).ok) return null;
  const now = new Date().toISOString();
  const axes = { ...defaultAxes(), ...d.axes };
  return {
    version: RELATIONSHIP_MODEL_VERSION,
    id: `rel-${Date.now()}`,
    label: d.label.trim().slice(0, 80),
    createdAt: now,
    updatedAt: now,
    phase: d.phase,
    closenessStyle: d.closenessStyle,
    attachmentWeather: d.attachmentWeather,
    axes: {
      capacity: clampAxis(axes.capacity),
      conflictClimate: clampAxis(axes.conflictClimate),
      closenessEase: clampAxis(axes.closenessEase),
      softSignalCulture: clampAxis(axes.softSignalCulture),
    },
    operatingNotes: d.operatingNotes.trim().slice(0, 2000),
    constitutionRef: null,
    softSignalAcknowledged: true,
    modelIsNotConsent: true,
  };
}

function clampAxis(n: number | undefined): 1 | 2 | 3 | 4 | 5 {
  const base = typeof n === "number" ? n : Number(n);
  const rounded = Math.round(base);
  // NaN/Infinity (bad storage data, malicious payloads) fall back to neutral 3
  // instead of silently propagating as an invalid axis value.
  const safe = Number.isFinite(rounded) ? rounded : 3;
  const v = Math.max(1, Math.min(5, safe));
  return v as 1 | 2 | 3 | 4 | 5;
}

export function setPhase(
  model: RelationshipModel,
  phase: RelationshipPhase,
): { model: RelationshipModel; event: RelationshipEvent } {
  const now = new Date().toISOString();
  const next: RelationshipModel = {
    ...model,
    phase,
    updatedAt: now,
  };
  const event: RelationshipEvent = {
    id: `evt-${Date.now()}`,
    at: now,
    kind: "phase_change",
    summary: `Phase → ${phaseLabel(phase)}`,
    phaseAfter: phase,
  };
  return { model: next, event };
}

export function updateAxes(
  model: RelationshipModel,
  partial: Partial<RelationshipAxes>,
): { model: RelationshipModel; event: RelationshipEvent } {
  const now = new Date().toISOString();
  const axes: RelationshipAxes = {
    capacity: clampAxis(partial.capacity ?? model.axes.capacity),
    conflictClimate: clampAxis(
      partial.conflictClimate ?? model.axes.conflictClimate,
    ),
    closenessEase: clampAxis(partial.closenessEase ?? model.axes.closenessEase),
    softSignalCulture: clampAxis(
      partial.softSignalCulture ?? model.axes.softSignalCulture,
    ),
  };
  const next: RelationshipModel = {
    ...model,
    axes,
    updatedAt: now,
  };
  const event: RelationshipEvent = {
    id: `evt-${Date.now()}`,
    at: now,
    kind: "axes_update",
    summary: `Axes updated · capacity ${axes.capacity} · conflict ${axes.conflictClimate}`,
    phaseAfter: model.phase,
  };
  return { model: next, event };
}

/** Constitution doc shape (duck-typed to avoid circular import with relationshipConstitutionCore). */
export type ConstitutionRefLite = {
  id: string;
  title: string;
  version: number;
};

/** Format a constitution doc into the compact ref string stored on the model. */
export function formatConstitutionRef(doc: ConstitutionRefLite): string {
  return `${doc.title} (v${doc.version})`;
}

/**
 * Link the bond map to a Relationship Constitution snapshot. Reference only —
 * never pulls articles in, never edits the constitution, never implies consent.
 */
export function linkConstitution(
  model: RelationshipModel,
  doc: ConstitutionRefLite,
): { model: RelationshipModel; event: RelationshipEvent } {
  const now = new Date().toISOString();
  const ref = formatConstitutionRef(doc);
  const next: RelationshipModel = {
    ...model,
    constitutionRef: ref,
    updatedAt: now,
  };
  const event: RelationshipEvent = {
    id: `evt-${Date.now()}`,
    at: now,
    kind: "constitution_linked",
    summary: `Linked constitution: ${ref}`,
    phaseAfter: model.phase,
  };
  return { model: next, event };
}

/** Unlink without deleting the constitution itself. */
export function unlinkConstitution(
  model: RelationshipModel,
): { model: RelationshipModel; event: RelationshipEvent } {
  const now = new Date().toISOString();
  const next: RelationshipModel = {
    ...model,
    constitutionRef: null,
    updatedAt: now,
  };
  const event: RelationshipEvent = {
    id: `evt-${Date.now()}`,
    at: now,
    kind: "constitution_linked",
    summary: `Unlinked constitution`,
    phaseAfter: model.phase,
  };
  return { model: next, event };
}

export function phaseLabel(id: RelationshipPhase): string {
  return PHASES.find((p) => p.id === id)?.label ?? id;
}

export function findPhase(id: RelationshipPhase) {
  return PHASES.find((p) => p.id === id) ?? PHASES[PHASES.length - 1]!;
}

/**
 * Fail-closed suggestions from model state.
 * Never partner surveillance. Soft Signal freeness outranks optimization.
 */
export function recommendFromModel(model: RelationshipModel): {
  href: string;
  why: string;
}[] {
  const out: { href: string; why: string }[] = [];
  const phase = findPhase(model.phase);
  for (const href of phase.suggestHrefs) {
    out.push({ href, why: `Phase: ${phase.label}` });
  }
  if (model.axes.capacity <= 2) {
    out.unshift({
      href: "/flood",
      why: "Capacity axis low — protect first",
    });
    out.unshift({
      href: "/pre-renn",
      why: "Capacity axis low — gate before dump",
    });
  }
  if (model.axes.conflictClimate <= 2) {
    out.push({
      href: "/reconcile",
      why: "Conflict climate cold — practice repair when safe",
    });
  }
  if (model.axes.softSignalCulture <= 3) {
    out.unshift({
      href: "/soft-signal/practice",
      why: "Soft Signal culture needs muscle — freeness is law",
    });
  }
  if (model.attachmentWeather === "dual_bind") {
    out.push({
      href: "/need-scared",
      why: "Dual bind weather named",
    });
  }
  if (model.attachmentWeather === "anxious_heat") {
    out.push({
      href: "/too-much",
      why: "Anxious heat — panic room available",
    });
  }
  if (model.closenessStyle === "parallel_primary") {
    out.push({
      href: "/parallel-play",
      why: "Parallel is primary language",
    });
  }
  if (model.closenessStyle === "touch_primary") {
    out.push({
      href: "/spooning",
      why: "Touch-primary — spooning map available",
    });
  }
  // de-dupe by href
  const seen = new Set<string>();
  return out
    .filter((r) => {
      if (seen.has(r.href)) return false;
      seen.add(r.href);
      return true;
    })
    .slice(0, 6);
}

/** One-line summary for hub */
export function modelSummaryLine(model: RelationshipModel): string {
  return `${model.label} · ${phaseLabel(model.phase)} · capacity ${model.axes.capacity}/5 · Soft Signal culture ${model.axes.softSignalCulture}/5 · not consent`;
}

export function parseBundle(raw: unknown): RelationshipModelBundle | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Partial<RelationshipModelBundle>;
  if (!o.model || typeof o.model !== "object") return null;
  const m = o.model as RelationshipModel;
  if (typeof m.id !== "string" || typeof m.label !== "string") return null;
  return {
    model: {
      ...m,
      version: RELATIONSHIP_MODEL_VERSION,
      softSignalAcknowledged: true,
      modelIsNotConsent: true,
      axes: {
        capacity: clampAxis(m.axes?.capacity),
        conflictClimate: clampAxis(m.axes?.conflictClimate),
        closenessEase: clampAxis(m.axes?.closenessEase),
        softSignalCulture: clampAxis(m.axes?.softSignalCulture ?? 5),
      },
      operatingNotes:
        typeof m.operatingNotes === "string" ? m.operatingNotes : "",
      constitutionRef:
        typeof m.constitutionRef === "string" ? m.constitutionRef : null,
    },
    events: Array.isArray(o.events) ? (o.events as RelationshipEvent[]).slice(0, 100) : [],
  };
}

export function exportModelText(model: RelationshipModel): string {
  return [
    `# Relationship model: ${model.label}`,
    `Phase: ${phaseLabel(model.phase)}`,
    `Closeness: ${model.closenessStyle}`,
    `Attachment weather: ${model.attachmentWeather}`,
    `Capacity ${model.axes.capacity} · Conflict ${model.axes.conflictClimate} · Closeness ease ${model.axes.closenessEase} · Soft Signal culture ${model.axes.softSignalCulture}`,
    ``,
    `Notes:`,
    model.operatingNotes || "(none)",
    ``,
    `— Soft Signal free · model is not consent · not legal · local only`,
  ].join("\n");
}

/** One-line banner for other protocols */
export function modelBannerLine(model: RelationshipModel): string {
  return `${model.label} · ${phaseLabel(model.phase)} · capacity ${model.axes.capacity}/5 · Soft Signal culture ${model.axes.softSignalCulture}/5 · not consent`;
}

/**
 * How the bond map biases Pre-Renn — never auto-sends, never weakens Soft Signal.
 */
export function preRennBiasFromModel(model: RelationshipModel): {
  suggestedDelayMinutes: 0 | 5 | 15 | 30 | 60;
  capacityWarn: boolean;
  floodProtect: boolean;
  dualBind: boolean;
  extraReasons: string[];
  extraHrefs: string[];
} {
  const capacityWarn = model.axes.capacity <= 2;
  const floodProtect = model.phase === "flood_protect" || capacityWarn;
  const dualBind = model.attachmentWeather === "dual_bind";
  const extraReasons: string[] = [];
  const extraHrefs: string[] = [];

  if (floodProtect) {
    extraReasons.push(
      `Bond map: ${phaseLabel(model.phase)} / capacity ${model.axes.capacity} — protect first.`,
    );
    extraHrefs.push("/flood", "/too-much");
  }
  if (dualBind) {
    extraReasons.push("Bond map weather is dual-bind — need ∧ leave-fear both allowed.");
    extraHrefs.push("/need-scared");
  }
  if (model.phase === "repair_needed") {
    extraReasons.push("Bond map phase is repair needed — dump may re-open the fight.");
    extraHrefs.push("/reconcile", "/apology-craft");
  }
  if (model.axes.softSignalCulture <= 3) {
    extraReasons.push("Soft Signal culture axis is low — practice freeness before reach.");
    extraHrefs.push("/soft-signal/practice");
  }

  let suggestedDelayMinutes: 0 | 5 | 15 | 30 | 60 = 15;
  if (floodProtect) suggestedDelayMinutes = 30;
  if (model.axes.capacity <= 1) suggestedDelayMinutes = 60;
  if (model.phase === "steady" && model.axes.capacity >= 4)
    suggestedDelayMinutes = 5;

  return {
    suggestedDelayMinutes,
    capacityWarn,
    floodProtect,
    dualBind,
    extraReasons,
    extraHrefs,
  };
}

/** Weather snapshot shape (duck-typed to avoid circular imports). */
export type WeatherAxesLite = {
  energy: number;
  anxiety: number;
  attachmentHeat: number;
  capacityForOthers: number;
};

/**
 * Suggest bond-model updates from personal weather.
 * Pure: does not mutate. Caller applies with Soft Signal freeness intact.
 */
/** Aftercare mode ids we may prime (mirrors aftercareCore; no circular import). */
export type AftercareModeHint =
  | "after_touch"
  | "after_conflict"
  | "after_flood"
  | "after_good_thing"
  | "after_build_spiral";

/**
 * Suggest aftercare mode from bond phase (never auto-starts aftercare).
 */
export function aftercareModeFromPhase(
  phase: RelationshipPhase,
): AftercareModeHint | null {
  switch (phase) {
    case "repair_needed":
      return "after_conflict";
    case "flood_protect":
      return "after_flood";
    case "celebration":
      return "after_good_thing";
    case "forming":
    case "steady":
    case "paused":
      return "after_touch";
    default:
      return null;
  }
}

/** Enter flood_protect on bond map when Flood Protocol starts (optional apply). */
export function enterFloodProtect(
  model: RelationshipModel,
): { model: RelationshipModel; event: RelationshipEvent } {
  return setPhase(model, "flood_protect");
}

/** After flood completes: leave flood_protect → steady if settled. */
export function exitFloodTowardSteady(
  model: RelationshipModel,
  settled: boolean,
): { model: RelationshipModel; event: RelationshipEvent } | null {
  if (model.phase !== "flood_protect") return null;
  return setPhase(model, settled ? "steady" : "paused");
}

export function suggestModelUpdateFromWeather(
  model: RelationshipModel,
  w: WeatherAxesLite,
): {
  phase: RelationshipPhase | null;
  axesPartial: Partial<RelationshipAxes>;
  reasons: string[];
} {
  const reasons: string[] = [];
  let phase: RelationshipPhase | null = null;
  const axesPartial: Partial<RelationshipAxes> = {};

  if (w.capacityForOthers <= 2 || w.anxiety >= 4) {
    phase = "flood_protect";
    axesPartial.capacity = Math.min(model.axes.capacity, w.capacityForOthers) as
      | 1
      | 2
      | 3
      | 4
      | 5;
    reasons.push("Personal sky is stormy / low capacity — flood protect suggested.");
  } else if (w.attachmentHeat >= 4 && w.anxiety >= 3) {
    if (model.phase !== "repair_needed") {
      phase = model.phase === "paused" ? "paused" : model.phase;
    }
    axesPartial.capacity = Math.min(
      model.axes.capacity,
      Math.max(1, w.capacityForOthers),
    ) as 1 | 2 | 3 | 4 | 5;
    reasons.push("Attachment heat high — hold dual-bind / pre-renn paths.");
  } else if (
    w.capacityForOthers >= 4 &&
    w.anxiety <= 2 &&
    model.phase === "flood_protect"
  ) {
    phase = "steady";
    axesPartial.capacity = Math.max(model.axes.capacity, w.capacityForOthers) as
      | 1
      | 2
      | 3
      | 4
      | 5;
    reasons.push("Sky clearing — can leave flood protect for steady when ready.");
  } else {
    axesPartial.capacity = Math.round(
      (model.axes.capacity + w.capacityForOthers) / 2,
    ) as 1 | 2 | 3 | 4 | 5;
    reasons.push("Synced capacity axis toward today's personal weather.");
  }

  return { phase, axesPartial, reasons };
}
