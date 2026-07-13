/**
 * Apple Watch / Taptic Engine layer for Litmo Haptic Language.
 *
 * WHAT: Watch-specific patterns, Taptic style mapping, complications, Soft Signal
 *       wrist path, co-regulation heartbeat, cross-device propose/preview/affirm.
 * WHY: Watch is a soft co-regulation device — never a notification spam surface.
 * CONSENT: Wrist Soft Signal is unilateral + global session kill; previews required
 *          for live non-stop patterns; phone propose → watch affirm.
 * NEVER: Badge counts, marketing haptics, peer presence spoofing via Taptic.
 * SEE: docs/HAPTIC_LANGUAGE.md · ADR 0064 · hapticLanguage.ts
 */

import {
  intensityStepToUnit,
  type HapticDeviceCapabilities,
  type HapticIntensityStep,
  type SharedHapticConsentVocabulary,
  type SharedHapticLexeme,
  defaultWatchCapabilities,
  mayPlayOnDevice,
  affirmDeviceOnVocabulary,
} from "./hapticLanguage.ts";

export const WATCH_HAPTIC_SPEC_VERSION = "0.1-watch" as const;

// ── Taptic Engine styles (Apple semantic + Litmo mapping) ──────────────────

/**
 * WHAT: Taptic styles abstract Apple's WKHapticType / CHH without importing WatchKit.
 * WHY: Shared package stays platform-free; Swift maps these 1:1.
 */
export const TAPTIC_STYLES = [
  "click", // light precise
  "directionUp",
  "directionDown",
  "success",
  "retry",
  "failure",
  "start",
  "stop",
  "clickSoft", // Litmo extension: feather
  "nudge", // gentle presence
  "strokeSegment", // one segment of directional stroke simulation
  "heartbeat", // soft double for co-regulation
  "softSignalTriple", // sacred triple
] as const;
export type TapticStyle = (typeof TAPTIC_STYLES)[number];

export type TapticCall =
  | { kind: "taptic"; style: TapticStyle; intensity: number }
  | { kind: "delay"; ms: number }
  | { kind: "chh_hint"; sharpness: number; intensity: number; durationMs: number };

// ── Watch-specific phrase library ──────────────────────────────────────────

export type WatchPhraseId =
  | "watch_gentle_tap"
  | "watch_strong_tap"
  | "watch_presence"
  | "watch_stroke"
  | "watch_co_regulation_heartbeat"
  | "watch_check_in"
  | "watch_soft_signal"
  | "watch_boundary_question";

export type WatchPhraseDef = {
  id: WatchPhraseId;
  lexeme: SharedHapticLexeme;
  description: string;
  /** Nervous-system respect copy — never notification language. */
  a11yLabel: string;
  defaultIntensity: HapticIntensityStep;
  sequence: TapticCall[];
};

/**
 * Soft Signal sacred on wrist: triple + decay; cannot be overridden.
 * Global session kill is session layer — this is motor + interrupt only.
 */
export const WATCH_SOFT_SIGNAL_SEQUENCE: TapticCall[] = [
  { kind: "taptic", style: "softSignalTriple", intensity: 0.85 },
  { kind: "delay", ms: 40 },
  { kind: "taptic", style: "stop", intensity: 0.7 },
  { kind: "delay", ms: 50 },
  { kind: "taptic", style: "directionDown", intensity: 0.55 },
  { kind: "chh_hint", sharpness: 0.2, intensity: 0.4, durationMs: 280 },
];

