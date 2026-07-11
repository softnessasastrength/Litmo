import assert from "node:assert/strict";
import test from "node:test";
import { computeCompatibility } from "@litmo/domain";
import {
  mockConsentProfileVersion,
  mockSnapshotNow,
} from "../data/mockConsentProfiles.ts";
import { buildSnapshotRows } from "./consentSnapshotView.ts";

test("self and maya produce welcomed, ask-first, and a not-included row", () => {
  const result = computeCompatibility(
    mockConsentProfileVersion("self"),
    mockConsentProfileVersion("maya"),
    mockSnapshotNow,
  );
  const rows = buildSnapshotRows(result);
  const byLabel = (label: string) => rows.find((row) => row.label === label);
  assert.equal(byLabel("Kind of connection")?.value, "Side by side");
  assert.equal(byLabel("Pressure")?.value, "Medium pressure");
  assert.equal(byLabel("Time")?.value, "Up to 15 minutes");
  assert.equal(byLabel("Place")?.value, "Hosted community");
  assert.ok(byLabel("Welcomed")?.value.includes("Hands"));
  assert.ok(byLabel("Welcomed")?.value.includes("Upper back"));
  assert.equal(byLabel("Ask each time")?.value, "Shoulders");
  assert.equal(byLabel("Not included")?.value, "All other body areas");
});
test("a profile with no ask-first overlap omits that row entirely", () => {
  const result = computeCompatibility(
    mockConsentProfileVersion("jonah"),
    mockConsentProfileVersion("self"),
    mockSnapshotNow,
  );
  const rows = buildSnapshotRows(result);
  assert.equal(
    rows.some((row) => row.label === "Ask each time"),
    false,
  );
});
test("decide_together contributes no ceiling of its own, so the counterpart's limit shows", () => {
  const result = computeCompatibility(
    mockConsentProfileVersion("eli"),
    mockConsentProfileVersion("jonah"),
    mockSnapshotNow,
  );
  const rows = buildSnapshotRows(result);
  const time = rows.find((row) => row.label === "Time");
  assert.equal(time?.value, "Up to 30 minutes");
});
test("the not-included row is always present since consent is never granted by compatibility alone", () => {
  const result = computeCompatibility(
    mockConsentProfileVersion("self"),
    mockConsentProfileVersion("self"),
    mockSnapshotNow,
  );
  assert.equal(result.consentGranted, false);
  const rows = buildSnapshotRows(result);
  assert.ok(rows.some((row) => row.label === "Not included"));
});
