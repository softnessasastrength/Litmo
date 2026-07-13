/**
 * Spooning Protocol v0.1 — pure logic for the most over-engineered cuddle ritual.
 *
 * WHAT: Roles, stupid-named positions, pressure/zones/energy seal, timer warnings,
 *   Soft Signal end, private debrief, local "non-traumatic closeness" ledger joke.
 * WHY: Externalize intimacy anxiety so it is less likely to dump onto Renn.
 * CONSENT: Local seal ≠ multi-party Consent Snapshot. Soft Signal is God Mode.
 * NEVER: Infer yes from history; require reason on Soft Signal; public skill scores.
 * SEE: docs/SPOONING_PROTOCOL.md · docs/REAL_PURPOSE.md
 */

export const SPOONING_PROTOCOL_VERSION = "0.1" as const;
export const SPOONING_CORE_VERSION = 2 as const;

export type SpoonRoleId =
  | "little"
  | "big"
  | "switch"
  | "parallel"
  | "burrito_mode"
  | "solo_practice"
  | "undecided";

export type SpoonPositionId =
  | "classic"
  | "safety"
  | "burrito"
  | "half_nelson_love"
  | "cthulhu"
  | "distance"
  | "custom";

export type SpoonPressureId =
  | "feather"
  | "gentle"
  | "firm"
  | "held_together"
  | "undecided";

export type SpoonEnergyId =
  | "cozy_silence"
  | "soft_talk"
  | "forehead_kisses_ok"
  | "playful"
  | "heavy"
  | "undecided";

/** Duration minutes or the sacred human-exit clause. */
export type SpoonDurationMinutes = 5 | 15 | 45 | "hot_or_pee";

export type SpoonZoneId =
  | "back"
  | "waist"
  | "hair"
  | "arm"
  | "shoulder"
  | "hand"
  | "nowhere_stomach"
  | "face_no"
  | "custom_ok";

export type SpoonRole = {
  id: SpoonRoleId;
  label: string;
  blurb: string;
  /** Strength reframe for the anxious brain. */
  strengthNote: string;
};

export type SpoonPosition = {
  id: SpoonPositionId;
  label: string;
  blurb: string;
};

export type SpoonPressure = {
  id: SpoonPressureId;
  label: string;
  blurb: string;
};

export type SpoonEnergy = {
  id: SpoonEnergyId;
  label: string;
  blurb: string;
};

export type SpoonZone = {
  id: SpoonZoneId;
  label: string;
  /** true = hard limit / keep away. */
  avoid: boolean;
};

export const SPOON_ROLES: readonly SpoonRole[] = [
  {
    id: "little",
    label: "Little Spoon",
    blurb: "Protected / cherished mode.",
    strengthNote:
      "Little Spoon is a position of strength, not weakness. Asking to be held is advanced adulting.",
  },
  {
    id: "big",
    label: "Big Spoon",
    blurb: "Protective / grounding mode.",
    strengthNote: "You are the backpack. Softness with a job. Soft Signal still free.",
  },
  {
    id: "switch",
    label: "Switch",
    blurb: "Chaotic neutral.",
    strengthNote: "We will renegotiate mid-spoon like mammals with ADHD.",
  },
  {
    id: "parallel",
    label: "Parallel Play",
    blurb: "Touch-adjacent, no full entanglement.",
    strengthNote: "Presence without performance. Introvert-legal.",
  },
  {
    id: "burrito_mode",
    label: "Burrito Mode",
    blurb: "Fully wrapped, maximum containment.",
    strengthNote: "Blanket + human = nervous system bunker. Valid primary role.",
  },
  {
    id: "solo_practice",
    label: "Solo Practice",
    blurb: "You + pillow + protocol.",
    strengthNote: "Practice without dumping practice-stress onto a partner.",
  },
  {
    id: "undecided",
    label: "Not sealed",
    blurb: "Fail-closed default.",
    strengthNote: "Pick something real.",
  },
] as const;

