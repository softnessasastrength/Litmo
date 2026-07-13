/**
 * Haptic Language — Litmo v0.1 Nuclear Autistic Edition.
 *
 * WHAT: Second/third-level primitives, pattern syntax, consent-bound vocabulary,
 *       phrase library, Soft Signal sacred envelope, ND sensory defaults.
 * WHY: Haptics are phonemes of the same consent language as physical touch.
 * CONSENT: Opt-in, previewable, interruptible; Soft Signal kills all motors.
 *          Patterns never encode peer consent by themselves — dual seal required
 *          for live session vocabulary; Soft Signal needs no peer permission.
 * EDGE: Envelope ceilings clamp intensity/duration; ND lowers ceilings further.
 * NEVER: Decorative FOMO; override Soft Signal; secret peer codes; live play
 *        without preview when session policy requires preview.
 * SEE: docs/HAPTIC_LANGUAGE.md (v0.1 nuclear) · hapticLanguageCore · ADR 0063
 */

import {
  compilePhrase,
  defaultPhraseForLexeme,
  phrase,
  phraseToPhoneCalls,
  type EmotionalModifier,
  type HapticLocation,
  type HapticPhrase,
  type PhoneHapticCall,
  type PressureCurve,
  type RhythmPattern,
} from "./hapticLanguageCore.ts";

export const HAPTIC_NUCLEAR_SPEC_VERSION = "0.1-nuclear" as const;

// ── Duration ───────────────────────────────────────────────────────────────

export const HAPTIC_DURATIONS = ["short", "medium", "sustained"] as const;
export type HapticDurationClass = (typeof HAPTIC_DURATIONS)[number];

export function durationClassMs(d: HapticDurationClass): {
  min: number;
  max: number;
  default: number;
} {
  switch (d) {
    case "short":
      return { min: 50, max: 200, default: 120 };
    case "medium":
      return { min: 300, max: 800, default: 600 };
    case "sustained":
      return { min: 1000, max: 8000, default: 2000 };
  }
}

// ── Intensity (5-step pressure scale) ──────────────────────────────────────

/**
 * WHAT: Feather → firm pressure scale mapped to motors (LRA/VCA/phone).
 * WHY: Matches Touch Language pressure vocabulary where possible.
 */
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

export function intensityStepFromPressure(
  p: "light" | "medium" | "firm" | null | undefined,
): HapticIntensityStep {
  if (p === "firm") return "firm";
  if (p === "medium") return "medium";
  return "light";
}

// ── Body-mapped + device-relative locations ────────────────────────────────

export const BODY_HAPTIC_ZONES = [
  "shoulder-left",
  "shoulder-right",
  "shoulders",
  "forearm-left",
  "forearm-right",
  "hand-left",
  "hand-right",
  "upper-back",
  "mid-back",
  "device",
  "device-left",
  "device-right",
  "device-center",
] as const;
export type BodyHapticZone = (typeof BODY_HAPTIC_ZONES)[number];

/** Map nuclear body zone → device-agnostic HapticLocation for phone collapse. */
export function bodyZoneToDeviceLocation(z: BodyHapticZone): HapticLocation {
  if (z.startsWith("device")) return "device";
  if (z.includes("hand") || z.includes("forearm")) return "fingertip";
  if (z.includes("shoulder") || z.includes("back")) return "palm_center";
  return "device";
}

// ── Texture modifiers ──────────────────────────────────────────────────────

export const TEXTURE_MODIFIERS = [
  "sharp",
  "soft",
  "rumbling",
  "pulsing",
  "directional_stroke",
  "smooth",
] as const;
export type TextureModifier = (typeof TEXTURE_MODIFIERS)[number];

export function textureToCurve(t: TextureModifier): PressureCurve {
  switch (t) {
    case "sharp":
      return "pulse_once";
    case "soft":
      return "soft_edge";
    case "rumbling":
      return "constant";
    case "pulsing":
      return "double_tap";
    case "directional_stroke":
      return "rise";
    case "smooth":
      return "soft_edge";
  }
}

// ── Emotional / context tags (private by default) ──────────────────────────

export const CONTEXT_TAGS = [
  "grounding",
  "affirming",
  "playful",
  "calming",
  "energizing",
  "check_in",
  "presence",
  "boundary_warning",
] as const;
export type ContextTag = (typeof CONTEXT_TAGS)[number];

export function contextToEmotion(tag: ContextTag): EmotionalModifier {
  switch (tag) {
    case "grounding":
    case "calming":
      return "calm";
    case "affirming":
    case "presence":
      return "warm";
    case "playful":
    case "energizing":
      return "crisp";
    case "check_in":
      return "neutral";
    case "boundary_warning":
      return "clear";
  }
}

