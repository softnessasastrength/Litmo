/**
 * Trauma-informed safety system — pure types and helpers.
 *
 * Invariants:
 * - Soft Signal / panic / quick exit never require a reason or peer permission.
 * - Partner verification is present-moment diligence, never a safety certificate.
 * - Session timeout is an agreed boundary aid, never a shame timer.
 * - Post-session reflection is optional, skippable, non-clinical, private.
 * - Litmo is not emergency response or crisis services.
 */

export const TRAUMA_SAFETY_VERSION = 1 as const;

// ── Panic mode & quick exit ────────────────────────────────────────────────

/** How the user asked to leave under stress. */
export type SafetyExitKind =
  | "soft_signal"
  | "quick_exit"
  | "panic_mode"
  | "timeout_auto"
  | "timeout_prompted";

export type PanicModePrefs = {
  version: typeof TRAUMA_SAFETY_VERSION;
  /**
   * When true, panic also navigates to a calm cover screen (clock/weather)
   * so shoulder-surfing or pressure to continue is harder.
   */
  useCoverScreen: boolean;
  /** Optional soft delay before cover (ms). 0 = immediate. Never delays the stop. */
  coverDelayMs: number;
  updatedAt: string;
};

export const defaultPanicPrefs = (): PanicModePrefs => ({
  version: 1,
  useCoverScreen: true,
  coverDelayMs: 0,
  updatedAt: new Date(0).toISOString(),
});

export function parsePanicPrefs(raw: unknown): PanicModePrefs | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const o = raw as Record<string, unknown>;
  if (o.version !== 1) return null;
  return {
    version: 1,
    useCoverScreen: o.useCoverScreen !== false,
    coverDelayMs:
      typeof o.coverDelayMs === "number" && o.coverDelayMs >= 0
        ? Math.min(2000, Math.floor(o.coverDelayMs))
        : 0,
    updatedAt:
      typeof o.updatedAt === "string" ? o.updatedAt : new Date(0).toISOString(),
  };
}

export const PANIC_COPY = {
  title: "You are out.",
  body: "The session ended on this device. You do not owe an explanation. Soft Signal and panic exit are never penalties.",
  coverTitle: "Take a breath.",
  coverBody:
    "You can put this phone away. Nothing here requires a story. Litmo is not emergency services.",
  notEmergency:
    "If you are in immediate danger, contact local emergency services. Litmo cannot dispatch help.",
  quickExitHint:
    "Ends the session immediately and returns you to a calm screen. No explanation needed.",
  panicHint:
    "Ends the session and shows a simple cover so you can leave the interaction without explaining.",
} as const;

// ── Session timeout ────────────────────────────────────────────────────────

export type SessionTimeoutPrefs = {
  version: typeof TRAUMA_SAFETY_VERSION;
  /** Master switch — off by default so silence is allowed. */
  enabled: boolean;
  /** Agreed max duration in minutes (5–180). */
  maxMinutes: number;
  /** Soft warning minutes before end (1–15). */
  warnBeforeMinutes: number;
  /**
   * When true, at timeout Soft Signal fires automatically.
   * When false, a calm prompt offers Soft Signal or mutual extend.
   */
  autoSoftSignalAtTimeout: boolean;
  updatedAt: string;
};

export const defaultSessionTimeoutPrefs = (): SessionTimeoutPrefs => ({
  version: 1,
  enabled: false,
  maxMinutes: 30,
  warnBeforeMinutes: 5,
  autoSoftSignalAtTimeout: false,
  updatedAt: new Date(0).toISOString(),
});

export function parseSessionTimeoutPrefs(
  raw: unknown,
): SessionTimeoutPrefs | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const o = raw as Record<string, unknown>;
  if (o.version !== 1) return null;
  const maxMinutes =
    typeof o.maxMinutes === "number"
      ? Math.min(180, Math.max(5, Math.floor(o.maxMinutes)))
      : 30;
  const warnBeforeMinutes =
    typeof o.warnBeforeMinutes === "number"
      ? Math.min(15, Math.max(1, Math.floor(o.warnBeforeMinutes)))
      : 5;
  return {
    version: 1,
    enabled: Boolean(o.enabled),
    maxMinutes,
    warnBeforeMinutes: Math.min(warnBeforeMinutes, maxMinutes - 1 || 1),
    autoSoftSignalAtTimeout: Boolean(o.autoSoftSignalAtTimeout),
    updatedAt:
      typeof o.updatedAt === "string" ? o.updatedAt : new Date(0).toISOString(),
  };
}

