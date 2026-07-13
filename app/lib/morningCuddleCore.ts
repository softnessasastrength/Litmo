/**
 * Morning Cuddle Protocol v0.1 — 7:42am spiral containment.
 *
 * WHAT: 30-second negotiation, energy/duration/style/zones, Soft Signal, exit ritual.
 * WHY: High-risk high-reward morning closeness without “am I needy?” brain fire.
 * CONSENT: Local seal only. Soft Signal sacred. Prior mornings ≠ consent.
 * NEVER: Public skill scores; require reason on Soft Signal; skip positive exit copy.
 * SEE: docs/MORNING_CUDDLE_PROTOCOL.md · docs/REAL_PURPOSE.md
 */

export const MORNING_CUDDLE_VERSION = "0.1" as const;
export const MORNING_CUDDLE_CORE_VERSION = 1 as const;

export type MorningEnergyId =
  | "crispy"
  | "toasty"
  | "gremlin"
  | "exit_protocol"
  | "undecided";

export type MorningDurationId =
  | "micro"
  | "standard"
  | "extended"
  | "undecided";

export type MorningStyleId =
  | "gentle_hold"
  | "full_burrito"
  | "back_scritches"
  | "big_spoon_safety"
  | "starfish_adjacent"
  | "jetpack"
  | "koala_cling"
  | "undecided";

export type MorningZoneKey =
  | "hair"
  | "stomach"
  | "legs"
  | "face_to_face";

export type MorningHairPolicy = "yes" | "washed_yesterday_only" | "no";
export type MorningStomachPolicy = "yes" | "negotiable" | "no";
export type MorningLegsPolicy = "default_yes" | "restless_no";
export type MorningFacePolicy = "no" | "explicit_yes";

export type MorningCheckInPhraseId =
  | "still_alive"
  | "you_good_gremlin"
  | "none";

export type MorningEnergy = {
  id: MorningEnergyId;
  label: string;
  blurb: string;
};

export type MorningDuration = {
  id: MorningDurationId;
  label: string;
  /** Target seconds; null = open / exit-driven. */
  targetSeconds: number | null;
  blurb: string;
};

export type MorningStyle = {
  id: MorningStyleId;
  label: string;
  blurb: string;
};

export const MORNING_ENERGIES: readonly MorningEnergy[] = [
  {
    id: "crispy",
    label: "Crispy",
    blurb: "Fully awake. Wants to be productive. Cuddle is a board meeting.",
  },
  {
    id: "toasty",
    label: "Toasty",
    blurb: "Warm, cozy, wants to melt into each other.",
  },
  {
    id: "gremlin",
    label: "Gremlin",
    blurb: "Barely conscious. Needs maximum containment. Also may need to pee in 8 minutes.",
  },
  {
    id: "exit_protocol",
    label: "Exit Protocol",
    blurb: "One or both needs to get up immediately. Soft Signal of the morning.",
  },
  {
    id: "undecided",
    label: "Not sealed",
    blurb: "Fail-closed.",
  },
] as const;

export const MORNING_DURATIONS: readonly MorningDuration[] = [
  {
    id: "micro",
    label: "Micro (2–5 min)",
    targetSeconds: 4 * 60,
    blurb: "Hit of closeness. Pee can wait… almost.",
  },
  {
    id: "standard",
    label: "Standard (8–15 min)",
    targetSeconds: 12 * 60,
    blurb: "Classic morning hold window.",
  },
  {
    id: "extended",
    label: "Extended (20+)",
    targetSeconds: 25 * 60,
    blurb: "Risk of falling back asleep. Accept the hazard.",
  },
  {
    id: "undecided",
    label: "Not sealed",
    targetSeconds: null,
    blurb: "Fail-closed.",
  },
] as const;

export const MORNING_STYLES: readonly MorningStyle[] = [
  {
    id: "gentle_hold",
    label: "Gentle Hold",
    blurb: "Light arm drape, low pressure.",
  },
  {
    id: "full_burrito",
    label: "Full Burrito",
    blurb: "Maximum entanglement + blanket prison.",
  },
  {
    id: "back_scritches",
    label: "Back Scritches",
    blurb: "Non-sexual service animal mode.",
  },
  {
    id: "big_spoon_safety",
    label: "Big Spoon Safety",
    blurb: "Little spoon protection priority.",
  },
  {
    id: "starfish_adjacent",
    label: "Starfish Adjacent",
    blurb: "Minimal contact — mostly existence confirmation.",
  },
  {
    id: "jetpack",
    label: "Jetpack Mode",
    blurb: "Little spoon clings from behind big spoon. Advanced gremlin tech.",
  },
  {
    id: "koala_cling",
    label: "Koala Cling",
    blurb: "Front-facing cling energy. High contact, high comedy.",
  },
  {
    id: "undecided",
    label: "Not sealed",
    blurb: "Fail-closed.",
  },
] as const;