export const WATCH_PHRASE_LIBRARY: Record<WatchPhraseId, WatchPhraseDef> = {
  watch_gentle_tap: {
    id: "watch_gentle_tap",
    lexeme: "gentle_tap",
    description: "Gentle tap — soft presence on the wrist",
    a11yLabel: "Gentle tap. Local presence only. Not a message from another person.",
    defaultIntensity: "feather",
    sequence: [
      { kind: "taptic", style: "clickSoft", intensity: 0.25 },
    ],
  },
  watch_strong_tap: {
    id: "watch_strong_tap",
    lexeme: "strong_tap",
    description: "Stronger tap — still local, never peer consent",
    a11yLabel: "Firm tap. Local only.",
    defaultIntensity: "firm",
    sequence: [{ kind: "taptic", style: "click", intensity: 0.75 }],
  },
  watch_presence: {
    id: "watch_presence",
    lexeme: "presence",
    description: "Soft double presence — I am here (device acknowledgment)",
    a11yLabel: "Presence double tap. Does not mean someone is nearby.",
    defaultIntensity: "light",
    sequence: [
      { kind: "taptic", style: "nudge", intensity: 0.35 },
      { kind: "delay", ms: 90 },
      { kind: "taptic", style: "nudge", intensity: 0.35 },
    ],
  },
  watch_stroke: {
    id: "watch_stroke",
    lexeme: "wrist_stroke",
    description: "Directional stroke simulation along wrist (Taptic sequence)",
    a11yLabel: "Stroke simulation. Optional. Not another person's hand.",
    defaultIntensity: "light",
    sequence: [
      { kind: "taptic", style: "strokeSegment", intensity: 0.3 },
      { kind: "delay", ms: 55 },
      { kind: "taptic", style: "strokeSegment", intensity: 0.35 },
      { kind: "delay", ms: 55 },
      { kind: "taptic", style: "strokeSegment", intensity: 0.3 },
      { kind: "chh_hint", sharpness: 0.3, intensity: 0.3, durationMs: 200 },
    ],
  },
  watch_co_regulation_heartbeat: {
    id: "watch_co_regulation_heartbeat",
    lexeme: "co_regulation_heartbeat",
    description: "Co-regulation heartbeat at resting rate (local pattern)",
    a11yLabel:
      "Heartbeat-style pulse for co-regulation. Not a medical monitor. Not peer heart rate.",
    defaultIntensity: "feather",
    sequence: [
      { kind: "taptic", style: "heartbeat", intensity: 0.28 },
      { kind: "delay", ms: 180 },
      { kind: "taptic", style: "heartbeat", intensity: 0.22 },
      { kind: "delay", ms: 520 },
    ],
  },
  watch_check_in: {
    id: "watch_check_in",
    lexeme: "check_in_gentle",
    description: "Gentle check-in — how are you, no pressure",
    a11yLabel: "Check-in pulse. You may ignore it. Soft Signal always free.",
    defaultIntensity: "feather",
    sequence: [{ kind: "taptic", style: "nudge", intensity: 0.22 }],
  },
  watch_soft_signal: {
    id: "watch_soft_signal",
    lexeme: "soft_signal",
    description: "Wrist Soft Signal — triple + decay; kills other haptics; ends session",
    a11yLabel:
      "Soft Signal. You need to stop. No explanation needed. Not emergency services.",
    defaultIntensity: "firm",
    sequence: WATCH_SOFT_SIGNAL_SEQUENCE,
  },
  watch_boundary_question: {
    id: "watch_boundary_question",
    lexeme: "boundary_question",
    description: "Soft question-mark before a new pattern class",
    a11yLabel: "Boundary question pattern. Preview only unless sealed.",
    defaultIntensity: "light",
    sequence: [
      { kind: "taptic", style: "directionUp", intensity: 0.3 },
      { kind: "delay", ms: 100 },
      { kind: "taptic", style: "directionUp", intensity: 0.3 },
    ],
  },
};

export function scaleWatchSequence(
  seq: TapticCall[],
  intensity: HapticIntensityStep,
): TapticCall[] {
  const s = intensityStepToUnit(intensity);
  return seq.map((c) => {
    if (c.kind === "taptic") {
      return { ...c, intensity: Math.min(1, c.intensity * (s / 0.5)) };
    }
    if (c.kind === "chh_hint") {
      return { ...c, intensity: Math.min(1, c.intensity * (s / 0.5)) };
    }
    return c;
  });
}

export function watchPhraseSequence(
  id: WatchPhraseId,
  intensity?: HapticIntensityStep,
): TapticCall[] {
  const def = WATCH_PHRASE_LIBRARY[id];
  return scaleWatchSequence(def.sequence, intensity ?? def.defaultIntensity);
}

// ── Complications (offline-first) ──────────────────────────────────────────

/**
 * WHAT: Complication intents that never become engagement badges.
 * WHY: Quick Soft Signal + check-in without opening full app.
 * CONSENT: Soft Signal from complication is full stop authority.
 * NEVER: Unread counts, streaks, social presence dots.
 */
export const WATCH_COMPLICATION_KINDS = [
  "soft_signal",
  "check_in",
  "session_active_calm", // only shows "in session" without peer identity
] as const;
export type WatchComplicationKind = (typeof WATCH_COMPLICATION_KINDS)[number];

export type WatchComplicationState = {
  kind: WatchComplicationKind;
  /** Opaque; never peer display name on face. */
  sessionActive: boolean;
  softSignalArmed: boolean;
  /** ISO or null — last local Soft Signal practice, private. */
  lastLocalStopAt: string | null;
};

export function defaultComplicationState(): WatchComplicationState {
  return {
    kind: "soft_signal",
    sessionActive: false,
    softSignalArmed: true,
    lastLocalStopAt: null,
  };
}

export function complicationA11yLabel(s: WatchComplicationState): string {
  if (s.kind === "soft_signal") {
    return "Soft Signal. Double tap or press to stop. No explanation needed.";
  }
  if (s.kind === "check_in") {
    return "Gentle check-in. Optional. Soft Signal still available.";
  }
  return s.sessionActive
    ? "Session active. Soft Signal available. No peer identity shown."
    : "No active session.";
}

// ── Cross-device flow: phone proposes, watch previews + affirms ─────────────

