/**
 * Semantic Haptic Language — programmable, composable, device-agnostic grammar.
 *
 * WHAT: Pure types + compilers for pressure curves, rhythm, location sequences,
 *       emotional modifiers, and safety interrupts. Compiles to platform IR.
 * WHY: Touch feedback must be a language with fixed meanings, not decorative buzz.
 * CONSENT: Haptics never encode peer consent, remote presence, trust, or safety scores.
 *          Soft Signal interrupt aborts any phrase; stop state commits before playback.
 * EDGE: Intensity 0 = silent meaning still valid visually; ND minimal = stop-class only.
 * NEVER: Secret peer codes; engagement FOMO loops; delay Soft Signal for motor finish.
 * SEE: docs/HAPTIC_LANGUAGE.md · ADR 0039 · ADR 0063 · HARDWARE/HAPTICS.md ·
 *      neuroAccommodationCore.mayPlayHaptic
 */

export const HAPTIC_LANGUAGE_VERSION = 1 as const;

// ── Pressure curves ────────────────────────────────────────────────────────

/**
 * WHAT: Normalized pressure envelope over a pulse [0,1] → intensity [0,1].
 * WHY: Soft Signal needs descending warm release; presence needs gentle rise.
 * CONSENT: Curve shape is local UX only — never peer agreement.
 */
export const PRESSURE_CURVES = [
  "constant",
  "rise",
  "fall",
  "soft_edge", // rise then soft fall (warm)
  "descend_warm", // Soft Signal freedom: long descending
  "pulse_once",
  "double_tap",
] as const;
export type PressureCurve = (typeof PRESSURE_CURVES)[number];

/**
 * WHAT: Sample a pressure curve at t in [0,1].
 * WHY: Device firmware / Core Haptics can approximate; phone maps to impact tiers.
 */
export function samplePressureCurve(curve: PressureCurve, t: number): number {
  const x = Math.min(1, Math.max(0, t));
  switch (curve) {
    case "constant":
      return 1;
    case "rise":
      return x;
    case "fall":
      return 1 - x;
    case "soft_edge":
      // smoothstep up then down
      if (x < 0.4) {
        const u = x / 0.4;
        return u * u * (3 - 2 * u);
      }
      {
        const u = (x - 0.4) / 0.6;
        return 1 - u * u * (3 - 2 * u);
      }
    case "descend_warm":
      // Cosine-ish fall for Soft Signal release
      return 0.5 * (1 + Math.cos(Math.PI * x));
    case "pulse_once":
      return x < 0.15 || x > 0.35 ? 0 : 1;
    case "double_tap":
      if (x < 0.12) return 1;
      if (x < 0.28) return 0;
      if (x < 0.4) return 1;
      return 0;
    default:
      return 1;
  }
}

// ── Rhythm ─────────────────────────────────────────────────────────────────

/**
 * WHAT: Named rhythm patterns as sequences of on/off durations (ms).
 * WHY: Attention vs presence must be distinguishable without implying urgency FOMO.
 */
export const RHYTHM_PATTERNS = [
  "single",
  "double",
  "triple_soft",
  "heartbeat_calm",
  "breath_slow",
  "staccato_alert", // reserved for emergencyStop only
] as const;
export type RhythmPattern = (typeof RHYTHM_PATTERNS)[number];

/** onMs, offMs pairs; final off optional */
export function rhythmTimeline(pattern: RhythmPattern): Array<{
  onMs: number;
  offMs: number;
  peak: number;
}> {
  switch (pattern) {
    case "single":
      return [{ onMs: 40, offMs: 0, peak: 0.55 }];
    case "double":
      return [
        { onMs: 30, offMs: 80, peak: 0.45 },
        { onMs: 30, offMs: 0, peak: 0.45 },
      ];
    case "triple_soft":
      return [
        { onMs: 25, offMs: 60, peak: 0.35 },
        { onMs: 25, offMs: 60, peak: 0.35 },
        { onMs: 25, offMs: 0, peak: 0.35 },
      ];
    case "heartbeat_calm":
      return [
        { onMs: 35, offMs: 120, peak: 0.5 },
        { onMs: 50, offMs: 400, peak: 0.4 },
      ];
    case "breath_slow":
      return [
        { onMs: 120, offMs: 80, peak: 0.3 },
        { onMs: 160, offMs: 0, peak: 0.2 },
      ];
    case "staccato_alert":
      return [
        { onMs: 40, offMs: 40, peak: 0.85 },
        { onMs: 40, offMs: 40, peak: 0.85 },
        { onMs: 60, offMs: 0, peak: 0.9 },
      ];
    default:
      return [{ onMs: 40, offMs: 0, peak: 0.5 }];
  }
}