export type MorningZones = {
  hair: MorningHairPolicy;
  stomach: MorningStomachPolicy;
  legs: MorningLegsPolicy;
  faceToFace: MorningFacePolicy;
};

export type MorningSealDraft = {
  energyId: MorningEnergyId;
  durationId: MorningDurationId;
  styleId: MorningStyleId;
  zones: MorningZones;
  checkInPhrase: MorningCheckInPhraseId;
  anxietyNote: string;
  goodMorningHaptic: boolean;
};

export type MorningSnapshot = {
  id: string;
  protocolVersion: typeof MORNING_CUDDLE_VERSION;
  sealedAt: string;
  energyId: Exclude<MorningEnergyId, "undecided">;
  durationId: Exclude<MorningDurationId, "undecided">;
  styleId: Exclude<MorningStyleId, "undecided">;
  zones: MorningZones;
  checkInPhrase: MorningCheckInPhraseId;
  anxietyNote: string;
  goodMorningHaptic: boolean;
};

export type MorningEndReason =
  | "completed"
  | "soft_signal"
  | "exit_protocol"
  | "graceful_timer"
  | "abandoned";

export type MorningDebrief = {
  /** How safe did that feel 1–10? */
  safetyFeel: number | null;
  note: string;
  ledgerReceivedWithoutSpiral: boolean;
  ledgerNoGuiltAboutCloseness: boolean;
  exitRitualDone: boolean;
};

export type MorningHistoryEntry = {
  snapshot: MorningSnapshot;
  startedAt: string;
  endedAt: string;
  endReason: MorningEndReason;
  checkInCount: number;
  debrief: MorningDebrief | null;
};

export type MorningActiveSession = {
  snapshot: MorningSnapshot;
  startedAt: string;
  elapsedSeconds: number;
  checkInCount: number;
  gracefulExitArmed: boolean;
};

export const MORNING_COPY = {
  banner:
    "This is currently a personal emotional containment system, not a public product.",
  title: "Morning Cuddle Protocol v0.1",
  tagline:
    "Because nothing says “I love you” like a formalized negotiation before coffee",
  philosophy:
    "Morning cuddles are high-risk, high-reward. One human is functional; the other is a half-dead gremlin who wants to be held and also needs to pee in 8 minutes. This exists so the brain does not spiral into “am I needy / are they annoyed / is this ruining the relationship” at 7:42am.",
  negotiateHint: "Pre-cuddle negotiation: 30 seconds max. Then seal or Exit Protocol.",
  softSignal:
    "Soft Signal remains sacred — instant release + “no worries, love you.” No TED talk.",
  exitRitual:
    "Post-cuddle ritual: forehead kiss + “I really liked that” (mandatory positive reinforcement for this brain).",
  checkInStillAlive: "Still alive in there?",
  checkInGremlin: "You good, gremlin?",
  ledger1: "+1 Successfully received morning affection without spiraling",
  ledger2: "+1 Managed to not feel guilty about wanting closeness",
  comedy:
    "Comedy gold. Also emotional support infrastructure. Both true before coffee.",
} as const;

export function defaultMorningZones(): MorningZones {
  return {
    hair: "yes",
    stomach: "negotiable",
    legs: "default_yes",
    faceToFace: "no",
  };
}

export function defaultMorningDraft(): MorningSealDraft {
  return {
    energyId: "undecided",
    durationId: "undecided",
    styleId: "undecided",
    zones: defaultMorningZones(),
    checkInPhrase: "you_good_gremlin",
    anxietyNote: "",
    goodMorningHaptic: true,
  };
}

export function defaultMorningDebrief(): MorningDebrief {
  return {
    safetyFeel: null,
    note: "",
    ledgerReceivedWithoutSpiral: true,
    ledgerNoGuiltAboutCloseness: true,
    exitRitualDone: false,
  };
}

