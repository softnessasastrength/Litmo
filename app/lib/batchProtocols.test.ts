import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  REPAIR_ARCHETYPES,
  canSealReconcile,
  resolveReconcileSteps,
  sealReconcile,
  findArchetype,
} from "./reconcileCore.ts";
import {
  PARALLEL_MODES,
  canSealParallel,
  ceremonialLine,
  sealParallel,
  findParallel,
} from "./parallelPlayCore.ts";
import {
  addArticle,
  amendArticle,
  createConstitution,
  exportConstitutionText,
  ratifyProposal,
  setPendingProposal,
} from "./relationshipConstitutionCore.ts";
import {
  DEBRIEF_FORBIDDEN,
  createManualDebrief,
  generateInsights,
  summarizeDebriefs,
} from "./privateDebriefCore.ts";
import {
  defaultMasochistPrefs,
  masochistBanner,
  ritualDensity,
  softSignalStillFree,
  wantsDenserRitual,
  intensityLabel,
  MASOCHIST_INVARIANTS,
} from "./masochistModeCore.ts";

describe("batch protocols 10–15 v0.2", () => {
  it("reconcile has 5 archetypes with denser steps", () => {
    const real = REPAIR_ARCHETYPES.filter((a) => a.id !== "undecided");
    assert.equal(real.length, 5);
    for (const a of real) {
      assert.ok(a.steps.length >= 4);
      assert.ok(a.denserSteps.length >= 3);
      assert.ok(a.whenToUse.length > 5);
      assert.ok(a.antiPattern.length > 5);
    }
    const d = {
      archetypeId: "soft_return" as const,
      fightNote: "we snapped about dishes",
      softSignalAcknowledged: true,
    };
    assert.equal(canSealReconcile(d).ok, true);
    const s = sealReconcile(d, true);
    assert.ok(s);
    assert.equal(s!.denser, true);
    const arch = findArchetype("soft_return");
    const dense = resolveReconcileSteps(arch, true);
    const base = resolveReconcileSteps(arch, false);
    assert.ok(dense.length > base.length);
  });

  it("parallel play sacred modes v0.2", () => {
    assert.ok(PARALLEL_MODES.filter((m) => m.id !== "undecided").length >= 7);
    const d = {
      modeId: "same_room_silence" as const,
      intention: "co-exist",
      softSignalAcknowledged: true,
      noTouchAcknowledged: true,
    };
    assert.equal(canSealParallel(d).ok, true);
    const s = sealParallel(d, true);
    assert.ok(s);
    assert.equal(s!.ceremonial, true);
    const mode = findParallel("ritual_tea");
    assert.ok(ceremonialLine(mode, true).includes("Entry:"));
  });

  it("constitution versions, proposal, export", () => {
    let doc = createConstitution("Test");
    assert.equal(doc.version, 1);
    assert.ok(doc.articles.length >= 7);
    doc = amendArticle(doc, "a0", "clarify", "Soft Signal is free. Always.");
    assert.equal(doc.version, 2);
    assert.equal(doc.amendments[0]!.versionAfter, 2);
    doc = addArticle(doc, "Snacks", "Shared snacks are optional love.");
    assert.equal(doc.version, 3);
    doc = setPendingProposal(doc, "We will try parallel tea weekly.");
    assert.ok(doc.pendingProposal);
    doc = ratifyProposal(doc);
    assert.equal(doc.version, 4);
    assert.equal(doc.pendingProposal, null);
    const text = exportConstitutionText(doc);
    assert.ok(text.includes("# Test"));
    assert.ok(text.includes("Soft Signal free"));
  });

  it("debrief summary + insights + anti-creep", () => {
    assert.ok(DEBRIEF_FORBIDDEN.length >= 5);
    const e = createManualDebrief({
      title: "after fight",
      regulation: 4,
      worked: "pause",
      didnt: "essays",
      tags: ["repair", "soft_signal"],
      softSignalUsed: true,
      again: true,
    });
    const s = summarizeDebriefs([e]);
    assert.equal(s.total, 1);
    assert.equal(s.soft_signal_rate, 1);
    assert.equal(s.again_rate, 1);
    const insights = generateInsights([e]);
    assert.ok(insights.some((i) => i.kind === "skill" || i.kind === "safety"));
  });

  it("masochist mode density + soft signal invariant", () => {
    const off = defaultMasochistPrefs();
    assert.equal(ritualDensity(off), 1);
    assert.equal(masochistBanner(off), null);
    assert.equal(wantsDenserRitual(off), false);
    assert.equal(intensityLabel(off), "baseline");
    const on = {
      ...off,
      enabled: true,
      denserScripts: true,
      ceremonialCopy: true,
    };
    assert.ok(ritualDensity(on) > 1);
    assert.ok(masochistBanner(on)?.includes("MASOCHIST"));
    assert.equal(wantsDenserRitual(on), true);
    assert.equal(intensityLabel(on), "cathedral");
    assert.equal(softSignalStillFree(on), true);
    assert.ok(MASOCHIST_INVARIANTS.length >= 4);
  });
});
