/**
 * Safety Operations Core — pure domain law for private-alpha moderation.
 *
 * WHAT: Executable twin of Chapter 5 + SAFETY-OPS-001 for queue, reports,
 *       appeals, restrictions, rate limits, trust ledger, and HITL gates.
 * WHY: Staff UI and migrations must not invent softer punishment paths.
 *      Agents and humans need one fail-closed source of product law.
 * CONSENT / CONSTITUTION:
 *   - Art I: Restriction never substitutes for session-specific consent.
 *   - Art II.5: Reports need careful human review; no auto-punishment.
 *   - Art II.4: Trust events never certify safety or become a public score.
 *   - Art II.6: Moderation is not emergency services or clinical care.
 *   - Art III: Staff notes and evidence stay private; minimize disclosure.
 *   - Art IV: Soft Signal / block / report remain free of dark patterns.
 *   - Art VII: Irreversible bans fail closed until dual-human confirmation.
 *   - Art X: Honest about what staff tools do and do not do.
 * EDGE CASES: Missing second staff, self-target, open appeal, stale queue.
 * NEVER: Auto-ban from report count/rate limit/model; public safety score;
 *        invent legal/clinical approval; single-staff permanent ban when
 *        two-person policy is required; weaken Soft Signal during holds.
 * SEE: docs/SAFETY_OPS_DESIGN.md · docs/SAFETY_OPS_RUNTIME.md ·
 *      docs/LITMO_CONSTITUTION.md · ADR 0042 · ADR 0061
 */

export const SAFETY_OPS_CORE_VERSION = 1 as const;

// ── Constitution map ───────────────────────────────────────────────────────

/**
 * WHAT: Constitution articles that safety-ops surfaces must honor.
 * WHY: Every staff action and queue transition maps to living product law.
 * CONSENT: Mapping is governance, not a consent grant to the restricted user.
 * NEVER: Treat a mapped article as legal advice or external approval evidence.
 */
export type SafetyOpsConstitutionArticle =
  | "I_consent"
  | "II_safety_product_logic"
  | "II_5_human_review"
  | "II_4_trust_not_safety_cert"
  | "II_6_no_false_emergency"
  | "III_privacy"
  | "IV_agency"
  | "VII_irreversible"
  | "X_honest_communication";

/**
 * WHAT: Static map from safety-ops subsystem → constitution articles.
 * WHY: Agents and reviewers can audit a change against the Living Constitution.
 * CONSENT: Not a consent surface.
 */
export const SAFETY_OPS_CONSTITUTION_MAP = {
  structuredReports: [
    "II_5_human_review",
    "III_privacy",
    "X_honest_communication",
  ],
  moderationQueue: [
    "II_safety_product_logic",
    "II_5_human_review",
    "III_privacy",
  ],
  rateLimits: ["II_safety_product_logic", "IV_agency", "VII_irreversible"],
  trustLedger: [
    "II_4_trust_not_safety_cert",
    "III_privacy",
    "X_honest_communication",
  ],
  restrictions: [
    "II_5_human_review",
    "IV_agency",
    "VII_irreversible",
    "I_consent",
  ],
  appeals: ["II_5_human_review", "IV_agency", "X_honest_communication"],
  permanentBanHitl: [
    "II_5_human_review",
    "VII_irreversible",
    "X_honest_communication",
  ],
  matchingPause: ["II_safety_product_logic", "I_consent", "IV_agency"],
  privateAlphaInvite: ["VII_irreversible", "III_privacy", "X_honest_communication"],
} as const satisfies Record<string, readonly SafetyOpsConstitutionArticle[]>;

// ── Structured reports ─────────────────────────────────────────────────────

/**
 * WHAT: Closed report category ids (must match DB + reportService).
 * WHY: Priority and escalation heuristics are category-bound, not free text.
 * CONSENT: Reporting is participant agency; category is not a conviction.
 * NEVER: Auto-punish from category alone.
 */
export const REPORT_CATEGORY_IDS = [
  "harassment",
  "coercion_pressure",
  "boundary_violation",
  "unsafe_behavior",
  "impersonation",
  "underage_concern",
  "spam_scam",
  "other",
] as const;

export type ReportCategoryId = (typeof REPORT_CATEGORY_IDS)[number];

/**
 * WHAT: Reporter-visible lifecycle only (coarse, non-disclosing).
 * WHY: Article X honesty without exposing staff deliberation or peer identity.
 */
