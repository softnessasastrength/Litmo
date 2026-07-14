/**
 * Spooning Protocol v0.2 — nuclear autistic cuddle containment.
 *
 * WHAT: 14 positions, full role negotiation, check-ins, Watch phrase map,
 *   mommy-issues reassurance tie-in, Soft Signal God Mode, post-spoon debrief.
 * WHY: Externalize intimacy anxiety + “am I allowed to need hold?” so it is
 *   less likely to dump raw onto Renn.
 * CONSENT: Local seal ≠ multi-party Consent Snapshot. Soft Signal free always.
 * NEVER: Infer yes from history; public skill scores; require reason on Soft Signal.
 * SEE: docs/SPOONING_PROTOCOL.md · docs/ATTACHMENT_REPAIR_PROTOCOL.md
 */

export const SPOONING_PROTOCOL_VERSION = "0.2" as const;
export const SPOONING_CORE_VERSION = 3 as const;

export type SpoonRoleId =
  | "little"
  | "big"
  | "switch"
  | "parallel"
  | "burrito_mode"
  | "care_seeker_little"
  | "solo_practice"
  | "undecided";

export type SpoonPositionId =
  | "classic"
  | "safety"
  | "safety_burrito"
  | "burrito"
  | "half_nelson_love"
  | "cthulhu"
  | "distance"
  | "jetpack"
  | "koala_death_grip"
  | "starfish_adjacent"
  | "lap_nest"
  | "backpack_of_love"
  | "fortress_of_solitude"
  | "custom";

/** Watch phrase hints for mid-spoon (mapped in spooningHaptics service). */
export type SpoonWatchPhraseHint =
  | "watch_presence"
  | "watch_check_in"
  | "watch_co_regulation_heartbeat"
  | "watch_gentle_tap"
  | "watch_soft_signal";

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
  | "reassurance_needed"
  | "undecided";

export type SpoonDurationMinutes = 5 | 15 | 30 | 45 | "hot_or_pee";

export type SpoonZoneId =
  | "back"
  | "waist"
  | "hair"
  | "arm"
  | "shoulder"
  | "hand"
  | "chest_over_clothes"
  | "nowhere_stomach"
  | "face_no"
  | "custom_ok";

export type SpoonCheckInPhraseId =
  | "you_good"
  | "still_alive"
  | "still_wanted"
  | "need_space"
  | "more_hold"
  | "custom";

export type SpoonRole = {
  id: SpoonRoleId;
  label: string;
  blurb: string;
  strengthNote: string;
  /** Ties to Attachment Repair / mommy issues when true. */
  mommyIssuesAdjacent: boolean;
};

export type SpoonPosition = {
  id: SpoonPositionId;
  label: string;
  blurb: string;
  /** Nervous-system job in plain language */
  nervousSystemJob: string;
  comedyLevel: 1 | 2 | 3;
  /** Needs chest-adjacent zone consent */
  requiresChestAdjacent: boolean;
  /** Suggested for care-seeker / little strength */
  littleFriendly: boolean;
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
  avoid: boolean;
};

export type SpoonCheckInPhrase = {
  id: SpoonCheckInPhraseId;
  label: string;
  flash: string;
};

export const SPOON_ROLES: readonly SpoonRole[] = [
  {
    id: "little",
    label: "Little Spoon",
    blurb: "Protected / cherished mode.",
    strengthNote:
      "Little Spoon is a position of strength, not weakness. Asking to be held is advanced adulting.",
    mommyIssuesAdjacent: true,
  },
  {
    id: "care_seeker_little",
    label: "Care-Seeker Little",
    blurb: "Little Spoon + explicit reassurance contract.",
    strengthNote:
      "Mommy-issues-adjacent on purpose: “I am wanted. I am not left for needing this.”",
    mommyIssuesAdjacent: true,
  },
  {
    id: "big",
    label: "Big Spoon",
    blurb: "Protective / grounding mode.",
    strengthNote: "You are the backpack. Softness with a job. Soft Signal free.",
    mommyIssuesAdjacent: false,
  },
  {
    id: "switch",
    label: "Switch",
    blurb: "Chaotic neutral. Renegotiate mid-spoon.",
    strengthNote: "Adults with ADHD energy. Soft Signal still free.",
    mommyIssuesAdjacent: false,
  },
  {
    id: "parallel",
    label: "Parallel Play",
    blurb: "Touch-adjacent, no full entanglement.",
    strengthNote: "Presence without performance. Introvert-legal.",
    mommyIssuesAdjacent: false,
  },
  {
    id: "burrito_mode",
    label: "Burrito Mode (role)",
    blurb: "Fully wrapped identity. Maximum containment.",
    strengthNote: "Blanket + human = nervous system bunker.",
    mommyIssuesAdjacent: true,
  },
  {
    id: "solo_practice",
    label: "Solo Practice",
    blurb: "You + pillow + protocol.",
    strengthNote: "Valid. Often optimal. No partner required to practice safety.",
    mommyIssuesAdjacent: false,
  },
  {
    id: "undecided",
    label: "Not sealed",
    blurb: "Fail-closed default.",
    strengthNote: "Pick something real.",
    mommyIssuesAdjacent: false,
  },
] as const;

