/**
 * Phone-side bridge to Apple Watch haptic co-regulation (stub + pure protocol).
 *
 * WHAT: Types and fail-closed client for Watch Soft Signal, preview, affirm.
 * WHY: Watch is first-class soft device; phone proposes, watch previews.
 * CONSENT: Soft Signal from wrist = global kill; live patterns need dual affirm.
 * NEVER: Treat bridge presence as peer consent; notification spam on watch face.
 * SEE: @litmo/domain hapticWatch · ADR 0064 · litmo-watch-haptics module
 */

import {
  createWristSoftSignalKill,
  defaultWatchCapabilities,
  type SoftSignalKillCommand,
  type WatchPhraseId,
  type CrossDeviceHapticProposal,
  resolveCrossDeviceProposal,
  watchPhraseSequence,
  WATCH_PHRASE_LIBRARY,
  type SharedHapticConsentVocabulary,
  emptyHapticVocabulary,
  type HapticDeviceCapabilities,
  type SharedHapticLexeme,
  type HapticIntensityStep,
} from "@litmo/domain";

export type WatchBridgeStatus =
  | "unavailable"
  | "not_paired"
  | "paired_reachable"
  | "paired_unreachable";

/**
 * WHAT: Minimal native module shape (filled by litmo-watch-haptics when linked).
 */
export type LitmoWatchHapticsNative = {
  getStatus(): Promise<WatchBridgeStatus>;
  playWatchPhrase(
    phraseId: string,
    intensity: string,
  ): Promise<{ ok: boolean }>;
  sendSoftSignalKill(command: SoftSignalKillCommand): Promise<{ ok: boolean }>;
  requestWatchPreview(proposal: CrossDeviceHapticProposal): Promise<{ ok: boolean }>;
};

let native: LitmoWatchHapticsNative | null = null;

export function registerWatchHapticsNative(
  impl: LitmoWatchHapticsNative | null,
): void {
  native = impl;
}

export const watchHapticBridge = {
  async getStatus(): Promise<WatchBridgeStatus> {
    if (!native) return "unavailable";
    try {
      return await native.getStatus();
    } catch {
      return "unavailable";
    }
  },

  /**
   * WHAT: Local phone simulation of watch phrase when native unavailable.
   * WHY: Development without Watch; never claims peer received it.
   */
  getLocalSequence(phraseId: WatchPhraseId, intensity?: HapticIntensityStep) {
    return watchPhraseSequence(phraseId, intensity);
  },

  describe(phraseId: WatchPhraseId): string {
    return WATCH_PHRASE_LIBRARY[phraseId].a11yLabel;
  },

  async playOnWatch(
    phraseId: WatchPhraseId,
    intensity: HapticIntensityStep = "light",
  ): Promise<{ ok: boolean; simulated: boolean }> {
    if (!native) {
      // Fail closed for "live" — simulation only for preview UX on phone.
      return { ok: true, simulated: true };
    }
    try {
      const r = await native.playWatchPhrase(phraseId, intensity);
      return { ok: r.ok, simulated: false };
    } catch {
      return { ok: false, simulated: false };
    }
  },

  /**
   * WHAT: Wrist Soft Signal — kill haptics + session when sessionId known.
   * WHY: Always-on wrist presence for free stop (offline-first command).
   */
  async softSignalFromWrist(input: {
    watchDeviceId: string;
    sessionId: string | null;
  }): Promise<{ command: SoftSignalKillCommand; delivered: boolean }> {
    const command = createWristSoftSignalKill({
      watchDeviceId: input.watchDeviceId,
      sessionId: input.sessionId,
      at: new Date().toISOString(),
    });
    if (!native) {
      return { command, delivered: false };
    }
    try {
      const r = await native.sendSoftSignalKill(command);
      return { command, delivered: r.ok };
    } catch {
      return { command, delivered: false };
    }
  },

  buildProposal(input: {
    consentId: string;
    lexeme: SharedHapticLexeme;
    intensity: HapticIntensityStep;
    watchPhraseId: WatchPhraseId | null;
    phoneDeviceId: string;
    watchDeviceId: string;
  }): CrossDeviceHapticProposal {
    return {
      proposalId: `prop-${Date.now()}`,
      consentId: input.consentId,
      lexeme: input.lexeme,
      intensity: input.intensity,
      watchPhraseId: input.watchPhraseId,
      proposedByDeviceId: input.phoneDeviceId,
      requiredDeviceIds: [input.phoneDeviceId, input.watchDeviceId],
      createdAt: new Date().toISOString(),
    };
  },

  resolveProposal: resolveCrossDeviceProposal,

  emptyVocabulary: emptyHapticVocabulary,

  watchCapabilities(): HapticDeviceCapabilities {
    return defaultWatchCapabilities();
  },
};

export type { SharedHapticConsentVocabulary, SoftSignalKillCommand };