export const SPOON_POSITIONS: readonly SpoonPosition[] = [
  {
    id: "classic",
    label: "Classic",
    blurb: "Default lateral spoon. Hands not assumed.",
  },
  {
    id: "safety",
    label: "Safety Spoon",
    blurb:
      "Big spoon arm under pillow; little spoon can hold wrist — escape route built in.",
  },
  {
    id: "burrito",
    label: "Burrito",
    blurb: "Blanket + human wrap. Maximum containment geometry.",
  },
  {
    id: "half_nelson_love",
    label: "Half-Nelson of Love",
    blurb: "Big spoon arm across chest — explicit consent only, every time.",
  },
  {
    id: "cthulhu",
    label: "Cthulhu",
    blurb: "All limbs entangled. Maximum chaos. Soft Signal still God Mode.",
  },
  {
    id: "distance",
    label: "Distance Spoon",
    blurb: "Back-to-back with pinky contact. For overstimulated days.",
  },
  {
    id: "custom",
    label: "Custom",
    blurb: "Name it. Still needs Soft Signal path.",
  },
] as const;

export const SPOON_PRESSURES: readonly SpoonPressure[] = [
  {
    id: "feather",
    label: "Feather",
    blurb: "Barely there. Proof of presence without weight.",
  },
  {
    id: "gentle",
    label: "Gentle",
    blurb: "Warm, soft, non-crushing.",
  },
  {
    id: "firm",
    label: "Firm",
    blurb: "Grounding pressure. Still revocable instantly.",
  },
  {
    id: "held_together",
    label: "Held together",
    blurb: "“I want to feel like I’m being held together.” Name it out loud.",
  },
  {
    id: "undecided",
    label: "Not sealed",
    blurb: "Fail-closed.",
  },
] as const;

export const SPOON_ENERGIES: readonly SpoonEnergy[] = [
  {
    id: "cozy_silence",
    label: "Cozy silence",
    blurb: "No small talk required. Breathing is enough.",
  },
  {
    id: "soft_talk",
    label: "Soft talk ok",
    blurb: "Small words. No debate club.",
  },
  {
    id: "forehead_kisses_ok",
    label: "Occasional forehead kiss",
    blurb: "Soft affection allowed if zones allow. Still Soft-Signalable.",
  },
  {
    id: "playful",
    label: "Playful",
    blurb: "Banter on. Soft Signal still free.",
  },
  {
    id: "heavy",
    label: "Heavy / sad-cuddle",
    blurb: "Grief spoon. No fixing required.",
  },
  {
    id: "undecided",
    label: "Not sealed",
    blurb: "Fail-closed.",
  },
] as const;

export const SPOON_ZONES: readonly SpoonZone[] = [
  { id: "back", label: "Back", avoid: false },
  { id: "waist", label: "Waist", avoid: false },
  { id: "hair", label: "Hair", avoid: false },
  { id: "arm", label: "Arm", avoid: false },
  { id: "shoulder", label: "Shoulder", avoid: false },
  { id: "hand", label: "Hand / wrist", avoid: false },
  { id: "nowhere_stomach", label: "Nowhere near stomach", avoid: true },
  { id: "face_no", label: "No face (unless re-asked)", avoid: true },
  { id: "custom_ok", label: "Custom ok (note it)", avoid: false },
] as const;

export const SPOON_DURATIONS: readonly SpoonDurationMinutes[] = [
  5,
  15,
  45,
  "hot_or_pee",
];

export type SpoonSealDraft = {
  roleId: SpoonRoleId;
  positionId: SpoonPositionId;
  durationMinutes: SpoonDurationMinutes | null;
  pressureId: SpoonPressureId;
  energyId: SpoonEnergyId;
  allowedZones: SpoonZoneId[];
  anxietyNote: string;
  customPositionNote: string;
};

export type SpoonSnapshot = {
  id: string;
  protocolVersion: typeof SPOONING_PROTOCOL_VERSION;
  sealedAt: string;
  roleId: Exclude<SpoonRoleId, "undecided">;
  positionId: SpoonPositionId;
  durationMinutes: SpoonDurationMinutes;
  pressureId: Exclude<SpoonPressureId, "undecided">;
  energyId: Exclude<SpoonEnergyId, "undecided">;
  allowedZones: SpoonZoneId[];
  anxietyNote: string;
  customPositionNote: string;
};

