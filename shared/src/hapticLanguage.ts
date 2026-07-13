/**
 * Shared Haptic Language library (@litmo/domain) — device-agnostic IR.
 *
 * WHAT: Portable types for phone, Watch (Taptic), and future Device OS.
 * WHY: One consent-bound language; clients must not invent conflicting meanings.
 * CONSENT: Haptics never encode peer consent; Soft Signal is free + kills others.
 * NEVER: Notification spam patterns; FOMO; secret inter-user codes.
 * SEE: docs/HAPTIC_LANGUAGE.md · ADR 0063 · ADR 0064 (Watch)
 */

export const SHARED_HAPTIC_LANGUAGE_VERSION = "0.2-watch" as const;

// ── Intensity ──────────────────────────────────────────────────────────────

export const HAPTIC_INTENSITY_STEPS = [
  "feather",
  "light",
  "medium",
  "firm",
  "firm_plus",
] as const;
export type HapticIntensityStep = (typeof HAPTIC_INTENSITY_STEPS)[number];

export function intensityStepToUnit(step: HapticIntensityStep): number {
  switch (step) {
    case "feather":
      return 0.15;
    case "light":
      return 0.3;
    case "medium":
      return 0.5;
    case "firm":
      return 0.75;
    case "firm_plus":
      return 0.92;
  }
}

// ── Device class ───────────────────────────────────────────────────────────

export const HAPTIC_DEVICE_CLASSES = [
  "phone",
  "watch",
  "companion_device",
  "unknown",
] as const;
export type HapticDeviceClass = (typeof HAPTIC_DEVICE_CLASSES)[number];

/**
 * WHAT: Declared capabilities of a participant device for seal-time negotiation.
 * WHY: Phone proposes; Watch previews; capabilities fail closed if missing.
 * CONSENT: Capability is not consent; dual affirm still required for live play.
 */
export type HapticDeviceCapabilities = {
  deviceClass: HapticDeviceClass;
  /** Supports linear actuator / Taptic precision patterns. */
  linearActuator: boolean;
  /** Can run Soft Signal from this device alone (offline). */
  softSignalLocal: boolean;
  /** Can show preview + affirm UI. */
  canPreviewAndAffirm: boolean;
  /** Complication / always-on surface available. */
  complicationSoftSignal: boolean;
  maxIntensity: HapticIntensityStep;
  supportsDirectionalStroke: boolean;
  supportsHeartbeatSync: boolean;
  /** Sensory profile id when ND / feather mode active. */
  sensoryProfileId?: string;
};

export function defaultPhoneCapabilities(): HapticDeviceCapabilities {
  return {
    deviceClass: "phone",
    linearActuator: true,
    softSignalLocal: true,
    canPreviewAndAffirm: true,
    complicationSoftSignal: false,
    maxIntensity: "firm_plus",
    supportsDirectionalStroke: false,
    supportsHeartbeatSync: true,
  };
}

export function defaultWatchCapabilities(): HapticDeviceCapabilities {
  return {
    deviceClass: "watch",
    linearActuator: true, // Taptic Engine
    softSignalLocal: true,
    canPreviewAndAffirm: true,
    complicationSoftSignal: true,
    maxIntensity: "firm",
    supportsDirectionalStroke: true, // wrist directional simulation
    supportsHeartbeatSync: true,
  };
}

export function featherModeCapabilities(
  base: HapticDeviceCapabilities,
): HapticDeviceCapabilities {
  return {
    ...base,
    maxIntensity: "feather",
    sensoryProfileId: base.sensoryProfileId ?? "feather_overstimulated",
  };
}

// ── Lexemes (shared) ───────────────────────────────────────────────────────