// ── Safety envelope ────────────────────────────────────────────────────────

/**
 * WHAT: Per-pattern / per-user ceiling for intensity and duration.
 * WHY: ND Mode and session policy lower ceilings without killing Soft Signal.
 * CONSENT: Soft Signal envelope is fixed sacred — cannot be lowered below audibility
 *          of stop, but user may still disable all haptics globally.
 */
export type SafetyEnvelope = {
  maxIntensity: number; // 0–1
  maxDurationMs: number;
  allowSustained: boolean;
  requirePreviewBeforeLive: boolean;
};

export const DEFAULT_SAFETY_ENVELOPE: SafetyEnvelope = {
  maxIntensity: 0.92,
  maxDurationMs: 8000,
  allowSustained: true,
  requirePreviewBeforeLive: true,
};

/** ND / demo-strength lower ceilings (Soft Signal still allowed). */
export const ND_SAFETY_ENVELOPE: SafetyEnvelope = {
  maxIntensity: 0.45,
  maxDurationMs: 2500,
  allowSustained: false,
  requirePreviewBeforeLive: true,
};

/** Soft Signal sacred envelope — not subject to ND maxIntensity for stop clarity. */
export const SOFT_SIGNAL_SACRED_ENVELOPE: SafetyEnvelope = {
  maxIntensity: 0.85,
  maxDurationMs: 900,
  allowSustained: true,
  requirePreviewBeforeLive: false, // Soft Signal never waits for preview
};

export function clampToEnvelope(
  intensity: number,
  durationMs: number,
  envelope: SafetyEnvelope,
  isSoftSignal: boolean,
): { intensity: number; durationMs: number } {
  const env = isSoftSignal ? SOFT_SIGNAL_SACRED_ENVELOPE : envelope;
  let d = Math.min(durationMs, env.maxDurationMs);
  if (!env.allowSustained && !isSoftSignal && d > 800) d = 800;
  return {
    intensity: Math.min(intensity, env.maxIntensity),
    durationMs: d,
  };
}

// ── Pattern syntax ─────────────────────────────────────────────────────────

/**
 * WHAT: Parsed internal pattern from bracket syntax.
 * Example: [shoulder-left][firm][wave-rising 600ms][heartbeat 72bpm][affirming][consent-id:xyz]
 * CONSENT: consent-id binds to snapshot fingerprint/vocabulary id — not peer proof alone.
 */
export type NuclearPattern = {
  zone: BodyHapticZone;
  intensity: HapticIntensityStep;
  curve: PressureCurve;
  durationMs: number;
  rhythm: RhythmPattern;
  heartbeatBpm: number | null;
  context: ContextTag;
  consentId: string | null;
  texture: TextureModifier | null;
};

const WAVE_CURVE: Record<string, PressureCurve> = {
  "wave-rising": "rise",
  "wave-falling": "fall",
  "wave-soft": "soft_edge",
  "descend-warm": "descend_warm",
  double: "double_tap",
  single: "constant",
};

/**
 * WHAT: Parse nuclear bracket syntax into a pattern (fail closed → null).
 * WHY: Spec-stable interchange; invalid tokens never invent firm sustained.
 */
export function parseNuclearSyntax(raw: string): NuclearPattern | null {
  const tokens = [...raw.matchAll(/\[([^\]]+)\]/g)].map((m) =>
    m[1]!.trim().toLowerCase(),
  );
  if (tokens.length < 1) return null;

  let zone: BodyHapticZone = "device";
  let intensity: HapticIntensityStep = "light";
  let curve: PressureCurve = "soft_edge";
  let durationMs = 400;
  let rhythm: RhythmPattern = "single";
  let heartbeatBpm: number | null = null;
  let context: ContextTag = "presence";
  let consentId: string | null = null;
  let texture: TextureModifier | null = null;

  for (const t of tokens) {
    if ((BODY_HAPTIC_ZONES as readonly string[]).includes(t)) {
      zone = t as BodyHapticZone;
      continue;
    }
    if ((HAPTIC_INTENSITY_STEPS as readonly string[]).includes(t)) {
      intensity = t as HapticIntensityStep;
      continue;
    }
    if ((CONTEXT_TAGS as readonly string[]).includes(t.replace("-", "_"))) {
      context = t.replace("-", "_") as ContextTag;
      continue;
    }
    if ((TEXTURE_MODIFIERS as readonly string[]).includes(t.replace("-", "_"))) {
      texture = t.replace("-", "_") as TextureModifier;
      continue;
    }
    if (t.startsWith("consent-id:")) {
      consentId = t.slice("consent-id:".length) || null;
      continue;
    }
    const ms = t.match(/(\d+)\s*ms/);
    if (ms) {
      durationMs = Math.min(8000, Math.max(50, Number(ms[1])));
    }
    const bpm = t.match(/heartbeat\s+(\d+)\s*bpm/);
    if (bpm) {
      heartbeatBpm = Math.min(120, Math.max(40, Number(bpm[1])));
      rhythm = "heartbeat_calm";
    }
    for (const [k, c] of Object.entries(WAVE_CURVE)) {
      if (t.startsWith(k)) {
        curve = c;
        break;
      }
    }
    if (t.includes("trill")) rhythm = "triple_soft";
    if (t.includes("double")) rhythm = "double";
    if (t.includes("breath")) rhythm = "breath_slow";
  }

  if (texture) curve = textureToCurve(texture);

  return {
    zone,
    intensity,
    curve,
    durationMs,
    rhythm,
    heartbeatBpm,
    context,
    consentId,
    texture,
  };
}