export type SpoonEndReason =
  | "completed"
  | "soft_signal"
  | "hot_or_pee"
  | "abandoned";

export type SpoonDebrief = {
  /** How did that feel in your body? */
  bodyFeel: 1 | 2 | 3 | 4 | 5 | null;
  bodyNotes: string;
  worked: string;
  didntWork: string;
  /** Local joke ledger — not a real public trust score. */
  nonTraumaticClosenessPlusOne: boolean;
  owedNoPerformance: boolean;
};

export type SpoonHistoryEntry = {
  snapshot: SpoonSnapshot;
  startedAt: string;
  endedAt: string;
  endReason: SpoonEndReason;
  checkInCount: number;
  debrief: SpoonDebrief | null;
};

export type SpoonActiveSession = {
  snapshot: SpoonSnapshot;
  startedAt: string;
  elapsedSeconds: number;
  checkInCount: number;
  /** Fired once when ≤5 min remain on a timed spoon. */
  fiveMinWarningFired: boolean;
};

export const SPOONING_COPY = {
  banner:
    "This is currently a personal emotional containment system, not a public product.",
  tagline: "Because apparently I can’t just fucking cuddle like a normal person",
  title: "Spooning Protocol v0.1",
  purpose:
    "Externalize anxiety around physical intimacy and closeness so it is less likely to dump onto Renn. Turn “just lying next to someone” into a hilarious over-engineered ritual that somehow makes a nervous system feel safer.",
  sealHint:
    "All spooning is opt-in, revocable, and snapshot-based. Prior cuddles are not consent.",
  softSignalGod:
    "Soft Signal is God Mode — instant disengage, no questions, no TED talk.",
  littleStrength:
    "Little Spoon is a position of strength, not weakness. Important for this brain.",
  debriefLol:
    "Post-spoon debrief is “mandatory for data collection” (lol). Skip still allowed — Soft Signal freeness extends to paperwork.",
  comedy: "My love language is infrastructure. Soft Signal is still freer than my social skills.",
  checkIn: "you good?",
  fiveMinWarning: "Five minutes left — extend, Soft Signal, or graceful exit.",
  ledgerJoke: "+1 successful non-traumatic closeness (local joke ledger, not a score)",
} as const;

export function defaultSpoonDraft(): SpoonSealDraft {
  return {
    roleId: "undecided",
    positionId: "classic",
    durationMinutes: null,
    pressureId: "undecided",
    energyId: "undecided",
    allowedZones: ["back", "arm", "nowhere_stomach"],
    anxietyNote: "",
    customPositionNote: "",
  };
}

export function defaultDebrief(): SpoonDebrief {
  return {
    bodyFeel: null,
    bodyNotes: "",
    worked: "",
    didntWork: "",
    nonTraumaticClosenessPlusOne: true,
    owedNoPerformance: true,
  };
}

export function canSealSpoon(draft: SpoonSealDraft): {
  ok: boolean;
  reason: string;
} {
  if (draft.roleId === "undecided") {
    return { ok: false, reason: "Pick a role (Little Spoon is strength)." };
  }
  if (draft.durationMinutes == null) {
    return {
      ok: false,
      reason: "Pick duration — including “until hot or pee.”",
    };
  }
  if (draft.pressureId === "undecided") {
    return { ok: false, reason: "Name pressure (feather → held together)." };
  }
  if (draft.energyId === "undecided") {
    return {
      ok: false,
      reason: "Name energy (cozy silence vs forehead kisses, etc.).",
    };
  }
  if (draft.allowedZones.length < 1) {
    return {
      ok: false,
      reason: "Pick at least one allowed zone (or an avoid zone that bounds the map).",
    };
  }
  if (
    draft.positionId === "custom" &&
    draft.customPositionNote.trim().length < 1
  ) {
    return { ok: false, reason: "Custom position needs a stupid name." };
  }
  if (
    draft.positionId === "half_nelson_love" &&
    !draft.allowedZones.includes("shoulder") &&
    !draft.allowedZones.includes("back")
  ) {
    return {
      ok: false,
      reason:
        "Half-Nelson of Love needs chest-adjacent consent (back or shoulder zone).",
    };
  }
  return { ok: true, reason: "Ready to seal. Soft Signal remains God Mode." };
}

