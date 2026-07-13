/**
 * Trauma-informed safety system — pure types and helpers.
 *
 * Invariants:
 * - Soft Signal / panic / quick exit never require a reason or peer permission.
 * - Partner verification is present-moment diligence, never a safety certificate.
 * - Session timeout is an agreed boundary aid, never a shame timer.
 * - Post-session reflection is optional, skippable, non-clinical, private.
 * - Litmo is not emergency response or crisis services.
 * - private notes on verification/reflection never leave the device by default.
 *
 * SEE: docs/LITMO_CONSTITUTION.md (I.3 Soft Signal, I.4 stop easier than continue,
 *      II.6 no false emergency) · docs/CODE_COMMENT_STANDARD.md
 */

export const TRAUMA_SAFETY_VERSION = 1 as const;

// ── Panic mode & quick exit ────────────────────────────────────────────────

/**
 * WHAT: Discriminator for how the user left under stress or agreed time.
 * WHY: Reflection and logs need kind without demanding narrative of harm.
 * CONSENT: soft_signal / panic_mode / quick_exit are unilateral stop paths.
 * NEVER: Treat timeout kinds as punishment or grade of the session.
 */
export type SafetyExitKind =
  | "soft_signal"
  | "quick_exit"
  | "panic_mode"
  | "timeout_auto"
  | "timeout_prompted";

/**
 * WHAT: Device-local panic / cover-screen preferences.
 * WHY: Users may want a calm cover after stop without delaying the stop itself.
 * CONSENT: Prefs configure post-stop UI only — never gate Soft Signal availability.
 * NEVER: coverDelayMs must never delay the session end / Soft Signal commit.
 */
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

/**
 * WHAT: Factory for default panic preferences.
 * WHY: Safe defaults — cover on, zero delay, epoch updatedAt until user saves.
 * CONSENT: Defaults do not enable any session; Soft Signal remains free elsewhere.
 * EDGE CASES: none — pure factory.
 * NEVER: Default coverDelayMs must stay 0 so stop is never scheduled behind delay.
 */
export const defaultPanicPrefs = (): PanicModePrefs => ({
  version: 1,
  useCoverScreen: true,
  // Stop is immediate; cover delay is cosmetic only and starts at 0.
  coverDelayMs: 0,
  updatedAt: new Date(0).toISOString(),
});

/**
 * WHAT: Parses untrusted storage into PanicModePrefs or null.
 * WHY: Fail-closed version gate; clamp cover delay so stop-adjacent UI cannot wait forever.
 * CONSENT: Parsing prefs does not authorize or block Soft Signal.
 * EDGE CASES:
 *   - non-object / array / wrong version → null
 *   - useCoverScreen defaults true unless explicitly false
 *   - coverDelayMs non-number or negative → 0; capped at 2000ms (cover only, not stop)
 * NEVER: Raise coverDelayMs cap into "delay Soft Signal" territory in callers.
 * SEE: PANIC_COPY · defaultPanicPrefs
 */
export function parsePanicPrefs(raw: unknown): PanicModePrefs | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const o = raw as Record<string, unknown>;
  if (o.version !== 1) return null;
  return {
    version: 1,
    // Explicit false only turns cover off; missing → true (safer privacy cover).
    useCoverScreen: o.useCoverScreen !== false,
    coverDelayMs:
      typeof o.coverDelayMs === "number" && o.coverDelayMs >= 0
        ? // Cap is for cover animation only — must not be used as Soft Signal dwell.
          Math.min(2000, Math.floor(o.coverDelayMs))
        : 0,
    updatedAt:
      typeof o.updatedAt === "string" ? o.updatedAt : new Date(0).toISOString(),
  };
}

/**
 * WHAT: User-facing copy for panic / quick exit / non-emergency framing.
 * WHY: Trauma-informed language; constitution forbids implying Litmo dispatches help.
 * CONSENT: Copy affirms no explanation owed; Soft Signal is never a penalty.
 * NEVER: Rewrite to claim emergency dispatch or require a reason.
 */
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

/**
 * WHAT: Optional agreed session time-boundary preferences.
 * WHY: Support "leave when we said we would" without shaming or auto-punishing.
 * CONSENT: Timeout aids Soft Signal / mutual end; does not replace snapshot consent.
 * NEVER: Enabled timeout is not a grade; Soft Signal must still work anytime.
 */
