import assert from "node:assert/strict";
import test from "node:test";
import { vibeModeLabel, vibeQuestionsForMode } from "./quizPaths.ts";

test("short vibe path is a calm subset", () => {
  const short = vibeQuestionsForMode("short");
  assert.ok(short.length >= 9 && short.length <= 12);
  const ids = new Set(short.map((q) => q.id));
  assert.equal(ids.size, short.length);
  const dimensions = new Set(short.map((q) => q.dimension));
  assert.ok(dimensions.has("repair"), "short path includes mend/repair");
  assert.ok(dimensions.size >= 9, "short path spans major themes");
  for (const q of short) {
    assert.ok(q.answers.length >= 2);
    for (const a of q.answers) {
      assert.ok(a.insight.trim().length > 0, `${q.id}/${a.id} needs insight`);
      assert.ok(
        Object.keys(a.scores).length > 0,
        `${q.id}/${a.id} needs scores`,
      );
    }
  }
});

test("deep vibe path is the full bank", () => {
  assert.equal(vibeQuestionsForMode("deep").length, 100);
  assert.match(vibeModeLabel("short"), /Short/);
  assert.match(vibeModeLabel("deep"), /Deep/);
});
