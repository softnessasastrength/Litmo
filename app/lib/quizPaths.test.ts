import assert from "node:assert/strict";
import test from "node:test";
import { vibeModeLabel, vibeQuestionsForMode } from "./quizPaths.ts";

test("short vibe path is a calm subset", () => {
  const short = vibeQuestionsForMode("short");
  assert.ok(short.length >= 6 && short.length <= 12);
  const ids = new Set(short.map((q) => q.id));
  assert.equal(ids.size, short.length);
});

test("deep vibe path is the full bank", () => {
  assert.equal(vibeQuestionsForMode("deep").length, 100);
  assert.match(vibeModeLabel("short"), /Short/);
  assert.match(vibeModeLabel("deep"), /Deep/);
});
