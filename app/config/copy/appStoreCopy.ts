/**
 * WHAT: App Store Safe Mode copy — review-sanitized strings.
 * WHY:  iOS store binary keeps the same safety mechanics with calmer language
 *       that is less likely to be misread as sexual, medical, or crisis product.
 * CONSENT: Still: stop needs no reason, not a penalty, not emergency services,
 *       educational ≠ consent, adults, platonic. Soft Signal still ends now.
 * NEVER: “By continuing you agree”; safety scores; require explain-to-stop.
 * SEE: maximumCopy.ts for full-voice twin; docs/BUILD_MODES.md.
 */

import type { ModeCopyPack } from "./types.ts";

export const appStoreCopy: ModeCopyPack = {
  softSignal: {
    // Same control; slightly less “sacred liturgy” density for Review.
    button: "End session now",
    buttonStopping: "Ending…",
    buttonStopped: "Session ended",
    hint: "Ends the session immediately. No explanation required. Not a penalty. Litmo is not emergency or crisis services.",
    bannerTitle: "End session",
    bannerBody:
      "You can end at any time. Ending is always allowed, never a failure, and never requires the other person’s permission.",
    endedTitle: "Session ended",
    endedBody:
      "The session has ended. You do not need to explain. Ending does not require their permission.",
    pendingSync:
      "Ended on this device. Litmo will update privately when the network returns. The session cannot resume.",
    practiceTitle: "Practice ending a session",
    practiceBody:
      "Practice ending without a real peer. Practice does not start a session or notify anyone.",
    logEmpty: "No end-session records on this device yet.",
    logPrivacy:
      "These notes are private on this device. They are not a score, not shared with others, and never required when you end.",
    notEmergency:
      "Litmo is not emergency response or crisis services. If you are in danger, contact local emergency services.",
    stickyLabel: "ALWAYS AVAILABLE · NO REASON NEEDED",
  },
  entry: {
    eyebrow: "How to continue",
    title: "Welcome to Litmo.",
    body: "Litmo helps adults practice clear boundaries and platonic connection preferences. Demo uses fictional data only when available.",
    demoTitle: "Try a demo",
    demoBody:
      "Walk through preferences, boundaries, and a practice session with fictional data. Nothing creates a real account or matches you with a real person.",
    demoNoticeTitle: "Please note",
    demoNoticeBody:
      "Examples and quizzes are educational only. They do not mean consent or that anyone is safe. Real connections always need a fresh, explicit agreement.",
    demoButton: "Continue with demo data",
    realTitle: "Account with passkey",
    realBody:
      "Create or sign in with a passkey (Face ID / Touch ID). Preferences can save to your account. Sensitive actions may ask you to confirm you are the device owner.",
    footer:
      "For adults 18+. Platonic, non-sexual connection only. Consent is specific, mutual, and can be withdrawn anytime.",
    modeBadgeMaximum: "MAXIMUM MODE",
    modeBadgeAppStore: "App Store build",
  },
  welcome: {
    kicker: "WELCOME TO LITMO",
    title: "Clear boundaries. Soft connection.",
    body: "Learn your preferences, name your boundaries, and practice clear agreement — for platonic connection between adults.",
    primary: "Continue",
    caption:
      "Practice with imaginary people and local data. No real account is required to explore the demo path when available.",
  },
  partnerName: "your partner",
};