export function formatNuclearSyntax(p: NuclearPattern): string {
  const parts = [
    `[${p.zone}]`,
    `[${p.intensity}]`,
    `[${p.curve} ${p.durationMs}ms]`,
  ];
  if (p.heartbeatBpm) parts.push(`[heartbeat ${p.heartbeatBpm}bpm]`);
  else parts.push(`[${p.rhythm}]`);
  parts.push(`[${p.context}]`);
  if (p.consentId) parts.push(`[consent-id:${p.consentId}]`);
  return parts.join("");
}

/**
 * WHAT: Compile nuclear pattern → HapticPhrase for phone/device adapters.
 */
export function nuclearPatternToPhrase(
  p: NuclearPattern,
  envelope: SafetyEnvelope = DEFAULT_SAFETY_ENVELOPE,
): HapticPhrase {
  const isSoft =
    p.context === "boundary_warning" && p.rhythm === "staccato_alert"
      ? false
      : false;
  void isSoft;
  const clamped = clampToEnvelope(
    intensityStepToUnit(p.intensity),
    p.durationMs,
    envelope,
    false,
  );
  return phrase({
    lexeme:
      p.context === "check_in"
        ? "check_in_gentle"
        : p.context === "boundary_warning"
          ? "attention"
          : p.context === "presence"
            ? "presence"
            : "confirmation",
    curve: p.curve,
    rhythm: p.rhythm,
    location: bodyZoneToDeviceLocation(p.zone),
    emotion: contextToEmotion(p.context),
    intensity: clamped.intensity,
    durationMs: clamped.durationMs,
    interrupt: "none",
  });
}

// ── Consent-bound vocabulary ───────────────────────────────────────────────

/**
 * WHAT: Session-allowed haptic vocabulary sealed with Consent Snapshot.
 * WHY: Live patterns require dual affirm of allowed zones/intensities/contexts.
 * CONSENT: Soft Signal is always allowed and never needs vocabulary seal.
 */
export type HapticConsentVocabulary = {
  version: 1;
  /** Snapshot fingerprint or local package id this vocabulary is bound to. */
  consentId: string;
  allowedZones: BodyHapticZone[];
  maxIntensity: HapticIntensityStep;
  allowSustained: boolean;
  allowedContexts: ContextTag[];
  /** Patterns previewed by both parties (ids). */
  previewedPatternIds: string[];
  /** Granular revocations mid-session (zone or "sustained"). */
  revoked: string[];
};

export function defaultHapticVocabulary(
  consentId: string,
): HapticConsentVocabulary {
  return {
    version: 1,
    consentId,
    allowedZones: ["device", "device-center", "shoulders", "hand-left", "hand-right"],
    maxIntensity: "medium",
    allowSustained: false,
    allowedContexts: [
      "presence",
      "check_in",
      "affirming",
      "calming",
      "grounding",
    ],
    previewedPatternIds: [],
    revoked: [],
  };
}

export function ndDefaultHapticVocabulary(
  consentId: string,
): HapticConsentVocabulary {
  return {
    ...defaultHapticVocabulary(consentId),
    maxIntensity: "light",
    allowSustained: false,
    allowedContexts: ["presence", "check_in", "calming", "grounding"],
  };
}

/**
 * WHAT: May this pattern play live under vocabulary + envelope + Soft Signal latch?
 * WHY: Preview-required, granular revocation, Soft Signal never blocked here
 *      (Soft Signal bypasses vocabulary — separate path).
 */