export type SessionTimeoutPrefs = {
  version: typeof TRAUMA_SAFETY_VERSION;
  /** Master switch — off by default so silence / open time is allowed. */
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

/**
 * WHAT: Factory for default session timeout prefs (disabled).
 * WHY: Off by default — no artificial urgency on first launch.
 * CONSENT: Disabled means no auto Soft Signal and no countdown pressure.
 * EDGE CASES: none — pure factory.
 * NEVER: Do not default enabled true (would create urgency-for-consent anti-pattern risk).
 * SEE: FORBIDDEN_ENGAGEMENT artificial_urgency in constitutionInvariants
 */
export const defaultSessionTimeoutPrefs = (): SessionTimeoutPrefs => ({
  version: 1,
  // Off by default: silence is allowed; no shame timer until user opts in.
  enabled: false,
  maxMinutes: 30,
  warnBeforeMinutes: 5,
  autoSoftSignalAtTimeout: false,
  updatedAt: new Date(0).toISOString(),
});

/**
 * WHAT: Parses untrusted storage into SessionTimeoutPrefs or null.
 * WHY: Clamp ranges so corrupt prefs cannot create zero-minute or multi-day traps.
 * CONSENT: Parsing does not start a session or grant touch.
 * EDGE CASES:
 *   - wrong version / non-object → null
 *   - maxMinutes clamped 5–180; warnBeforeMinutes 1–15 and < maxMinutes
 *   - enabled / autoSoftSignal only true when Boolean(true)
 * NEVER: Use parse success as proof both parties agreed to the timer live.
 * SEE: computeTimeoutPhase
 */
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
    // Warning window must not meet or exceed full duration (would always warn).
    warnBeforeMinutes: Math.min(warnBeforeMinutes, maxMinutes - 1 || 1),
    autoSoftSignalAtTimeout: Boolean(o.autoSoftSignalAtTimeout),
    updatedAt:
      typeof o.updatedAt === "string" ? o.updatedAt : new Date(0).toISOString(),
  };
}

/**
 * WHAT: Lifecycle phase of an optional session time boundary.
 * WHY: UI needs discrete states without inventing "failed session" scores.
 * CONSENT: "due" may trigger Soft Signal or prompt — never requires reason text.
 */
export type TimeoutPhase = "ok" | "warning" | "due" | "disabled";

/**
 * WHAT: Computes timeout phase and calm message from prefs + elapsed seconds.
 * WHY: Pure helper so UI/session timer cannot invent shame grades.
 * CONSENT: Soft Signal always available in messaging; auto Soft Signal only when pref set.
 * EDGE CASES:
 *   - !enabled → disabled, null remaining/message
 *   - remaining <= 0 → due with auto vs prompt message
 *   - remaining <= warn window → warning with minutes ceil ≥ 1
 * NEVER: Present "due" as user failure; never require peer permission to Soft Signal at due.
 * SEE: TIMEOUT_COPY · Living Constitution I.3 / I.4
 */
export function computeTimeoutPhase(
  prefs: SessionTimeoutPrefs,
  elapsedSeconds: number,
): {
  phase: TimeoutPhase;
  remainingSeconds: number | null;
  message: string | null;
} {
  // Opt-in only: disabled timeout must not create urgency chrome.
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
      // Auto Soft Signal is still Soft Signal (unilateral stop), not a penalty score.
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
      // Always remind Soft Signal is free — stop must stay easier than continue.
      message: `About ${mins} minute${mins === 1 ? "" : "s"} left in the time you set. Soft Signal is always available.`,
    };
  }
  return {
    phase: "ok",
    remainingSeconds: remaining,
    message: null,
  };
}

/**
 * WHAT: Copy for session time-boundary UI.
 * WHY: Frame timer as boundary aid, never grade; Soft Signal still anytime.
 * CONSENT: Not a consent seal — supports agreed duration only.
 * NEVER: Use "failed" / "overtime penalty" language.
 */
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
 *
 * WHAT (type): Stable ids for self-orientation checks before contact.
 * WHY: Avoid inventing free-text "verification theater" as a public safety score.
 * CONSENT: Checks never replace Consent Snapshot or grant touch.
 * NEVER: Map completion to verifiedSafeBadge or ranking-as-safety.
 */
export type PartnerVerificationCheckId =
  | "i_am_present"
  | "reviewed_snapshot"
  | "soft_signal_known"
  | "exit_path_known"
  | "space_feels_workable"
  | "can_stop_without_story";

/**
 * WHAT: One present-moment check definition (label + detail).
 * WHY: UI and records share one catalog of non-certificate diligence language.
 * CONSENT: Detail text must keep non-claims (not ID proof, not partner score).
 */
export type PartnerVerificationCheck = {
  id: PartnerVerificationCheckId;
  label: string;
  detail: string;
};