export const REPORTER_VISIBLE_STATUSES = [
  "submitted",
  "under_review",
  "closed",
] as const;
export type ReporterVisibleStatus = (typeof REPORTER_VISIBLE_STATUSES)[number];

/**
 * WHAT: Coarse closed outcomes shown to the reporter.
 * WHY: Avoids detailed adjudication that could retraumatize or dox staff action.
 */
export const CLOSED_OUTCOMES = [
  "no_action",
  "action_taken",
  "info_needed",
] as const;
export type ClosedOutcome = (typeof CLOSED_OUTCOMES)[number];

// ── Moderation queue ───────────────────────────────────────────────────────

/**
 * WHAT: Staff queue states for a moderation case (1:1 with a report).
 * WHY: Human work items need explicit claim/escalate/resolve — no silent close.
 * CONSENT: Queue state is staff process, not participant consent.
 * NEVER: Jump open → resolved without staff action in product UI (DB may allow).
 */
export const QUEUE_STATUSES = [
  "open",
  "in_progress",
  "escalated",
  "resolved",
] as const;
export type QueueStatus = (typeof QUEUE_STATUSES)[number];

/**
 * WHAT: Intake priority ladder (heuristic only — not guilt).
 * WHY: Underage and coercion surface first; spam last.
 * NEVER: Priority = automatic restriction.
 */
export const QUEUE_PRIORITIES = [
  "low",
  "normal",
  "high",
  "urgent",
] as const;
export type QueuePriority = (typeof QUEUE_PRIORITIES)[number];

/**
 * WHAT: Maps report category → initial queue priority.
 * WHY: Mirrors SQL moderation_priority_for_category for client/docs parity.
 * CONSENT: Priority is staffing signal only.
 * EDGE: Unknown category → normal (fail soft on display, never invent ban).
 * NEVER: Use priority as evidence of guilt in UI copy.
 */
export function priorityForReportCategory(
  category: string,
): QueuePriority {
  switch (category) {
    case "underage_concern":
      return "urgent";
    case "unsafe_behavior":
    case "coercion_pressure":
    case "boundary_violation":
      return "high";
    case "harassment":
    case "impersonation":
      return "normal";
    case "spam_scam":
      return "low";
    default:
      return "normal";
  }
}

/**
 * WHAT: Legal queue transitions for staff console state machine.
 * WHY: Prevents inventing states like "auto_closed" or skipping claim.
 * CONSENT: Not a consent surface.
 * EDGE: resolved is terminal; escalated may still resolve.
 * NEVER: Allow open → resolved without going through claim in UI guidance
 *        (server may still resolve if already assigned).
 */
export function canTransitionQueue(
  from: QueueStatus,
  to: QueueStatus,
): boolean {
  if (from === to) return true;
  if (from === "resolved") return false;
  switch (from) {
    case "open":
      return to === "in_progress" || to === "escalated" || to === "resolved";
    case "in_progress":
      return to === "escalated" || to === "resolved" || to === "open";
    case "escalated":
      return to === "in_progress" || to === "resolved";
    default:
      return false;
  }
}

/**
 * WHAT: Whether a case may still receive staff actions (claim/note/hold).
 * WHY: Resolved cases should not silently re-open via UI mistakes.
 */
export function isQueueActionable(status: QueueStatus): boolean {
  return status !== "resolved";
}

// ── Restrictions ───────────────────────────────────────────────────────────

/**
 * WHAT: Restriction kinds enforced on matching (not Soft Signal).
 * WHY: Holds pause discovery/requests; bans are irreversible-class HITL.
 * CONSENT: Restriction never ends Soft Signal availability on open sessions
 *          except via documented safety-end of open work (ADR 0035/0038).
 * NEVER: Auto-apply from report volume.
 */
export const RESTRICTION_KINDS = ["matching_hold", "permanent_ban"] as const;
export type RestrictionKind = (typeof RESTRICTION_KINDS)[number];

/**
 * WHAT: Staff reason codes (ops enum; not user-facing shame copy).
 * WHY: Auditable closed set; Article X prefers structured over free-form.
 */
export const RESTRICTION_REASON_CODES = [
  "policy_violation",
  "safety_review",
  "underage_concern",
  "harassment",
  "impersonation",
  "spam_abuse",
  "legal_request",
  "other",
] as const;
export type RestrictionReasonCode = (typeof RESTRICTION_REASON_CODES)[number];

