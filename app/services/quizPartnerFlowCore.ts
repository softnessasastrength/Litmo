/**
 * Pure partner-invite flow guidance.
 * Keeps UX calm: one primary next step, dual consent fail-closed.
 * Never treats quiz weather as consent to touch.
 */

import { canCompare, type QuizInvite } from "./quizShareCore.ts";

export type PartnerPrimaryAction =
  | "create"
  | "show_package"
  | "practice_demo"
  | "import"
  | "take_quiz"
  | "share"
  | "compare"
  | "open_compare"
  | "idle";

export type PartnerFlowGuide = {
  /** 1–4 for progress chips */
  stepIndex: number;
  stepTotal: number;
  /** Short empowering headline */
  title: string;
  /** What to do next in plain language */
  body: string;
  primaryAction: PartnerPrimaryAction;
  primaryLabel: string;
  /** Safety line always shown under the guide */
  safetyLine: string;
};

const SAFETY =
  "Shared weather is for conversation only. It is never consent to touch or a Consent Snapshot.";

/**
 * Decide the single calm next step for the selected invite.
 * @param hasLocalQuizResult — user has completed this quiz on device
 * @param isDemo — demo mode may offer fictional partner practice
 */
export function guidePartnerFlow(
  invite: QuizInvite | null,
  options: { hasLocalQuizResult: boolean; isDemo: boolean },
): PartnerFlowGuide {
  if (!invite) {
    return {
      stepIndex: 1,
      stepTotal: 4,
      title: "Start a private invite",
      body: "Create an encrypted invite for one person. Your keys stay on this device. You stay in control of what you share.",
      primaryAction: "create",
      primaryLabel: "Create encrypted invite",
      safetyLine: SAFETY,
    };
  }

  if (canCompare(invite)) {
    return {
      stepIndex: 4,
      stepTotal: 4,
      title: "Ready to compare — only because both of you said yes",
      body: "Open soft notes about your weather. You can withdraw share or compare anytime; comparison closes immediately.",
      primaryAction: "open_compare",
      primaryLabel: "Open shared comparison",
      safetyLine: SAFETY,
    };
  }

  // Peer path: joined, may need quiz then share
  if (invite.role === "peer" && !invite.hostConsentToShare) {
    if (!options.hasLocalQuizResult) {
      return {
        stepIndex: 2,
        stepTotal: 4,
        title: "Take the same quiz first",
        body: "Your result stays private until you consent to share an encrypted package for this invite.",
        primaryAction: "take_quiz",
        primaryLabel: "Take this quiz",
        safetyLine: SAFETY,
      };
    }
    return {
      stepIndex: 2,
      stepTotal: 4,
      title: "Share when you are ready",
      body: "Consent to encrypt your result for this invite only. You can withdraw later. Encryption uses Signal-style keys on this device.",
      primaryAction: "share",
      primaryLabel: "I consent to share my encrypted result",
      safetyLine: SAFETY,
    };
  }

  // Host: waiting for partner handshake / package
  if (invite.role === "host" && !invite.sessionReady && !invite.peerResult) {
    return {
      stepIndex: 1,
      stepTotal: 4,
      title: "Invite is ready — send it privately",
      body: options.isDemo
        ? "Show the package for a real partner, or practice with a fictional partner on this phone. Comparison still needs your yes twice."
        : "Show the public invite package and send it only to the person you trust. It holds public keys only — not your weather.",
      primaryAction: options.isDemo ? "practice_demo" : "show_package",
      primaryLabel: options.isDemo
        ? "Practice with fictional partner"
        : "Show invite package",
      safetyLine: SAFETY,
    };
  }

  // Session ready but not shared
  if (!invite.hostConsentToShare || !invite.hostResult) {
    if (!options.hasLocalQuizResult) {
      return {
        stepIndex: 2,
        stepTotal: 4,
        title: "Take the quiz, then choose to share",
        body: "Nothing is shared automatically. When you are ready, you will encrypt your result for this invite only.",
        primaryAction: "take_quiz",
        primaryLabel: "Take this quiz",
        safetyLine: SAFETY,
      };
    }
    return {
      stepIndex: 2,
      stepTotal: 4,
      title: "Your choice: share encrypted weather",
      body: "This is optional and withdrawable. Servers never see plaintext weather — only you and your partner with the right keys can open it.",
      primaryAction: "share",
      primaryLabel: "I consent to share my encrypted result",
      safetyLine: SAFETY,
    };
  }

  // Shared but not compare
  if (!invite.hostConsentToCompare) {
    return {
      stepIndex: 3,
      stepTotal: 4,
      title: "Second yes: compare only if they do too",
      body: "Compare is separate from share. Comparison stays closed until both people consent to compare and both results are present.",
      primaryAction: "compare",
      primaryLabel: "I consent to compare (if they do too)",
      safetyLine: SAFETY,
    };
  }

  // Local consents done; waiting on partner result or partner compare
  if (!invite.peerResult || !invite.peerConsentToShare) {
    return {
      stepIndex: 3,
      stepTotal: 4,
      title: "Waiting for their encrypted package",
      body: "Import their package when they send it. Wrong or incomplete packages fail closed — nothing opens by accident.",
      primaryAction: "import",
      primaryLabel: "Import partner package",
      safetyLine: SAFETY,
    };
  }

  if (!invite.peerConsentToCompare) {
    return {
      stepIndex: 3,
      stepTotal: 4,
      title: "Waiting for their compare consent",
      body: "They shared weather but have not consented to compare yet. You stay closed until both say yes to compare.",
      primaryAction: "idle",
      primaryLabel: "Still waiting",
      safetyLine: SAFETY,
    };
  }

  return {
    stepIndex: 3,
    stepTotal: 4,
    title: "Almost ready",
    body: "Check that both results and both consents are present, then open comparison.",
    primaryAction: "open_compare",
    primaryLabel: "Try open comparison",
    safetyLine: SAFETY,
  };
}