/**
 * WHAT: Catalog of present-moment partner-orientation checks.
 * WHY: Single source for labels that refuse safety-certificate framing.
 * CONSENT: Completing the list never grants touch or seals a snapshot.
 * NEVER: Surface these as a public badge or "this person is safe" score.
 * SEE: Living Constitution II.4 · VERIFICATION_COPY
 */
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

/**
 * WHAT: Device-local record that present-moment checks were completed.
 * WHY: Private diligence history without becoming a public safety certificate.
 * CONSENT: notSafetyCertificate / notConsent / notIdentityProof always true.
 * NEVER: Share privateNote; never use as match ranking or touch authorization.
 */
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

/**
 * WHAT: Creates a verification record with forced non-certificate invariants.
 * WHY: UI save path must not allow callers to omit notConsent / notSafetyCertificate.
 * CONSENT: Prepare-only private diligence; does not seal snapshot or grant touch.
 * EDGE CASES:
 *   - checks deduped via Set
 *   - privateNote trim + max 400; empty → null
 * NEVER: Transmit privateNote to partners or analytics; never claim identity proof.
 * SEE: PARTNER_VERIFICATION_CHECKS · parseVerificationRecord
 */
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
    // Forced invariants — completion is diligence, not a safety certificate.
    notSafetyCertificate: true,
    notConsent: true,
    notIdentityProof: true,
  };
}

/**
 * WHAT: Parses untrusted storage into PartnerVerificationRecord or null.
 * WHY: Fail-closed; unknown check ids dropped; invariants re-stamped true.
 * CONSENT: Parse never upgrades record into consent or identity proof.
 * EDGE CASES:
 *   - missing id/version/checks → null
 *   - unknown check strings filtered out (not invented as complete)
 *   - privateNote truncated to 400 without requiring trim of legacy blobs
 * NEVER: Trust client-sent notConsent:false; never log privateNote body.
 * SEE: createVerificationRecord
 */
export function parseVerificationRecord(
  raw: unknown,
): PartnerVerificationRecord | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const o = raw as Record<string, unknown>;
  if (o.version !== 1 || typeof o.id !== "string") return null;
  if (typeof o.completedAt !== "string" || !Array.isArray(o.checks)) return null;
  const allowed = new Set(PARTNER_VERIFICATION_CHECKS.map((c) => c.id));
  // Drop unknown ids rather than accepting free-form "verified_safe" inventions.
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
    // Re-stamp: storage cannot claim this is consent or a safety certificate.
    notSafetyCertificate: true,
    notConsent: true,
    notIdentityProof: true,
  };
}

/**
 * WHAT: Copy for partner verification UI.
 * WHY: Repeat non-claims so UI chrome cannot drift into "safety score" language.
 * CONSENT: Incomplete checks must not trap users — Soft Signal / decline remain free.
 * NEVER: Require all checks as gate theater before Soft Signal.
 */
export const VERIFICATION_COPY = {
  title: "Present-moment checks",
  body: "These help you orient before contact. Completing them never certifies that anyone is safe, never replaces a Consent Snapshot, and never grants touch.",
  incomplete: "You can still Soft Signal or decline. Checks are for you, not a gate theater.",
  complete: "Checks saved privately on this device. Still not a safety score.",
} as const;

// ── Post-session reflection ────────────────────────────────────────────────

/**
 * WHAT: Ids for optional post-session reflection ladder steps.
 * WHY: Stable keys for answers without free-form clinical taxonomy.
 * CONSENT: Reflection is never required for Soft Signal legitimacy.
 */
export type ReflectionPromptId =
  | "body_now"
  | "what_helped"
  | "what_was_hard"
  | "aftercare_next"
  | "enough_for_today";

/**
 * WHAT: One skippable reflection prompt definition.
 * WHY: Trauma-informed ladder — chips optional, skip celebrated.
 * CONSENT: Not a consent surface; not partner-visible content.
 * NEVER: Force free-text narrative of harm; never share with partner.
 */
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
 *
 * WHAT: Ordered optional prompts for private post-session processing.
 * WHY: Support body agency after contact without therapy claims or grades.
 * CONSENT: Completing or skipping never changes past Soft Signal validity.
 * NEVER: Export answers to partners; never score completeness as trust.
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

/**
 * WHAT: One answer (or skip) for a reflection prompt.
 * WHY: Structured private storage without requiring free-text trauma narrative.
 * CONSENT: skipped true is a complete valid outcome for that step.
 * NEVER: Share chip/note with partner; never grade skipped as failure.
 */
export type ReflectionAnswer = {
  promptId: ReflectionPromptId;
  chip: string | null;
  note: string | null;
  skipped: boolean;
};