/**
 * WHAT: Validates restriction shape before staff RPC.
 * WHY: Client-side fail-closed mirrors DB checks (ends_at rules).
 * CONSENT: Validation is not consent revocation for sessions.
 * EDGE:
 *   - permanent_ban forbids ends_at
 *   - matching_hold may be indefinite (null ends_at) or future ends_at
 *   - ends_at in the past rejected
 * NEVER: Allow permanent_ban with end time "for convenience."
 */
export function validateRestrictionShape(input: {
  kind: RestrictionKind;
  reasonCode: string;
  endsAtIso: string | null;
  nowMs?: number;
}): { ok: true } | { ok: false; code: string; message: string } {
  if (
    !RESTRICTION_REASON_CODES.includes(
      input.reasonCode as RestrictionReasonCode,
    )
  ) {
    return {
      ok: false,
      code: "invalid_reason",
      message: "invalid restriction reason",
    };
  }
  if (input.kind === "permanent_ban" && input.endsAtIso != null) {
    return {
      ok: false,
      code: "ban_has_end",
      message: "permanent bans cannot have an end time",
    };
  }
  if (input.kind === "matching_hold" && input.endsAtIso != null) {
    const ends = Date.parse(input.endsAtIso);
    const now = input.nowMs ?? Date.now();
    if (!Number.isFinite(ends) || ends <= now) {
      return {
        ok: false,
        code: "hold_end_past",
        message: "hold end time must be in the future",
      };
    }
  }
  return { ok: true };
}

/**
 * WHAT: Whether a restriction row is currently active.
 * WHY: Pure helper for UI/self-status without inventing server truth.
 * EDGE: lifted_at set → inactive; ends_at past → inactive; starts_at future → inactive.
 */
export function isRestrictionActive(row: {
  liftedAt: string | null;
  startsAt: string;
  endsAt: string | null;
  nowMs?: number;
}): boolean {
  if (row.liftedAt != null) return false;
  const now = row.nowMs ?? Date.now();
  const starts = Date.parse(row.startsAt);
  if (!Number.isFinite(starts) || starts > now) return false;
  if (row.endsAt == null) return true;
  const ends = Date.parse(row.endsAt);
  return Number.isFinite(ends) && ends > now;
}

// ── Appeals ────────────────────────────────────────────────────────────────

/**
 * WHAT: Appeal lifecycle for human reconsideration (never auto-lift).
 * WHY: Article IV agency + Article II.5 human judgment.
 */
export const APPEAL_STATUSES = [
  "submitted",
  "under_review",
  "upheld",
  "lifted",
] as const;
export type AppealStatus = (typeof APPEAL_STATUSES)[number];

export const APPEAL_OUTCOMES = ["upheld", "lifted"] as const;
export type AppealOutcome = (typeof APPEAL_OUTCOMES)[number];

/**
 * WHAT: Whether appellant may submit an appeal for a restriction.
 * WHY: One open appeal; only active restrictions; statement length bounds.
 * CONSENT: Appeal is optional speech; no reason required to Soft Signal.
 * EDGE: Empty/whitespace statement invalid; open appeal blocks second.
 * NEVER: Auto-lift on submit.
 */
export function canSubmitAppeal(input: {
  restrictionActive: boolean;
  hasOpenAppeal: boolean;
  statement: string;
  maxLen?: number;
  minLen?: number;
}): { ok: true } | { ok: false; code: string; message: string } {
  if (!input.restrictionActive) {
    return {
      ok: false,
      code: "not_active",
      message: "only active restrictions can be appealed",
    };
  }
  if (input.hasOpenAppeal) {
    return {
      ok: false,
      code: "open_exists",
      message: "an open appeal already exists for that restriction",
    };
  }
  const min = input.minLen ?? 1;
  // DB check: restriction_appeals.statement max 2000 (migration 031).
  const max = input.maxLen ?? 2000;
  const trimmed = input.statement.trim();
  if (trimmed.length < min || trimmed.length > max) {
    return {
      ok: false,
      code: "invalid_statement",
      message: "invalid appeal statement",
    };
  }
  return { ok: true };
}

/**
 * WHAT: Whether staff may resolve an open appeal.
 * WHY: Terminal statuses cannot re-resolve; outcome must be closed set.
 */
