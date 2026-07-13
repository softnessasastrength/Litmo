/**
 * Semantic haptic vocabulary (HAPTIC-001) + composable language (ADR 0063).
 * Callers request meaning, never platform vibration APIs.
 * Haptics never represent remote consent, trust, safety, or another person.
 *
 * SEE: docs/HAPTIC_LANGUAGE.md · hapticLanguageCore · hapticService.ts
 */

import {
  defaultPhraseForLexeme,
  legacyEventToPhoneCalls,
  lexemeAllowedAtIntensity,
  lexemeFromLegacy,
  phraseToPhoneCalls,
  resolveInterrupt,
  type HapticPhrase,
  type LegacyHapticEvent,
  type SafetyInterrupt,
} from "../lib/hapticLanguageCore.ts";

/**
 * WHAT: Closed set of product-meaningful haptic events (legacy public API).
 * WHY: Backward compatible with HAPTIC-001 call sites.
 * CONSENT: No event means peer consent, Soft Signal grant, or “person is safe”.
 * NEVER: Map match quality or trust scores into haptic intensity.
 */
export type HapticEvent = LegacyHapticEvent;

/**
 * WHAT: Platform-neutral call descriptors consumed by the adapter.
 * WHY: Core stays testable without importing expo-haptics.
 * CONSENT: Not a consent surface — pure playback plan.
 * EDGE: core_haptics_hint is ignored by Expo adapter (future native CHH).
 * NEVER: Encode user secrets or session ids into call parameters.
 */
export type HapticPlatformCall =
  | { kind: "impact"; style: "light" | "medium" | "heavy" }
  | { kind: "notification"; type: "success" | "warning" | "error" }
  | { kind: "delay"; ms: number }
  | {
      kind: "core_haptics_hint";
      sharpness: number;
      intensity: number;
      durationMs: number;
    };

/**
 * WHAT: Deterministic mapping from semantic event → platform adapter calls.
 * WHY: Routes through haptic language grammar (descend_warm Soft Signal, etc.).
 * CONSENT: softSignal/emergencyStop acknowledge local stop UX only.
 * NEVER: Vary pattern by peer trust or match score.
 * SEE: HAPTIC-001 · ADR 0063 · hapticLanguageCore
 */
export function mappingForEvent(event: HapticEvent): HapticPlatformCall[] {
  return legacyEventToPhoneCalls(event) as HapticPlatformCall[];
}

/**
 * WHAT: Async key-value preference store for haptics enabled flag.
 * WHY: Inject AsyncStorage/tests without hard dependency in core.
 * CONSENT: Preference only — not consent state.
 * EDGE CASES: get/set may throw; callers catch.
 * NEVER: Store session/consent payloads under HAPTIC_PREF_KEY.
 */
export type HapticPreferenceStorage = {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
};

/**
 * WHAT: Platform playback ports for impact, notification, and delay.
 * WHY: Unit tests mock these without real motors.
 * CONSENT: Not a consent surface.
 * EDGE CASES: Implementations may no-op on web.
 * NEVER: Throw into Soft Signal fire path (play swallows errors).
 */
export type HapticPlatformAdapter = {
  impact: (style: "light" | "medium" | "heavy") => Promise<void>;
  notification: (type: "success" | "warning" | "error") => Promise<void>;
  delay: (ms: number) => Promise<void>;
};

/** Storage key for user haptics preference (v1). Unit: boolean as "1"/"0". */
export const HAPTIC_PREF_KEY = "litmo.haptics.enabled.v1";

/**
 * WHAT: Parse stored preference string into enabled boolean.
 * WHY: Centralize fail-open default for missing prefs (conventional iOS UX).
 * CONSENT: Not a consent surface.
 * EDGE CASES:
 *   - null/undefined/"" → true (default enabled)
 *   - "0"/"false" → false; "1"/"true" → true
 *   - malformed → true (not clearly false-like)
 * NEVER: Infer consent preferences from this key.
 */
export function parseHapticsEnabled(raw: string | null): boolean {
  if (raw === null || raw === undefined || raw === "") return true;
  if (raw === "0" || raw === "false") return false;
  if (raw === "1" || raw === "true") return true;
  // Malformed storage fails open to enabled only if not clearly false-like.
  return true;
}

/**
 * WHAT: Factory for play / isEnabled / setEnabled haptic service with injected deps.
 * WHY: Shared algorithm for production adapter and unit tests (HAPTIC-001).
 * CONSENT: Playback never authorizes touch, Soft Signal success, or peer safety.
 * EDGE CASES:
 *   - storage read fails → treat enabled true for session cache
 *   - play errors swallowed so safety navigation is not blocked
 * NEVER: Throw from play into Soft Signal / emergency stop control flow.
 * SEE: createHapticService consumers in hapticService.ts
 */