/**
 * WHAT: Private post-session reflection document.
 * WHY: Optional aftercare tooling, device-local first, non-clinical.
 * CONSENT: notTherapy / notRequired / notScore always true.
 * NEVER: Partner-visible; never used as trust ranking or safety proof.
 */
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

/**
 * WHAT: Creates an empty reflection document with forced non-therapy invariants.
 * WHY: Soft Signal wrap-up can open reflection without requiring answers.
 * CONSENT: Empty answers + completed false is valid; Soft Signal already finished.
 * EDGE CASES: missing partial fields → null session links, exitKind "unknown".
 * NEVER: Require completion before user can leave the app; never partner-share.
 * SEE: REFLECTION_PROMPTS · REFLECTION_COPY
 */
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
    // Forced: reflection is optional tooling, not clinical care or a grade.
    notTherapy: true,
    notRequired: true,
    notScore: true,
  };
}

/**
 * WHAT: Upserts one reflection answer by promptId (replace prior for that prompt).
 * WHY: User can change mind / skip later without accumulating duplicate rows.
 * CONSENT: Re-stamps notTherapy/notRequired/notScore; skip is first-class.
 * EDGE CASES:
 *   - chip truncated 80; note trim + 500 or null
 *   - skipped coerced Boolean
 * NEVER: Log note body; never sync to partner; never treat missing answers as incomplete person.
 * SEE: createEmptyReflection
 */
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

/**
 * WHAT: Parses untrusted storage into SessionReflectionDocument or null.
 * WHY: Fail-closed; unknown prompt answers dropped; invariants re-stamped.
 * CONSENT: Parse never makes reflection required for prior Soft Signal validity.
 * EDGE CASES:
 *   - wrong version / missing id / non-array answers → null
 *   - unknown promptId rows skipped
 *   - chip/note length caps; exitKind free string cast with "unknown" fallback
 * NEVER: Trust notScore:false from storage; never export aftercareNote.
 * SEE: createEmptyReflection · REFLECTION_PROMPTS
 */
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
    // Unknown prompts are dropped — no free-form clinical taxonomy injection.
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

/**
 * WHAT: Copy for private reflection UI.
 * WHY: Affirm skip-as-success and non-therapy framing at the chrome layer.
 * CONSENT: Not a consent surface.
 * NEVER: Partner share CTAs; never "complete reflection to unlock" engagement.
 */
export const REFLECTION_COPY = {
  title: "Private reflection",
  body: "Optional tools to process at your pace. Skip any step. This is not therapy, not a grade, and never shared with a partner.",
  skipAll: "Skip reflection — that’s complete",
  save: "Save privately on this device",
  done: "Enough for now",
} as const;

// ── Combined prefs document ────────────────────────────────────────────────

/**
 * WHAT: Combined panic + timeout prefs document for local vault.
 * WHY: One storage blob for trauma-safety settings without network authority.
 * CONSENT: Prefs configure safety UI; Soft Signal remains free regardless of values.
 * NEVER: Remote merge must not force auto Soft Signal without user opt-in.
 */
export type TraumaSafetyPrefs = {
  version: typeof TRAUMA_SAFETY_VERSION;
  panic: PanicModePrefs;
  timeout: SessionTimeoutPrefs;
  updatedAt: string;
};

/**
 * WHAT: Factory for combined trauma safety prefs.
 * WHY: Local-first defaults: panic cover on, timeout off.
 * CONSENT: Defaults do not start sessions or require peer.
 * EDGE CASES: none — pure factory.
 * NEVER: Default timeout enabled (urgency anti-pattern).
 */
export function defaultTraumaSafetyPrefs(): TraumaSafetyPrefs {
  return {
    version: 1,
    panic: defaultPanicPrefs(),
    timeout: defaultSessionTimeoutPrefs(),
    updatedAt: new Date(0).toISOString(),
  };
}

/**
 * WHAT: Parses combined trauma safety prefs; partial sections fall back to defaults.
 * WHY: Fail-closed version gate but recover nested panic/timeout when one side corrupt.
 * CONSENT: Parse does not authorize contact; Soft Signal remains free.
 * EDGE CASES:
 *   - wrong top-level version → null
 *   - nested panic/timeout parse null → respective defaults (not open-ended allow)
 * NEVER: Treat remote-only prefs as more authoritative than local Soft Signal.
 * SEE: parsePanicPrefs · parseSessionTimeoutPrefs
 */
export function parseTraumaSafetyPrefs(raw: unknown): TraumaSafetyPrefs | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const o = raw as Record<string, unknown>;
  if (o.version !== 1) return null;
  // Nested fail: fall back to safe defaults rather than discarding whole prefs blob.
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
