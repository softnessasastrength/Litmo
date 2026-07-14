/**
 * Attachment Repair Protocol v0.1 — Mommy Issues + Emotional Masochist Cathedral.
 *
 * WHAT: Modes, roles, intensity/duration seal, Soft Signal, pause, debrief, joke ledger.
 * WHY: Hold attachment panic + masochistic over-protocoling in a fail-closed ritual.
 * CONSENT: Local seal. Soft Signal God Mode. Prior ritual ≠ next yes.
 * NEVER: Clinical claims; public scores; require reason on Soft Signal.
 * SEE: docs/ATTACHMENT_REPAIR_PROTOCOL.md · docs/REAL_PURPOSE.md
 */

export const ATTACHMENT_REPAIR_VERSION = "0.1" as const;
export const ATTACHMENT_REPAIR_CORE_VERSION = 1 as const;

export type RepairModeId =
  | "mommy_issues"
  | "emotional_masochist"
  | "soft_landing"
  | "cathedral_silence"
  | "undecided";

export type RepairRoleId =
  | "care_seeker"
  | "care_giver"
  | "solo"
  | "mutual"
  | "undecided";

export type RepairIntensityId =
  | "feather"
  | "warm"
  | "firm"
  | "edge"
  | "undecided";

export type RepairDurationMinutes = 3 | 7 | 12 | 20 | "open";

export type RepairMode = {
  id: RepairModeId;
  label: string;
  blurb: string;
  nervousSystemJob: string;
};

export type RepairRole = {
  id: RepairRoleId;
  label: string;
  blurb: string;
};

export type RepairIntensity = {
  id: RepairIntensityId;
  label: string;
  blurb: string;
};

export const REPAIR_MODES: readonly RepairMode[] = [
  {
    id: "mommy_issues",
    label: "Mommy Issues Reassurance Ritual",
    blurb: "Am I wanted? Will I be left for needing this?",
    nervousSystemJob:
      "Receive chosen care without earning it via suffering or performance.",
  },
  {
    id: "emotional_masochist",
    label: "Emotional Masochist Circuit",
    blurb: "Urge to tighten the screw: more pain narrative, more protocol.",
    nervousSystemJob:
      "Name the payoff of suffering, cap intensity, soft land without growth-porn lies.",
  },
  {
    id: "soft_landing",
    label: "Soft Landing",
    blurb: "Already flooded. Minimal script. Blanket + Soft Signal.",
    nervousSystemJob: "Stop the spiral with almost no cognitive load.",
  },
  {
    id: "cathedral_silence",
    label: "Cathedral Silence",
    blurb: "Words are too much. Presence only. Timer + Soft Signal.",
    nervousSystemJob: "Attachment without performance language.",
  },
  {
    id: "undecided",
    label: "Not sealed",
    blurb: "Fail-closed.",
    nervousSystemJob: "—",
  },
] as const;

export const REPAIR_ROLES: readonly RepairRole[] = [
  {
    id: "care_seeker",
    label: "Care-seeker",
    blurb: "Receiving reassurance / hold. Not weak — brave enough to name the wound.",
  },
  {
    id: "care_giver",
    label: "Care-giver",
    blurb: "Offering structured care (partner voice or self-script).",
  },
  {
    id: "solo",
    label: "Solo practice",
    blurb: "Me + script + pillow cathedral. Valid default.",
  },
  {
    id: "mutual",
    label: "Mutual",
    blurb: "Both need something; dual care with a hard time-box.",
  },
  {
    id: "undecided",
    label: "Not sealed",
    blurb: "Fail-closed.",
  },
] as const;

export const REPAIR_INTENSITIES: readonly RepairIntensity[] = [
  {
    id: "feather",
    label: "Feather",
    blurb: "Barely there. Presence without pressure.",
  },
  {
    id: "warm",
    label: "Warm",
    blurb: "Steady reassurance. Default for Mommy Issues mode.",
  },
  {
    id: "firm",
    label: "Firm",
    blurb: "Grounding. Still Soft-Signalable.",
  },
  {
    id: "edge",
    label: "Edge",
    blurb: "Emotional Masochist Circuit only. Hard-capped. Soft land required.",
  },
  {
    id: "undecided",
    label: "Not sealed",
    blurb: "Fail-closed.",
  },
] as const;

export const REPAIR_DURATIONS: readonly RepairDurationMinutes[] = [
  3,
  7,
  12,
  20,
  "open",
];

/** Scripted lines shown during ritual body (not clinical). */
export const RITUAL_SCRIPTS: Record<
  Exclude<RepairModeId, "undecided">,
  readonly string[]
