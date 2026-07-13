import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  canSealSpoon,
  completeSpoon,
  defaultSpoonDraft,
  formatSpoonClock,
  isDurationComplete,
  sealSpoon,
  startSpoonSession,
  summarizeHistory,
  tickSpoonSession,
} from "./spooningCore.ts";

describe("spooningCore", () => {
  it("fails closed without role duration energy", () => {
    const d = defaultSpoonDraft();
    assert.equal(canSealSpoon(d).ok, false);
    d.roleId = "little";
    assert.equal(canSealSpoon(d).ok, false);
    d.durationMinutes = 15;
    assert.equal(canSealSpoon(d).ok, false);
    d.energyId = "quiet";
    assert.equal(canSealSpoon(d).ok, true);
  });

  it("custom position needs a name", () => {
    const d = defaultSpoonDraft();
    d.roleId = "big";
    d.durationMinutes = 30;
    d.energyId = "soft";
    d.positionId = "custom";
    d.customPositionNote = "";
    assert.equal(canSealSpoon(d).ok, false);
    d.customPositionNote = "couch starfish hybrid";
    assert.equal(canSealSpoon(d).ok, true);
  });

  it("seal + soft signal complete does not require debrief", () => {
    const d = defaultSpoonDraft();
    d.roleId = "solo_practice";
    d.positionId = "burrito";
    d.durationMinutes = 5;
    d.energyId = "quiet";
    d.anxietyNote = "what if I am bad at existing near another mammal";
    const snap = sealSpoon(d, { id: "t1", sealedAt: "2026-07-13T00:00:00.000Z" });
    assert.ok(snap);
    assert.equal(snap!.roleId, "solo_practice");
    let session = startSpoonSession(snap!);
    session = tickSpoonSession(session, 12);
    assert.equal(formatSpoonClock(session.elapsedSeconds), "0:12");
    const entry = completeSpoon(session, "soft_signal", null);
    assert.equal(entry.endReason, "soft_signal");
    assert.equal(entry.debrief, null);
  });

  it("duration complete detects target", () => {
    const d = defaultSpoonDraft();
    d.roleId = "little";
    d.durationMinutes = 5;
    d.energyId = "playful";
    const snap = sealSpoon(d)!;
    let session = startSpoonSession(snap);
    session = tickSpoonSession(session, 5 * 60 - 1);
    assert.equal(isDurationComplete(session), false);
    session = tickSpoonSession(session, 1);
    assert.equal(isDurationComplete(session), true);
  });

  it("history summary counts soft signals", () => {
    const d = defaultSpoonDraft();
    d.roleId = "solo_practice";
    d.durationMinutes = 15;
    d.energyId = "heavy";
    const snap = sealSpoon(d)!;
    const session = startSpoonSession(snap);
    const entry = completeSpoon(session, "soft_signal", {
      comfort: 4,
      again: "maybe",
      note: "",
      owedNoPerformance: true,
    });
    const s = summarizeHistory([entry]);
    assert.equal(s.total, 1);
    assert.equal(s.soft_signal_exits, 1);
    assert.equal(s.solo_practice, 1);
  });
});