/**
 * Exit Protocol energy is a valid “seal” that means do not start cuddle.
 */
export function isImmediateExit(draft: MorningSealDraft): boolean {
  return draft.energyId === "exit_protocol";
}

export function canSealMorning(draft: MorningSealDraft): {
  ok: boolean;
  reason: string;
  immediateExit: boolean;
} {
  if (draft.energyId === "undecided") {
    return {
      ok: false,
      reason: "Pick energy (Crispy / Toasty / Gremlin / Exit Protocol).",
      immediateExit: false,
    };
  }
  if (draft.energyId === "exit_protocol") {
    return {
      ok: true,
      reason: "Exit Protocol — no cuddle start. Soft Signal of the morning.",
      immediateExit: true,
    };
  }
  if (draft.durationId === "undecided") {
    return {
      ok: false,
      reason: "Pick duration (Micro / Standard / Extended).",
      immediateExit: false,
    };
  }
  if (draft.styleId === "undecided") {
    return {
      ok: false,
      reason: "Pick style (Gentle Hold → Koala Cling).",
      immediateExit: false,
    };
  }
  return {
    ok: true,
    reason: "Ready to seal. Soft Signal remains sacred.",
    immediateExit: false,
  };
}

export function sealMorning(
  draft: MorningSealDraft,
  opts?: { id?: string; sealedAt?: string },
): MorningSnapshot | null {
  const gate = canSealMorning(draft);
  if (!gate.ok || gate.immediateExit) return null;
  if (
    draft.energyId === "undecided" ||
    draft.energyId === "exit_protocol" ||
    draft.durationId === "undecided" ||
    draft.styleId === "undecided"
  ) {
    return null;
  }
  return {
    id: opts?.id ?? `morning-${Date.now()}`,
    protocolVersion: MORNING_CUDDLE_VERSION,
    sealedAt: opts?.sealedAt ?? new Date().toISOString(),
    energyId: draft.energyId,
    durationId: draft.durationId,
    styleId: draft.styleId,
    zones: { ...draft.zones },
    checkInPhrase: draft.checkInPhrase,
    anxietyNote: draft.anxietyNote.trim().slice(0, 500),
    goodMorningHaptic: Boolean(draft.goodMorningHaptic),
  };
}

export function startMorningSession(
  snapshot: MorningSnapshot,
): MorningActiveSession {
  return {
    snapshot,
    startedAt: new Date().toISOString(),
    elapsedSeconds: 0,
    checkInCount: 0,
    gracefulExitArmed: false,
  };
}

export function tickMorningSession(
  session: MorningActiveSession,
  deltaSeconds = 1,
): MorningActiveSession {
  const d = Math.max(0, Math.floor(deltaSeconds));
  return {
    ...session,
    elapsedSeconds: session.elapsedSeconds + d,
  };
}

export function recordMorningCheckIn(
  session: MorningActiveSession,
): MorningActiveSession {
  return {
    ...session,
    checkInCount: session.checkInCount + 1,
  };
}

export function armGracefulExit(
  session: MorningActiveSession,
): MorningActiveSession {
  return { ...session, gracefulExitArmed: true };
}

export function durationTargetSeconds(
  durationId: Exclude<MorningDurationId, "undecided">,
): number | null {
  return (
    MORNING_DURATIONS.find((d) => d.id === durationId)?.targetSeconds ?? null
  );
}

export function isMorningDurationComplete(
  session: MorningActiveSession,
): boolean {
  const target = durationTargetSeconds(session.snapshot.durationId);
  if (target == null) return false;
  return session.elapsedSeconds >= target;
}

/** Gremlin pee-window reminder at ~8 minutes if still active. */
export function shouldFireGremlinPeeWarning(
  session: MorningActiveSession,
): boolean {
  if (session.snapshot.energyId !== "gremlin") return false;
  return session.elapsedSeconds === 8 * 60;
}

