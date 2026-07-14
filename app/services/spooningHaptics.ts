/**
 * Spooning Protocol haptics — phone + best-effort Apple Watch.
 * Soft Signal is sacred; never blocks on Watch delivery.
 */
import type { WatchPhraseId } from "@litmo/domain";
import { hapticService } from "./hapticService.ts";
import { watchHapticBridge } from "./watchHapticBridge.ts";
import type { SpoonSnapshot } from "../lib/spooningCore.ts";

export const spooningHaptics = {
  async onSeal(snapshot: SpoonSnapshot): Promise<void> {
    void hapticService.play("presence");
    if (!snapshot.watchHapticsEnabled) return;
    void watchHapticBridge.playOnWatch("watch_presence", "light");
  },

  async onCheckIn(snapshot: SpoonSnapshot): Promise<{
    watchSimulated: boolean;
    phrase: WatchPhraseId;
  }> {
    void hapticService.play("presence");
    const phrase: WatchPhraseId =
      snapshot.preferredCheckIn === "still_wanted" ||
      snapshot.mommyIssuesReassurance
        ? "watch_co_regulation_heartbeat"
        : "watch_check_in";
    if (!snapshot.watchHapticsEnabled) {
      return { watchSimulated: true, phrase };
    }
    const r = await watchHapticBridge.playOnWatch(phrase, "light");
    return { watchSimulated: r.simulated, phrase };
  },

  async onFiveMinWarning(snapshot: SpoonSnapshot): Promise<void> {
    void hapticService.play("attention");
    if (!snapshot.watchHapticsEnabled) return;
    void watchHapticBridge.playOnWatch("watch_gentle_tap", "medium");
  },

  async onSoftSignal(snapshot: SpoonSnapshot | null): Promise<void> {
    void hapticService.play("softSignal");
    if (snapshot?.watchHapticsEnabled === false) return;
    void watchHapticBridge.playOnWatch("watch_soft_signal", "firm");
    void watchHapticBridge.softSignalFromWrist({
      watchDeviceId: "local-practice",
      sessionId: snapshot?.id ?? null,
    });
  },

  async onReassuranceLine(): Promise<void> {
    void hapticService.play("confirmation");
  },
};
