/**
 * Nearby-share master opt-in preference (pure).
 * Default is OFF — radio never starts without an intentional Settings enable.
 */

export const LOCAL_SHARE_PREF_KEY = "@litmo/nearby_share_enabled_v1";

export function parseNearbyShareEnabled(raw: string | null): boolean {
  return raw === "1" || raw === "true";
}

export function serializeNearbyShareEnabled(enabled: boolean): string {
  return enabled ? "1" : "0";
}
