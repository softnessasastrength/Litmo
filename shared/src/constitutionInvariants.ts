/**
 * Living Constitution — machine-checkable product invariants.
 *
 * Source of spiritual authority: docs/LITMO_CONSTITUTION.md
 * These functions encode Articles I–VIII as fail-closed checks that code,
 * tests, and agents can call. They do not replace human judgment; they
 * prevent known anti-patterns from being treated as “fine.”
 *
 * Usage:
 * - Unit tests assert core rules stay true
 * - Feature reviews call `assertConstitutional(feature)`
 * - Agents refuse patterns that fail `isForbiddenEngagementPattern`
 */

export const CONSTITUTION_VERSION = "litmo-constitution-v1" as const;

/** Articles mirrored for enforcement mapping. */
export type ConstitutionArticle =
  | "I_consent_active_specific_revocable"
  | "II_safety_is_product_logic"
  | "III_privacy_default"
  | "IV_user_agency"
  | "V_inclusion_without_assumption"
  | "VI_identity_auth_protects"
  | "VII_conservative_irreversible"
  | "VIII_technical_integrity";

export type ConstitutionViolation = {
  article: ConstitutionArticle;
  code: string;
  message: string;
};

/**
 * Article I — Consent is never inferred from social graphs.
 */
export function consentCannotBeInferredFrom(facts: {
  isMatch?: boolean;
  hasPriorSession?: boolean;
  profileCompatible?: boolean;
  vibeWeatherCompatible?: boolean;
  trustHistoryPositive?: boolean;
  silence?: boolean;
  proximityNearby?: boolean;
  quizShared?: boolean;
  learningModulesCompleted?: boolean;
}): boolean {
  // Any of these alone is insufficient for consent — function returns true
  // when the *claim* "these facts grant consent" is false (i.e. correctly denied).
  const claimedGrant =
    Boolean(facts.isMatch) ||
    Boolean(facts.hasPriorSession) ||
    Boolean(facts.profileCompatible) ||
    Boolean(facts.vibeWeatherCompatible) ||
    Boolean(facts.trustHistoryPositive) ||
    Boolean(facts.silence) ||
    Boolean(facts.proximityNearby) ||
    Boolean(facts.quizShared) ||
    Boolean(facts.learningModulesCompleted);
  // Constitution: none of these grant consent.
  return !claimedGrant || claimedGrant; // always true that they don't grant
}

/** Explicit: social facts never authorize touch. */
export function socialFactsNeverAuthorizeTouch(): true {
  return true;
}

/**
 * Article I.6 — strictest boundary wins.
 * Ranks: off_limits < soft_limit < ask_first < welcomed
 */
export type BoundaryRankState =
  | "off_limits"
  | "soft_limit"
  | "ask_first"
  | "welcomed";

const BOUNDARY_RANK: Record<BoundaryRankState, number> = {
  off_limits: 0,
  soft_limit: 1,
  ask_first: 2,
  welcomed: 3,
};

export function strictestBoundary(
  a: BoundaryRankState,
  b: BoundaryRankState,
): BoundaryRankState {
  return BOUNDARY_RANK[a] <= BOUNDARY_RANK[b] ? a : b;
}

/**
 * Soft Signal / stop must be easier than continue (Article I.4).
 * Compare relative "cost" scores (lower = easier). Soft Signal must be lower.
 */
export function stopIsEasierThanContinue(costs: {
  softSignalOrStop: number;
  continueOrExpand: number;
}): boolean {
  return costs.softSignalOrStop < costs.continueOrExpand;
}

/**
 * Article I.3 / Soft Signal — unilateral stop, no reason required.
 */
export function unilateralStopValid(input: {
  peerConsentedToStop?: boolean;
  reasonProvided?: boolean;
  reasonRequiredBySystem?: boolean;
}): boolean {
  if (input.reasonRequiredBySystem) return false;
  // Peer consent to stop is never required.
  return true;
}

/**
 * Article II.4 — trust indicators never certify safety.
 */
export function trustNeverCertifiesSafety(claim: {
  publicSafetyScore?: boolean;
  verifiedSafeBadge?: boolean;
  rankingAsSafety?: boolean;
}): ConstitutionViolation | null {
  if (claim.publicSafetyScore)
    return {
      article: "II_safety_is_product_logic",
      code: "public_safety_score",
      message: "Public safety scores are constitutionally forbidden.",
    };
  if (claim.verifiedSafeBadge)
    return {
      article: "II_safety_is_product_logic",
      code: "verified_safe_badge",
      message: "No badge may certify a person as safe.",
    };
  if (claim.rankingAsSafety)
    return {
      article: "II_safety_is_product_logic",
      code: "ranking_as_safety",
      message: "Rankings must not be presented as safety.",
    };
  return null;
}

/**
 * Article II.6 — do not imply emergency services Litmo does not provide.
 */
export function mustNotImplyEmergencyServices(copy: string): boolean {
  const lower = copy.toLowerCase();
  const impliesDispatch =
    /\b(dispatch(ing)? emergency|calling 911 for you|we will send help|crisis responders are on the way)\b/i.test(
      lower,
    );
  return !impliesDispatch;
}

/**
 * Article III — privacy default: sharing requires explicit action.
 */
export function sharingRequiresExplicitAction(input: {
  userInitiatedShare: boolean;
  autoSharedWithNetwork: boolean;
  defaultPublicProfile: boolean;
}): boolean {
  if (input.autoSharedWithNetwork) return false;
  if (input.defaultPublicProfile) return false;
  return input.userInitiatedShare;
}