export const SHARED_HAPTIC_LEXEMES = [
  "presence",
  "attention",
  "confirmation",
  "soft_signal",
  "emergency_stop",
  "check_in_gentle",
  "co_regulation_heartbeat",
  "wrist_stroke",
  "gentle_tap",
  "strong_tap",
  "boundary_question",
  "wrap_complete",
] as const;
export type SharedHapticLexeme = (typeof SHARED_HAPTIC_LEXEMES)[number];

// ── Cross-device consent vocabulary ─────────────────────────────────────────

export type SharedHapticConsentVocabulary = {
  version: 1;
  /** Bound to Consent Snapshot fingerprint / package id. */
  consentId: string;
  allowedLexemes: SharedHapticLexeme[];
  maxIntensity: HapticIntensityStep;
  allowSustained: boolean;
  /** Devices that have previewed + affirmed this vocabulary. */
  affirmedDeviceIds: string[];
  /** Devices that may initiate Soft Signal (always both when paired). */
  softSignalDeviceIds: string[];
  revoked: string[];
  previewedPatternIds: string[];
};

export function emptyHapticVocabulary(
  consentId: string,
): SharedHapticConsentVocabulary {
  return {
    version: 1,
    consentId,
    allowedLexemes: [
      "presence",
      "check_in_gentle",
      "co_regulation_heartbeat",
      "gentle_tap",
      "soft_signal",
    ],
    maxIntensity: "medium",
    allowSustained: false,
    affirmedDeviceIds: [],
    softSignalDeviceIds: [],
    revoked: [],
    previewedPatternIds: [],
  };
}

export function ndWatchVocabulary(
  consentId: string,
): SharedHapticConsentVocabulary {
  return {
    ...emptyHapticVocabulary(consentId),
    maxIntensity: "feather",
    allowSustained: false,
    allowedLexemes: [
      "presence",
      "check_in_gentle",
      "gentle_tap",
      "soft_signal",
      "co_regulation_heartbeat",
    ],
  };
}

/**
 * WHAT: Cross-device gate for live haptic (not Soft Signal).
 * WHY: Phone proposes; each device must preview/affirm; Soft Signal always free.
 */
export function mayPlayOnDevice(input: {
  lexeme: SharedHapticLexeme;
  intensity: HapticIntensityStep;
  deviceId: string;
  capabilities: HapticDeviceCapabilities;
  vocabulary: SharedHapticConsentVocabulary | null;
  softSignalActive: boolean;
  isSoftSignal: boolean;
  hasPreviewed: boolean;
  requireDualDeviceAffirm: boolean;
  minAffirmedDevices: number;
}): { ok: true } | { ok: false; code: string; message: string } {
  if (input.isSoftSignal || input.lexeme === "soft_signal") {
    if (!input.capabilities.softSignalLocal) {
      return {
        ok: false,
        code: "no_local_soft_signal",
        message: "device cannot Soft Signal locally",
      };
    }
    return { ok: true };
  }
  if (input.softSignalActive) {
    return {
      ok: false,
      code: "soft_signal_active",
      message: "all non-stop haptics killed",
    };
  }
  if (!input.vocabulary) {
    return {
      ok: false,
      code: "no_vocabulary",
      message: "live haptics require sealed vocabulary",
    };
  }
  const v = input.vocabulary;
  if (!input.hasPreviewed) {
    return {
      ok: false,
      code: "preview_required",
      message: "preview required before live play",
    };
  }
  if (input.requireDualDeviceAffirm) {
    if (v.affirmedDeviceIds.length < input.minAffirmedDevices) {
      return {
        ok: false,
        code: "devices_not_affirmed",
        message: "not enough devices have affirmed vocabulary",
      };
    }
    if (!v.affirmedDeviceIds.includes(input.deviceId)) {
      return {
        ok: false,
        code: "this_device_not_affirmed",
        message: "this device has not affirmed the vocabulary",
      };
    }
  }
  if (!v.allowedLexemes.includes(input.lexeme)) {
    return {
      ok: false,
      code: "lexeme_not_allowed",
      message: `lexeme ${input.lexeme} not in sealed vocabulary`,
    };
  }
  if (v.revoked.includes(input.lexeme)) {
    return {
      ok: false,
      code: "lexeme_revoked",
      message: `lexeme ${input.lexeme} revoked`,
    };
  }
  const maxI = HAPTIC_INTENSITY_STEPS.indexOf(v.maxIntensity);
  const wantI = HAPTIC_INTENSITY_STEPS.indexOf(input.intensity);
  const capI = HAPTIC_INTENSITY_STEPS.indexOf(input.capabilities.maxIntensity);
  if (wantI > maxI || wantI > capI) {
    return {
      ok: false,
      code: "intensity_exceeds",
      message: "intensity exceeds seal or device capability",
    };
  }
  if (
    input.lexeme === "wrist_stroke" &&
    !input.capabilities.supportsDirectionalStroke
  ) {
    return {
      ok: false,
      code: "no_directional",
      message: "device cannot directional stroke",
    };
  }
  if (
    input.lexeme === "co_regulation_heartbeat" &&
    !input.capabilities.supportsHeartbeatSync
  ) {
    return {
      ok: false,
      code: "no_heartbeat",
      message: "device cannot heartbeat sync",
    };
  }
  return { ok: true };
}

