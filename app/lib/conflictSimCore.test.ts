import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildIStatement,
  canCompleteSim,
  canSealConflict,
  completeConflict,
  defaultConflictDraft,
  sealConflict,
  startConflictSim,
  summarizeConflictHistory,
} from "./conflictSimCore.ts";

describe("conflictSimCore", () => {
  it("fails closed without mode intensity Soft Signal issue", () => {
    const d = defaultConflictDraft();
    assert.equal(canSealConflict(d).ok, false);
    d.modeId = "solo_rehearsal";
    d.intensityId = "normal";
    d.softSignalAcknowledged = true;
    assert.equal(canSealConflict(d).ok, false);
    d.issueSentence = "I freeze when plans change last minute";
    assert.equal(canSealConflict(d).ok, true);
  });

  it("flood can seal without issue sentence", () => {
    const d = defaultConflictDraft();
    d.modeId = "flood";
    d.intensityId = "flooded";
    d.softSignalAcknowledged = true;
    assert.equal(canSealConflict(d).ok, true);
    const snap = sealConflict(d)!;
    assert.ok(snap.issueSentence.includes("flood"));
  });

  it("I-statement + complete with soft signal", () => {
    const d = defaultConflictDraft();
    d.modeId = "solo_rehearsal";
    d.intensityId = "charged";
    d.softSignalAcknowledged = true;
    d.issueSentence = "I feel abandoned when texts go cold";
    const snap = sealConflict(d)!;
    let s = startConflictSim(snap);
    s = {
      ...s,
      bodySpot: "chest",
      iStatement: buildIStatement({
        when: "texts go quiet",
        feel: "panic",
        need: "a check-in or a clear pause",
      }),
      moveId: "soft_signal",
      step: "done",
    };
    assert.equal(canCompleteSim(s).ok, true);
    const entry = completeConflict(s, "soft_signal", {
      shameLevel: 7,
      note: "practiced exit",
      ledgerNamedWithoutGhosting: true,
      ledgerPauseWithoutSelfHate: false,
      ledgerSoftSignalOk: true,
      ledgerNotProsecutor: true,
    });
    const sum = summarizeConflictHistory([entry]);
    assert.equal(sum.soft_signal, 1);
    assert.equal(sum.named_without_ghosting, 1);
  });
});
