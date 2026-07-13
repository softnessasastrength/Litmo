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
 * - Feature reviews call `evaluateFeatureConstitutionally` / `assertNoViolations`
 * - Agents refuse patterns that fail `isForbiddenEngagementPattern`
 *
 * Product philosophy (encoded here):
 * - Consent never inferred from match, vibe, TL %, proximity, quiz, trust history
 * - soft_limit is first-class in boundary rank (strictest wins)
 * - Soft Signal free: unilateral, no reason, easier than continue
 * - Trust never certifies safety; Litmo is not emergency dispatch
 *
 * SEE: docs/LITMO_CONSTITUTION.md · docs/CODE_COMMENT_STANDARD.md ·
 *      shared/src/consentEngine.ts
 */

/**
 * WHAT: Constitution document version string for tests and agents.
 * WHY: Pin which spiritual authority revision these checks claim to encode.
 * CONSENT: Versioning is governance integrity, not a consent grant.
 * NEVER: Bump without reviewing encoded rules against docs/LITMO_CONSTITUTION.md.
 */
/**
 * WHAT: Constitution document version string for tests and agents.
 * WHY: Pin which spiritual authority revision these checks claim to encode.
 * Bump when docs/LITMO_CONSTITUTION.md enforceable meaning changes (v2: living language + XI–XV).
 */
export const CONSTITUTION_VERSION = "litmo-constitution-v2" as const;

/**
 * WHAT: Article ids mirrored for enforcement mapping on violations.
 * WHY: Stable codes for tests, logs, and feature review messages.
 * CONSENT: Articles 0–I–II dominate consent/Soft Signal; XI–XV second/third-order.
 * NEVER: Treat article presence as legal approval of a feature.
 */
export type ConstitutionArticle =
  | "0_living_authority"
  | "I_consent_active_specific_revocable"
  | "II_safety_is_product_logic"
  | "III_privacy_default"
  | "IV_user_agency"
  | "V_inclusion_without_assumption"
  | "VI_identity_auth_protects"
  | "VII_conservative_irreversible"
  | "VIII_technical_integrity"
  | "IX_ai_accountable"
  | "X_honest_communication"
  | "XI_collective_safety"
  | "XII_living_consent_language"
  | "XIII_cultural_adoption"
  | "XIV_societal_impact"
  | "XV_neurotype_trauma_edges";

/**
 * WHAT: Structured constitution violation for review and assertNoViolations.
 * WHY: Machine-readable fail reasons without free-form ambiguity.
 * CONSENT: Violations block treating anti-patterns as shipping-ready.
 * NEVER: Swallow violations in production "for growth."
 */
export type ConstitutionViolation = {
  article: ConstitutionArticle;
  code: string;
  message: string;
};

/**
 * WHAT: Asserts that social/graph facts alone never constitute consent.
 * WHY: Article I — consent is active, specific, revocable; never inferred.
 * CONSENT: Returns true always that these facts do not grant consent (invariant helper).
 * EDGE CASES:
 *   - any combination of match/prior/profile/vibe/trust/silence/proximity/quiz/learning
 *     is still insufficient for consent
 *   - implementation always returns true (claim "these grant consent" is always false)
 * NEVER: Use a true return as "these facts grant consent" — true means "correctly denied."
 * SEE: docs/LITMO_CONSTITUTION.md Article I
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
  // Any of these alone (or together) is insufficient for consent.
  // claimedGrant documents what a bad feature might claim; the constitution denies it.
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
  // Constitution: none of these grant consent — invariant holds whether or not claimed.
  return !claimedGrant || claimedGrant; // always true that they don't grant
}

/**
 * WHAT: Explicit constant true that social facts never authorize touch.
 * WHY: Tests and agents need a named axiom without re-listing facts.
 * CONSENT: Soft Signal/social graph never substitutes for session consent.
 * EDGE CASES: none — pure constant true.
 * NEVER: Call as if it checks runtime state of a user.
 */
export function socialFactsNeverAuthorizeTouch(): true {
  return true;
}

/**
 * WHAT: Boundary states ordered for strictest-wins (includes soft_limit).
 * WHY: Article I.6 — most restrictive preference wins; soft_limit is first-class.
 * CONSENT: Rank is for merge/override logic, not session seal.
 * NEVER: Drop soft_limit from the rank table or treat it as welcomed.
 */
