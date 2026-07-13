/**
 * Scale layout metrics when Neurodivergent Mode requests larger text.
 * Pure helper — used by useThemedStyles. Never affects consent/safety logic.
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

/** Prefer scale on readable/tap metrics; leave borders/hairlines alone. */
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

export function neuroTextScale(enabled: boolean): number {
  return enabled ? 1.18 : 1;
}

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
  // Avoid blowing up full-screen flex heights that use percentages via numbers incorrectly
  if (key === "height" || key === "width") {
    if (value >= 200) return value; // layout containers, not text
  }
  return Math.round(value * scale * 10) / 10;
}

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
