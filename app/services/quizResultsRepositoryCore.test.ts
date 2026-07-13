import assert from "node:assert/strict";
import test from "node:test";
import {
  mergeQuizResults,
  parseQuizResultsMap,
  parseStoredQuizResult,
  resultToServerPayload,
  resultsMapsEqual,
  rowToStoredResult,
  rowsToQuizResultsMap,
  type StoredQuizResult,
} from "./quizResultsRepositoryCore.ts";

const sample = (
  overrides: Partial<StoredQuizResult> = {},
): StoredQuizResult => ({
  quizId: "vibe-short",
  primary: "hearth",
  secondary: "lantern",
  mixPercent: { hearth: 50, lantern: 30, tidepool: 20 },
  notes: ["Soft presence"],
  completedAt: "2026-07-13T12:00:00.000Z",
  modeLabel: "Vibe Quiz — Short",
  ...overrides,
});

test("parseStoredQuizResult accepts a well-formed summary", () => {
  const parsed = parseStoredQuizResult(sample());
  assert.equal(parsed?.primary, "hearth");
  assert.equal(parsed?.secondary, "lantern");
  assert.deepEqual(parsed?.mixPercent, {
    hearth: 50,
    lantern: 30,
    tidepool: 20,
  });
});

test("parseStoredQuizResult fails closed on invalid archetype or mix", () => {
  assert.equal(
    parseStoredQuizResult(sample({ primary: "unsafe" as never })),
    null,
  );
  assert.equal(
    parseStoredQuizResult({
      ...sample(),
      mixPercent: { hearth: 50, lantern: 30, tidepool: 200 },
    }),
    null,
  );
  assert.equal(parseStoredQuizResult({ quizId: "vibe-short" }), null);
  assert.equal(parseStoredQuizResult(null), null);
});

test("parseQuizResultsMap drops corrupt entries and never invents keys", () => {
  const map = parseQuizResultsMap(
    JSON.stringify({
      "vibe-short": sample(),
      "vibe-deep": { primary: "nope" },
      "soft-capacity": null,
    }),
  );
  assert.equal(Object.keys(map).length, 1);
  assert.equal(map["vibe-short"]?.primary, "hearth");
  assert.equal(map["vibe-deep"], undefined);
});

test("mergeQuizResults prefers newer completedAt and never invents", () => {
  const older = sample({
    completedAt: "2026-07-01T00:00:00.000Z",
    primary: "hearth",
  });
  const newer = sample({
    completedAt: "2026-07-13T00:00:00.000Z",
    primary: "tidepool",
  });
  const onlyRemote = sample({
    quizId: "boundary-voice",
    completedAt: "2026-07-10T00:00:00.000Z",
    primary: "lantern",
  });

  const merged = mergeQuizResults(
    { "vibe-short": older },
    { "vibe-short": newer, "boundary-voice": onlyRemote },
  );

  assert.equal(merged["vibe-short"]?.primary, "tidepool");
  assert.equal(merged["boundary-voice"]?.primary, "lantern");
  assert.equal(merged["comfort-care"], undefined);
});

test("rowToStoredResult maps server rows fail-closed", () => {
  const ok = rowToStoredResult({
    quiz_id: "vibe-short",
    primary_archetype: "lantern",
    secondary_archetype: null,
    mix_hearth: 10,
    mix_lantern: 70,
    mix_tidepool: 20,
    insight_notes: ["Curious light"],
    mode_label: "Short",
    completed_at: "2026-07-13T00:00:00.000Z",
  });
  assert.equal(ok?.primary, "lantern");
  assert.equal(
    rowToStoredResult({
      quiz_id: "vibe-short",
      primary_archetype: "not-real",
      mix_hearth: 10,
      mix_lantern: 10,
      mix_tidepool: 10,
      insight_notes: [],
      completed_at: "2026-07-13T00:00:00.000Z",
    }),
    null,
  );
  assert.deepEqual(rowsToQuizResultsMap(null), {});
});

test("resultToServerPayload is owner summary only (no partner fields)", () => {
  const payload = resultToServerPayload(sample());
  assert.equal(payload.p_quiz_id, "vibe-short");
  assert.equal(payload.p_primary_archetype, "hearth");
  assert.equal(payload.p_secondary_archetype, "lantern");
  assert.deepEqual(payload.p_insight_notes, ["Soft presence"]);
  assert.equal(Object.prototype.hasOwnProperty.call(payload, "partner"), false);
  assert.equal(
    Object.prototype.hasOwnProperty.call(payload, "comparison"),
    false,
  );
  assert.equal(Object.prototype.hasOwnProperty.call(payload, "sealKey"), false);
});

test("resultsMapsEqual is structural", () => {
  assert.equal(
    resultsMapsEqual({ "vibe-short": sample() }, { "vibe-short": sample() }),
    true,
  );
  assert.equal(
    resultsMapsEqual(
      { "vibe-short": sample() },
      { "vibe-short": sample({ primary: "lantern" }) },
    ),
    false,
  );
});