export function mayPlayLivePattern(input: {
  pattern: NuclearPattern;
  vocabulary: HapticConsentVocabulary | null;
  envelope: SafetyEnvelope;
  isSoftSignal: boolean;
  softSignalActive: boolean;
  hasPreviewed: boolean;
}): { ok: true } | { ok: false; code: string; message: string } {
  if (input.isSoftSignal) {
    // Sacred path — always ok at language layer (global haptics off is separate).
    return { ok: true };
  }
  if (input.softSignalActive) {
    return {
      ok: false,
      code: "soft_signal_active",
      message: "all non-stop haptics killed while Soft Signal is active",
    };
  }
  if (input.envelope.requirePreviewBeforeLive && !input.hasPreviewed) {
    return {
      ok: false,
      code: "preview_required",
      message: "haptic preview is mandatory before live session patterns",
    };
  }
  const vocab = input.vocabulary;
  if (!vocab) {
    return {
      ok: false,
      code: "no_vocabulary",
      message: "live haptics require a sealed haptic vocabulary",
    };
  }
  if (
    input.pattern.consentId &&
    input.pattern.consentId !== vocab.consentId
  ) {
    return {
      ok: false,
      code: "consent_id_mismatch",
      message: "pattern consent-id does not match sealed vocabulary",
    };
  }
  if (vocab.revoked.includes(input.pattern.zone)) {
    return {
      ok: false,
      code: "zone_revoked",
      message: `zone ${input.pattern.zone} was revoked`,
    };
  }
  if (
    input.pattern.durationMs >= 1000 &&
    (vocab.revoked.includes("sustained") || !vocab.allowSustained)
  ) {
    return {
      ok: false,
      code: "sustained_revoked",
      message: "sustained haptics not allowed",
    };
  }
  if (!vocab.allowedZones.includes(input.pattern.zone)) {
    return {
      ok: false,
      code: "zone_not_allowed",
      message: `zone ${input.pattern.zone} not in sealed vocabulary`,
    };
  }
  const maxIdx = HAPTIC_INTENSITY_STEPS.indexOf(vocab.maxIntensity);
  const wantIdx = HAPTIC_INTENSITY_STEPS.indexOf(input.pattern.intensity);
  if (wantIdx > maxIdx) {
    return {
      ok: false,
      code: "intensity_exceeds",
      message: "intensity exceeds sealed maximum",
    };
  }
  if (!vocab.allowedContexts.includes(input.pattern.context)) {
    return {
      ok: false,
      code: "context_not_allowed",
      message: `context ${input.pattern.context} not sealed`,
    };
  }
  return { ok: true };
}

/**
 * WHAT: Apply granular revocation (zone or "sustained").
 * WHY: "yes to shoulder but no to sustained" live update without full reseal.
 */
export function revokeHapticFacet(
  vocab: HapticConsentVocabulary,
  facet: string,
): HapticConsentVocabulary {
  if (vocab.revoked.includes(facet)) return vocab;
  return { ...vocab, revoked: [...vocab.revoked, facet] };
}

export function markPatternPreviewed(
  vocab: HapticConsentVocabulary,
  patternId: string,
): HapticConsentVocabulary {
  if (vocab.previewedPatternIds.includes(patternId)) return vocab;
  return {
    ...vocab,
    previewedPatternIds: [...vocab.previewedPatternIds, patternId],
  };
}

// ── Core phrase library (spec §3) ──────────────────────────────────────────

export type LibraryPhraseId =
  | "greeting_double_tap"
  | "greeting_shoulder_wave"
  | "checkin_heartbeat"
  | "checkin_soft_pulse"
  | "affirmation_stroke"
  | "affirmation_trill"
  | "grounding_rumble"
  | "grounding_bilateral"
  | "soft_signal_sacred"
  | "boundary_question";

export const HAPTIC_PHRASE_LIBRARY: Record<
  LibraryPhraseId,
  { syntax: string; description: string; phoneLexemeHint: string }
