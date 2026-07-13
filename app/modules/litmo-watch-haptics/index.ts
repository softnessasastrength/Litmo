/**
 * Expo module surface for Apple Watch haptics (stub until native linked).
 *
 * WHAT: JS API matching watchHapticBridge native shape.
 * WHY: Phone can register real Watch Connectivity + Taptic when binary includes Watch app.
 * CONSENT: Soft Signal kill is stop authority; previews never auto-play live.
 * NEVER: Fake "partner felt this"; spam complications with engagement.
 * SEE: ADR 0064 · @litmo/domain hapticWatch
 */

export type WatchBridgeStatus =
  | "unavailable"
  | "not_paired"
  | "paired_reachable"
  | "paired_unreachable";

/**
 * WHAT: Stub implementation used until Watch app + WCSession ship.
 * WHY: App builds without Watch target; Soft Signal on phone remains primary.
 */
export const LitmoWatchHapticsStub = {
  async getStatus(): Promise<WatchBridgeStatus> {
    return "unavailable";
  },
  async playWatchPhrase(
    _phraseId: string,
    _intensity: string,
  ): Promise<{ ok: boolean }> {
    return { ok: false };
  },
  async sendSoftSignalKill(_command: unknown): Promise<{ ok: boolean }> {
    return { ok: false };
  },
  async requestWatchPreview(_proposal: unknown): Promise<{ ok: boolean }> {
    return { ok: false };
  },
};

export default LitmoWatchHapticsStub;
