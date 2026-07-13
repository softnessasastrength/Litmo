import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  defaultProximityPrefs,
  parseProximityPrefs,
  PROXIMITY_PREF_KEY,
  serializeProximityPrefs,
  type ProximityPrefs,
} from "./proximityPreferenceCore.ts";

export async function getProximityPrefs(): Promise<ProximityPrefs> {
  try {
    const raw = await AsyncStorage.getItem(PROXIMITY_PREF_KEY);
    return parseProximityPrefs(raw);
  } catch {
    return {
      ...defaultProximityPrefs,
      axes: { ...defaultProximityPrefs.axes },
    };
  }
}

export async function setProximityPrefs(
  prefs: ProximityPrefs,
): Promise<ProximityPrefs> {
  await AsyncStorage.setItem(PROXIMITY_PREF_KEY, serializeProximityPrefs(prefs));
  return prefs;
}

export async function updateProximityPrefs(
  patch: Partial<ProximityPrefs>,
): Promise<ProximityPrefs> {
  const current = await getProximityPrefs();
  const next: ProximityPrefs = {
    ...current,
    ...patch,
    axes: { ...current.axes, ...(patch.axes ?? {}) },
  };
  return setProximityPrefs(next);
}

export type { ProximityPrefs };