export type TimeoutPhase = "ok" | "warning" | "due" | "disabled";

export function computeTimeoutPhase(
  prefs: SessionTimeoutPrefs,
  elapsedSeconds: number,
): {
  phase: TimeoutPhase;
  remainingSeconds: number | null;
  message: string | null;
} {
  if (!prefs.enabled) {
    return { phase: "disabled", remainingSeconds: null, message: null };
  }
  const maxSec = prefs.maxMinutes * 60;
  const warnSec = prefs.warnBeforeMinutes * 60;
  const remaining = maxSec - elapsedSeconds;
  if (remaining <= 0) {
    return {
      phase: "due",
      remainingSeconds: 0,
      message: prefs.autoSoftSignalAtTimeout
        ? "Agreed time is up. Soft Signal will end the session gently."
        : "Agreed time is up. You may Soft Signal, end together, or calmly extend if both still want to.",
    };
  }
  if (remaining <= warnSec) {
    const mins = Math.max(1, Math.ceil(remaining / 60));
    return {
      phase: "warning",
      remainingSeconds: remaining,
      message: `About ${mins} minute${mins === 1 ? "" : "s"} left in the time you set. Soft Signal is always available.`,
    };
  }
  return {
    phase: "ok",
    remainingSeconds: remaining,
    message: null,
  };
}

export const TIMEOUT_COPY = {
  title: "Session time boundary",
  body: "Optional. Helps you leave when you said you would. Never a grade. Soft Signal still works anytime.",
  dueAuto: "Time boundary reached — ending safely.",
  duePrompt: "Your agreed time is complete. What would help next?",
} as const;

// ── Partner verification ───────────────────────────────────────────────────

/**
 * Present-moment diligence checks. Completing them never means anyone is safe,
 * verified identity-proof, or that touch is authorized.
 */
export type PartnerVerificationCheckId =
  | "i_am_present"
  | "reviewed_snapshot"
  | "soft_signal_known"
  | "exit_path_known"
  | "space_feels_workable"
  | "can_stop_without_story";

export type PartnerVerificationCheck = {
  id: PartnerVerificationCheckId;
  label: string;
  detail: string;
};

export const PARTNER_VERIFICATION_CHECKS: PartnerVerificationCheck[] = [
  {
    id: "i_am_present",
    label: "I am here as myself for this moment",
    detail:
      "Not a background check. A present-moment orientation — not proof of identity to the platform.",
  },
  {
    id: "reviewed_snapshot",
    label: "I have read the Consent Snapshot we would affirm",
    detail: "Same current boundaries. A match or vibe is not enough.",
  },
  {
    id: "soft_signal_known",
    label: "I know Soft Signal ends everything immediately",
    detail: "No explanation required. Either person may use it.",
  },
  {
    id: "exit_path_known",
    label: "I know how I can leave the room or space if I need to",
    detail: "Practical safety for your body — not a partner score.",
  },
  {
    id: "space_feels_workable",
    label: "This setting feels workable enough for me right now",
    detail:
      "If it does not, declining or Soft Signaling is complete. You do not need a better reason.",
  },
  {
    id: "can_stop_without_story",
    label: "I can stop without managing their feelings",
    detail: "Their disappointment is not your job at stop time.",
  },
];

export type PartnerVerificationRecord = {
  version: typeof TRAUMA_SAFETY_VERSION;
  id: string;
  completedAt: string;
  checks: PartnerVerificationCheckId[];
  /** Optional free note — private, never shared. */
  privateNote: string | null;
  /** Product invariants */
  notSafetyCertificate: true;
  notConsent: true;
  notIdentityProof: true;
};

