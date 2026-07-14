import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  BOTH_AND_SCRIPT,
  FEAR_POLES,
  NEED_POLES,
  buildDualSentence,
  canSealNeedScared,
  completeNeedScared,
  defaultNeedScaredDraft,
  sealNeedScared,
  summarizeNeedScared,
} from "./needScaredCore.ts";

describe("needScaredCore", () => {
  it("has granular poles and both/and script", () => {
    assert.ok(NEED_POLES.filter((p) => p.id !== "undecided").length >= 8);
    assert.ok(FEAR_POLES.filter((p) => p.id !== "undecided").length >= 8);
    assert.ok(BOTH_AND_SCRIPT.length >= 8);
  });

  it("fails closed then seals dual bind", () => {
    const d = defaultNeedScaredDraft();
    assert.equal(canSealNeedScared(d).ok, false);
    d.softSignalAcknowledged = true;
    d.dualBindAdmitted = true;
    d.needId = "body_hold";
    d.fearId = "leave_if_need";
    d.needIntensity = 4;
    d.fearIntensity = 5;
    assert.equal(canSealNeedScared(d).ok, true);
    const sentence = buildDualSentence(d);
    assert.ok(sentence.includes("need"));
    assert.ok(sentence.toLowerCase().includes("scared") || sentence.includes("leave"));
    const snap = sealNeedScared(d)!;
    assert.equal(snap.protocolVersion, "0.1");
    assert.ok(snap.optionalAsk.length > 10);
    const entry = completeNeedScared(snap, "hold_both", "completed", 5, {
      bothPolesStillPresent: true,
      note: "",
      ledgerHeldBoth: true,
      ledgerDidNotPreAbandon: true,
      ledgerDidNotFawnOnly: true,
      ledgerSoftSignalOk: true,
      ledgerAskNotAutoSent: true,
    });
    const s = summarizeNeedScared([entry]);
    assert.equal(s.total, 1);
    assert.equal(s.held_both, 1);
  });
});