export function canResolveAppeal(input: {
  status: AppealStatus;
  outcome: AppealOutcome;
}): boolean {
  if (input.status !== "submitted" && input.status !== "under_review") {
    return false;
  }
  return APPEAL_OUTCOMES.includes(input.outcome);
}

// ── Rate limits ────────────────────────────────────────────────────────────

/**
 * WHAT: Rate-limit action keys (append-only counters, not punishment).
 * WHY: Soft abuse throttles; never convert into bans without human review.
 * CONSENT: Throttle message is non-revealing; not a conviction.
 */
export const RATE_LIMIT_ACTIONS = [
  "session_request",
  "report",
  "block",
  "unblock",
  "invite_redeem",
  "appeal",
] as const;
export type RateLimitAction = (typeof RATE_LIMIT_ACTIONS)[number];

/**
 * WHAT: Private-alpha default budgets (mirror SQL assert_under_rate_limit + invite).
 * WHY: Single place for product docs and client messaging about windows.
 * NEVER: Treat exceeding a budget as grounds for automatic permanent ban.
 */
export const RATE_LIMIT_BUDGETS: Record<
  RateLimitAction,
  { windowMs: number; max: number; label: string }
> = {
  session_request: {
    windowMs: 60 * 60 * 1000,
    max: 20,
    label: "session requests per hour",
  },
  report: {
    windowMs: 24 * 60 * 60 * 1000,
    max: 15,
    label: "reports per day",
  },
  block: {
    windowMs: 24 * 60 * 60 * 1000,
    max: 40,
    label: "blocks per day",
  },
  unblock: {
    windowMs: 24 * 60 * 60 * 1000,
    max: 40,
    label: "unblocks per day",
  },
  invite_redeem: {
    windowMs: 60 * 60 * 1000,
    max: 10,
    label: "invite redemption attempts per hour",
  },
  appeal: {
    windowMs: 24 * 60 * 60 * 1000,
    max: 5,
    label: "appeals per day",
  },
};

/**
 * WHAT: Pure check whether an action is under budget given recent event times.
 * WHY: Unit-testable twin of SQL counting window (events are append-only).
 * EDGE: Events exactly at window edge are excluded (created_at > now - window).
 * NEVER: Record a ban trust event from a failed rate limit.
 */
export function isUnderRateLimit(input: {
  action: RateLimitAction;
  eventTimestampsMs: readonly number[];
  nowMs?: number;
}): { allowed: true; remaining: number } | { allowed: false; remaining: 0 } {
  const budget = RATE_LIMIT_BUDGETS[input.action];
  const now = input.nowMs ?? Date.now();
  const windowStart = now - budget.windowMs;
  const count = input.eventTimestampsMs.filter((t) => t > windowStart).length;
  if (count >= budget.max) {
    return { allowed: false, remaining: 0 };
  }
  return { allowed: true, remaining: budget.max - count };
}

// ── Trust ledger ───────────────────────────────────────────────────────────

/**
 * WHAT: Append-only trust event types (provenance, never a universal score).
 * WHY: Article II.4 — specific, legible signals only.
 * NEVER: Aggregate into public ranking, badge, or “safe person” certificate.
 */
export const TRUST_EVENT_TYPES = [
  "profile_completed",
  "age_adult_confirmed",
  "session_completed",
  "session_soft_signaled",
  "session_safety_ended",
  "report_submitted",
  "moderation_closed",
  "account_restricted",
  "account_restriction_lifted",
  "appeal_submitted",
  "appeal_resolved",
  "permanent_ban_requested",
  "permanent_ban_confirmed",
  "matching_pause_changed",
  "private_alpha_enrolled",
] as const;
export type TrustEventType = (typeof TRUST_EVENT_TYPES)[number];

/**
 * WHAT: Events that may appear in coarse self-summary (my_trust_signals).
 * WHY: Self-visible facts only; no report/moderation peer leakage.
 */
export const SELF_VISIBLE_TRUST_TYPES = [
  "profile_completed",
  "age_adult_confirmed",
  "session_completed",
  "session_soft_signaled",
  "session_safety_ended",
] as const satisfies readonly TrustEventType[];

/**
 * WHAT: Asserts trust ledger append-only invariants for a proposed write.
 * WHY: Client/docs gate before calling append_trust_event equivalents.
 * CONSENT: Trust events never grant consent (Article I).
 * EDGE: Unknown type rejected; metadata must be plain object.
 * NEVER: Allow negative public review types.
 */
