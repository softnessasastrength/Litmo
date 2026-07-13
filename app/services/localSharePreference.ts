import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  LOCAL_SHARE_PREF_KEY,
  parseNearbyShareEnabled,
  serializeNearbyShareEnabled,
} from "./localSharePreferenceCore.ts";

export async function getNearbyShareEnabled(): Promise<boolean> {
  try {
    const raw = await AsyncStorage.getItem(LOCAL_SHARE_PREF_KEY);
    return parseNearbyShareEnabled(raw);
  } catch {
    return false;
  }
}

export async function setNearbyShareEnabled(enabled: boolean): Promise<void> {
  await AsyncStorage.setItem(
    LOCAL_SHARE_PREF_KEY,
    serializeNearbyShareEnabled(enabled),
  );
}
