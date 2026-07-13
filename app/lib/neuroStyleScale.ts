/**
 * Scale layout metrics when Neurodivergent Mode requests larger text.
 * Pure helper — used by useThemedStyles. Never affects consent/safety logic.
 *
 * Product philosophy:
 * - Larger text and tap targets improve access without changing consent gates
 * - Soft Signal / grant timing tokens must not be scaled here
 * - Layout containers (large height/width) stay unscaled to avoid broken screens
 *
 * SEE: app/lib/clearLanguage.ts · docs/LITMO_CONSTITUTION.md (V inclusion)
 */

/**
 * WHAT: Style keys that should grow with ND text scale.
 * WHY: Readable/tap metrics (font, padding, min sizes) need scale; not all RN style keys.
 * CONSENT: Not a consent surface — presentation only.
 * NEVER: Put Soft Signal dwell ms or grant-arm timing into this set.
 */
const SCALED_KEYS = new Set([
  "fontSize",
  "lineHeight",
  "letterSpacing",
  "minHeight",
  "minWidth",
  "padding",
  "paddingTop",
  "paddingBottom",
  "paddingVertical",
  "paddingHorizontal",
  "marginTop",
  "marginBottom",
  "marginVertical",
  "gap",
  "rowGap",
  "columnGap",
  "height",
  "width",
  "borderRadius",
]);

/**
 * WHAT: Style keys that must never scale (borders, flex weights, stacking).
 * WHY: Scaling borders/hairlines or flex causes layout thrash without accessibility gain.
 * CONSENT: Not a consent surface.
 * NEVER: Scale opacity/flex in a way that hides Soft Signal controls.
 */
const SKIP_EXACT = new Set([
  "borderWidth",
  "borderTopWidth",
  "borderBottomWidth",
  "borderLeftWidth",
  "borderRightWidth",
  "opacity",
  "flex",
  "flexGrow",
  "flexShrink",
  "zIndex",
  "elevation",
]);

/**
 * WHAT: Returns the numeric scale factor for ND text mode.
 * WHY: Single constant for useThemedStyles so scale stays consistent.
 * CONSENT: Not a consent surface — does not change Soft Signal or grant rules.
 * EDGE CASES: enabled false → 1 (identity); true → 1.18
 * NEVER: Use this scale on timing tokens (ms) or consent boolean gates.
 */
export function neuroTextScale(enabled: boolean): number {
  return enabled ? 1.18 : 1;
}

/**
 * WHAT: Scales one style value if its key is a scaled metric and value is a finite number.
 * WHY: Avoid scaling non-numbers, skipped keys, or large layout container dimensions.
 * CONSENT: Not a consent surface — pure presentation transform.
 * EDGE CASES:
 *   - scale === 1 → return value unchanged
 *   - non-number / non-finite → unchanged
 *   - SKIP_EXACT or not in SCALED_KEYS → unchanged
 *   - height/width ≥ 200 treated as layout containers → unchanged
 * NEVER: Scale grant-arm or Soft Signal timing; never hide stop controls via opacity scaling.
 * SEE: scaleStyleRecord · SCALED_KEYS
 */
export function scaleStyleValue(
  key: string,
  value: unknown,
  scale: number,
): unknown {
  if (scale === 1 || typeof value !== "number" || !Number.isFinite(value)) {
    return value;
  }
  if (SKIP_EXACT.has(key)) return value;
  if (!SCALED_KEYS.has(key)) return value;
  // Avoid blowing up full-screen flex heights that use large numeric dimensions.
  if (key === "height" || key === "width") {
    if (value >= 200) return value; // layout containers, not text/tap targets
  }
  return Math.round(value * scale * 10) / 10;
}

/**
 * WHAT: Scales every entry in a single style record.
 * WHY: StyleSheet-like objects need one-pass ND scaling.
 * CONSENT: Not a consent surface.
 * EDGE CASES: scale === 1 returns same object reference (no copy churn).
 * NEVER: Mutate the input when scale !== 1 (returns a new object).
 * SEE: scaleStyleValue
 */
export function scaleStyleRecord(
  style: Record<string, unknown>,
  scale: number,
): Record<string, unknown> {
  if (scale === 1) return style;
  const next: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(style)) {
    next[key] = scaleStyleValue(key, value, scale);
  }
  return next;
}

/**
 * WHAT: Scales a map of named styles (e.g. StyleSheet.create output-like object).
 * WHY: Theme helpers scale whole style maps without touching non-object values.
 * CONSENT: Not a consent surface.
 * EDGE CASES:
 *   - scale === 1 → same map reference
 *   - array or non-object values passed through unchanged
 * NEVER: Scale consent logic modules; this is styles only.
 * SEE: scaleStyleRecord · neuroTextScale
 */
export function scaleStylesMap(
  map: Record<string, unknown>,
  scale: number,
): Record<string, unknown> {
  if (scale === 1) return map;
  const out: Record<string, unknown> = {};
  for (const [name, style] of Object.entries(map)) {
    if (style && typeof style === "object" && !Array.isArray(style)) {
      out[name] = scaleStyleRecord(style as Record<string, unknown>, scale);
    } else {
      out[name] = style;
    }
  }
  return out;
}
