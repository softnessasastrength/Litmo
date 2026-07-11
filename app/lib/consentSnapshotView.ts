import type { CompatibilityResult, OverlapItem } from "@litmo/domain";

export type SnapshotRow = { label: string; value: string };

const readable = (value: string) => value.replaceAll("_", " ");
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
function titleCase(value: string) {
  const text = readable(value);
  return text.charAt(0).toUpperCase() + text.slice(1);
}
function pressureRow(items: OverlapItem[]): SnapshotRow | null {
  const general = items.find(
    (item) => item.dimension === "pressure" && item.value === "general",
  );
  if (!general) return null;
  return {
    label: "Pressure",
    value: general.pressure
      ? `${titleCase(general.pressure)} pressure`
      : "No shared pressure limit",
  };
}
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
 * Turns a live CompatibilityResult into the plain-language rows the mock
 * Consent Snapshot screen renders. Pure and framework-independent so it can
 * be unit tested without React Native. Never reports consent as granted;
 * the caller must still require explicit confirmation.
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
  rows.push({ label: "Not included", value: "All other body areas" });
  return rows;
}