export type BoundaryRankState =
  | "off_limits"
  | "soft_limit"
  | "ask_first"
  | "welcomed";

/**
 * WHAT: Numeric rank (lower = stricter) for boundary states.
 * WHY: Implements strictestBoundary and boundaryOutranksScore.
 * CONSENT: off_limits always beats soft_limit; soft_limit beats ask_first/welcomed.
 * NEVER: Invert so algorithm openness beats explicit off_limits.
 */
const BOUNDARY_RANK: Record<BoundaryRankState, number> = {
  off_limits: 0,
  soft_limit: 1,
  ask_first: 2,
  welcomed: 3,
};

/**
 * WHAT: Returns the stricter of two boundary states.
 * WHY: Article I.6 — hard/soft limits win over more open preferences.
 * CONSENT: Used when merging people or score vs explicit boundary.
 * EDGE CASES: equal rank → returns `a` (stable).
 * NEVER: Return the more open state when ranks differ.
 * SEE: consentEngine stateRank · boundaryOutranksScore
 */
export function strictestBoundary(
  a: BoundaryRankState,
  b: BoundaryRankState,
): BoundaryRankState {
  return BOUNDARY_RANK[a] <= BOUNDARY_RANK[b] ? a : b;
}

/**
 * WHAT: Soft Signal / stop must be easier than continue (Article I.4).
 * WHY: Body freedom before beauty; stop must not lose a race to continue UX.
 * CONSENT: Soft Signal free — lower cost score means easier motor/UI path.
 * EDGE CASES: equal costs → false (stop must be strictly easier).
 * NEVER: Ship grant dwell shorter than Soft Signal commit path.
 * SEE: softSignalConstitutionContract · app Soft Signal timing tokens
 */
export function stopIsEasierThanContinue(costs: {
  softSignalOrStop: number;
  continueOrExpand: number;
}): boolean {
  // Strict inequality: stop must be cheaper, not merely equal.
  return costs.softSignalOrStop < costs.continueOrExpand;
}

/**
 * WHAT: Validates Soft Signal / unilateral stop product rules.
 * WHY: Article I.3 — stop without peer permission or required reason.
 * CONSENT: Soft Signal free — peerConsentedToStop is never required.
 * EDGE CASES:
 *   - reasonRequiredBySystem true → false (system must not demand a story)
 *   - missing reason / missing peer consent → still true
 * NEVER: Require peer OK or narrative before local stop commits.
 * SEE: softSignalConstitutionContract
 */
export function unilateralStopValid(input: {
  peerConsentedToStop?: boolean;
  reasonProvided?: boolean;
  reasonRequiredBySystem?: boolean;
}): boolean {
  // Fail closed on forced narrative — explanation is never a gate for stop.
  if (input.reasonRequiredBySystem) return false;
  // Peer consent to stop is never required (peerConsentedToStop intentionally unused).
  return true;
}

/**
 * WHAT: Detects forbidden trust-as-safety product claims (Article II.4).
 * WHY: Trust indicators never certify safety; rankings ≠ safety.
 * CONSENT: Returning a violation blocks shipping safety-certificate UX.
 * EDGE CASES: all flags false/undefined → null (no violation).
 * NEVER: Present public safety scores or verified-safe badges as product.
 * SEE: docs/LITMO_CONSTITUTION.md Article II
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
 * WHAT: True when copy does not falsely imply Litmo dispatches emergency help.
 * WHY: Article II.6 — Litmo is not emergency response.
 * CONSENT: Soft Signal ends session; it does not call 911 for the user.
 * EDGE CASES: empty/unrelated copy → true; dispatch-ish phrases → false.
 * NEVER: Ship "we will send help" / "calling 911 for you" product claims.
 * SEE: traumaSafetyCore PANIC_COPY.notEmergency
 */
export function mustNotImplyEmergencyServices(copy: string): boolean {
  const lower = copy.toLowerCase();
  const impliesDispatch =
    /\b(dispatch(ing)? emergency|calling 911 for you|we will send help|crisis responders are on the way)\b/i.test(
      lower,
    );
  // true = copy is OK (does not imply dispatch).
  return !impliesDispatch;
}

