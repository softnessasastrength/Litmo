import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import { safeLog } from "./logger.ts";
import {
  createHapticService,
  type HapticEvent,
  type HapticPlatformAdapter,
} from "./hapticServiceCore.ts";

const impactStyle = {
  light: Haptics.ImpactFeedbackStyle.Light,
  medium: Haptics.ImpactFeedbackStyle.Medium,
  heavy: Haptics.ImpactFeedbackStyle.Heavy,
} as const;

const notificationType = {
  success: Haptics.NotificationFeedbackType.Success,
  warning: Haptics.NotificationFeedbackType.Warning,
  error: Haptics.NotificationFeedbackType.Error,
} as const;

const expoPlatform: HapticPlatformAdapter = {
  async impact(style) {
    await Haptics.impactAsync(impactStyle[style]);
  },
  async notification(type) {
    await Haptics.notificationAsync(notificationType[type]);
  },
  delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  },
};

export const hapticService = createHapticService({
  storage: {
    getItem: (key) => AsyncStorage.getItem(key),
    setItem: (key, value) => AsyncStorage.setItem(key, value),
  },
  platform: expoPlatform,
  onPlaybackError(event: HapticEvent, error: unknown) {
    safeLog("haptic_playback_failed", {
      event,
      // Non-sensitive: only event name + error name/message shape.
      errorName: error instanceof Error ? error.name : "unknown",
    });
  },
});

export type { HapticEvent } from "./hapticServiceCore.ts";
