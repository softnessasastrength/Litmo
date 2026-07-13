/**
 * Plain-language chrome for Neurodivergent Mode and quiz/partner flows.
 * Does not rewrite clinical/legal meaning of consent gates.
 *
 * Product philosophy:
 * - Quiz is for you only — not consent, not a safety score
 * - Partner share/compare requires two yeses; never permission to touch
 * - Pace and break language must not auto-skip consent surfaces
 * - Soft reminders stay explicit non-claims
 *
 * SEE: docs/LITMO_CONSTITUTION.md · app/lib/neuroStyleScale.ts · app/lib/quizPaths.ts
 */

/**
 * WHAT: Centralized clear-language strings and small formatters for ND / quiz / partner UI.
 * WHY: One place for non-shaming, non-consent-implying chrome used across screens.
 * CONSENT: quizSoftReminder and partnerBody explicitly deny consent-from-quiz/share.
 * EDGE CASES: progress helpers clamp left ≥ 0; total 0 → 0% (no divide-by-zero surprise).
 * NEVER: Soften partnerBody into match-implies-touch; never auto-share on shareYes alone without peer yes.
 */
export const clearLanguage = {
  /**
   * WHAT: Soft reminder that quiz is personal, not consent or safety score.
   * WHY: Constitution — social/quiz facts never authorize touch.
   * CONSENT: Explicit non-claim bound near quiz chrome.
   */
  quizSoftReminder:
    "This quiz is for you only. It is not consent. It is not a safety score.",
  quizLeave: "Leave quiz",
  quizBack: "Previous question",
  quizNext: "Next question",
  /**
   * WHAT: Formats "Question X of Y" for progress chrome.
   * WHY: Predictable pacing without urgency countdown-for-consent.
   * CONSENT: Not a consent surface.
   */
  quizProgress: (current: number, total: number) =>
    `Question ${current} of ${total}`,
  quizSaved: "Your place is saved on this device. You can leave and come back.",
  quizResume: "Continue where you left off?",
  quizReadAloud: "Read question out loud",
  quizVoiceHint:
    "Tip: type or dictate the option number (1, 2, 3…) then press Go. Or use the buttons.",
  quizVoicePlaceholder: "Option number (or dictate)",
  /**
   * WHAT: Formats learning-module step progress.
   * WHY: Clear progress without streak punishment language.
   * CONSENT: Not a consent surface — learning ≠ touch authorization.
   */
  learningProgress: (current: number, total: number) =>
    `Step ${current} of ${total}`,
  learningReadAloud: "Read this step out loud",
  partnerTitle: "Share with a partner — only if both say yes",
  /**
   * WHAT: Partner compare framing with dual-yes and encryption non-permission.
   * WHY: Two yeses required; share is never permission to touch.
   * CONSENT: Explicit — never permission to touch.
   */
  partnerBody:
    "Two yeses needed: share, then compare. Encryption keeps results private. This is never permission to touch.",
  partnerShareYes: "Yes — share my encrypted result",
  partnerShareNo: "Stop sharing my result",
  partnerCompareYes: "Yes — I agree to compare",
  partnerCompareNo: "Stop compare",
  partnerCreate: "Start a private invite",
  partnerImport: "Add their package",
  partnerCompareOpen: "Show comparison",
  partnerCompareClosed: "Comparison is still closed",
  ndModeOn:
    "Neurodivergent Mode is on: larger text, reduced motion, your pace, clear progress, easy breaks, voice aids, and saves on this device.",
  ndModeOffHint:
    "Turn on Neurodivergent Mode in Settings for larger text, your own pace, easy breaks, and quieter screens.",
  ndModeOnPlain:
    "Calm mode on: bigger text, your pace, easy breaks, quieter screens.",
  ndModeOnDetailed:
    "Neurodivergent Mode is on for this device only. It turns on larger text, reduced motion, confirm-to-continue pacing, plain language, progressive detail, easy breaks, voice aids, on-device saves, low sensory density, and an overload exit. It is not a diagnosis, not matching, and never replaces Soft Signal or consent.",
  takeBreak: "Take a break — progress is saved",
  continueWhenReady: "Continue when you are ready",
  showDetail: "Show more detail",
  hideDetail: "Hide detail",
  overloadExit: "I need a break",
  overloadExitSession: "Stop and get space",
  sensoryLow: "Sensory: low stimulation",
  sensoryBalanced: "Sensory: balanced",
  sensoryVariable: "Sensory: variable day",
  languagePlain: "Language: plain and short",
  languageStandard: "Language: standard",
  languageDetailed: "Language: more detail",
  motionReduced: "Motion: reduced",
  motionStandard: "Motion: standard",
  hapticsOff: "Haptics: off",
  hapticsMinimal: "Haptics: stop signals only",
  hapticsStandard: "Haptics: standard",
  exitBreak: "Overload exit: take a break (saved)",
  exitHome: "Overload exit: leave to Home",
  exitPanic: "Overload exit: calm cover / safety tools",
  /**
   * WHAT: Rich quiz progress line with percent and remaining count.
   * WHY: ND Mode prefers explicit remaining work without artificial urgency for consent.
   * CONSENT: Not a consent surface.
   * EDGE CASES: total ≤ 0 → 0%; left floored at 0 if current > total.
   */
  progressQuiz: (current: number, total: number) => {
    const left = Math.max(0, total - current);
    const pct = total > 0 ? Math.round((current / total) * 100) : 0;
    return `Question ${current} of ${total} · ${pct}% · ${left} left`;
  },
  /**
   * WHAT: Rich learning progress line with percent and remaining count.
   * WHY: Same ND clarity as progressQuiz for modules.
   * CONSENT: Not a consent surface — learning completion ≠ consent.
   * EDGE CASES: total ≤ 0 → 0%; left floored at 0.
   */
  progressLearn: (current: number, total: number) => {
    const left = Math.max(0, total - current);
    const pct = total > 0 ? Math.round((current / total) * 100) : 0;
    return `Step ${current} of ${total} · ${pct}% · ${left} left`;
  },
  breakSaved:
    "Your place is saved on this device. Come back whenever you like. No rush.",
  /**
   * WHAT: Affirms user-paced advance (no auto-skip of intentional gates).
   * WHY: Consent microinteractions forbid accidental advance; ND pace respects agency.
   * CONSENT: Does not rewrite grant-arm / Soft Signal timing — chrome only.
   */
  paceConfirm: "You choose when to go on — no auto-skip.",
  paceSlow: "Slower auto-advance is on.",
  paceAuto: "Brief pause, then next question.",
};