export function sealSpoon(
  draft: SpoonSealDraft,
  opts?: { id?: string; sealedAt?: string },
): SpoonSnapshot | null {
  const gate = canSealSpoon(draft);
  if (!gate.ok) return null;
  if (
    draft.roleId === "undecided" ||
    draft.durationMinutes == null ||
    draft.pressureId === "undecided" ||
    draft.energyId === "undecided"
  ) {
    return null;
  }

  return {
    id: opts?.id ?? `spoon-${Date.now()}`,
    protocolVersion: SPOONING_PROTOCOL_VERSION,
    sealedAt: opts?.sealedAt ?? new Date().toISOString(),
    roleId: draft.roleId,
    positionId: draft.positionId,
    durationMinutes: draft.durationMinutes,
    pressureId: draft.pressureId,
    energyId: draft.energyId,
    allowedZones: [...draft.allowedZones],
    anxietyNote: draft.anxietyNote.trim().slice(0, 500),
    customPositionNote: draft.customPositionNote.trim().slice(0, 200),
  };
}

export function startSpoonSession(snapshot: SpoonSnapshot): SpoonActiveSession {
  return {
    snapshot,
    startedAt: new Date().toISOString(),
    elapsedSeconds: 0,
    checkInCount: 0,
    fiveMinWarningFired: false,
  };
}

export function tickSpoonSession(
  session: SpoonActiveSession,
  deltaSeconds = 1,
): SpoonActiveSession {
  const d = Math.max(0, Math.floor(deltaSeconds));
  return {
    ...session,
    elapsedSeconds: session.elapsedSeconds + d,
  };
}

export function recordCheckIn(
  session: SpoonActiveSession,
): SpoonActiveSession {
  return {
    ...session,
    checkInCount: session.checkInCount + 1,
  };
}

/** Timed spoons only — hot_or_pee has no auto warning. */
export function durationTargetSeconds(
  duration: SpoonDurationMinutes,
): number | null {
  if (duration === "hot_or_pee") return null;
  return duration * 60;
}

export function remainingSeconds(session: SpoonActiveSession): number | null {
  const target = durationTargetSeconds(session.snapshot.durationMinutes);
  if (target == null) return null;
  return Math.max(0, target - session.elapsedSeconds);
}

/**
 * WHAT: Whether to surface the 5-minute warning once.
 * WHY: User asked for timer with 5min warning (extend or graceful exit).
 */
export function shouldFireFiveMinWarning(
  session: SpoonActiveSession,
): boolean {
  if (session.fiveMinWarningFired) return false;
  const remaining = remainingSeconds(session);
  if (remaining == null) return false;
  const target = durationTargetSeconds(session.snapshot.durationMinutes);
  if (target == null || target <= 5 * 60) return false;
  return remaining <= 5 * 60;
}

export function markFiveMinWarning(
  session: SpoonActiveSession,
): SpoonActiveSession {
  return { ...session, fiveMinWarningFired: true };
}

export function isDurationComplete(session: SpoonActiveSession): boolean {
  const target = durationTargetSeconds(session.snapshot.durationMinutes);
  if (target == null) return false;
  return session.elapsedSeconds >= target;
}