export function formatMorningClock(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, "0")}`;
}

export function checkInPhraseText(
  id: MorningCheckInPhraseId,
): string | null {
  if (id === "still_alive") return MORNING_COPY.checkInStillAlive;
  if (id === "you_good_gremlin") return MORNING_COPY.checkInGremlin;
  return null;
}

export function completeMorning(
  session: MorningActiveSession,
  endReason: MorningEndReason,
  debrief: MorningDebrief | null,
): MorningHistoryEntry {
  return {
    snapshot: session.snapshot,
    startedAt: session.startedAt,
    endedAt: new Date().toISOString(),
    endReason,
    checkInCount: session.checkInCount,
    debrief: debrief
      ? {
          safetyFeel:
            debrief.safetyFeel != null
              ? Math.max(1, Math.min(10, Math.round(debrief.safetyFeel)))
              : null,
          note: debrief.note.trim().slice(0, 500),
          ledgerReceivedWithoutSpiral: Boolean(
            debrief.ledgerReceivedWithoutSpiral,
          ),
          ledgerNoGuiltAboutCloseness: Boolean(
            debrief.ledgerNoGuiltAboutCloseness,
          ),
          exitRitualDone: Boolean(debrief.exitRitualDone),
        }
      : null,
  };
}

export function findEnergy(id: MorningEnergyId): MorningEnergy {
  return (
    MORNING_ENERGIES.find((e) => e.id === id) ??
    MORNING_ENERGIES[MORNING_ENERGIES.length - 1]!
  );
}

export function findDuration(id: MorningDurationId): MorningDuration {
  return (
    MORNING_DURATIONS.find((d) => d.id === id) ??
    MORNING_DURATIONS[MORNING_DURATIONS.length - 1]!
  );
}

export function findStyle(id: MorningStyleId): MorningStyle {
  return (
    MORNING_STYLES.find((s) => s.id === id) ??
    MORNING_STYLES[MORNING_STYLES.length - 1]!
  );
}

export function summarizeMorningHistory(entries: MorningHistoryEntry[]): {
  total: number;
  soft_signal_exits: number;
  exit_protocol_skips: number;
  no_spiral_plus: number;
  no_guilt_plus: number;
  gremlin_sessions: number;
} {
  return {
    total: entries.length,
    soft_signal_exits: entries.filter((e) => e.endReason === "soft_signal")
      .length,
    exit_protocol_skips: entries.filter((e) => e.endReason === "exit_protocol")
      .length,
    no_spiral_plus: entries.filter(
      (e) => e.debrief?.ledgerReceivedWithoutSpiral,
    ).length,
    no_guilt_plus: entries.filter(
      (e) => e.debrief?.ledgerNoGuiltAboutCloseness,
    ).length,
    gremlin_sessions: entries.filter((e) => e.snapshot.energyId === "gremlin")
      .length,
  };
}

/** Log Exit Protocol without an active session. */
export function exitProtocolHistoryEntry(
  opts?: { id?: string; at?: string },
): MorningHistoryEntry {
  const at = opts?.at ?? new Date().toISOString();
  return {
    snapshot: {
      id: opts?.id ?? `morning-exit-${Date.now()}`,
      protocolVersion: MORNING_CUDDLE_VERSION,
      sealedAt: at,
      energyId: "gremlin",
      durationId: "micro",
      styleId: "starfish_adjacent",
      zones: defaultMorningZones(),
      checkInPhrase: "none",
      anxietyNote: "Exit Protocol — no cuddle started.",
      goodMorningHaptic: false,
    },
    startedAt: at,
    endedAt: at,
    endReason: "exit_protocol",
    checkInCount: 0,
    debrief: null,
  };
}

export function parseMorningHistory(raw: unknown): MorningHistoryEntry[] {
  if (!Array.isArray(raw)) return [];
  const out: MorningHistoryEntry[] = [];
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
      endReason !== "exit_protocol" &&
      endReason !== "graceful_timer" &&
      endReason !== "abandoned"
    ) {
      continue;
    }
    out.push({
      snapshot: {
        id: snap.id,
        protocolVersion: MORNING_CUDDLE_VERSION,
        sealedAt:
          typeof snap.sealedAt === "string"
            ? snap.sealedAt
            : new Date(0).toISOString(),
        energyId: (snap.energyId as MorningSnapshot["energyId"]) ?? "gremlin",
        durationId:
          (snap.durationId as MorningSnapshot["durationId"]) ?? "micro",
        styleId:
          (snap.styleId as MorningSnapshot["styleId"]) ?? "gentle_hold",
        zones: defaultMorningZones(),
        checkInPhrase:
          (snap.checkInPhrase as MorningCheckInPhraseId) ?? "none",
        anxietyNote:
          typeof snap.anxietyNote === "string"
            ? snap.anxietyNote.slice(0, 500)
            : "",
        goodMorningHaptic: Boolean(snap.goodMorningHaptic),
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
