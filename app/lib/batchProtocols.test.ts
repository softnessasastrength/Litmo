import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  REPAIR_ARCHETYPES,
  canSealReconcile,
  sealReconcile,
} from "./reconcileCore.ts";
import {
  PARALLEL_MODES,
  canSealParallel,
  sealParallel,
} from "./parallelPlayCore.ts";
import {
  addArticle,
  amendArticle,
  createConstitution,
} from "./relationshipConstitutionCore.ts";
import {
  createManualDebrief,
  summarizeDebriefs,
} from "./privateDebriefCore.ts";
import {
  defaultMasochistPrefs,
  masochistBanner,
  ritualDensity,
} from "./masochistModeCore.ts";

describe("batch protocols 10–15", () => {
  it("reconcile has 5 archetypes", () => {
    assert.equal(
      REPAIR_ARCHETYPES.filter((a) => a.id !== "undecided").length,
      5,
    );
    const d = {
      archetypeId: "soft_return" as const,
      fightNote: "we snapped about dishes",
      softSignalAcknowledged: true,
    };
    assert.equal(canSealReconcile(d).ok, true);
    assert.ok(sealReconcile(d));
  });

  it("parallel play sacred modes", () => {
    assert.ok(PARALLEL_MODES.length >= 5);
    const d = {
      modeId: "same_room_silence" as const,
      intention: "co-exist",
      softSignalAcknowledged: true,
      noTouchAcknowledged: true,
    };
    assert.equal(canSealParallel(d).ok, true);
    assert.ok(sealParallel(d));
  });

  it("constitution versions on amend", () => {
    let doc = createConstitution("Test");
    assert.equal(doc.version, 1);
    doc = amendArticle(doc, "a0", "clarify", "Soft Signal is free. Always.");
    assert.equal(doc.version, 2);
    assert.equal(doc.amendments.length, 1);
    doc = addArticle(doc, "Snacks", "Shared snacks are optional love.");
    assert.equal(doc.version, 3);
  });

  it("debrief summary", () => {
    const e = createManualDebrief({
      title: "after fight",
      regulation: 4,
      worked: "pause",
      didnt: "essays",
      tags: ["repair", "soft_signal"],
      softSignalUsed: true,
    });
    const s = summarizeDebriefs([e]);
    assert.equal(s.total, 1);
    assert.equal(s.soft_signal_rate, 1);
  });

  it("masochist mode density", () => {
    const off = defaultMasochistPrefs();
    assert.equal(ritualDensity(off), 1);
    assert.equal(masochistBanner(off), null);
    const on = { ...off, enabled: true, denserScripts: true };
    assert.ok(ritualDensity(on) > 1);
    assert.ok(masochistBanner(on)?.includes("MASOCHIST"));
  });
});