// ── Location sequences ─────────────────────────────────────────────────────

/**
 * WHAT: Logical actuator / body-relative locations (device-agnostic).
 * WHY: Phone collapses to "device"; hardware Device OS maps to multi-actuator.
 * CONSENT: Locations are playback targets only — not consent body zones.
 * NEVER: Confuse haptic location with Touch Language zone permission.
 */
export const HAPTIC_LOCATIONS = [
  "device", // whole phone / whole palm field
  "palm_center",
  "palm_edge",
  "fingertip",
  "wrist",
  "distributed", // multi-actuator phase
] as const;
export type HapticLocation = (typeof HAPTIC_LOCATIONS)[number];

// ── Emotional modifiers ────────────────────────────────────────────────────

/**
 * WHAT: Affect coloring of a phrase (never sexualized or shaming).
 * WHY: Soft Signal must feel free; presence calm; emergency clear not panicked.
 * NEVER: "arousal", "urgency_marketing", FOMO modifiers.
 */
export const EMOTIONAL_MODIFIERS = [
  "neutral",
  "calm",
  "warm",
  "crisp",
  "solemn", // Soft Signal dignity
  "clear", // emergencyStop clarity without siren culture
] as const;
export type EmotionalModifier = (typeof EMOTIONAL_MODIFIERS)[number];

export function modifierIntensityScale(mod: EmotionalModifier): number {
  switch (mod) {
    case "calm":
      return 0.55;
    case "warm":
      return 0.7;
    case "crisp":
      return 0.85;
    case "solemn":
      return 0.75;
    case "clear":
      return 0.95;
    case "neutral":
    default:
      return 0.65;
  }
}

// ── Safety interrupts ──────────────────────────────────────────────────────

/**
 * WHAT: Interrupt classes that abort in-flight phrases.
 * WHY: Soft Signal / emergency must cut any decorative playback immediately.
 * CONSENT: Interrupt is local UX path only; stop authority is separate.
 */
export const SAFETY_INTERRUPTS = [
  "none",
  "soft_signal",
  "emergency_stop",
  "user_cancel",
] as const;
export type SafetyInterrupt = (typeof SAFETY_INTERRUPTS)[number];

export function interruptPriority(i: SafetyInterrupt): number {
  switch (i) {
    case "emergency_stop":
      return 100;
    case "soft_signal":
      return 90;
    case "user_cancel":
      return 50;
    case "none":
    default:
      return 0;
  }
}

/** Higher priority interrupt wins; equal keeps current. */
export function resolveInterrupt(
  current: SafetyInterrupt,
  incoming: SafetyInterrupt,
): SafetyInterrupt {
  return interruptPriority(incoming) >= interruptPriority(current)
    ? incoming
    : current;
}

// ── Lexemes (atomic meanings) ──────────────────────────────────────────────

/**
 * WHAT: Closed lexicon of product meanings (extends HAPTIC-001).
 * WHY: Screens speak meaning, never raw vibration APIs.
 */
export const HAPTIC_LEXEMES = [
  "presence",
  "attention",
  "confirmation",
  "soft_signal",
  "emergency_stop",
  "boundary_saved",
  "check_in_gentle",
  "zone_preview", // TL pressure preview — local only
  "seal_step", // dual seal progress (local)
  "wrap_complete",
] as const;
export type HapticLexeme = (typeof HAPTIC_LEXEMES)[number];

/** Legacy HapticEvent names used by hapticServiceCore */
export type LegacyHapticEvent =
  | "presence"
  | "attention"
  | "confirmation"
  | "softSignal"
  | "emergencyStop";

export function lexemeFromLegacy(event: LegacyHapticEvent): HapticLexeme {
  switch (event) {
    case "softSignal":
      return "soft_signal";
    case "emergencyStop":
      return "emergency_stop";
    default:
      return event;
  }
}

export function legacyFromLexeme(
  lexeme: HapticLexeme,
): LegacyHapticEvent | null {
  switch (lexeme) {
    case "presence":
    case "attention":
    case "confirmation":
      return lexeme;
    case "soft_signal":
      return "softSignal";
    case "emergency_stop":
      return "emergencyStop";
    default:
      return null;
  }
}

// ── Phrase grammar (composable) ────────────────────────────────────────────

/**
 * WHAT: One composable haptic phrase — the sentence unit.
 * WHY: Programmable language: curve + rhythm + location + emotion + interrupt.
 */