export type CrossDeviceHapticProposal = {
  proposalId: string;
  consentId: string;
  lexeme: SharedHapticLexeme;
  intensity: HapticIntensityStep;
  watchPhraseId: WatchPhraseId | null;
  proposedByDeviceId: string;
  /** Devices that must affirm before live. */
  requiredDeviceIds: string[];
  createdAt: string;
};

export type CrossDeviceHapticDecision =
  | { status: "pending_preview" }
  | { status: "previewed"; deviceId: string }
  | { status: "affirmed"; deviceId: string }
  | { status: "rejected"; deviceId: string; reason: "soft_signal" | "decline" }
  | { status: "live_allowed" }
  | { status: "blocked"; code: string; message: string };

/**
 * WHAT: Reduce proposal + vocabulary + device affirmations to a decision.
 * WHY: Fail closed until watch (and phone) affirm; Soft Signal rejects freely.
 */
export function resolveCrossDeviceProposal(input: {
  proposal: CrossDeviceHapticProposal;
  vocabulary: SharedHapticConsentVocabulary;
  capabilitiesByDevice: Record<string, HapticDeviceCapabilities>;
  previewedBy: string[];
  affirmedBy: string[];
  rejectedBy: Array<{ deviceId: string; reason: "soft_signal" | "decline" }>;
  softSignalActive: boolean;
}): CrossDeviceHapticDecision {
  if (input.rejectedBy.some((r) => r.reason === "soft_signal")) {
    return {
      status: "rejected",
      deviceId: input.rejectedBy.find((r) => r.reason === "soft_signal")!
        .deviceId,
      reason: "soft_signal",
    };
  }
  if (input.rejectedBy.length > 0) {
    const r = input.rejectedBy[0]!;
    return { status: "rejected", deviceId: r.deviceId, reason: r.reason };
  }
  if (input.softSignalActive) {
    return {
      status: "blocked",
      code: "soft_signal_active",
      message: "session stop active",
    };
  }
  const required = input.proposal.requiredDeviceIds;
  for (const id of required) {
    if (!input.previewedBy.includes(id)) {
      return { status: "pending_preview" };
    }
  }
  for (const id of required) {
    if (!input.affirmedBy.includes(id)) {
      return { status: "previewed", deviceId: id };
    }
  }
  // All affirmed — check mayPlay on each
  for (const id of required) {
    const caps =
      input.capabilitiesByDevice[id] ?? defaultWatchCapabilities();
    const gate = mayPlayOnDevice({
      lexeme: input.proposal.lexeme,
      intensity: input.proposal.intensity,
      deviceId: id,
      capabilities: caps,
      vocabulary: input.vocabulary,
      softSignalActive: false,
      isSoftSignal: false,
      hasPreviewed: true,
      requireDualDeviceAffirm: true,
      minAffirmedDevices: required.length,
    });
    if (!gate.ok) {
      return { status: "blocked", code: gate.code, message: gate.message };
    }
  }
  return { status: "live_allowed" };
}

/**
 * WHAT: After watch Soft Signal — vocabulary stays but live play denied until new seal.
 * WHY: Instant global kill without deleting the person's history.
 */
export function vocabularyAfterWristSoftSignal(
  v: SharedHapticConsentVocabulary,
): SharedHapticConsentVocabulary {
  // Soft Signal does not require reseal of Soft Signal itself; other lexemes need re-preview.
  return {
    ...v,
    previewedPatternIds: [],
    // Keep soft_signal allowed; clear other live trust until re-affirm optional
  };
}

export function mergePhoneAndWatchVocabulary(
  base: SharedHapticConsentVocabulary,
  phoneId: string,
  watchId: string,
): SharedHapticConsentVocabulary {
  let v = affirmDeviceOnVocabulary(base, phoneId);
  v = affirmDeviceOnVocabulary(v, watchId);
  return v;
}

// ── Soft Signal wrist kill command ─────────────────────────────────────────

/**
 * WHAT: Portable kill command for phone + watch + companion.
 * WHY: Wrist Soft Signal must end session authority everywhere, offline-first.
 * CONSENT: Unilateral; no peer permission; not emergency dispatch.
 */
export type SoftSignalKillCommand = {
  kind: "soft_signal_kill";
  sourceDeviceId: string;
  sourceClass: "watch" | "phone" | "companion_device";
  sessionId: string | null;
  at: string;
  /** Always true — motors + session. */
  killAllHaptics: true;
  /** Always true for real sessions when sessionId present. */
  endSession: boolean;
};

export function createWristSoftSignalKill(input: {
  watchDeviceId: string;
  sessionId: string | null;
  at: string;
}): SoftSignalKillCommand {
  return {
    kind: "soft_signal_kill",
    sourceDeviceId: input.watchDeviceId,
    sourceClass: "watch",
    sessionId: input.sessionId,
    at: input.at,
    killAllHaptics: true,
    endSession: Boolean(input.sessionId),
  };
}