export function createVerificationRecord(
  checks: PartnerVerificationCheckId[],
  privateNote: string | null = null,
): PartnerVerificationRecord {
  return {
    version: 1,
    id: `verify_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    completedAt: new Date().toISOString(),
    checks: [...new Set(checks)],
    privateNote: privateNote?.trim().slice(0, 400) || null,
    notSafetyCertificate: true,
    notConsent: true,
    notIdentityProof: true,
  };
}

export function parseVerificationRecord(
  raw: unknown,
): PartnerVerificationRecord | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const o = raw as Record<string, unknown>;
  if (o.version !== 1 || typeof o.id !== "string") return null;
  if (typeof o.completedAt !== "string" || !Array.isArray(o.checks)) return null;
  const allowed = new Set(PARTNER_VERIFICATION_CHECKS.map((c) => c.id));
  const checks = o.checks.filter(
    (c): c is PartnerVerificationCheckId =>
      typeof c === "string" && allowed.has(c as PartnerVerificationCheckId),
  );
  return {
    version: 1,
    id: o.id,
    completedAt: o.completedAt,
    checks,
    privateNote:
      typeof o.privateNote === "string" ? o.privateNote.slice(0, 400) : null,
    notSafetyCertificate: true,
    notConsent: true,
    notIdentityProof: true,
  };
}

export const VERIFICATION_COPY = {
  title: "Present-moment checks",
  body: "These help you orient before contact. Completing them never certifies that anyone is safe, never replaces a Consent Snapshot, and never grants touch.",
  incomplete: "You can still Soft Signal or decline. Checks are for you, not a gate theater.",
  complete: "Checks saved privately on this device. Still not a safety score.",
} as const;

// ── Post-session reflection ────────────────────────────────────────────────

export type ReflectionPromptId =
  | "body_now"
  | "what_helped"
  | "what_was_hard"
  | "aftercare_next"
  | "enough_for_today";

export type ReflectionPrompt = {
  id: ReflectionPromptId;
  title: string;
  body: string;
  /** Suggested chips — optional, never required free text. */
  chips?: string[];
  /** If true, skip is explicitly celebrated. */
  skipIsSuccess?: boolean;
};

/**
 * Trauma-informed reflection ladder. Every step is skippable.
 * No forced narrative of harm. No partner-visible content.
 */
export const REFLECTION_PROMPTS: ReflectionPrompt[] = [
  {
    id: "body_now",
    title: "Where is your body right now?",
    body: "No analysis required. Notice breath, feet, jaw, or nothing at all.",
    chips: [
      "Breath is available",
      "Feet on the ground",
      "Still buzzing",
      "Numb or flat",
      "Prefer not to say",
    ],
    skipIsSuccess: true,
  },
  {
    id: "what_helped",
    title: "Did anything help?",
    body: "Even small. Optional. Never a performance of gratitude.",
    chips: [
      "Clear Soft Signal",
      "Their respect of a no",
      "Having a plan",
      "Leaving when I needed",
      "Nothing particular",
    ],
    skipIsSuccess: true,
  },
  {
    id: "what_was_hard",
    title: "Was anything hard?",
    body: "You can name a little, a lot, or skip. This is not a report form.",
    chips: [
      "Hard to speak up",
      "Too much intensity",
      "Unclear boundaries",
      "After-stop feelings",
      "Prefer private only",
    ],
    skipIsSuccess: true,
  },
  {
    id: "aftercare_next",
    title: "What might help in the next half hour?",
    body: "A tiny plan is enough. You can change it.",
    chips: [
      "Water",
      "Quiet alone",
      "Text a trusted person",
      "Walk",
      "Rest / sleep",
      "Nothing scheduled",
    ],
    skipIsSuccess: true,
  },
  {
    id: "enough_for_today",
    title: "Is this enough for today?",
    body: "Stopping reflection mid-way is self-trust. You can return later — or never.",
    chips: ["Yes — done", "Maybe more later", "Still open"],
    skipIsSuccess: true,
  },
];

export type ReflectionAnswer = {
  promptId: ReflectionPromptId;
  chip: string | null;
  note: string | null;
  skipped: boolean;
};

export type SessionReflectionDocument = {
  version: typeof TRAUMA_SAFETY_VERSION;
  id: string;
  createdAt: string;
  updatedAt: string;
  sessionId: string | null;
  softSignalLogId: string | null;
  exitKind: SafetyExitKind | "together" | "unknown";
  answers: ReflectionAnswer[];
  /** Free private aftercare note */
  aftercareNote: string | null;
  completed: boolean;
  notTherapy: true;
  notRequired: true;
  notScore: true;
};

export function createEmptyReflection(
  partial?: Partial<
    Pick<
      SessionReflectionDocument,
      "sessionId" | "softSignalLogId" | "exitKind"
    >
  >,
): SessionReflectionDocument {
  const now = new Date().toISOString();
  return {
    version: 1,
    id: `refl_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    createdAt: now,
    updatedAt: now,
    sessionId: partial?.sessionId ?? null,
    softSignalLogId: partial?.softSignalLogId ?? null,
    exitKind: partial?.exitKind ?? "unknown",
    answers: [],
    aftercareNote: null,
    completed: false,
    notTherapy: true,
    notRequired: true,
    notScore: true,
  };
}

