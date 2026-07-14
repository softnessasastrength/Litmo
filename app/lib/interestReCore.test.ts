import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  canSealInterest,
  completeInterest,
  computeHonesty,
  defaultInterestDraft,
  defaultSignals,
  sealInterest,
  suggestedMoves,
  summarizeInterestHistory,
} from "./interestReCore.ts";

describe("interestReCore", () => {
  it("fails closed without target Soft Signal signals", () => {
    const d = defaultInterestDraft();
    assert.equal(canSealInterest(d).ok, false);
    d.targetKind = "cuddle";
    d.softSignalAcknowledged = true;
    assert.equal(canSealInterest(d).ok, false);
    d.signals.bodyWant = true;
    assert.equal(canSealInterest(d).ok, true);
  });

  it("detects performing vs clear yes vs flood", () => {
    const perf = defaultSignals();
    perf.shouldWant = true;
    perf.fearIfNo = true;
    assert.equal(computeHonesty(perf).label, "performing");

    const yes = defaultSignals();
    yes.bodyWant = true;
    yes.mindWant = true;
    assert.equal(computeHonesty(yes).label, "clear_yes");

    const flood = defaultSignals();
    flood.flooded = true;
    flood.bodyWant = true;
    assert.equal(computeHonesty(flood).label, "flooded_unknown");
  });

  it("seal + soft signal history", () => {
    const d = defaultInterestDraft();
    d.targetKind = "closeness";
    d.softSignalAcknowledged = true;
    d.signals.shouldWant = true;
    d.signals.performingSuspected = true;
    const snap = sealInterest(d)!;
    assert.equal(snap.honesty.label, "performing");
    assert.ok(suggestedMoves("performing").includes("soft_no"));
    const entry = completeInterest(snap, "soft_signal", "soft_signal", {
      clarity: 6,
      note: "caught should",
      ledgerNamedShould: true,
      ledgerAllowedDontKnow: false,
      ledgerSoftSignalOk: true,
      ledgerNotGotcha: true,
    });
    const s = summarizeInterestHistory([entry]);
    assert.equal(s.performing, 1);
    assert.equal(s.soft_signal, 1);
  });
});