/** 14 positions — ridiculous + nervous-system useful. */
export const SPOON_POSITIONS: readonly SpoonPosition[] = [
  {
    id: "classic",
    label: "Classic",
    blurb: "Default lateral spoon. Hands not assumed.",
    nervousSystemJob: "Baseline co-presence.",
    comedyLevel: 1,
    requiresChestAdjacent: false,
    littleFriendly: true,
  },
  {
    id: "safety",
    label: "Safety Spoon",
    blurb:
      "Big spoon arm under pillow; little can hold wrist — escape route built in.",
    nervousSystemJob: "Hold with an exit ramp. Hypervigilance-friendly.",
    comedyLevel: 1,
    requiresChestAdjacent: false,
    littleFriendly: true,
  },
  {
    id: "safety_burrito",
    label: "Safety Burrito",
    blurb: "Safety Spoon + blanket prison. Escape wrist + full wrap.",
    nervousSystemJob: "Maximum containment with a known exit.",
    comedyLevel: 2,
    requiresChestAdjacent: false,
    littleFriendly: true,
  },
  {
    id: "burrito",
    label: "Burrito",
    blurb: "Blanket + human wrap. Classic containment geometry.",
    nervousSystemJob: "Reduce sensory surface area. Nest.",
    comedyLevel: 2,
    requiresChestAdjacent: false,
    littleFriendly: true,
  },
  {
    id: "half_nelson_love",
    label: "Half-Nelson of Love",
    blurb: "Arm across chest — explicit consent only, every time.",
    nervousSystemJob: "Deep pressure (only if wanted).",
    comedyLevel: 2,
    requiresChestAdjacent: true,
    littleFriendly: true,
  },
  {
    id: "cthulhu",
    label: "Cthulhu",
    blurb: "All limbs entangled. Maximum chaos. Soft Signal still God Mode.",
    nervousSystemJob: "Full contact for brains that need “enough.”",
    comedyLevel: 3,
    requiresChestAdjacent: false,
    littleFriendly: false,
  },
  {
    id: "distance",
    label: "Distance Spoon",
    blurb: "Back-to-back with pinky contact. Overstimulated days.",
    nervousSystemJob: "Connection without flood.",
    comedyLevel: 1,
    requiresChestAdjacent: false,
    littleFriendly: true,
  },
  {
    id: "jetpack",
    label: "Jetpack Mode",
    blurb: "Little clings from behind big spoon. Advanced gremlin tech.",
    nervousSystemJob: "Attachment with agency — you hold on, they ground.",
    comedyLevel: 3,
    requiresChestAdjacent: false,
    littleFriendly: true,
  },
  {
    id: "koala_death_grip",
    label: "Koala Death Grip",
    blurb: "Front-facing cling. High contact, high comedy, high honesty.",
    nervousSystemJob: "Ventral contact for “I’m still here.” Soft Signal free.",
    comedyLevel: 3,
    requiresChestAdjacent: true,
    littleFriendly: true,
  },
  {
    id: "starfish_adjacent",
    label: "Starfish Adjacent",
    blurb: "Minimal contact — mostly existence confirmation.",
    nervousSystemJob: "Lowest-demand closeness.",
    comedyLevel: 2,
    requiresChestAdjacent: false,
    littleFriendly: true,
  },
  {
    id: "lap_nest",
    label: "Lap Nest",
    blurb: "Head/torso in lap territory. Reassurance throne (consent zones).",
    nervousSystemJob: "Care-seeker geometry. Mommy-issues-adjacent on purpose.",
    comedyLevel: 2,
    requiresChestAdjacent: false,
    littleFriendly: true,
  },
  {
    id: "backpack_of_love",
    label: "Backpack of Love",
    blurb: "Big spoon is furniture. Little is the backpack. Weight optional.",
    nervousSystemJob: "Being carried without leaving the bed.",
    comedyLevel: 2,
    requiresChestAdjacent: false,
    littleFriendly: true,
  },
  {
    id: "fortress_of_solitude",
    label: "Fortress of Solitude",
    blurb: "Pillows + one human touch point. Fortress, not isolation theater.",
    nervousSystemJob: "Solo-adjacent co-regulation.",
    comedyLevel: 2,
    requiresChestAdjacent: false,
    littleFriendly: true,
  },
  {
    id: "custom",
    label: "Custom Chaos",
    blurb: "Name the shape. Still Soft-Signalable.",
    nervousSystemJob: "Whatever your body invents tonight.",
    comedyLevel: 3,
    requiresChestAdjacent: false,
    littleFriendly: true,
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
    blurb: "Soft affection if zones allow. Still Soft-Signalable.",
  },
  {
    id: "playful",
    label: "Playful",
    blurb: "Banter on. Soft Signal free.",
  },
  {
    id: "heavy",
    label: "Heavy / sad-cuddle",
    blurb: "Grief spoon. No fixing required.",
  },
  {
    id: "reassurance_needed",
    label: "Reassurance needed",
    blurb:
      "Mommy-issues mode: explicit “you are wanted / not left for needing this.”",
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
  { id: "chest_over_clothes", label: "Chest (over clothes)", avoid: false },
  { id: "nowhere_stomach", label: "Nowhere near stomach", avoid: true },
  { id: "face_no", label: "No face (unless re-asked)", avoid: true },
  { id: "custom_ok", label: "Custom ok (note it)", avoid: false },
] as const;

export const SPOON_DURATIONS: readonly SpoonDurationMinutes[] = [
  5,
  15,
  30,
  45,
  "hot_or_pee",
];

export const SPOON_CHECK_IN_PHRASES: readonly SpoonCheckInPhrase[] = [
  { id: "you_good", label: "You good?", flash: "you good?" },
  { id: "still_alive", label: "Still alive in there?", flash: "still alive?" },
  {
    id: "still_wanted",
    label: "Still wanted? (reassurance)",
    flash: "you are still wanted",
  },
  { id: "need_space", label: "Need space?", flash: "need space?" },
  { id: "more_hold", label: "More hold?", flash: "more hold?" },
  { id: "custom", label: "Custom phrase", flash: "…" },
] as const;

/** Scripted reassurance lines when energy/role is mommy-issues-adjacent. */
export const MOMMY_ISSUES_REASSURANCE_LINES: readonly string[] = [
  "You are allowed to need this.",
  "Needing hold is not the same as being broken.",
  "I am not leaving because you asked.",
  "You don’t have to perform grateful to keep this.",
  "Little Spoon is strength.",
] as const;

export type SpoonSealDraft = {
  roleId: SpoonRoleId;
  positionId: SpoonPositionId;
  durationMinutes: SpoonDurationMinutes | null;
  pressureId: SpoonPressureId;
  energyId: SpoonEnergyId;
  allowedZones: SpoonZoneId[];
  anxietyNote: string;
  customPositionNote: string;
  /** Explicit mommy-issues reassurance contract */
  mommyIssuesReassurance: boolean;
  watchHapticsEnabled: boolean;
  preferredCheckIn: SpoonCheckInPhraseId;
  customCheckInFlash: string;
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
  mommyIssuesReassurance: boolean;
  watchHapticsEnabled: boolean;
  preferredCheckIn: SpoonCheckInPhraseId;
  customCheckInFlash: string;
};

export type SpoonEndReason =
  | "completed"
  | "soft_signal"
  | "hot_or_pee"
  | "abandoned";

export type SpoonDebrief = {
  bodyFeel: 1 | 2 | 3 | 4 | 5 | null;
  bodyNotes: string;
  worked: string;
  didntWork: string;
  nonTraumaticClosenessPlusOne: boolean;
  owedNoPerformance: boolean;
  /** Mommy issues: received hold without earning via pain */
  receivedWithoutPerformingPain: boolean;
  /** Linked cathedral honesty */
  namedNeedForHold: boolean;
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
  fiveMinWarningFired: boolean;
  lastCheckInFlash: string;
  reassuranceLineIndex: number;
};

export const SPOONING_COPY = {
  banner:
    "This is currently a personal emotional containment system, not a public product.",
  tagline: "Because apparently I can’t just fucking cuddle like a normal person",
  title: "Spooning Protocol v0.2",
  purpose:
    "Nuclear autistic precision cuddle planner: 14 positions, full role negotiation, Watch check-ins, mommy-issues reassurance, Soft Signal God Mode — so intimacy anxiety has a map that is less likely to dump onto Renn.",
  sealHint:
    "All spooning is opt-in, revocable, and snapshot-based. Prior cuddles are not consent.",
  softSignalGod:
    "Soft Signal is God Mode — instant disengage, no questions, no TED talk. Watch Soft Signal when paired.",
  littleStrength:
    "Little Spoon is a position of strength, not weakness. Important for this brain.",
  mommyTie:
    "Care-Seeker Little / Reassurance energy ties to Attachment Repair Cathedral — same wound, softer furniture.",
  debriefLol:
    "Post-spoon debrief is “mandatory for data collection” (lol). Skip still allowed.",
  comedy:
    "My love language is infrastructure. Jetpack Mode is a valid attachment strategy.",
  checkInDefault: "you good?",
  fiveMinWarning: "Five minutes left — extend, Soft Signal, or graceful exit.",
  ledgerJoke: "+1 successful non-traumatic closeness (local joke ledger, not a score)",
  negotiateSteps: [
    "Role",
    "Position",
    "Body rules",
    "Reassurance / Watch",
    "Seal",
  ] as const,
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
    mommyIssuesReassurance: false,
    watchHapticsEnabled: true,
    preferredCheckIn: "you_good",
    customCheckInFlash: "",
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
    receivedWithoutPerformingPain: true,
    namedNeedForHold: false,
  };
}

