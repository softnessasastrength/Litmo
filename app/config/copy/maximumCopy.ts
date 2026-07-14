/**
 * WHAT: Maximum Mode copy — full autistic consent voice.
 * WHY:  macOS / Linux / internal builds keep sacred Soft Signal language and
 *       uncompromising platonic-consent framing.
 * CONSENT: Stop is sacred success; no reason; not emergency services;
 *       educational ≠ consent; adults only platonic.
 * NEVER: Soften into swipe-to-agree or safety-score theater.
 * SEE: config/copy/appStoreCopy.ts for review-sanitized twin.
 */

import type { ModeCopyPack } from "./types.ts";

export const maximumCopy: ModeCopyPack = {
  softSignal: {
    button: "Soft Signal — end now",
    buttonStopping: "Stopping…",
    buttonStopped: "You are free",
    hint: "Ends everything immediately. No explanation. No penalty. A complete sentence of care. Not emergency or crisis services.",
    bannerTitle: "Soft Signal",
    bannerBody:
      "Your stop is sacred here. Soft Signal is success — a safe exit — never failure, never blame, never a debate.",
    endedTitle: "You stopped. That is enough.",
    endedBody:
      "The session has ended. You do not owe a story. Soft Signal is never a penalty and never requires their permission.",
    pendingSync:
      "Stopped on this device. Litmo will sync privately when the network returns. The session cannot resume.",
    practiceTitle: "Practice Soft Signal",
    practiceBody:
      "Feel the stop without a real peer. Muscle memory for freedom. Practice never starts a session or notifies anyone.",
    logEmpty: "No Soft Signal records on this device yet.",
    logPrivacy:
      "These notes are private to you on this device. They are not a score, not shared with partners, and never required when you stop.",
    notEmergency:
      "Litmo is not emergency response or crisis services. If you are in danger, use local emergency services.",
    stickyLabel: "ALWAYS AVAILABLE · NO REASON NEEDED · NEVER A PENALTY",
  },
  entry: {
    eyebrow: "Choose how to enter",
    title: "Explore Litmo honestly.",
    body: "This build is a local prototype. Demo mode uses fictional adults and does not create an account, verify identity, or connect you with a real person.",
    demoTitle: "Demo mode",
    demoBody:
      "Walk a calm path: Touch Language onboarding, boundaries, discovery, Quizzes, full Guided Learning, partner invite with a fictional encrypted peer, consent, Soft Signal, and wrap-up. Demo turns on Neurodivergent Mode by default — change anytime in Settings.",
    demoNoticeTitle: "Important",
    demoNoticeBody:
      "Compatibility, quizzes, and trust examples are educational signals only. They do not establish consent or prove that anyone is safe. Partner comparison still needs your share and compare consents — even with a fictional demo partner. Some progress may stay on this device only — never an account and never real matching.",
    demoButton: "Enter the fictional demo",
    realTitle: "Real account · passkeys",
    realBody:
      "Real accounts use WebAuthn passkeys (Face ID / Touch ID) through Supabase Auth — no passwords. Your general profile, touch preferences, and consent boundaries persist across visits. Sensitive screens still require a fresh device-owner check.",
    footer:
      "For consenting adults. Non-sexual, platonic connection only. Consent is specific, mutual, and revocable at any moment.",
    modeBadgeMaximum: "MAXIMUM MODE · full consent grammar",
    modeBadgeAppStore: "APP STORE SAFE · review-sanitized",
  },
  welcome: {
    kicker: "WELCOME TO LITMO",
    title: "Connection can be soft.",
    body: "A playful place to learn your vibe, name your boundaries, and practice clear consent.",
    primary: "Explore the prototype",
    caption:
      "A tap-through prototype using imaginary people and local data. No real account or connection is created.",
  },
  partnerName: "Renn",
};