export function formatSpoonClock(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, "0")}`;
}

export function durationLabel(d: SpoonDurationMinutes): string {
  if (d === "hot_or_pee") return "Until hot or pee";
  return `${d} min`;
}

export function completeSpoon(
  session: SpoonActiveSession,
  endReason: SpoonEndReason,
  debrief: SpoonDebrief | null,
): SpoonHistoryEntry {
  return {
    snapshot: session.snapshot,
    startedAt: session.startedAt,
    endedAt: new Date().toISOString(),
    endReason,
    checkInCount: session.checkInCount,
    debrief: debrief
      ? {
          bodyFeel: debrief.bodyFeel,
          bodyNotes: debrief.bodyNotes.trim().slice(0, 500),
          worked: debrief.worked.trim().slice(0, 500),
          didntWork: debrief.didntWork.trim().slice(0, 500),
          nonTraumaticClosenessPlusOne: Boolean(
            debrief.nonTraumaticClosenessPlusOne,
          ),
          owedNoPerformance: Boolean(debrief.owedNoPerformance),
        }
      : null,
  };
}

export function findRole(id: SpoonRoleId): SpoonRole {
  return (
    SPOON_ROLES.find((r) => r.id === id) ?? SPOON_ROLES[SPOON_ROLES.length - 1]!
  );
}

export function findPosition(id: SpoonPositionId): SpoonPosition {
  return SPOON_POSITIONS.find((p) => p.id === id) ?? SPOON_POSITIONS[0]!;
}

export function findPressure(id: SpoonPressureId): SpoonPressure {
  return SPOON_PRESSURES.find((p) => p.id === id) ?? SPOON_PRESSURES[0]!;
}

export function findEnergy(id: SpoonEnergyId): SpoonEnergy {
  return SPOON_ENERGIES.find((e) => e.id === id) ?? SPOON_ENERGIES[0]!;
}

export function toggleZone(
  zones: SpoonZoneId[],
  zone: SpoonZoneId,
): SpoonZoneId[] {
  if (zones.includes(zone)) return zones.filter((z) => z !== zone);
  return [...zones, zone];
}

export function summarizeHistory(entries: SpoonHistoryEntry[]): {
  total: number;
  soft_signal_exits: number;
  check_ins: number;
  non_traumatic_plus_ones: number;
  solo_or_burrito: number;
} {
  return {
    total: entries.length,
    soft_signal_exits: entries.filter((e) => e.endReason === "soft_signal")
      .length,
    check_ins: entries.reduce((n, e) => n + e.checkInCount, 0),
    non_traumatic_plus_ones: entries.filter(
      (e) => e.debrief?.nonTraumaticClosenessPlusOne,
    ).length,
    solo_or_burrito: entries.filter(
      (e) =>
        e.snapshot.roleId === "solo_practice" ||
        e.snapshot.roleId === "burrito_mode",
    ).length,
  };
}

export function parseSpoonHistory(raw: unknown): SpoonHistoryEntry[] {
  if (!Array.isArray(raw)) return [];
  const out: SpoonHistoryEntry[] = [];
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
      endReason !== "hot_or_pee" &&
      endReason !== "abandoned"
    ) {
      continue;
    }
    out.push({
      snapshot: {
        id: snap.id,
        protocolVersion: SPOONING_PROTOCOL_VERSION,
        sealedAt:
          typeof snap.sealedAt === "string"
            ? snap.sealedAt
            : new Date(0).toISOString(),
        roleId: (snap.roleId as SpoonSnapshot["roleId"]) ?? "solo_practice",
        positionId: (snap.positionId as SpoonPositionId) ?? "classic",
        durationMinutes:
          (snap.durationMinutes as SpoonDurationMinutes) ?? 15,
        pressureId: (snap.pressureId as SpoonSnapshot["pressureId"]) ?? "gentle",
        energyId:
          (snap.energyId as SpoonSnapshot["energyId"]) ?? "cozy_silence",
        allowedZones: Array.isArray(snap.allowedZones)
          ? (snap.allowedZones as SpoonZoneId[])
          : ["back"],
        anxietyNote:
          typeof snap.anxietyNote === "string"
            ? snap.anxietyNote.slice(0, 500)
            : "",
        customPositionNote:
          typeof snap.customPositionNote === "string"
            ? snap.customPositionNote.slice(0, 200)
            : "",
      },
      startedAt: e.startedAt,
      endedAt: e.endedAt,
      endReason,
      checkInCount:
        typeof e.checkInCount === "number" ? e.checkInCount : 0,
      debrief: null,
    });
  }
  return out.slice(0, 50);
}
