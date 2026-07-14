import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  SPOON_POSITIONS,
  canSealSpoon,
  checkInFlashText,
  completeSpoon,
  defaultSpoonDraft,
  durationTargetSeconds,
  formatSpoonClock,
  isDurationComplete,
  markFiveMinWarning,
  positionCount,
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

describe("spooningCore v0.2 nuclear", () => {
  it("has 14 positions including jetpack koala safety burrito", () => {
    assert.ok(positionCount() >= 14);
    assert.ok(SPOON_POSITIONS.some((p) => p.id === "jetpack"));
    assert.ok(SPOON_POSITIONS.some((p) => p.id === "koala_death_grip"));
    assert.ok(SPOON_POSITIONS.some((p) => p.id === "safety_burrito"));
    assert.ok(SPOON_POSITIONS.some((p) => p.id === "fortress_of_solitude"));
  });

  it("fails closed without role duration pressure energy zones", () => {
    const d = defaultSpoonDraft();
    assert.equal(canSealSpoon(d).ok, false);
    d.roleId = "little";
    d.durationMinutes = 15;
    d.pressureId = "gentle";
    d.energyId = "cozy_silence";
    assert.equal(canSealSpoon(d).ok, true);
  });

  it("chest-adjacent positions need zone consent", () => {
    const d = sealableDraft();
    d.positionId = "koala_death_grip";
    d.allowedZones = ["hair"];
    assert.equal(canSealSpoon(d).ok, false);
    d.allowedZones = ["chest_over_clothes", "nowhere_stomach"];
    assert.equal(canSealSpoon(d).ok, true);
  });

  it("mommy issues reassurance gates role/energy", () => {
    const d = sealableDraft();
    d.roleId = "big";
    d.mommyIssuesReassurance = true;
    assert.equal(canSealSpoon(d).ok, false);
    d.roleId = "care_seeker_little";
    d.energyId = "reassurance_needed";
    assert.equal(canSealSpoon(d).ok, true);
  });

  it("check-in flash + 5min warning + soft signal history", () => {
    const d = sealableDraft();
    d.preferredCheckIn = "still_wanted";
    d.mommyIssuesReassurance = true;
    d.roleId = "little";
    d.energyId = "reassurance_needed";
    const snap = sealSpoon(d)!;
    assert.equal(snap.protocolVersion, "0.2");
    assert.equal(checkInFlashText(snap), "you are still wanted");
    let session = startSpoonSession(snap);
    session = recordCheckIn(session);
    assert.equal(session.checkInCount, 1);
    session = tickSpoonSession(session, 10 * 60);
    assert.equal(shouldFireFiveMinWarning(session), true);
    session = markFiveMinWarning(session);
    assert.equal(formatSpoonClock(0), "0:00");
    assert.equal(durationTargetSeconds("hot_or_pee"), null);
    const entry = completeSpoon(session, "soft_signal", {
      bodyFeel: 5,
      bodyNotes: "held",
      worked: "safety burrito",
      didntWork: "",
      nonTraumaticClosenessPlusOne: true,
      owedNoPerformance: true,
      receivedWithoutPerformingPain: true,
      namedNeedForHold: true,
    });
    const s = summarizeHistory([entry]);
    assert.equal(s.soft_signal_exits, 1);
    assert.equal(s.mommy_issues_runs, 1);
    assert.equal(isDurationComplete(tickSpoonSession(startSpoonSession(snap), 15 * 60)), true);
  });

  it("toggle zone", () => {
    assert.deepEqual(toggleZone(["back"], "arm"), ["back", "arm"]);
  });
});