/**
 * WHAT: Sharing intimate data requires explicit user action (Article III).
 * WHY: Privacy default — no auto-share or default-public intimate profiles.
 * CONSENT: Share of TL/quiz is not consent to touch; this only checks share agency.
 * EDGE CASES:
 *   - autoSharedWithNetwork true → false
 *   - defaultPublicProfile true → false
 *   - otherwise requires userInitiatedShare true
 * NEVER: Auto-upload privateNotes or nervous-system notes.
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
 * WHAT: Catalog of forbidden engagement / dark patterns (Article IV).
 * WHY: Named denylist for agents and tests.
 * CONSENT: Includes swipe_to_consent, match_implies_touch, shame_for_soft_signal.
 * NEVER: Implement any of these as "engagement optimizations."
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

/**
 * WHAT: Union type of forbidden engagement pattern ids.
 * WHY: Type-safe denylist checks.
 * CONSENT: Patterns that coerce or fake consent are constitutionally banned.
 */
export type ForbiddenEngagementPattern =
  (typeof FORBIDDEN_ENGAGEMENT_PATTERNS)[number];

/**
 * WHAT: Type guard whether a string is a forbidden engagement pattern.
 * WHY: Feature review and agent refuse paths.
 * CONSENT: true means do not ship that pattern.
 * EDGE CASES: unknown strings → false (not in denylist; still review separately).
 * NEVER: Treat false as "pattern is allowed without review."
 */
export function isForbiddenEngagementPattern(
  pattern: string,
): pattern is ForbiddenEngagementPattern {
  return (FORBIDDEN_ENGAGEMENT_PATTERNS as readonly string[]).includes(pattern);
}

/**
 * WHAT: Explicit boundary always outranks algorithm/score desire (Article IV.6).
 * WHY: No score/AI may expand contact beyond stated boundary.
 * CONSENT: Returns strictest of explicit boundary and algorithm want.
 * EDGE CASES: algorithm more open → explicit wins; algorithm stricter → algorithm wins (still fail closed).
 * NEVER: Let recommendation systems override off_limits or soft_limit upward to welcomed.
 * SEE: strictestBoundary · soft_limit first-class
 */
export function boundaryOutranksScore(input: {
  explicitBoundary: BoundaryRankState;
  algorithmWants: BoundaryRankState;
}): BoundaryRankState {
  return strictestBoundary(input.explicitBoundary, input.algorithmWants);
}

/**
 * WHAT: When consent/authorization data is missing or uncertain, refuse open allow.
 * WHY: Article V / fail-closed — prefer deny or defer over assumed ability.
 * CONSENT: Uncertain data never becomes allow for human contact actions.
 * EDGE CASES:
 *   - consentDataMissing or authorizationUncertain + proposed allow → deny
 *   - same + proposed deny/defer → keep deny/defer
 *   - certain → return proposedAction as given
 * NEVER: Default allow when data is missing "to keep the funnel moving."
 */
export function failClosedWhenUncertain(input: {
  consentDataMissing: boolean;
  authorizationUncertain: boolean;
  proposedAction: "allow" | "deny" | "defer";
}): "deny" | "defer" | "allow" {
  if (input.consentDataMissing || input.authorizationUncertain) {
    // Fail closed: never upgrade uncertainty into allow.
    return input.proposedAction === "allow" ? "deny" : input.proposedAction;
  }
  return input.proposedAction;
}

/**
 * WHAT: Demo experiences must be labeled when they are demos (Article VII).
 * WHY: Users must not confuse simulated consent paths with real account sessions.
 * CONSENT: Unlabeled demo is a governance/product violation, not a grant.
 * EDGE CASES: !isDemo → true (vacuously ok); isDemo requires labeledAsDemo.
 * NEVER: Ship Face-ID-optional demo paths as if they were production real sessions without labels.
 */
export function demoMustBeLabeled(input: {
  isDemo: boolean;
  labeledAsDemo: boolean;
}): boolean {
  if (!input.isDemo) return true;
  return input.labeledAsDemo;
}

/**
 * WHAT: Material consent/Soft Signal/authorization code changes require same-change docs.
 * WHY: Article VIII — technical integrity; agents must not silent-ship safety edits.
 * CONSENT: Returns true when docs are still required (missing) for a material change.
 * EDGE CASES:
 *   - non-material change → false (docs not required by this rule)
 *   - material + docsUpdated → false (satisfied)
 *   - material + !docsUpdated → true (blocked until docs catch up)
 * NEVER: Weaken tests or skip docs for Soft Signal timing/consent engine edits.
 * SEE: docs/DOCUMENTATION_STANDARD.md · docs/CODE_COMMENT_STANDARD.md
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
  // true = still needs docs (callers should refuse incomplete change sets).
  return !change.docsUpdatedInSameChange;
}

/**
 * WHAT: Soft Signal product contract constants (Articles I + II).
 * WHY: Single exported shape for tests asserting Soft Signal free + non-emergency.
 * CONSENT: unilateral, noReasonRequired, peerPermissionNotRequired, localStopAuthoritative.
 * NEVER: Soften notAPenalty or claim emergency services via this contract.
 */