export type HapticPhrase = {
  version: typeof HAPTIC_LANGUAGE_VERSION;
  lexeme: HapticLexeme;
  curve: PressureCurve;
  rhythm: RhythmPattern;
  location: HapticLocation;
  emotion: EmotionalModifier;
  /** Global intensity 0–1 after ND / user sliders. */
  intensity: number;
  /** If set, this phrase is a safety interrupt carrier. */
  interrupt: SafetyInterrupt;
  /** Total soft duration budget ms (capped). */
  durationMs?: number;
};

export function phrase(partial: {
  lexeme: HapticLexeme;
  curve?: PressureCurve;
  rhythm?: RhythmPattern;
  location?: HapticLocation;
  emotion?: EmotionalModifier;
  intensity?: number;
  interrupt?: SafetyInterrupt;
  durationMs?: number;
}): HapticPhrase {
  const defaults = defaultPhraseForLexeme(partial.lexeme);
  return {
    version: 1,
    lexeme: partial.lexeme,
    curve: partial.curve ?? defaults.curve,
    rhythm: partial.rhythm ?? defaults.rhythm,
    location: partial.location ?? defaults.location,
    emotion: partial.emotion ?? defaults.emotion,
    intensity: clamp01(partial.intensity ?? defaults.intensity),
    interrupt: partial.interrupt ?? defaults.interrupt,
    durationMs: partial.durationMs ?? defaults.durationMs,
  };
}

export function defaultPhraseForLexeme(lexeme: HapticLexeme): HapticPhrase {
  const base = {
    version: 1 as const,
    location: "device" as HapticLocation,
    intensity: 0.7,
    interrupt: "none" as SafetyInterrupt,
  };
  switch (lexeme) {
    case "presence":
      return {
        ...base,
        lexeme,
        curve: "soft_edge",
        rhythm: "single",
        emotion: "calm",
        intensity: 0.45,
        durationMs: 80,
      };
    case "attention":
      return {
        ...base,
        lexeme,
        curve: "pulse_once",
        rhythm: "double",
        emotion: "crisp",
        intensity: 0.5,
        durationMs: 200,
      };
    case "confirmation":
      return {
        ...base,
        lexeme,
        curve: "rise",
        rhythm: "single",
        emotion: "warm",
        intensity: 0.55,
        durationMs: 60,
      };
    case "soft_signal":
      return {
        ...base,
        lexeme,
        curve: "descend_warm",
        rhythm: "breath_slow",
        emotion: "solemn",
        intensity: 0.7,
        interrupt: "soft_signal",
        durationMs: 420,
      };
    case "emergency_stop":
      return {
        ...base,
        lexeme,
        curve: "constant",
        rhythm: "staccato_alert",
        emotion: "clear",
        intensity: 0.9,
        interrupt: "emergency_stop",
        durationMs: 220,
      };
    case "boundary_saved":
      return {
        ...base,
        lexeme,
        curve: "soft_edge",
        rhythm: "single",
        emotion: "warm",
        intensity: 0.4,
        durationMs: 70,
      };
    case "check_in_gentle":
      return {
        ...base,
        lexeme,
        curve: "rise",
        rhythm: "heartbeat_calm",
        emotion: "calm",
        intensity: 0.35,
        durationMs: 500,
      };
    case "zone_preview":
      return {
        ...base,
        lexeme,
        curve: "constant",
        rhythm: "single",
        emotion: "neutral",
        intensity: 0.4,
        durationMs: 50,
      };
    case "seal_step":
      return {
        ...base,
        lexeme,
        curve: "rise",
        rhythm: "double",
        emotion: "warm",
        intensity: 0.45,
        durationMs: 160,
      };
    case "wrap_complete":
      return {
        ...base,
        lexeme,
        curve: "soft_edge",
        rhythm: "single",
        emotion: "calm",
        intensity: 0.4,
        durationMs: 90,
      };
  }
}

/**
 * WHAT: Compose sequential phrases (e.g. seal_step then confirmation).
 * WHY: Transmissible recipe for future multi-device without peer meaning.
 * NEVER: Compose secret interpersonal messages.
 */
export type HapticComposition = {
  id: string;
  phrases: HapticPhrase[];
  /** Abort composition if interrupt ≥ this priority mid-play. */
  yieldToInterruptAbove: number;
};

export function compose(
  id: string,
  phrases: HapticPhrase[],
): HapticComposition {
  return {
    id,
    phrases,
    yieldToInterruptAbove: interruptPriority("soft_signal"),
  };
}

// ── Intermediate representation (device-agnostic) ───────────────────────────

/**
 * WHAT: Discrete IR atom for firmware / phone adapters.
 * WHY: One compile target; phone maps intensity→impact; CHH uses continuous.
 */