> = {
  mommy_issues: [
    "You are allowed to need this.",
    "Needing reassurance is not the same as being broken.",
    "I am not leaving because you asked.",
    "You don’t have to perform grateful to keep this.",
    "Your need for care is not an inconvenience to be apologized away.",
  ],
  emotional_masochist: [
    "I notice the urge to deepen the wound with more protocol.",
    "This circuit is capped. Soft Signal ends it. No drama extensions.",
    "Pain is not automatically growth. Feeling is not a productivity metric.",
    "I can name the masochistic pull without obeying it forever.",
    "Soft land is part of the seal — not optional bonus content.",
  ],
  soft_landing: [
    "You are here. You are allowed to stop performing.",
    "One breath. Soft Signal is free.",
    "You do not have to solve the relationship in this minute.",
  ],
  cathedral_silence: [
    "(Silence is the script. Presence only. Soft Signal free.)",
  ],
};

export type RepairSealDraft = {
  modeId: RepairModeId;
  roleId: RepairRoleId;
  intensityId: RepairIntensityId;
  durationMinutes: RepairDurationMinutes | null;
  softSignalAcknowledged: boolean;
  yellowPauseAcknowledged: boolean;
  edgeConsent: boolean;
  woundNote: string;
};

export type RepairSnapshot = {
  id: string;
  protocolVersion: typeof ATTACHMENT_REPAIR_VERSION;
  sealedAt: string;
  modeId: Exclude<RepairModeId, "undecided">;
  roleId: Exclude<RepairRoleId, "undecided">;
  intensityId: Exclude<RepairIntensityId, "undecided">;
  durationMinutes: RepairDurationMinutes;
  softSignalAcknowledged: boolean;
  yellowPauseAcknowledged: boolean;
  edgeConsent: boolean;
  woundNote: string;
};

export type RepairEndReason =
  | "completed"
  | "soft_signal"
  | "yellow_pause_exit"
  | "abandoned";

export type RepairDebrief = {
  flooded: number | null;
  softSignalStayedFreeInMind: boolean;
  woundActuallyFor: string;
  usedPartnerAsStandInWithoutConsent: boolean;
  ledgerNamedMommyIssues: boolean;
  ledgerCaughtMasochistLoop: boolean;
  ledgerReceivedWithoutPerformingPain: boolean;
  ledgerSoftSignalRemembered: boolean;
};

export type RepairHistoryEntry = {
  snapshot: RepairSnapshot;
  startedAt: string;
  endedAt: string;
  endReason: RepairEndReason;
  pauseCount: number;
  debrief: RepairDebrief | null;
};

export type RepairActiveSession = {
  snapshot: RepairSnapshot;
  startedAt: string;
  elapsedSeconds: number;
  pauseCount: number;
  scriptIndex: number;
  paused: boolean;
};

export const REPAIR_COPY = {
  banner:
    "This is currently a personal emotional containment system, not a public product.",
  title: "Attachment Repair Protocol v0.1",
  cathedral: "Attachment Repair Cathedral",
  tagline:
    "Mommy issues, emotional masochism, and extremely over-engineered rituals — leaning all the way in.",
  purpose:
    "Hold attachment panic and the urge to turn pain into protocol so raw need is less likely to ambush {{PARTNER}} without a map. Not therapy. Not a public product. Weirdly helpful.",
  softSignal: "Soft Signal is God Mode. Instant stop. No questions. Sacred even in the cathedral.",
  yellow: "Yellow = pause. Slow down. Do not escalate. Soft Signal still free.",
  careSeeker:
    "Care-seeker is strength. Naming the wound in a sealed ritual is advanced adulting.",
  masochist:
    "If you are here to tighten the screw for the aesthetic of suffering: Edge is capped. Soft land is law.",
  comedy:
    "I build cathedrals so I don’t have to feel like a child who might be left. Also it’s funny. Both true.",
} as const;

export function defaultRepairDraft(): RepairSealDraft {
  return {
    modeId: "undecided",
    roleId: "solo",
    intensityId: "undecided",
    durationMinutes: null,
    softSignalAcknowledged: false,
    yellowPauseAcknowledged: false,
    edgeConsent: false,
    woundNote: "",
  };
}

export function defaultRepairDebrief(): RepairDebrief {
  return {
    flooded: null,
    softSignalStayedFreeInMind: true,
    woundActuallyFor: "",
    usedPartnerAsStandInWithoutConsent: false,
    ledgerNamedMommyIssues: false,
    ledgerCaughtMasochistLoop: false,
    ledgerReceivedWithoutPerformingPain: false,
    ledgerSoftSignalRemembered: true,
  };
}