export type SoftSignalConstitutionContract = {
  unilateral: true;
  noReasonRequired: true;
  localStopAuthoritative: true;
  notEmergencyServices: true;
  notAPenalty: true;
  peerPermissionNotRequired: true;
};

/**
 * WHAT: Returns the fixed Soft Signal constitution contract object.
 * WHY: Tests freeze the product rules Soft Signal must obey.
 * CONSENT: Soft Signal free — all fields true by type and value.
 * EDGE CASES: none — pure constant factory.
 * NEVER: Return peerPermissionNotRequired: false or require reason.
 * SEE: unilateralStopValid · stopIsEasierThanContinue
 */
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
 * WHAT: Accommodations (ND Mode, sensory, language) must not become profile traits.
 * WHY: Constitution V / XV — inclusion without assumption or public diagnosis.
 * CONSENT: Not a consent surface; protects agency and privacy of accommodations.
 * NEVER: Export ND Mode, trauma flags, or sensory profile as peer-visible match data.
 */
export function accommodationsMustNotExportAsProfileTrait(input: {
  exportsNdModeToPeers?: boolean;
  exportsSensoryProfileToDiscovery?: boolean;
  publicNeurotypeBadge?: boolean;
}): boolean {
  return !(
    input.exportsNdModeToPeers ||
    input.exportsSensoryProfileToDiscovery ||
    input.publicNeurotypeBadge
  );
}

/**
 * WHAT: Consent language changes must be versioned (fingerprint / CONSTITUTION_VERSION).
 * WHY: Article 0 / XII — living language without silent redefinition mid-session.
 * CONSENT: Versioning protects dual-seal meaning; not a consent grant.
 * NEVER: Rewrite sealed vocabulary in place without invalidation path.
 */
export function consentLanguageMustBeVersioned(input: {
  hasVersionOrFingerprint: boolean;
  mutatesSealInPlace?: boolean;
}): boolean {
  if (input.mutatesSealInPlace) return false;
  return input.hasVersionOrFingerprint === true;
}

/**
 * WHAT: Aggregate constitution check for a proposed feature description.
 * WHY: Agents/humans review features before implementation without reading full prose.
 * CONSENT: Flags infer-consent, Soft Signal harder, match-as-touch patterns via denylist.
 * EDGE CASES: multiple violations collected; empty array means no listed anti-pattern detected.
 * NEVER: Empty array means "legal/clinical approved" — only that these machine checks passed.
 * SEE: assertNoViolations · FORBIDDEN_ENGAGEMENT_PATTERNS
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
  exportsNdModeToPeers?: boolean;
  mutatesSealVocabularyInPlace?: boolean;
  unversionedConsentLanguage?: boolean;
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
  // Soft Signal must stay easier than continue (I.4).
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
  if (
    !accommodationsMustNotExportAsProfileTrait({
      exportsNdModeToPeers: feature.exportsNdModeToPeers,
    })
  ) {
    out.push({
      article: "V_inclusion_without_assumption",
      code: "nd_export_trait",
      message: `${feature.name}: accommodations must not export as peer-visible traits.`,
    });
  }
  if (
    feature.unversionedConsentLanguage ||
    feature.mutatesSealVocabularyInPlace
  ) {
    out.push({
      article: "XII_living_consent_language",
      code: "unversioned_language",
      message: `${feature.name}: consent language must be versioned; seals must not mutate in place.`,
    });
  }
  return out;
}

/**
 * WHAT: Throws if any constitution violations are present.
 * WHY: Fail tests/agents hard rather than warn-and-ship anti-patterns.
 * CONSENT: Used to block consent-violating features at review time.
 * EDGE CASES: empty array → no throw; non-empty → Error with article/code list.
 * NEVER: Catch and ignore in CI for Soft Signal or consent engine changes.
 * SEE: evaluateFeatureConstitutionally
 */
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
