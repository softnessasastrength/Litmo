import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  canSealMorning,
  completeMorning,
  defaultMorningDraft,
  exitProtocolHistoryEntry,
  isImmediateExit,
  isMorningDurationComplete,
  sealMorning,
  shouldFireGremlinPeeWarning,
  startMorningSession,
  summarizeMorningHistory,
  tickMorningSession,
} from "./morningCuddleCore.ts";

function sealable() {
  const d = defaultMorningDraft();
  d.energyId = "gremlin";
  d.durationId = "standard";
  d.styleId = "full_burrito";
  return d;
}

describe("morningCuddleCore", () => {
  it("fails closed until energy duration style set", () => {
    const d = defaultMorningDraft();
    assert.equal(canSealMorning(d).ok, false);
    d.energyId = "toasty";
    assert.equal(canSealMorning(d).ok, false);
    d.durationId = "micro";
    assert.equal(canSealMorning(d).ok, false);
    d.styleId = "gentle_hold";
    assert.equal(canSealMorning(d).ok, true);
  });

  it("Exit Protocol is immediate exit without snapshot start", () => {
    const d = defaultMorningDraft();
    d.energyId = "exit_protocol";
    assert.equal(isImmediateExit(d), true);
    const g = canSealMorning(d);
    assert.equal(g.ok, true);
    assert.equal(g.immediateExit, true);
    assert.equal(sealMorning(d), null);
    const entry = exitProtocolHistoryEntry({ id: "e1" });
    assert.equal(entry.endReason, "exit_protocol");
  });

  it("gremlin pee warning at 8 minutes", () => {
    const snap = sealMorning(sealable())!;
    let s = startMorningSession(snap);
    s = tickMorningSession(s, 8 * 60 - 1);
    assert.equal(shouldFireGremlinPeeWarning(s), false);
    s = tickMorningSession(s, 1);
    assert.equal(shouldFireGremlinPeeWarning(s), true);
  });

  it("standard duration completes", () => {
    const snap = sealMorning(sealable())!;
    let s = startMorningSession(snap);
    s = tickMorningSession(s, 12 * 60);
    assert.equal(isMorningDurationComplete(s), true);
  });

  it("soft signal history + ledger summary", () => {
    const snap = sealMorning(sealable())!;
    const s = startMorningSession(snap);
    const entry = completeMorning(s, "soft_signal", {
      safetyFeel: 8,
      note: "no spiral",
      ledgerReceivedWithoutSpiral: true,
      ledgerNoGuiltAboutCloseness: true,
      exitRitualDone: true,
    });
    const sum = summarizeMorningHistory([entry]);
    assert.equal(sum.soft_signal_exits, 1);
    assert.equal(sum.no_spiral_plus, 1);
    assert.equal(sum.gremlin_sessions, 1);
  });
});
