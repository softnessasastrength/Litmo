/**
 * Plain-language chrome for Neurodivergent Mode.
 * Does not rewrite clinical/legal meaning of consent gates.
 */

export const clearLanguage = {
  quizSoftReminder:
    "This quiz is for you only. It is not consent. It is not a safety score.",
  quizLeave: "Leave quiz",
  quizBack: "Previous question",
  quizNext: "Next question",
  quizProgress: (current: number, total: number) =>
    `Question ${current} of ${total}`,
  quizSaved: "Your place is saved on this device. You can leave and come back.",
  quizResume: "Continue where you left off?",
  quizReadAloud: "Read question out loud",
  quizVoiceHint:
    "Tip: type or dictate the option number (1, 2, 3…) then press Go. Or use the buttons.",
  quizVoicePlaceholder: "Option number (or dictate)",
  learningProgress: (current: number, total: number) =>
    `Step ${current} of ${total}`,
  learningReadAloud: "Read this step out loud",
  partnerTitle: "Share with a partner — only if both say yes",
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
    "Neurodivergent Mode is on: quieter screens, save/resume, clearer words, read-aloud, and dictation aids.",
  ndModeOffHint:
    "Turn on Neurodivergent Mode in Settings for quieter screens, save/resume, and clearer steps.",
};