export function canSealRepair(draft: RepairSealDraft): {
  ok: boolean;
  reason: string;
} {
  if (draft.modeId === "undecided") {
    return { ok: false, reason: "Pick a mode (Mommy Issues / Masochist / Soft Landing / Silence)." };
  }
  if (draft.roleId === "undecided") {
    return { ok: false, reason: "Pick a role (Care-seeker is strength)." };
  }
  if (draft.intensityId === "undecided") {
    return { ok: false, reason: "Pick intensity." };
  }
  if (draft.durationMinutes == null) {
    return { ok: false, reason: "Pick duration (or open)." };
  }
  if (!draft.softSignalAcknowledged) {
    return {
      ok: false,
      reason: "Acknowledge Soft Signal as God Mode before sealing.",
    };
  }
  if (!draft.yellowPauseAcknowledged) {
    return {
      ok: false,
      reason: "Acknowledge Yellow pause exists before sealing.",
    };
  }
  if (draft.intensityId === "edge") {
    if (draft.modeId !== "emotional_masochist") {
      return {
        ok: false,
        reason: "Edge intensity only allowed in Emotional Masochist Circuit.",
      };
    }
    if (!draft.edgeConsent) {
      return {
        ok: false,
        reason: "Edge requires explicit consent to the cap + soft land.",
      };
    }
  }
  if (
    draft.modeId === "emotional_masochist" &&
    draft.intensityId === "edge" &&
    draft.durationMinutes === "open"
  ) {
    return {
      ok: false,
      reason: "Edge + open duration is forbidden (masochist loophole). Pick a timer.",
    };
  }
  return { ok: true, reason: "Cathedral doors open. Soft Signal armed." };
}

export function sealRepair(
  draft: RepairSealDraft,
  opts?: { id?: string; sealedAt?: string },
): RepairSnapshot | null {
  const gate = canSealRepair(draft);
  if (!gate.ok) return null;
  if (
    draft.modeId === "undecided" ||
    draft.roleId === "undecided" ||
    draft.intensityId === "undecided" ||
    draft.durationMinutes == null
  ) {
    return null;
  }
  return {
    id: opts?.id ?? `repair-${Date.now()}`,
    protocolVersion: ATTACHMENT_REPAIR_VERSION,
    sealedAt: opts?.sealedAt ?? new Date().toISOString(),
    modeId: draft.modeId,
    roleId: draft.roleId,
    intensityId: draft.intensityId,
    durationMinutes: draft.durationMinutes,
    softSignalAcknowledged: true,
    yellowPauseAcknowledged: true,
    edgeConsent: Boolean(draft.edgeConsent),
    woundNote: draft.woundNote.trim().slice(0, 500),
  };
}

export function startRepairSession(
  snapshot: RepairSnapshot,
): RepairActiveSession {
  return {
    snapshot,
    startedAt: new Date().toISOString(),
    elapsedSeconds: 0,
    pauseCount: 0,
    scriptIndex: 0,
    paused: false,
  };
}

export function tickRepairSession(
  session: RepairActiveSession,
  deltaSeconds = 1,
): RepairActiveSession {
  if (session.paused) return session;
  const d = Math.max(0, Math.floor(deltaSeconds));
  return {
    ...session,
    elapsedSeconds: session.elapsedSeconds + d,
  };
}

export function yellowPause(
  session: RepairActiveSession,
): RepairActiveSession {
  return {
    ...session,
    paused: true,
    pauseCount: session.pauseCount + 1,
  };
}

export function resumeFromYellow(
  session: RepairActiveSession,
): RepairActiveSession {
  return { ...session, paused: false };
}

export function advanceScript(
  session: RepairActiveSession,
): RepairActiveSession {
  const lines = RITUAL_SCRIPTS[session.snapshot.modeId];
  const next = Math.min(session.scriptIndex + 1, lines.length - 1);
  return { ...session, scriptIndex: next };
}

export function currentScriptLine(session: RepairActiveSession): string {
  const lines = RITUAL_SCRIPTS[session.snapshot.modeId];
  return lines[session.scriptIndex] ?? lines[0] ?? "";
}

export function durationTargetSeconds(
  duration: RepairDurationMinutes,
): number | null {
  if (duration === "open") return null;
  return duration * 60;
}

