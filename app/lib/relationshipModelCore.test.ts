import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  canSealModel,
  createModel,
  defaultDraft,
  recommendFromModel,
  setPhase,
  updateAxes,
  exportModelText,
  modelSummaryLine,
  parseBundle,
  preRennBiasFromModel,
  suggestModelUpdateFromWeather,
  aftercareModeFromPhase,
  enterFloodProtect,
  exitFloodTowardSteady,
  linkConstitution,
  unlinkConstitution,
  formatConstitutionRef,
} from "./relationshipModelCore.ts";
import { computeVerdict } from "./preRennGateCore.ts";

describe("relationship model", () => {
  it("fail-closed without Soft Signal ack", () => {
    const d = defaultDraft();
    d.phase = "steady";
    d.label = "me + Renn";
    assert.equal(canSealModel(d).ok, false);
    d.softSignalAcknowledged = true;
    assert.equal(canSealModel(d).ok, true);
    const m = createModel(d);
    assert.ok(m);
    assert.equal(m!.modelIsNotConsent, true);
    assert.equal(m!.softSignalAcknowledged, true);
  });

  it("phase change + axes", () => {
    const d = {
      ...defaultDraft(),
      label: "bond",
      phase: "steady" as const,
      softSignalAcknowledged: true,
      attachmentWeather: "dual_bind" as const,
      closenessStyle: "parallel_primary" as const,
    };
    let m = createModel(d)!;
    const p = setPhase(m, "flood_protect");
    m = p.model;
    assert.equal(m.phase, "flood_protect");
    assert.equal(p.event.kind, "phase_change");
    const a = updateAxes(m, { capacity: 1, softSignalCulture: 5 });
    m = a.model;
    assert.equal(m.axes.capacity, 1);
    const recs = recommendFromModel(m);
    assert.ok(recs.some((r) => r.href === "/flood" || r.href === "/pre-renn"));
    assert.ok(recs.some((r) => r.href === "/need-scared"));
    assert.ok(modelSummaryLine(m).includes("not consent"));
    assert.ok(exportModelText(m).includes("Soft Signal free"));
  });

  it("parse round-trip", () => {
    const d = {
      ...defaultDraft(),
      label: "x",
      phase: "forming" as const,
      softSignalAcknowledged: true,
    };
    const m = createModel(d)!;
    const bundle = parseBundle({ model: m, events: [] });
    assert.ok(bundle);
    assert.equal(bundle!.model.label, "x");
  });

  it("pre-renn bias from flood_protect raises delay", () => {
    const d = {
      ...defaultDraft(),
      label: "bond",
      phase: "flood_protect" as const,
      softSignalAcknowledged: true,
      axes: { capacity: 1, conflictClimate: 2, closenessEase: 2, softSignalCulture: 5 },
    };
    const m = createModel(d)!;
    const bias = preRennBiasFromModel(m);
    assert.ok(bias.floodProtect);
    assert.ok(bias.suggestedDelayMinutes >= 30);
    const v = computeVerdict(2, 2, "check in", {
      minVerdict: "yellow",
      extraReasons: bias.extraReasons,
      extraHrefs: bias.extraHrefs,
    });
    assert.equal(v.verdict, "yellow");
    assert.ok(v.reasons.some((r) => r.includes("Bond map")));
  });

  it("weather suggests flood_protect when sky is bad", () => {
    const d = {
      ...defaultDraft(),
      label: "bond",
      phase: "steady" as const,
      softSignalAcknowledged: true,
    };
    const m = createModel(d)!;
    const s = suggestModelUpdateFromWeather(m, {
      energy: 2,
      anxiety: 5,
      attachmentHeat: 4,
      capacityForOthers: 1,
    });
    assert.equal(s.phase, "flood_protect");
    assert.ok(s.reasons.length > 0);
  });

  it("flood protect enter/exit and aftercare phase map", () => {
    const d = {
      ...defaultDraft(),
      label: "bond",
      phase: "steady" as const,
      softSignalAcknowledged: true,
    };
    let m = createModel(d)!;
    m = enterFloodProtect(m).model;
    assert.equal(m.phase, "flood_protect");
    m = exitFloodTowardSteady(m, true)!.model;
    assert.equal(m.phase, "steady");
    assert.equal(aftercareModeFromPhase("repair_needed"), "after_conflict");
    assert.equal(aftercareModeFromPhase("flood_protect"), "after_flood");
    assert.equal(aftercareModeFromPhase("celebration"), "after_good_thing");
  });

  it("constitution link is reference-only and reversible", () => {
    const d = {
      ...defaultDraft(),
      label: "bond",
      phase: "steady" as const,
      softSignalAcknowledged: true,
    };
    let m = createModel(d)!;
    assert.equal(m.constitutionRef, null);

    const doc = { id: "con-1", title: "Our Constitution", version: 3 };
    const linked = linkConstitution(m, doc);
    m = linked.model;
    assert.equal(m.constitutionRef, formatConstitutionRef(doc));
    assert.equal(linked.event.kind, "constitution_linked");
    // linking must never touch the hard invariants
    assert.equal(m.modelIsNotConsent, true);
    assert.equal(m.softSignalAcknowledged, true);

    const unlinked = unlinkConstitution(m);
    m = unlinked.model;
    assert.equal(m.constitutionRef, null);
    assert.equal(unlinked.event.kind, "constitution_linked");
  });
});