export type HapticAtom = {
  tMs: number;
  durationMs: number;
  intensity: number;
  location: HapticLocation;
  curve: PressureCurve;
  lexeme: HapticLexeme;
  interrupt: SafetyInterrupt;
};

/**
 * WHAT: Compile a phrase into timed IR atoms.
 * WHY: Pure, testable; no expo import.
 */
export function compilePhrase(p: HapticPhrase): HapticAtom[] {
  const timeline = rhythmTimeline(p.rhythm);
  const emotionScale = modifierIntensityScale(p.emotion);
  const atoms: HapticAtom[] = [];
  let t = 0;
  const totalBudget = p.durationMs ?? 400;
  let spent = 0;

  for (const beat of timeline) {
    if (spent >= totalBudget) break;
    const onMs = Math.min(beat.onMs, totalBudget - spent);
    const midT = 0.5;
    const curveSample = samplePressureCurve(p.curve, midT);
    const intensity = clamp01(p.intensity * emotionScale * beat.peak * curveSample);
    if (intensity > 0.02) {
      atoms.push({
        tMs: t,
        durationMs: onMs,
        intensity,
        location: p.location,
        curve: p.curve,
        lexeme: p.lexeme,
        interrupt: p.interrupt,
      });
    }
    t += onMs + beat.offMs;
    spent += onMs + beat.offMs;
  }
  return atoms;
}

export function compileComposition(c: HapticComposition): HapticAtom[] {
  const out: HapticAtom[] = [];
  let offset = 0;
  for (const p of c.phrases) {
    const atoms = compilePhrase(p);
    for (const a of atoms) {
      out.push({ ...a, tMs: a.tMs + offset });
    }
    const last = atoms[atoms.length - 1];
    offset += last ? last.tMs + last.durationMs + 40 : 40;
  }
  return out;
}

// ── Phone platform mapping (iOS-native excellent) ──────────────────────────

/**
 * WHAT: Phone-level call plan (extends ADR 0039 primitives).
 * WHY: Expo Go uses impact/notification; Core Haptics path reserved in meta.
 */
export type PhoneHapticCall =
  | { kind: "impact"; style: "light" | "medium" | "heavy" }
  | { kind: "notification"; type: "success" | "warning" | "error" }
  | { kind: "delay"; ms: number }
  | {
      kind: "core_haptics_hint";
      /** Future CHH continuous event descriptor (not executed in Expo Go). */
      sharpness: number;
      intensity: number;
      durationMs: number;
    };

/**
 * WHAT: Map IR intensity to iOS impact style.
 * WHY: Excellent native feel without custom engines on Expo Go.
 */
export function intensityToImpactStyle(
  intensity: number,
): "light" | "medium" | "heavy" {
  if (intensity < 0.4) return "light";
  if (intensity < 0.75) return "medium";
  return "heavy";
}

/**
 * WHAT: Compile phrase → phone call sequence (Expo-executable subset).
 * WHY: Soft Signal uses notification warning + optional descending impacts.
 * CONSENT: soft_signal still local acknowledgment only.
 */
export function phraseToPhoneCalls(p: HapticPhrase): PhoneHapticCall[] {
  // Safety-class: distinct notification + optional warm descent impacts
  if (p.lexeme === "soft_signal") {
    const calls: PhoneHapticCall[] = [
      { kind: "notification", type: "warning" },
      { kind: "delay", ms: 40 },
    ];
    const atoms = compilePhrase(p);
    for (const a of atoms) {
      calls.push({
        kind: "impact",
        style: intensityToImpactStyle(a.intensity),
      });
      calls.push({
        kind: "core_haptics_hint",
        sharpness: 0.25,
        intensity: a.intensity,
        durationMs: a.durationMs,
      });
      if (a.durationMs > 0) calls.push({ kind: "delay", ms: Math.min(80, a.durationMs) });
    }
    return calls;
  }
  if (p.lexeme === "emergency_stop") {
    return [
      { kind: "notification", type: "error" },
      { kind: "delay", ms: 30 },
      { kind: "impact", style: "heavy" },
      { kind: "delay", ms: 40 },
      { kind: "impact", style: "heavy" },
    ];
  }
  if (p.lexeme === "confirmation" || p.lexeme === "boundary_saved") {
    return [{ kind: "notification", type: "success" }];
  }

  const atoms = compilePhrase(p);
  const calls: PhoneHapticCall[] = [];
  let lastT = 0;
  for (const a of atoms) {
    const gap = a.tMs - lastT;
    if (gap > 0) calls.push({ kind: "delay", ms: gap });
    calls.push({
      kind: "impact",
      style: intensityToImpactStyle(a.intensity),
    });
    calls.push({
      kind: "core_haptics_hint",
      sharpness: p.emotion === "crisp" ? 0.7 : 0.35,
      intensity: a.intensity,
      durationMs: a.durationMs,
    });
    lastT = a.tMs + a.durationMs;
  }
  return calls;
}