export function affirmDeviceOnVocabulary(
  v: SharedHapticConsentVocabulary,
  deviceId: string,
): SharedHapticConsentVocabulary {
  if (v.affirmedDeviceIds.includes(deviceId)) return v;
  return {
    ...v,
    affirmedDeviceIds: [...v.affirmedDeviceIds, deviceId],
    softSignalDeviceIds: v.softSignalDeviceIds.includes(deviceId)
      ? v.softSignalDeviceIds
      : [...v.softSignalDeviceIds, deviceId],
  };
}

export function revokeLexeme(
  v: SharedHapticConsentVocabulary,
  lexeme: string,
): SharedHapticConsentVocabulary {
  if (v.revoked.includes(lexeme)) return v;
  return { ...v, revoked: [...v.revoked, lexeme] };
}

// ── Sensory profiles (travel with user, device-local storage) ──────────────

export type HapticSensoryProfile = {
  id: string;
  label: string;
  maxIntensity: HapticIntensityStep;
  preferReducedMotion: boolean;
  softSignalOnly: boolean;
  longerPreviewMs: number;
};

export const BUILTIN_SENSORY_PROFILES: HapticSensoryProfile[] = [
  {
    id: "default",
    label: "Default",
    maxIntensity: "medium",
    preferReducedMotion: false,
    softSignalOnly: false,
    longerPreviewMs: 0,
  },
  {
    id: "feather_overstimulated",
    label: "Overstimulated days (feather)",
    maxIntensity: "feather",
    preferReducedMotion: true,
    softSignalOnly: false,
    longerPreviewMs: 1200,
  },
  {
    id: "co_regulation",
    label: "Needing co-regulation",
    maxIntensity: "light",
    preferReducedMotion: true,
    softSignalOnly: false,
    longerPreviewMs: 800,
  },
  {
    id: "soft_signal_only",
    label: "Stop signals only",
    maxIntensity: "firm",
    preferReducedMotion: true,
    softSignalOnly: true,
    longerPreviewMs: 0,
  },
];

export function applySensoryProfileToCapabilities(
  caps: HapticDeviceCapabilities,
  profile: HapticSensoryProfile,
): HapticDeviceCapabilities {
  const maxI = HAPTIC_INTENSITY_STEPS.indexOf(caps.maxIntensity);
  const profI = HAPTIC_INTENSITY_STEPS.indexOf(profile.maxIntensity);
  const step =
    HAPTIC_INTENSITY_STEPS[Math.min(maxI, profI)] ?? profile.maxIntensity;
  return {
    ...caps,
    maxIntensity: step,
    sensoryProfileId: profile.id,
  };
}