export function validateTrustEventAppend(input: {
  eventType: string;
  metadata?: unknown;
}): { ok: true } | { ok: false; code: string; message: string } {
  if (!TRUST_EVENT_TYPES.includes(input.eventType as TrustEventType)) {
    return {
      ok: false,
      code: "invalid_type",
      message: "invalid trust event type",
    };
  }
  if (input.metadata !== undefined) {
    if (
      input.metadata === null ||
      typeof input.metadata !== "object" ||
      Array.isArray(input.metadata)
    ) {
      return {
        ok: false,
        code: "invalid_metadata",
        message: "trust event metadata must be an object",
      };
    }
  }
  return { ok: true };
}

/**
 * WHAT: Forbidden product patterns for trust display.
 * WHY: Encode Article II.4 as a pure check for UI and export paths.
 */
export function isForbiddenTrustDisplayPattern(
  pattern:
    | "public_safety_score"
    | "star_rating_of_person"
    | "auto_ban_from_score"
    | "peer_visible_report_count"
    | "badge_certifies_safe",
): true {
  void pattern;
  return true;
}

// ── HITL / permanent ban ───────────────────────────────────────────────────

/**
 * WHAT: Two-person permanent-ban policy state (founder S10 / ADR 0042).
 * WHY: Irreversible social exclusion requires dual human confirmation when
 *      required; until named second owner exists, ban completion fails closed.
 * CONSENT: Ban is not consent; Soft Signal remains sacred on remaining users.
 * NEVER: Invent named staff; single staff self-confirm.
 */
export type PermanentBanPolicy = {
  /** When true, permanent ban needs two distinct staff humans. */
  twoPersonRequired: boolean;
  /**
   * When true, a real second named reviewer is configured in ops.
   * Engineering must not set this true without a documented human owner.
   */
  namedSecondOwnerConfigured: boolean;
  /** Count of distinct staff_roles rows (moderator|admin). */
  distinctStaffCount: number;
};

/**
 * WHAT: Whether the environment may complete a permanent ban at all.
 * WHY: Fail closed until dual-HITL capacity exists (S7/S10 external gates).
 * EDGE:
 *   - twoPersonRequired false → allowed with single staff (dev/founder synthetic)
 *   - twoPersonRequired true needs ≥2 staff AND namedSecondOwnerConfigured
 * NEVER: Treat “founder alone in prod external alpha” as dual-HITL ready.
 */
export function permanentBanCompletionAllowed(
  policy: PermanentBanPolicy,
): { allowed: true } | { allowed: false; code: string; message: string } {
  if (!policy.twoPersonRequired) {
    return { allowed: true };
  }
  if (!policy.namedSecondOwnerConfigured) {
    return {
      allowed: false,
      code: "named_second_owner_missing",
      message:
        "permanent ban requires a named second reviewer before external alpha",
    };
  }
  if (policy.distinctStaffCount < 2) {
    return {
      allowed: false,
      code: "insufficient_staff",
      message: "permanent ban requires two distinct staff accounts",
    };
  }
  return { allowed: true };
}

/**
 * WHAT: Validates a dual-confirm permanent ban pair of staff actions.
 * WHY: Second confirmer must differ from requester; target ≠ either staff.
 * CONSENT: Not a consent surface.
 * EDGE: Same person both roles → reject; self-ban → reject.
 */
export function validatePermanentBanDualConfirm(input: {
  targetUserId: string;
  requestedBy: string;
  confirmedBy: string;
  policy: PermanentBanPolicy;
}): { ok: true } | { ok: false; code: string; message: string } {
  const gate = permanentBanCompletionAllowed(input.policy);
  if (!gate.allowed) {
    return { ok: false, code: gate.code, message: gate.message };
  }
  if (
    !input.targetUserId ||
    !input.requestedBy ||
    !input.confirmedBy ||
    input.targetUserId === input.requestedBy ||
    input.targetUserId === input.confirmedBy
  ) {
    return {
      ok: false,
      code: "invalid_target",
      message: "invalid restriction target",
    };
  }
  if (input.policy.twoPersonRequired) {
    if (input.requestedBy === input.confirmedBy) {
      return {
        ok: false,
        code: "same_staff",
        message: "permanent ban requires a second distinct staff confirmer",
      };
    }
  }
  return { ok: true };
}

