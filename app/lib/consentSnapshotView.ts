/**
 * CompatibilityResult → plain-language Consent Snapshot display rows (mock / domain path).
 *
 * WHAT (module): Pure view-model mapping from @litmo/domain CompatibilityResult to SnapshotRow[].
 * WHY: UI must not re-interpret permitted/askFirst sets ad hoc; unit tests can lock copy rules.
 * CONSENT: Presentation only — never claims consent granted; caller still requires explicit confirmation.
 * NEVER: Do not treat row presence as sealed dual affirm or Soft Signal disablement.
 * SEE: sessionConsentSnapshotCore for the prepare/mutual seal path (separate product surface).
 * docs/CODE_COMMENT_STANDARD.md
 */

import type { CompatibilityResult, OverlapItem } from "@litmo/domain";

/**
 * WHAT: One display row for a mock Consent Snapshot screen.
 * WHY: Decouples React Native from domain result shape.
 * CONSENT: Not a consent grant record.
 * EDGE CASES: Empty value should be avoided by builders (return null instead of empty row).
 * NEVER: label/value are not machine consent tokens.
 */
export type SnapshotRow = { label: string; value: string };

/**
 * WHAT: Replace underscores with spaces for human-readable dimension values.
 * WHY: Domain ids use snake_case; UI needs plain language.
 * CONSENT: Not a consent surface — string display only.
 * EDGE CASES: none — pure transform of validated input.
 * NEVER: Do not use for parse identity.
 */
const readable = (value: string) => value.replaceAll("_", " ");

/**
 * WHAT: Unique value strings for one OverlapItem dimension.
 * WHY: A dimension may appear multiple times; UI wants a de-duplicated list.
 * CONSENT: Not a consent surface — filtering for display.
 * EDGE CASES: Empty filter → empty array (caller returns null row).
 * NEVER: Do not invent values not present in items.
 */
function uniqueValues(
  items: OverlapItem[],
  dimension: OverlapItem["dimension"],
) {
  return [
    ...new Set(
      items
        .filter((item) => item.dimension === dimension)
        .map((item) => item.value),
    ),
  ];
}

/**
 * WHAT: Capitalize first character after readable() for list presentation.
 * WHY: Consistent Title-case-ish labels without a full locale-aware title library.
 * CONSENT: Not a consent surface.
 * EDGE CASES: Empty string → empty string (charAt(0) + slice still safe).
 * NEVER: Do not claim titleCase is locale-complete for all languages.
 */
function titleCase(value: string) {
  const text = readable(value);
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/**
 * WHAT: Build optional Pressure row from a general pressure overlap item.
 * WHY: Domain encodes pressure on a sentinel value “general”; UI needs one readable line.
 * CONSENT: Shared pressure limit is compatibility info, not touch authorization.
 * EDGE CASES:
 *   - no general pressure item → null (omit row)
 *   - pressure field missing → “No shared pressure limit”
 * NEVER: Do not infer pressure from body_zone items.
 */
function pressureRow(items: OverlapItem[]): SnapshotRow | null {
  const general = items.find(
    (item) => item.dimension === "pressure" && item.value === "general",
  );
  // Fail-closed for display: missing general pressure → no row (not a fake default).
  if (!general) return null;
  return {
    label: "Pressure",
    value: general.pressure
      ? `${titleCase(general.pressure)} pressure`
      : "No shared pressure limit",
  };
}

/**
 * WHAT: Build optional Time row from general duration overlap.
 * WHY: maxDurationMinutes may be null (no fixed clock) or a shared max.
 * CONSENT: Time boundary is not a cage; Soft Signal (elsewhere) still ends anytime sooner.
 * EDGE CASES:
 *   - no general duration item → null
 *   - maxDurationMinutes null → decide together copy
 * NEVER: Do not invent a default minute cap here.
 */
function durationRow(items: OverlapItem[]): SnapshotRow | null {
  const general = items.find(
    (item) => item.dimension === "duration" && item.value === "general",
  );
  if (!general) return null;
  return {
    label: "Time",
    value:
      general.maxDurationMinutes !== null
        ? `Up to ${general.maxDurationMinutes} minutes`
        : "Decide together, no fixed limit",
  };
}

/**
 * WHAT: Build a list row for a dimension if any unique values exist.
 * WHY: Shared helper for contact_type, environment, body_zone lists.
 * CONSENT: Listing permitted/askFirst zones is not dual seal.
 * EDGE CASES: Empty values → null (omit row rather than “None” for this mock path).
 * NEVER: Do not auto-include dimensions not in items.
 */
function listRow(
  items: OverlapItem[],
  dimension: OverlapItem["dimension"],
  label: string,
): SnapshotRow | null {
  const values = uniqueValues(items, dimension);
  if (values.length === 0) return null;
  return { label, value: values.map(titleCase).join(", ") };
}

/**
 * WHAT: Turn a live CompatibilityResult into plain-language rows for the mock Consent Snapshot screen.
 * WHY: Pure and framework-independent so unit tests cover copy without React Native.
 * CONSENT: Never reports consent as granted; always ends with “Not included: All other body areas”
 * as a fail-closed remainder. Caller must still require explicit confirmation / dual seal path.
 * EDGE CASES:
 *   - missing optional dimensions simply omit those rows
 *   - askFirst body zones listed separately from permitted welcomed
 *   - soft_limit is not represented in this domain CompatibilityResult path (sessionConsentSnapshotCore handles soft_limit)
 * NEVER: Do not treat buildSnapshotRows success as mutual seal; do not hide “Not included”.
 * SEE: sessionConsentSnapshotCore.mutualSnapshotRows for the pre-session dual-seal package rows.
 */
export function buildSnapshotRows(result: CompatibilityResult): SnapshotRow[] {
  const rows: SnapshotRow[] = [];
  const connection = listRow(
    result.permitted,
    "contact_type",
    "Kind of connection",
  );
  if (connection) rows.push(connection);
  const pressure = pressureRow(result.permitted);
  if (pressure) rows.push(pressure);
  const duration = durationRow(result.permitted);
  if (duration) rows.push(duration);
  const place = listRow(result.permitted, "environment", "Place");
  if (place) rows.push(place);
  const welcomed = listRow(result.permitted, "body_zone", "Welcomed");
  if (welcomed) rows.push(welcomed);
  const askFirst = listRow(result.askFirst, "body_zone", "Ask each time");
  if (askFirst) rows.push(askFirst);
  // Fail-closed remainder: anything not listed as welcomed/ask is not included.
  rows.push({ label: "Not included", value: "All other body areas" });
  return rows;
}
