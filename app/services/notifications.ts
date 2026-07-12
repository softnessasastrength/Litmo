import * as Notifications from "expo-notifications";
import { privacySafeNotificationContent } from "./notificationsCore.ts";

/**
 * Real, device-level local notifications -- not an in-app mock banner. Used
 * to demonstrate actual intended notification behavior (e.g. for App Store
 * review) without any backend/push infrastructure: everything here is
 * scheduled and fired entirely on-device.
 */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export async function requestNotificationPermission(): Promise<boolean> {
  const existing = await Notifications.getPermissionsAsync();
  if (existing.granted) return true;
  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}

export async function scheduleDemoNotification(
  secondsFromNow: number,
): Promise<boolean> {
  const granted = await requestNotificationPermission();
  if (!granted) return false;
  await Notifications.scheduleNotificationAsync({
    content: privacySafeNotificationContent(),
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: secondsFromNow,
    },
  });
  return true;
}