export function createHapticService(deps: {
  storage: HapticPreferenceStorage;
  platform: HapticPlatformAdapter;
  /** Optional non-sensitive dev log. Never logs session/consent content. */
  onPlaybackError?: (event: HapticEvent, error: unknown) => void;
  /**
   * Optional ND intensity gate (off / minimal / standard).
   * Default standard when unset — Settings master switch still applies.
   */
  getIntensityPolicy?: () => "off" | "minimal" | "standard";
}) {
  let enabledCache: boolean | null = null;
  let activeInterrupt: SafetyInterrupt = "none";
  let playGeneration = 0;

  /**
   * WHAT: Read whether haptics are enabled (memory cache then storage).
   * WHY: Avoid storage hit on every Soft Signal / attention play.
   * CONSENT: Not a consent surface.
   * EDGE CASES: storage throw → cache true and return true.
   * NEVER: Disable Soft Signal because haptics failed — preference is separate.
   */
  async function isEnabled(): Promise<boolean> {
    if (enabledCache !== null) return enabledCache;
    try {
      const raw = await deps.storage.getItem(HAPTIC_PREF_KEY);
      enabledCache = parseHapticsEnabled(raw);
      return enabledCache;
    } catch {
      // Preference unavailable: keep conventional default (enabled).
      enabledCache = true;
      return true;
    }
  }

  /**
   * WHAT: Persist haptics preference and update in-memory cache.
   * WHY: Settings toggle must survive restarts when storage works.
   * CONSENT: Not a consent surface.
   * EDGE CASES: write failure still updates cache for this process; enable plays confirmation.
   * NEVER: Play softSignal/emergencyStop as “you disabled haptics” feedback.
   */
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

  /**
   * WHAT: Sequentially execute impact/notification/delay calls on the adapter.
   * WHY: Multi-tap patterns (attention) need ordered delays.
   * CONSENT: Not a consent surface.
   * EDGE CASES: empty array no-op; adapter throws bubble to play’s catch.
   * NEVER: Parallelize delays that define anti-accident rhythm.
   */
  async function runCalls(
    calls: HapticPlatformCall[],
    generation: number,
  ): Promise<void> {
    for (const call of calls) {
      // Soft Signal / emergency abort mid-phrase decorative playback.
      if (generation !== playGeneration) return;
      if (call.kind === "delay") {
        await deps.platform.delay(call.ms);
      } else if (call.kind === "impact") {
        await deps.platform.impact(call.style);
      } else if (call.kind === "notification") {
        await deps.platform.notification(call.type);
      }
      // core_haptics_hint: reserved for native CHH adapters; Expo ignores.
    }
  }

  /**
   * WHAT: Raise a safety interrupt (aborts in-flight non-safety phrases).
   * WHY: Soft Signal must cut engagement-like patterns immediately.
   * CONSENT: Interrupt is local motor control only.
   */
  function raiseInterrupt(incoming: SafetyInterrupt): void {
    activeInterrupt = resolveInterrupt(activeInterrupt, incoming);
    if (incoming === "soft_signal" || incoming === "emergency_stop") {
      playGeneration += 1;
    }
  }

  /**
   * WHAT: Play a full grammar phrase if enabled and ND policy allows.
   * WHY: TL zone preview, seal steps, Soft Signal descend_warm compositions.
   * NEVER: Block Soft Signal commit path — callers fire void after stop.
   */
  async function playPhrase(p: HapticPhrase): Promise<void> {
    try {
      if (!(await isEnabled())) return;
      const policy = deps.getIntensityPolicy?.() ?? "standard";
      if (!lexemeAllowedAtIntensity(p.lexeme, policy)) return;
      if (
        p.interrupt === "none" &&
        activeInterrupt !== "none"
      ) {
        // Decorative phrase while safety interrupt latched — skip.
        return;
      }
      if (
        p.interrupt !== "none" &&
        interruptPriorityLocal(p.interrupt) <
          interruptPriorityLocal(activeInterrupt)
      ) {
        return;
      }
      if (p.interrupt === "soft_signal" || p.interrupt === "emergency_stop") {
        raiseInterrupt(p.interrupt);
      }
      const gen = playGeneration;
      const calls = phraseToPhoneCalls(p) as HapticPlatformCall[];
      await runCalls(calls, gen);
      // Clear latch after stop-class phrase completes so presence can resume later.
      if (
        p.interrupt === "soft_signal" ||
        p.interrupt === "emergency_stop"
      ) {
        activeInterrupt = "none";
      }
    } catch (error) {
      deps.onPlaybackError?.(
        legacyEventNameForError(p) ?? "presence",
        error,
      );
    }
  }

  /**
   * WHAT: Play semantic haptic if enabled; never throw to callers.
   * WHY: Soft Signal / navigation must continue when motors or OS APIs fail.
   * CONSENT: softSignal haptic is local UX acknowledgment only — stop already decided elsewhere.
   * EDGE CASES: disabled → silent return; catch → optional onPlaybackError only.
   * NEVER: Block Soft Signal completion on haptic failure; claim peer felt the haptic.
   */
  async function play(event: HapticEvent): Promise<void> {
    const lexeme = lexemeFromLegacy(event);
    const p = defaultPhraseForLexeme(lexeme);
    await playPhrase(p);
  }

  return {
    play,
    playPhrase,
    raiseInterrupt,
    isEnabled,
    setEnabled,
    /** Test helper: clear in-memory preference cache. */
    _resetCache() {
      enabledCache = null;
      activeInterrupt = "none";
      playGeneration = 0;
    },
  };
}

function interruptPriorityLocal(i: SafetyInterrupt): number {
  if (i === "emergency_stop") return 100;
  if (i === "soft_signal") return 90;
  if (i === "user_cancel") return 50;
  return 0;
}

function legacyEventNameForError(p: HapticPhrase): HapticEvent | null {
  if (p.lexeme === "soft_signal") return "softSignal";
  if (p.lexeme === "emergency_stop") return "emergencyStop";
  if (
    p.lexeme === "presence" ||
    p.lexeme === "attention" ||
    p.lexeme === "confirmation"
  ) {
    return p.lexeme;
  }
  return null;
}

export type HapticService = ReturnType<typeof createHapticService>;