export function positionCount(): number {
  return SPOON_POSITIONS.filter((p) => p.id !== "custom").length + 1;
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
      reason: "Name energy (including “reassurance needed”).",
    };
  }
  if (draft.allowedZones.length < 1) {
    return {
      ok: false,
      reason: "Pick at least one zone (or an avoid bound).",
    };
  }
  if (
    draft.positionId === "custom" &&
    draft.customPositionNote.trim().length < 1
  ) {
    return { ok: false, reason: "Custom Chaos needs a stupid name." };
  }
  if (
    draft.preferredCheckIn === "custom" &&
    draft.customCheckInFlash.trim().length < 1
  ) {
    return { ok: false, reason: "Custom check-in needs a phrase." };
  }
  const pos = findPosition(draft.positionId);
  if (pos.requiresChestAdjacent) {
    const ok =
      draft.allowedZones.includes("shoulder") ||
      draft.allowedZones.includes("back") ||
      draft.allowedZones.includes("chest_over_clothes");
    if (!ok) {
      return {
        ok: false,
        reason: `${pos.label} needs chest-adjacent consent (back / shoulder / chest over clothes).`,
      };
    }
  }
  if (
    draft.mommyIssuesReassurance &&
    draft.energyId !== "reassurance_needed" &&
    draft.roleId !== "care_seeker_little" &&
    draft.roleId !== "little"
  ) {
    return {
      ok: false,
      reason:
        "Mommy-issues reassurance wants Care-Seeker Little / Little + ideally “reassurance needed” energy.",
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
    mommyIssuesReassurance: Boolean(draft.mommyIssuesReassurance),
    watchHapticsEnabled: Boolean(draft.watchHapticsEnabled),
    preferredCheckIn: draft.preferredCheckIn,
    customCheckInFlash: draft.customCheckInFlash.trim().slice(0, 80),
  };
}

