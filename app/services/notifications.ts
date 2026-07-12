import * as Notifications from "expo-notifications";

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

export async function scheduleDemoNotification(input: {
  title: string;
  body: string;
  secondsFromNow: number;
}): Promise<boolean> {
  const granted = await requestNotificationPermission();
  if (!granted) return false;
  await Notifications.scheduleNotificationAsync({
    content: { title: input.title, body: input.body },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: input.secondsFromNow,
    },
  });
  return true;
}