/**
 * WHAT: Legacy event → phone calls via full grammar (backward compatible).
 * WHY: Existing play("softSignal") path gains descend_warm composition.
 */
export function legacyEventToPhoneCalls(event: LegacyHapticEvent): PhoneHapticCall[] {
  return phraseToPhoneCalls(defaultPhraseForLexeme(lexemeFromLegacy(event)));
}

// ── Touch Language bridge ──────────────────────────────────────────────────

/**
 * WHAT: Map TL pressure preference to preview intensity (local only).
 * WHY: Zone editor can “feel” light/medium/firm without granting consent.
 * CONSENT: Preview is never a seal or peer signal.
 */
export function zonePreviewPhrase(
  pressure: "light" | "medium" | "firm" | null | undefined,
): HapticPhrase {
  const intensity =
    pressure === "firm" ? 0.75 : pressure === "medium" ? 0.5 : 0.3;
  return phrase({
    lexeme: "zone_preview",
    intensity,
    curve: "constant",
    rhythm: "single",
    emotion: "neutral",
  });
}

// ── ND / intensity gates ───────────────────────────────────────────────────

/**
 * WHAT: Whether a lexeme may play under ND haptic intensity policy.
 * WHY: Align with mayPlayHaptic: minimal = stop-class only.
 */
export function lexemeAllowedAtIntensity(
  lexeme: HapticLexeme,
  intensity: "off" | "minimal" | "standard",
): boolean {
  if (intensity === "off") return false;
  if (intensity === "standard") return true;
  return lexeme === "soft_signal" || lexeme === "emergency_stop";
}

export function scalePhraseIntensity(
  p: HapticPhrase,
  globalScale: number,
): HapticPhrase {
  return { ...p, intensity: clamp01(p.intensity * clamp01(globalScale)) };
}

// ── Serialization (transmissible recipes — local / future device) ──────────

/**
 * WHAT: JSON-stable recipe for phrase (no secrets, no user ids).
 * WHY: Device OS / multi-client can share recipes without peer meaning.
 * NEVER: Embed peer identity or consent fingerprints.
 */
export function serializePhrase(p: HapticPhrase): string {
  return JSON.stringify({
    v: p.version,
    l: p.lexeme,
    c: p.curve,
    r: p.rhythm,
    loc: p.location,
    e: p.emotion,
    i: p.intensity,
    int: p.interrupt,
    d: p.durationMs ?? null,
  });
}

export function parsePhrase(raw: string): HapticPhrase | null {
  try {
    const o = JSON.parse(raw) as Record<string, unknown>;
    if (o.v !== 1 || typeof o.l !== "string") return null;
    if (!HAPTIC_LEXEMES.includes(o.l as HapticLexeme)) return null;
    return phrase({
      lexeme: o.l as HapticLexeme,
      curve: o.c as PressureCurve | undefined,
      rhythm: o.r as RhythmPattern | undefined,
      location: o.loc as HapticLocation | undefined,
      emotion: o.e as EmotionalModifier | undefined,
      intensity: typeof o.i === "number" ? o.i : undefined,
      interrupt: o.int as SafetyInterrupt | undefined,
      durationMs: typeof o.d === "number" ? o.d : undefined,
    });
  } catch {
    return null;
  }
}

// ── Constitution gate ──────────────────────────────────────────────────────

export function evaluateHapticLanguageFeature(input: {
  encodesPeerConsent: boolean;
  engagementLoop: boolean;
  delaysSoftSignalCommit: boolean;
  secretInterUserCode: boolean;
  documentsGrammar: boolean;
}): { ok: true } | { ok: false; violations: string[] } {
  const violations: string[] = [];
  if (input.encodesPeerConsent) {
    violations.push("I: haptics must not encode peer consent");
  }
  if (input.engagementLoop) {
    violations.push("IV: engagement FOMO haptic loops forbidden");
  }
  if (input.delaysSoftSignalCommit) {
    violations.push("I.4: Soft Signal commit must precede haptic playback");
  }
  if (input.secretInterUserCode) {
    violations.push("X: no secret inter-user haptic codes");
  }
  if (!input.documentsGrammar) {
    violations.push("VIII.6: haptic language requires documentation");
  }
  return violations.length === 0 ? { ok: true } : { ok: false, violations };
}

function clamp01(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.min(1, Math.max(0, n));
}