export function startSpoonSession(snapshot: SpoonSnapshot): SpoonActiveSession {
  return {
    snapshot,
    startedAt: new Date().toISOString(),
    elapsedSeconds: 0,
    checkInCount: 0,
    fiveMinWarningFired: false,
    lastCheckInFlash: "",
    reassuranceLineIndex: 0,
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

export function checkInFlashText(snapshot: SpoonSnapshot): string {
  if (snapshot.preferredCheckIn === "custom") {
    return snapshot.customCheckInFlash || "…";
  }
  return (
    SPOON_CHECK_IN_PHRASES.find((p) => p.id === snapshot.preferredCheckIn)
      ?.flash ?? SPOONING_COPY.checkInDefault
  );
}

export function recordCheckIn(
  session: SpoonActiveSession,
): SpoonActiveSession {
  return {
    ...session,
    checkInCount: session.checkInCount + 1,
    lastCheckInFlash: checkInFlashText(session.snapshot),
  };
}

export function advanceReassuranceLine(
  session: SpoonActiveSession,
): SpoonActiveSession {
  const n = MOMMY_ISSUES_REASSURANCE_LINES.length;
  return {
    ...session,
    reassuranceLineIndex: (session.reassuranceLineIndex + 1) % n,
  };
}

export function currentReassuranceLine(session: SpoonActiveSession): string {
  return (
    MOMMY_ISSUES_REASSURANCE_LINES[session.reassuranceLineIndex] ??
    MOMMY_ISSUES_REASSURANCE_LINES[0]!
  );
}

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
          receivedWithoutPerformingPain: Boolean(
            debrief.receivedWithoutPerformingPain,
          ),
          namedNeedForHold: Boolean(debrief.namedNeedForHold),
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
  mommy_issues_runs: number;
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
    mommy_issues_runs: entries.filter((e) => e.snapshot.mommyIssuesReassurance)
      .length,
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
        mommyIssuesReassurance: Boolean(snap.mommyIssuesReassurance),
        watchHapticsEnabled: snap.watchHapticsEnabled !== false,
        preferredCheckIn:
          (snap.preferredCheckIn as SpoonCheckInPhraseId) ?? "you_good",
        customCheckInFlash:
          typeof snap.customCheckInFlash === "string"
            ? snap.customCheckInFlash.slice(0, 80)
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
