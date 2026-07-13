import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  canSealSpoon,
  completeSpoon,
  defaultSpoonDraft,
  durationTargetSeconds,
  formatSpoonClock,
  isDurationComplete,
  markFiveMinWarning,
  recordCheckIn,
  sealSpoon,
  shouldFireFiveMinWarning,
  startSpoonSession,
  summarizeHistory,
  tickSpoonSession,
  toggleZone,
} from "./spooningCore.ts";

function sealableDraft() {
  const d = defaultSpoonDraft();
  d.roleId = "little";
  d.positionId = "safety";
  d.durationMinutes = 15;
  d.pressureId = "held_together";
  d.energyId = "cozy_silence";
  d.allowedZones = ["back", "arm", "nowhere_stomach"];
  return d;
}

describe("spooningCore v0.1 (nuclear cuddle)", () => {
  it("fails closed without role duration pressure energy zones", () => {
    const d = defaultSpoonDraft();
    assert.equal(canSealSpoon(d).ok, false);
    d.roleId = "little";
    assert.equal(canSealSpoon(d).ok, false);
    d.durationMinutes = 15;
    assert.equal(canSealSpoon(d).ok, false);
    d.pressureId = "gentle";
    assert.equal(canSealSpoon(d).ok, false);
    d.energyId = "cozy_silence";
    assert.equal(canSealSpoon(d).ok, true);
  });

  it("Half-Nelson of Love needs chest-adjacent zone", () => {
    const d = sealableDraft();
    d.positionId = "half_nelson_love";
    d.allowedZones = ["hair"];
    assert.equal(canSealSpoon(d).ok, false);
    d.allowedZones = ["shoulder", "nowhere_stomach"];
    assert.equal(canSealSpoon(d).ok, true);
  });

  it("hot_or_pee has no auto-complete target", () => {
    assert.equal(durationTargetSeconds("hot_or_pee"), null);
    const d = sealableDraft();
    d.durationMinutes = "hot_or_pee";
    const snap = sealSpoon(d)!;
    let session = startSpoonSession(snap);
    session = tickSpoonSession(session, 9999);
    assert.equal(isDurationComplete(session), false);
  });

  it("5min warning fires once on long timed spoon", () => {
    const d = sealableDraft();
    d.durationMinutes = 15;
    const snap = sealSpoon(d)!;
    let session = startSpoonSession(snap);
    session = tickSpoonSession(session, 9 * 60);
    assert.equal(shouldFireFiveMinWarning(session), false);
    session = tickSpoonSession(session, 60); // 10 min elapsed, 5 left
    assert.equal(shouldFireFiveMinWarning(session), true);
    session = markFiveMinWarning(session);
    assert.equal(shouldFireFiveMinWarning(session), false);
  });

  it("check-in and soft signal history", () => {
    const d = sealableDraft();
    d.roleId = "burrito_mode";
    d.positionId = "cthulhu";
    d.pressureId = "firm";
    const snap = sealSpoon(d)!;
    let session = startSpoonSession(snap);
    session = recordCheckIn(session);
    session = recordCheckIn(session);
    assert.equal(session.checkInCount, 2);
    assert.equal(formatSpoonClock(0), "0:00");
    const entry = completeSpoon(session, "soft_signal", {
      bodyFeel: 4,
      bodyNotes: "held together worked",
      worked: "safety escape wrist",
      didntWork: "nothing yet",
      nonTraumaticClosenessPlusOne: true,
      owedNoPerformance: true,
    });
    const s = summarizeHistory([entry]);
    assert.equal(s.soft_signal_exits, 1);
    assert.equal(s.check_ins, 2);
    assert.equal(s.non_traumatic_plus_ones, 1);
  });

  it("toggle zone", () => {
    assert.deepEqual(toggleZone(["back"], "arm"), ["back", "arm"]);
    assert.deepEqual(toggleZone(["back", "arm"], "back"), ["arm"]);
  });
});
