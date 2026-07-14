import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  canSealRepair,
  completeRepair,
  currentScriptLine,
  defaultRepairDraft,
  isRepairDurationComplete,
  sealRepair,
  startRepairSession,
  summarizeRepairHistory,
  tickRepairSession,
  yellowPause,
} from "./attachmentRepairCore.ts";

function baseSealable() {
  const d = defaultRepairDraft();
  d.modeId = "mommy_issues";
  d.roleId = "care_seeker";
  d.intensityId = "warm";
  d.durationMinutes = 7;
  d.softSignalAcknowledged = true;
  d.yellowPauseAcknowledged = true;
  return d;
}

describe("attachmentRepairCore", () => {
  it("fails closed without Soft Signal + Yellow ack", () => {
    const d = defaultRepairDraft();
    d.modeId = "mommy_issues";
    d.roleId = "solo";
    d.intensityId = "warm";
    d.durationMinutes = 3;
    assert.equal(canSealRepair(d).ok, false);
    d.softSignalAcknowledged = true;
    assert.equal(canSealRepair(d).ok, false);
    d.yellowPauseAcknowledged = true;
    assert.equal(canSealRepair(d).ok, true);
  });

  it("edge only on masochist circuit with consent and timer", () => {
    const d = baseSealable();
    d.intensityId = "edge";
    assert.equal(canSealRepair(d).ok, false);
    d.modeId = "emotional_masochist";
    assert.equal(canSealRepair(d).ok, false);
    d.edgeConsent = true;
    assert.equal(canSealRepair(d).ok, true);
    d.durationMinutes = "open";
    assert.equal(canSealRepair(d).ok, false);
  });

  it("ritual runs scripts and soft signal history", () => {
    const snap = sealRepair(baseSealable())!;
    let s = startRepairSession(snap);
    assert.ok(currentScriptLine(s).includes("allowed to need"));
    s = tickRepairSession(s, 7 * 60);
    assert.equal(isRepairDurationComplete(s), true);
    s = yellowPause(s);
    assert.equal(s.paused, true);
    assert.equal(s.pauseCount, 1);
    const entry = completeRepair(s, "soft_signal", {
      flooded: 6,
      softSignalStayedFreeInMind: true,
      woundActuallyFor: "mommy issues",
      usedPartnerAsStandInWithoutConsent: false,
      ledgerNamedMommyIssues: true,
      ledgerCaughtMasochistLoop: false,
      ledgerReceivedWithoutPerformingPain: true,
      ledgerSoftSignalRemembered: true,
    });
    const sum = summarizeRepairHistory([entry]);
    assert.equal(sum.soft_signal_exits, 1);
    assert.equal(sum.named_mommy_ledger, 1);
  });
});