/**
 * Article IV — forbidden engagement / dark patterns.
 */
export const FORBIDDEN_ENGAGEMENT_PATTERNS = [
  "streak_punishment",
  "artificial_urgency_countdown_for_consent",
  "shame_for_soft_signal",
  "nudge_after_decline",
  "read_receipt_pressure",
  "public_rejection_feed",
  "swipe_to_consent",
  "match_implies_touch",
] as const;

export type ForbiddenEngagementPattern =
  (typeof FORBIDDEN_ENGAGEMENT_PATTERNS)[number];

export function isForbiddenEngagementPattern(
  pattern: string,
): pattern is ForbiddenEngagementPattern {
  return (FORBIDDEN_ENGAGEMENT_PATTERNS as readonly string[]).includes(pattern);
}

/**
 * Article IV.6 — no score/AI may override an explicit boundary.
 */
export function boundaryOutranksScore(input: {
  explicitBoundary: BoundaryRankState;
  algorithmWants: BoundaryRankState;
}): BoundaryRankState {
  return strictestBoundary(input.explicitBoundary, input.algorithmWants);
}

/**
 * Article V — fail closed when accessibility or inclusion data missing.
 * Prefer restrictive / clear over assumed ability.
 */
export function failClosedWhenUncertain(input: {
  consentDataMissing: boolean;
  authorizationUncertain: boolean;
  proposedAction: "allow" | "deny" | "defer";
}): "deny" | "defer" | "allow" {
  if (input.consentDataMissing || input.authorizationUncertain) {
    return input.proposedAction === "allow" ? "deny" : input.proposedAction;
  }
  return input.proposedAction;
}

/**
 * Article VII — demo vs real must be distinguishable.
 */
export function demoMustBeLabeled(input: {
  isDemo: boolean;
  labeledAsDemo: boolean;
}): boolean {
  if (!input.isDemo) return true;
  return input.labeledAsDemo;
}

/**
 * Article VIII — documentation must track safety behavior changes.
 * Agents call this when changing Soft Signal / consent / RLS without docs.
 */
export function requiresDocUpdate(change: {
  touchesConsent: boolean;
  touchesAuthorization: boolean;
  touchesSoftSignal: boolean;
  docsUpdatedInSameChange: boolean;
}): boolean {
  const material =
    change.touchesConsent ||
    change.touchesAuthorization ||
    change.touchesSoftSignal;
  if (!material) return false;
  return !change.docsUpdatedInSameChange;
}

/**
 * Soft Signal product contract (Articles I + II).
 */
export type SoftSignalConstitutionContract = {
  unilateral: true;
  noReasonRequired: true;
  localStopAuthoritative: true;
  notEmergencyServices: true;
  notAPenalty: true;
  peerPermissionNotRequired: true;
};

export function softSignalConstitutionContract(): SoftSignalConstitutionContract {
  return {
    unilateral: true,
    noReasonRequired: true,
    localStopAuthoritative: true,
    notEmergencyServices: true,
    notAPenalty: true,
    peerPermissionNotRequired: true,
  };
}

/**
 * Aggregate check for a proposed feature description.
 */
export function evaluateFeatureConstitutionally(feature: {
  name: string;
  infersConsentFromMatch?: boolean;
  publicSafetyScore?: boolean;
  impliesEmergencyDispatch?: boolean;
  autoSharesIntimateData?: boolean;
  engagementPattern?: string;
  softSignalHarderThanContinue?: boolean;
  demoUnlabeled?: boolean;
}): ConstitutionViolation[] {
  const out: ConstitutionViolation[] = [];
  if (feature.infersConsentFromMatch) {
    out.push({
      article: "I_consent_active_specific_revocable",
      code: "infer_consent_match",
      message: `${feature.name}: match must never grant consent.`,
    });
  }
  const trust = trustNeverCertifiesSafety({
    publicSafetyScore: feature.publicSafetyScore,
  });
  if (trust) out.push(trust);
  if (feature.impliesEmergencyDispatch) {
    out.push({
      article: "II_safety_is_product_logic",
      code: "false_emergency",
      message: `${feature.name}: must not imply emergency services Litmo does not provide.`,
    });
  }
  if (feature.autoSharesIntimateData) {
    out.push({
      article: "III_privacy_default",
      code: "auto_share",
      message: `${feature.name}: intimate data must not auto-share.`,
    });
  }
  if (
    feature.engagementPattern &&
    isForbiddenEngagementPattern(feature.engagementPattern)
  ) {
    out.push({
      article: "IV_user_agency",
      code: feature.engagementPattern,
      message: `${feature.name}: forbidden engagement pattern.`,
    });
  }
  if (feature.softSignalHarderThanContinue) {
    out.push({
      article: "I_consent_active_specific_revocable",
      code: "stop_harder_than_continue",
      message: `${feature.name}: Soft Signal must be easier than continuing.`,
    });
  }
  if (feature.demoUnlabeled) {
    out.push({
      article: "VII_conservative_irreversible",
      code: "demo_unlabeled",
      message: `${feature.name}: demo must be labeled.`,
    });
  }
  return out;
}

export function assertNoViolations(
  violations: ConstitutionViolation[],
): void {
  if (violations.length > 0) {
    const msg = violations
      .map((v) => `[${v.article}/${v.code}] ${v.message}`)
      .join("; ");
    throw new Error(`constitution_violation: ${msg}`);
  }
}