export function isRepairDurationComplete(
  session: RepairActiveSession,
): boolean {
  const target = durationTargetSeconds(session.snapshot.durationMinutes);
  if (target == null) return false;
  return session.elapsedSeconds >= target;
}

export function formatRepairClock(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, "0")}`;
}

export function completeRepair(
  session: RepairActiveSession,
  endReason: RepairEndReason,
  debrief: RepairDebrief | null,
): RepairHistoryEntry {
  return {
    snapshot: session.snapshot,
    startedAt: session.startedAt,
    endedAt: new Date().toISOString(),
    endReason,
    pauseCount: session.pauseCount,
    debrief: debrief
      ? {
          flooded:
            debrief.flooded != null
              ? Math.max(1, Math.min(10, Math.round(debrief.flooded)))
              : null,
          softSignalStayedFreeInMind: Boolean(
            debrief.softSignalStayedFreeInMind,
          ),
          woundActuallyFor: debrief.woundActuallyFor.trim().slice(0, 500),
          usedPartnerAsStandInWithoutConsent: Boolean(
            debrief.usedPartnerAsStandInWithoutConsent,
          ),
          ledgerNamedMommyIssues: Boolean(debrief.ledgerNamedMommyIssues),
          ledgerCaughtMasochistLoop: Boolean(debrief.ledgerCaughtMasochistLoop),
          ledgerReceivedWithoutPerformingPain: Boolean(
            debrief.ledgerReceivedWithoutPerformingPain,
          ),
          ledgerSoftSignalRemembered: Boolean(
            debrief.ledgerSoftSignalRemembered,
          ),
        }
      : null,
  };
}

export function findMode(id: RepairModeId): RepairMode {
  return REPAIR_MODES.find((m) => m.id === id) ?? REPAIR_MODES[REPAIR_MODES.length - 1]!;
}

export function findRole(id: RepairRoleId): RepairRole {
  return REPAIR_ROLES.find((r) => r.id === id) ?? REPAIR_ROLES[REPAIR_ROLES.length - 1]!;
}

export function findIntensity(id: RepairIntensityId): RepairIntensity {
  return (
    REPAIR_INTENSITIES.find((i) => i.id === id) ?? REPAIR_INTENSITIES[0]!
  );
}

export function summarizeRepairHistory(entries: RepairHistoryEntry[]): {
  total: number;
  soft_signal_exits: number;
  mommy_issues: number;
  masochist: number;
  named_mommy_ledger: number;
  caught_masochist_ledger: number;
} {
  return {
    total: entries.length,
    soft_signal_exits: entries.filter((e) => e.endReason === "soft_signal")
      .length,
    mommy_issues: entries.filter((e) => e.snapshot.modeId === "mommy_issues")
      .length,
    masochist: entries.filter(
      (e) => e.snapshot.modeId === "emotional_masochist",
    ).length,
    named_mommy_ledger: entries.filter((e) => e.debrief?.ledgerNamedMommyIssues)
      .length,
    caught_masochist_ledger: entries.filter(
      (e) => e.debrief?.ledgerCaughtMasochistLoop,
    ).length,
  };
}

export function parseRepairHistory(raw: unknown): RepairHistoryEntry[] {
  if (!Array.isArray(raw)) return [];
  const out: RepairHistoryEntry[] = [];
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
      endReason !== "yellow_pause_exit" &&
      endReason !== "abandoned"
    ) {
      continue;
    }
    out.push({
      snapshot: {
        id: snap.id,
        protocolVersion: ATTACHMENT_REPAIR_VERSION,
        sealedAt:
          typeof snap.sealedAt === "string"
            ? snap.sealedAt
            : new Date(0).toISOString(),
        modeId: (snap.modeId as RepairSnapshot["modeId"]) ?? "soft_landing",
        roleId: (snap.roleId as RepairSnapshot["roleId"]) ?? "solo",
        intensityId:
          (snap.intensityId as RepairSnapshot["intensityId"]) ?? "warm",
        durationMinutes:
          (snap.durationMinutes as RepairDurationMinutes) ?? 7,
        softSignalAcknowledged: true,
        yellowPauseAcknowledged: true,
        edgeConsent: Boolean(snap.edgeConsent),
        woundNote:
          typeof snap.woundNote === "string"
            ? snap.woundNote.slice(0, 500)
            : "",
      },
      startedAt: e.startedAt,
      endedAt: e.endedAt,
      endReason,
      pauseCount: typeof e.pauseCount === "number" ? e.pauseCount : 0,
      debrief: null,
    });
  }
  return out.slice(0, 50);
}
