/**
 * Semantic haptic vocabulary (HAPTIC-001).
 * Callers request meaning, never platform vibration APIs.
 * Haptics never represent remote consent, trust, safety, or another person.
 */

export type HapticEvent =
  "presence" | "attention" | "confirmation" | "softSignal" | "emergencyStop";

export type HapticPlatformCall =
  | { kind: "impact"; style: "light" | "medium" | "heavy" }
  | { kind: "notification"; type: "success" | "warning" | "error" }
  | { kind: "delay"; ms: number };

/** Deterministic mapping from semantic event → platform adapter calls. */
export function mappingForEvent(event: HapticEvent): HapticPlatformCall[] {
  switch (event) {
    case "presence":
      return [{ kind: "impact", style: "light" }];
    case "attention":
      return [
        { kind: "impact", style: "light" },
        { kind: "delay", ms: 80 },
        { kind: "impact", style: "light" },
      ];
    case "confirmation":
      return [{ kind: "notification", type: "success" }];
    case "softSignal":
      return [{ kind: "notification", type: "warning" }];
    case "emergencyStop":
      return [{ kind: "notification", type: "error" }];
  }
}

export type HapticPreferenceStorage = {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
};

export type HapticPlatformAdapter = {
  impact: (style: "light" | "medium" | "heavy") => Promise<void>;
  notification: (type: "success" | "warning" | "error") => Promise<void>;
  delay: (ms: number) => Promise<void>;
};

export const HAPTIC_PREF_KEY = "litmo.haptics.enabled.v1";

/** Default enabled when preference is missing (conventional for iOS apps). */
export function parseHapticsEnabled(raw: string | null): boolean {
  if (raw === null || raw === undefined || raw === "") return true;
  if (raw === "0" || raw === "false") return false;
  if (raw === "1" || raw === "true") return true;
  // Malformed storage fails open to enabled only if not clearly false-like.
  return true;
}

export function createHapticService(deps: {
  storage: HapticPreferenceStorage;
  platform: HapticPlatformAdapter;
  /** Optional non-sensitive dev log. Never logs session/consent content. */
  onPlaybackError?: (event: HapticEvent, error: unknown) => void;
}) {
  let enabledCache: boolean | null = null;

  async function isEnabled(): Promise<boolean> {
    if (enabledCache !== null) return enabledCache;
    try {
      const raw = await deps.storage.getItem(HAPTIC_PREF_KEY);
      enabledCache = parseHapticsEnabled(raw);
      return enabledCache;
    } catch {
      enabledCache = true;
      return true;
    }
  }

  async function setEnabled(enabled: boolean): Promise<void> {
    enabledCache = enabled;
    try {
      await deps.storage.setItem(HAPTIC_PREF_KEY, enabled ? "1" : "0");
    } catch {
      // Preference write failure still updates in-memory cache for this session.
    }
    // Play confirmation only when enabling (spec).
    if (enabled) {
      await play("confirmation");
    }
  }

  async function runCalls(calls: HapticPlatformCall[]): Promise<void> {
    for (const call of calls) {
      if (call.kind === "delay") {
        await deps.platform.delay(call.ms);
      } else if (call.kind === "impact") {
        await deps.platform.impact(call.style);
      } else {
        await deps.platform.notification(call.type);
      }
    }
  }

  async function play(event: HapticEvent): Promise<void> {
    try {
      if (!(await isEnabled())) return;
      await runCalls(mappingForEvent(event));
    } catch (error) {
      deps.onPlaybackError?.(event, error);
      // Never throw into safety or navigation flows.
    }
  }

  return {
    play,
    isEnabled,
    setEnabled,
    /** Test helper: clear in-memory preference cache. */
    _resetCache() {
      enabledCache = null;
    },
  };
}

export type HapticService = ReturnType<typeof createHapticService>;
