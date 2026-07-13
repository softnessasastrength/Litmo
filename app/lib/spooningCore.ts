/**
 * Spooning Protocol v0.1 — pure logic for the most over-engineered cuddle planner.
 *
 * WHAT: Roles, positions, duration/energy seal, active timer, Soft Signal end, debrief.
 * WHY: Containment for intimacy anxiety; funny; still fail-closed (no seal → no spoon).
 * CONSENT: Local practice seal is NOT a multi-party Consent Snapshot. Soft Signal free.
 * NEVER: Infer yes from history; require reason on Soft Signal; score “spoon skill.”
 * SEE: docs/SPOONING_PROTOCOL.md · docs/REAL_PURPOSE.md · docs/CONTAINMENT_SYSTEM.md
 */

export const SPOONING_PROTOCOL_VERSION = "0.1" as const;
export const SPOONING_CORE_VERSION = 1 as const;

export type SpoonRoleId =
  | "little"
  | "big"
  | "switch"
  | "parallel"
  | "solo_practice"
  | "undecided";

export type SpoonPositionId =
  | "classic"
  | "safety"
  | "half_nest"
  | "burrito"
  | "back_to_back"
  | "legs_only"
  | "custom";

export type SpoonEnergyId =
  | "quiet"
  | "soft"
  | "playful"
  | "heavy"
  | "unknown";

export type SpoonDurationMinutes = 5 | 15 | 30 | 45 | 60 | "open";

export type SpoonRole = {
  id: SpoonRoleId;
  label: string;
  blurb: string;
};

export type SpoonPosition = {
  id: SpoonPositionId;
  label: string;
  blurb: string;
};

export type SpoonEnergy = {
  id: SpoonEnergyId;
  label: string;
  blurb: string;
};

export const SPOON_ROLES: readonly SpoonRole[] = [
  {
    id: "little",
    label: "Little Spoon",
    blurb: "Held. Spine option of the soul. Asking for this is strength.",
  },
  {
    id: "big",
    label: "Big Spoon",
    blurb: "The backpack. Warmth + optional responsibility theater.",
  },
  {
    id: "switch",
    label: "Switch",
    blurb: "We will renegotiate mid-spoon like adults with feelings.",
  },
  {
    id: "parallel",
    label: "Parallel Play",
    blurb: "Same bed energy, less interlocking. Introvert-legal.",
  },
  {
    id: "solo_practice",
    label: "Solo Practice",
    blurb: "You + pillow + protocol. Valid. Often optimal.",
  },
  {
    id: "undecided",
    label: "Not sealed",
    blurb: "Fail-closed default. Pick something real.",
  },
] as const;

export const SPOON_POSITIONS: readonly SpoonPosition[] = [
  {
    id: "classic",
    label: "Classic",
    blurb: "Lateral alignment. Hands are not assumed.",
  },
  {
    id: "safety",
    label: "Safety Spoon",
    blurb: "Extra torso space. Hands stay boring on purpose.",
  },
  {
    id: "half_nest",
    label: "Half Nest",
    blurb: "Upper-body contact; lower-body optional.",
  },
  {
    id: "burrito",
    label: "Burrito",
    blurb: "Blanket-dominant. Skin optional. Still counts.",
  },
  {
    id: "back_to_back",
    label: "Back-to-Back",
    blurb: "Presence without face intensity.",
  },
  {
    id: "legs_only",
    label: "Legs-Only",
    blurb: "Low-stakes entanglement. High comedy.",
  },
  {
    id: "custom",
    label: "Custom",
    blurb: "Name it in notes. Still needs Soft Signal path.",
  },
] as const;

export const SPOON_ENERGIES: readonly SpoonEnergy[] = [
  {
    id: "quiet",
    label: "Quiet",
    blurb: "Low verbal. Nervous system wants mute mode.",
  },
  {
    id: "soft",
    label: "Soft talk ok",
    blurb: "Small words allowed. No debate club.",
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
    id: "unknown",
    label: "Not named",
    blurb: "Pick deliberately if you seal — not auto-yes.",
  },
] as const;

export const SPOON_DURATIONS: readonly SpoonDurationMinutes[] = [
  5,
  15,
  30,
  45,
  60,
  "open",
];

export type SpoonSealDraft = {
  roleId: SpoonRoleId;
  positionId: SpoonPositionId;
  durationMinutes: SpoonDurationMinutes | null;
  energyId: SpoonEnergyId;
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
  energyId: Exclude<SpoonEnergyId, "unknown"> | "unknown";
  anxietyNote: string;
  customPositionNote: string;
};

export type SpoonEndReason = "completed" | "soft_signal" | "abandoned";

export type SpoonDebrief = {
  comfort: 1 | 2 | 3 | 4 | 5 | null;
  again: "yes" | "maybe" | "no" | null;
  note: string;
  owedNoPerformance: boolean;
};

export type SpoonHistoryEntry = {
  snapshot: SpoonSnapshot;
  startedAt: string;
  endedAt: string;
  endReason: SpoonEndReason;
  debrief: SpoonDebrief | null;
};