/**
 * WHAT: Staff console action matrix (what roles may do).
 * WHY: Least privilege for UI enablement; server remains authoritative.
 * NEVER: Client-side matrix replaces RLS / is_staff_moderator.
 */
export type StaffConsoleAction =
  | "list_queue"
  | "claim_case"
  | "add_note"
  | "resolve_case"
  | "apply_matching_hold"
  | "request_permanent_ban"
  | "confirm_permanent_ban"
  | "lift_restriction"
  | "list_open_appeals"
  | "resolve_appeal"
  | "set_matching_paused"
  | "issue_invite"
  | "export_not_other_users";

export function staffMayPerform(
  role: "none" | "moderator" | "admin",
  action: StaffConsoleAction,
): boolean {
  if (role === "none") return false;
  // Moderators and admins share the private-alpha console surface.
  // export_not_other_users is always true for staff self-export only;
  // exporting another user is never a staff console action.
  if (action === "export_not_other_users") return true;
  return role === "moderator" || role === "admin";
}

// ── Matching pause (kill-switch) ───────────────────────────────────────────

/**
 * WHAT: What the routine matching pause must preserve (S4 / ADR 0042).
 * WHY: Kill-switch pauses discovery/new requests; never removes stop paths.
 * CONSENT: Soft Signal and wrap-up remain available (Article I.3–I.4).
 * NEVER: Force-end all sessions via the routine flag (separate incident path).
 */
export const MATCHING_PAUSE_PRESERVES = [
  "soft_signal",
  "withdrawal",
  "wrap_up",
  "block",
  "report",
  "active_session_participant_stop",
] as const;

export const MATCHING_PAUSE_BLOCKS = [
  "discovery_results",
  "new_session_requests",
] as const;

/**
 * WHAT: Validates that a proposed kill-switch scope is constitution-safe.
 * WHY: Prevents accidental “pause Soft Signal” product bugs in flags.
 */
export function isRoutineMatchingPauseScopeSafe(scope: {
  blocksDiscovery: boolean;
  blocksNewRequests: boolean;
  removesSoftSignal: boolean;
  forceEndsActiveSessions: boolean;
}): boolean {
  if (scope.removesSoftSignal) return false;
  if (scope.forceEndsActiveSessions) return false;
  return scope.blocksDiscovery && scope.blocksNewRequests;
}

// ── Aggregate feature gate ─────────────────────────────────────────────────

/**
 * WHAT: Constitution gate for shipping a safety-ops feature change.
 * WHY: Same spirit as evaluateFeatureConstitutionally for moderation systems.
 * CONSENT: Fail closed on auto-punish or safety-score features.
 */
export function evaluateSafetyOpsFeature(input: {
  autoPunishesFromReports: boolean;
  createsPublicSafetyScore: boolean;
  impliesEmergencyServices: boolean;
  permanentBanWithoutHitlWhenRequired: boolean;
  removesSoftSignalOnMatchingPause: boolean;
  documentsConstitutionArticles: boolean;
}): { ok: true } | { ok: false; violations: string[] } {
  const violations: string[] = [];
  if (input.autoPunishesFromReports) {
    violations.push("II.5: automated punishment from reports is forbidden");
  }
  if (input.createsPublicSafetyScore) {
    violations.push("II.4: public safety score is forbidden");
  }
  if (input.impliesEmergencyServices) {
    violations.push("II.6: moderation must not imply emergency services");
  }
  if (input.permanentBanWithoutHitlWhenRequired) {
    violations.push(
      "VII: permanent ban without required two-person HITL is forbidden",
    );
  }
  if (input.removesSoftSignalOnMatchingPause) {
    violations.push(
      "I.3/I.4: matching pause must not remove Soft Signal stop paths",
    );
  }
  if (!input.documentsConstitutionArticles) {
    violations.push("VIII.6: safety-ops changes require documentation");
  }
  return violations.length === 0 ? { ok: true } : { ok: false, violations };
}

/**
 * WHAT: Default private-alpha HITL policy until founder names second owner.
 * WHY: Fail closed for irreversible bans in external contexts.
 * NEVER: Flip namedSecondOwnerConfigured without documented human owner.
 */
export const DEFAULT_PRIVATE_ALPHA_BAN_POLICY: PermanentBanPolicy = {
  twoPersonRequired: true,
  namedSecondOwnerConfigured: false,
  distinctStaffCount: 0,
};