export function upsertReflectionAnswer(
  doc: SessionReflectionDocument,
  answer: ReflectionAnswer,
): SessionReflectionDocument {
  const others = doc.answers.filter((a) => a.promptId !== answer.promptId);
  return {
    ...doc,
    answers: [
      ...others,
      {
        promptId: answer.promptId,
        chip: answer.chip?.slice(0, 80) ?? null,
        note: answer.note?.trim().slice(0, 500) || null,
        skipped: Boolean(answer.skipped),
      },
    ],
    updatedAt: new Date().toISOString(),
    notTherapy: true,
    notRequired: true,
    notScore: true,
  };
}

export function parseSessionReflection(
  raw: unknown,
): SessionReflectionDocument | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const o = raw as Record<string, unknown>;
  if (o.version !== 1 || typeof o.id !== "string") return null;
  if (!Array.isArray(o.answers)) return null;
  const promptIds = new Set(REFLECTION_PROMPTS.map((p) => p.id));
  const answers: ReflectionAnswer[] = [];
  for (const item of o.answers) {
    if (!item || typeof item !== "object") continue;
    const a = item as Record<string, unknown>;
    if (typeof a.promptId !== "string" || !promptIds.has(a.promptId as ReflectionPromptId))
      continue;
    answers.push({
      promptId: a.promptId as ReflectionPromptId,
      chip: typeof a.chip === "string" ? a.chip.slice(0, 80) : null,
      note: typeof a.note === "string" ? a.note.slice(0, 500) : null,
      skipped: Boolean(a.skipped),
    });
  }
  return {
    version: 1,
    id: o.id,
    createdAt: typeof o.createdAt === "string" ? o.createdAt : new Date().toISOString(),
    updatedAt: typeof o.updatedAt === "string" ? o.updatedAt : new Date().toISOString(),
    sessionId: typeof o.sessionId === "string" ? o.sessionId : null,
    softSignalLogId:
      typeof o.softSignalLogId === "string" ? o.softSignalLogId : null,
    exitKind: (typeof o.exitKind === "string"
      ? o.exitKind
      : "unknown") as SessionReflectionDocument["exitKind"],
    answers,
    aftercareNote:
      typeof o.aftercareNote === "string"
        ? o.aftercareNote.slice(0, 500)
        : null,
    completed: Boolean(o.completed),
    notTherapy: true,
    notRequired: true,
    notScore: true,
  };
}

export const REFLECTION_COPY = {
  title: "Private reflection",
  body: "Optional tools to process at your pace. Skip any step. This is not therapy, not a grade, and never shared with a partner.",
  skipAll: "Skip reflection — that’s complete",
  save: "Save privately on this device",
  done: "Enough for now",
} as const;

// ── Combined prefs document ────────────────────────────────────────────────

export type TraumaSafetyPrefs = {
  version: typeof TRAUMA_SAFETY_VERSION;
  panic: PanicModePrefs;
  timeout: SessionTimeoutPrefs;
  updatedAt: string;
};

export function defaultTraumaSafetyPrefs(): TraumaSafetyPrefs {
  return {
    version: 1,
    panic: defaultPanicPrefs(),
    timeout: defaultSessionTimeoutPrefs(),
    updatedAt: new Date(0).toISOString(),
  };
}

export function parseTraumaSafetyPrefs(raw: unknown): TraumaSafetyPrefs | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const o = raw as Record<string, unknown>;
  if (o.version !== 1) return null;
  const panic = parsePanicPrefs(o.panic) ?? defaultPanicPrefs();
  const timeout =
    parseSessionTimeoutPrefs(o.timeout) ?? defaultSessionTimeoutPrefs();
  return {
    version: 1,
    panic,
    timeout,
    updatedAt:
      typeof o.updatedAt === "string" ? o.updatedAt : new Date(0).toISOString(),
  };
}