> = {
  greeting_double_tap: {
    syntax: "[device][light][double 120ms][affirming]",
    description: "Soft double tap — affirming arrival",
    phoneLexemeHint: "presence",
  },
  greeting_shoulder_wave: {
    syntax: "[shoulders][light][wave-rising 600ms][affirming]",
    description: "Gentle rising wave — safe container",
    phoneLexemeHint: "presence",
  },
  checkin_heartbeat: {
    syntax: "[device-center][feather][heartbeat 72bpm][check_in]",
    description: "Heartbeat sync at resting rate — co-regulation",
    phoneLexemeHint: "check_in_gentle",
  },
  checkin_soft_pulse: {
    syntax: "[device][feather][single 80ms][check_in]",
    description: "Single soft pulse — I'm here, no pressure",
    phoneLexemeHint: "check_in_gentle",
  },
  affirmation_stroke: {
    syntax: "[forearm-left][light][wave-rising 500ms][directional_stroke][playful]",
    description: "Light directional stroke simulation (user-approved)",
    phoneLexemeHint: "confirmation",
  },
  affirmation_trill: {
    syntax: "[device][light][trill 400ms][playful]",
    description: "Playful trill sequence",
    phoneLexemeHint: "attention",
  },
  grounding_rumble: {
    syntax: "[device][medium][rumbling 1200ms][calming]",
    description: "Deep slow rumble with long fade",
    phoneLexemeHint: "presence",
  },
  grounding_bilateral: {
    syntax: "[device-left][light][pulsing 800ms][grounding]",
    description: "Bilateral soft pulsing (left-right via multi-device later)",
    phoneLexemeHint: "presence",
  },
  soft_signal_sacred: {
    syntax: "[device][firm][staccato 220ms][descend-warm 600ms][boundary_warning]",
    description:
      "Sacred Soft Signal: sharp triple + sustained decay — cannot be overridden",
    phoneLexemeHint: "soft_signal",
  },
  boundary_question: {
    syntax: "[device][light][wave-rising 200ms][wave-rising 200ms][boundary_warning]",
    description: "Preemptive soft question-mark before new zone",
    phoneLexemeHint: "attention",
  },
};

/**
 * WHAT: Resolve library id → HapticPhrase (Soft Signal uses sacred default).
 */
export function libraryPhraseToHaptic(
  id: LibraryPhraseId,
  envelope: SafetyEnvelope = DEFAULT_SAFETY_ENVELOPE,
): HapticPhrase {
  if (id === "soft_signal_sacred") {
    return defaultPhraseForLexeme("soft_signal");
  }
  const entry = HAPTIC_PHRASE_LIBRARY[id];
  const parsed = parseNuclearSyntax(entry.syntax);
  if (!parsed) {
    return defaultPhraseForLexeme("presence");
  }
  return nuclearPatternToPhrase(parsed, envelope);
}

/**
 * WHAT: Soft Signal sacred phone calls — triple pulse + decay; highest interrupt.
 * WHY: Spec: unmistakable, cannot be overridden by other haptics.
 */
export function softSignalSacredPhoneCalls(): PhoneHapticCall[] {
  return phraseToPhoneCalls(defaultPhraseForLexeme("soft_signal"));
}

// ── Accessibility descriptions ─────────────────────────────────────────────

export function describePattern(p: NuclearPattern): string {
  const parts = [
    `Location ${p.zone}`,
    `intensity ${p.intensity}`,
    `duration ${p.durationMs} milliseconds`,
    `rhythm ${p.rhythm}`,
    `feeling ${p.context}`,
  ];
  if (p.texture) parts.push(`texture ${p.texture}`);
  return parts.join(", ") + ". Optional haptic. Never means someone else agreed.";
}

export function describeLibraryPhrase(id: LibraryPhraseId): string {
  return HAPTIC_PHRASE_LIBRARY[id].description;
}

// ── Constitution gate for nuclear edition ──────────────────────────────────

export function evaluateNuclearHapticSpec(input: {
  softSignalCanBeOverridden: boolean;
  liveWithoutPreviewWhenRequired: boolean;
  peerConsentEncodedInPattern: boolean;
  communityPatternWithoutReview: boolean;
  documentsSpec: boolean;
}): { ok: true } | { ok: false; violations: string[] } {
  const v: string[] = [];
  if (input.softSignalCanBeOverridden) {
    v.push("Soft Signal haptic must not be overrideable by other patterns");
  }
  if (input.liveWithoutPreviewWhenRequired) {
    v.push("Live session patterns require preview when policy says so");
  }
  if (input.peerConsentEncodedInPattern) {
    v.push("Patterns must not encode peer consent as a motor signal");
  }
  if (input.communityPatternWithoutReview) {
    v.push("Community patterns require constitution review before core library");
  }
  if (!input.documentsSpec) {
    v.push("Nuclear haptic language requires documentation");
  }
  return v.length === 0 ? { ok: true } : { ok: false, violations: v };
}

// Re-export compile helpers for adapters
export { compilePhrase, phraseToPhoneCalls };
