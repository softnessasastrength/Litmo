import assert from "node:assert/strict";
import test from "node:test";
import {
  findLearningModule,
  learningModules,
  learningModulesForTrack,
  modulesLinkedToQuiz,
} from "./learningModules.ts";

const LIVED_IDS = [
  "consent-as-language",
  "nervous-system-safety",
  "boundaries",
  "recovering-from-violation",
  "partner-communication",
  "self-compassion",
] as const;

test("all modules have a track and short step counts", () => {
  for (const module of learningModules) {
    assert.ok(
      module.track === "foundations" || module.track === "lived-lessons",
    );
    assert.ok(module.steps.length >= 2);
    assert.ok(module.steps.length <= 12);
    assert.ok(module.minutes >= 2 && module.minutes <= 15);
    for (const step of module.steps) {
      assert.ok(step.title.length > 0);
      assert.ok(step.body.length > 20);
      assert.ok(step.takeaway.length > 0);
      if (step.scenario) {
        assert.ok(step.scenario.options.length >= 2);
        for (const opt of step.scenario.options) {
          assert.ok(opt.feedback.length > 10);
        }
      }
    }
  }
});

test("lived-lessons curriculum includes the six hard-learned modules", () => {
  const lived = learningModulesForTrack("lived-lessons");
  assert.equal(lived.length, 6);
  for (const id of LIVED_IDS) {
    const mod = findLearningModule(id);
    assert.ok(mod, `missing ${id}`);
    assert.equal(mod.track, "lived-lessons");
    assert.ok(
      mod.steps.some((s) => s.scenario),
      `${id} should include a scenario`,
    );
  }
});

test("lived lessons integrate with Vibe / self quizzes without authority claims", () => {
  for (const id of LIVED_IDS) {
    const mod = findLearningModule(id)!;
    assert.ok(mod.relatedQuizId, `${id} should link a private quiz`);
    assert.ok(mod.relatedQuizPrompt);
    assert.match(
      `${mod.summary} ${mod.relatedQuizPrompt}`,
      /private|never|optional|weather|consent/i,
    );
  }
  assert.ok(modulesLinkedToQuiz("vibe-short").length >= 1);
});

test("no module claims safety certification or public scoring", () => {
  const blob = JSON.stringify(learningModules);
  // Affirmative claims only — teaching phrases like "never a safety score" are OK.
  assert.doesNotMatch(blob, /certified safe|public badge|safety ranking/i);
  assert.doesNotMatch(blob, /is a safety score|proves (that )?anyone is safe/i);
  assert.match(blob, /never proof|not certify|not clinical|not therapy/i);
});
