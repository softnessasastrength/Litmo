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
} from "./relationshipModelCore.ts";

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
});
