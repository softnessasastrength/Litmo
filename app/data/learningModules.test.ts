import assert from "node:assert/strict";
import test from "node:test";
import {
  findLearningModule,
  findLearningPath,
  learningModules,
  learningModulesForTheme,
  learningModulesForTrack,
  learningPaths,
  modulesLinkedToQuiz,
  nextModuleInPath,
  pathCompletion,
  recommendedNextModule,
} from "./learningModules.ts";

const LIVED_IDS = [
  "consent-as-language",
  "nervous-system-safety",
  "boundaries",
  "recovering-from-violation",
  "partner-communication",
  "self-compassion",
] as const;

const THEME_COVERAGE = [
  "consent",
  "nervous-system",
  "boundaries",
  "recovery",
  "communication",
  "self-compassion",
] as const;

test("all modules have a track, themes, and short step counts", () => {
  for (const module of learningModules) {
    assert.ok(
      module.track === "foundations" || module.track === "lived-lessons",
    );
    assert.ok(module.themes.length >= 1, `${module.id} needs themes`);
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
    const scenarios = mod.steps.filter((s) => s.scenario);
    assert.ok(
      scenarios.length >= 2,
      `${id} should include at least two interactive scenarios (has ${scenarios.length})`,
    );
  }
});

test("core themes each appear on at least one lived lesson", () => {
  for (const theme of THEME_COVERAGE) {
    const mods = learningModulesForTheme(theme).filter(
      (m) => m.track === "lived-lessons",
    );
    assert.ok(mods.length >= 1, `theme ${theme} missing from lived lessons`);
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

test("key modules offer optional product practice links", () => {
  const withPractice = [
    "consent-as-language",
    "soft-signal",
    "nervous-system-safety",
    "boundaries",
    "recovering-from-violation",
    "consent-snapshots",
  ];
  for (const id of withPractice) {
    const mod = findLearningModule(id)!;
    assert.ok(
      mod.relatedPractice && mod.relatedPractice.length >= 1,
      `${id} should offer product practice`,
    );
    for (const link of mod.relatedPractice!) {
      assert.ok(link.href.startsWith("/"));
      assert.ok(link.label.length > 0);
    }
  }
});

test("learning paths reference existing modules only", () => {
  assert.ok(learningPaths.length >= 5);
  for (const path of learningPaths) {
    assert.ok(path.moduleIds.length >= 2);
    for (const id of path.moduleIds) {
      assert.ok(findLearningModule(id), `path ${path.id} missing module ${id}`);
    }
    const { done, total } = pathCompletion(path, {});
    assert.equal(done, 0);
    assert.equal(total, path.moduleIds.length);
  }
  assert.ok(findLearningPath("first-session-readiness"));
  assert.ok(findLearningPath("full-lived-track"));
});

test("recommended next prefers first-session readiness path", () => {
  const first = recommendedNextModule({});
  assert.ok(first);
  assert.equal(first!.id, "consent-as-language");

  const afterFirst = recommendedNextModule({
    "consent-as-language": { completed: true },
  });
  assert.equal(afterFirst?.id, "consent-snapshots");

  const allDone: Record<string, { completed: boolean }> = {};
  for (const m of learningModules) allDone[m.id] = { completed: true };
  assert.equal(recommendedNextModule(allDone), undefined);
});

test("next module in path skips completed modules", () => {
  const next = nextModuleInPath("full-lived-track", "consent-as-language", {
    "nervous-system-safety": { completed: true },
  });
  assert.equal(next?.id, "boundaries");
});

test("no module claims safety certification or public scoring", () => {
  const blob = JSON.stringify(learningModules) + JSON.stringify(learningPaths);
  // Affirmative claims only — teaching phrases like "never a safety score" are OK.
  assert.doesNotMatch(blob, /certified safe|public badge|safety ranking/i);
  assert.doesNotMatch(blob, /is a safety score|proves (that )?anyone is safe/i);
  assert.match(blob, /never proof|not certify|not clinical|not therapy/i);
});

test("foundations track has six product modules including practice session", () => {
  const foundations = learningModulesForTrack("foundations");
  assert.equal(foundations.length, 6);
  assert.ok(findLearningModule("full-session-practice"));
  assert.ok(findLearningModule("soft-signal")?.requiredBeforeFirstSession);
});