export type SpoonActiveSession = {
  snapshot: SpoonSnapshot;
  startedAt: string;
  /** Elapsed seconds while active (UI ticks). */
  elapsedSeconds: number;
};

export const SPOONING_COPY = {
  banner:
    "This is currently a personal emotional containment system, not a public product.",
  title: "Spooning Protocol v0.1",
  subtitle:
    "The most over-engineered spooning experience in human history. Also: me trying not to be anxious while cuddling.",
  sealHint:
    "No spoon without an explicit local seal. Prior cuddles are not consent.",
  softSignalHint: "Mid-spoon Soft Signal ends everything. No explanation owed.",
  comedy:
    "My love language is infrastructure. Yours can be snacks. Both valid.",
} as const;

export function defaultSpoonDraft(): SpoonSealDraft {
  return {
    roleId: "undecided",
    positionId: "classic",
    durationMinutes: null,
    energyId: "unknown",
    anxietyNote: "",
    customPositionNote: "",
  };
}

export function defaultDebrief(): SpoonDebrief {
  return {
    comfort: null,
    again: null,
    note: "",
    owedNoPerformance: false,
  };
}

/**
 * WHAT: Whether draft may become a sealed spoon snapshot.
 * WHY: Fail closed — undecided role / missing duration cannot start.
 */
export function canSealSpoon(draft: SpoonSealDraft): {
  ok: boolean;
  reason: string;
} {
  if (draft.roleId === "undecided") {
    return { ok: false, reason: "Pick a role (even Solo Practice counts)." };
  }
  if (draft.durationMinutes == null) {
    return { ok: false, reason: "Pick a duration (or open — still Soft-Signalable)." };
  }
  if (draft.positionId === "custom" && draft.customPositionNote.trim().length < 1) {
    return {
      ok: false,
      reason: "Custom position needs a short name so future-you knows what happened.",
    };
  }
  if (draft.energyId === "unknown") {
    return {
      ok: false,
      reason: "Name the energy (quiet/soft/playful/heavy). Unknown is not a seal.",
    };
  }
  return { ok: true, reason: "Ready to seal. Soft Signal stays free." };
}

export function sealSpoon(
  draft: SpoonSealDraft,
  opts?: { id?: string; sealedAt?: string },
): SpoonSnapshot | null {
  const gate = canSealSpoon(draft);
  if (!gate.ok) return null;
  if (draft.roleId === "undecided" || draft.durationMinutes == null) return null;
  if (draft.energyId === "unknown") return null;

  return {
    id: opts?.id ?? `spoon-${Date.now()}`,
    protocolVersion: SPOONING_PROTOCOL_VERSION,
    sealedAt: opts?.sealedAt ?? new Date().toISOString(),
    roleId: draft.roleId,
    positionId: draft.positionId,
    durationMinutes: draft.durationMinutes,
    energyId: draft.energyId,
    anxietyNote: draft.anxietyNote.trim().slice(0, 500),
    customPositionNote: draft.customPositionNote.trim().slice(0, 200),
  };
}

export function startSpoonSession(snapshot: SpoonSnapshot): SpoonActiveSession {
  return {
    snapshot,
    startedAt: new Date().toISOString(),
    elapsedSeconds: 0,
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

/**
 * WHAT: Target seconds for duration (open = null = no auto-complete).
 */
export function durationTargetSeconds(
  duration: SpoonDurationMinutes,
): number | null {
  if (duration === "open") return null;
  return duration * 60;
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
    debrief: debrief
      ? {
          comfort: debrief.comfort,
          again: debrief.again,
          note: debrief.note.trim().slice(0, 500),
          owedNoPerformance: Boolean(debrief.owedNoPerformance),
        }
      : null,
  };
}

export function findRole(id: SpoonRoleId): SpoonRole {
  return SPOON_ROLES.find((r) => r.id === id) ?? SPOON_ROLES[SPOON_ROLES.length - 1]!;
}

export function findPosition(id: SpoonPositionId): SpoonPosition {
  return (
    SPOON_POSITIONS.find((p) => p.id === id) ?? SPOON_POSITIONS[0]!
  );
}

export function findEnergy(id: SpoonEnergyId): SpoonEnergy {
  return SPOON_ENERGIES.find((e) => e.id === id) ?? SPOON_ENERGIES[0]!;
}

export function summarizeHistory(entries: SpoonHistoryEntry[]): {
  total: number;
  soft_signal_exits: number;
  solo_practice: number;
} {
  return {
    total: entries.length,
    soft_signal_exits: entries.filter((e) => e.endReason === "soft_signal")
      .length,
    solo_practice: entries.filter((e) => e.snapshot.roleId === "solo_practice")
      .length,
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
        energyId: (snap.energyId as SpoonSnapshot["energyId"]) ?? "quiet",
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
      debrief: null,
    });
  }
  return out.slice(0, 50);
}
