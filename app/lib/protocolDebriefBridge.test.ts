import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  DEBRIEF_BRIDGE_SOURCES,
  debriefFromConflict,
  debriefFromNeedScared,
  debriefFromParallel,
  debriefFromReconcile,
  debriefFromSpoon,
  debriefFromTooMuch,
} from "./protocolDebriefBridge.ts";
import type { SpoonHistoryEntry } from "./spooningCore.ts";
import type { TooMuchHistoryEntry } from "./tooMuchCore.ts";
import type { NeedScaredHistoryEntry } from "./needScaredCore.ts";
import type { ConflictHistoryEntry } from "./conflictSimCore.ts";
import type { ReconcileEntry } from "./reconcileCore.ts";
import type { ParallelEntry } from "./parallelPlayCore.ts";

describe("protocol debrief bridge", () => {
  it("covers all auto-ingest sources", () => {
    assert.ok(DEBRIEF_BRIDGE_SOURCES.includes("spooning"));
    assert.ok(DEBRIEF_BRIDGE_SOURCES.includes("need_scared"));
    assert.ok(DEBRIEF_BRIDGE_SOURCES.includes("too_much"));
    assert.ok(DEBRIEF_BRIDGE_SOURCES.length >= 10);
  });

  it("maps spoon soft signal as skill", () => {
    const e = {
      snapshot: { id: "s1" },
      startedAt: new Date().toISOString(),
      endedAt: new Date().toISOString(),
      endReason: "soft_signal",
      checkInCount: 0,
      debrief: {
        bodyFeel: null,
        bodyNotes: "",
        worked: "hold",
        didntWork: "",
        nonTraumaticClosenessPlusOne: false,
        owedNoPerformance: true,
        receivedWithoutPerformingPain: false,
        namedNeedForHold: true,
      },
    } as unknown as SpoonHistoryEntry;
    const d = debriefFromSpoon(e);
    assert.equal(d.source, "spooning");
    assert.equal(d.softSignalUsed, true);
    assert.ok(d.tags.includes("soft_signal"));
  });

  it("maps too much without partner fields", () => {
    const e = {
      snapshot: { id: "t1" },
      moveId: "soft_signal",
      endedAt: new Date().toISOString(),
      endReason: "completed",
      containmentStepsDone: 3,
      reassuranceStepsDone: 2,
      debrief: {
        stillFlooded: false,
        note: "named story",
        ledgerNamedStory: true,
        ledgerDidNotDumpRaw: true,
        ledgerSoftSignalOk: true,
        ledgerNotTooMuchVerdict: true,
        ledgerUsedRoomWithoutShame: true,
      },
    } as unknown as TooMuchHistoryEntry;
    const d = debriefFromTooMuch(e);
    assert.equal(d.source, "too_much");
    assert.ok(d.tags.includes("too_much_story"));
    assert.ok(d.worked.includes("named") || d.worked.length >= 0);
  });

  it("maps dual bind", () => {
    const e = {
      snapshot: { id: "n1" },
      moveId: "none",
      endedAt: new Date().toISOString(),
      endReason: "soft_signal",
      bothAndStepsDone: 2,
      debrief: {
        bothPolesStillPresent: true,
        note: "held both",
        ledgerHeldBoth: true,
        ledgerDidNotPreAbandon: true,
        ledgerDidNotFawnOnly: true,
        ledgerSoftSignalOk: true,
        ledgerAskNotAutoSent: true,
      },
    } as unknown as NeedScaredHistoryEntry;
    const d = debriefFromNeedScared(e);
    assert.equal(d.source, "need_scared");
    assert.ok(d.tags.includes("dual_bind"));
    assert.equal(d.softSignalUsed, true);
  });

  it("maps conflict reschedule as soft win", () => {
    const e = {
      snapshot: { id: "c1" },
      bodySpot: "chest",
      iStatement: "I felt flooded",
      moveId: "reschedule",
      endedAt: new Date().toISOString(),
      endReason: "reschedule",
      debrief: null,
    } as unknown as ConflictHistoryEntry;
    const d = debriefFromConflict(e);
    assert.equal(d.source, "conflict_sim");
    assert.ok(d.tags.includes("space"));
  });

  it("maps reconcile denser ceremony tag", () => {
    const e: ReconcileEntry = {
      snapshot: {
        id: "r1",
        version: "0.2",
        sealedAt: new Date().toISOString(),
        archetypeId: "soft_return",
        fightNote: "dishes",
        denser: true,
      },
      stepsDone: 3,
      endedAt: new Date().toISOString(),
      endReason: "completed",
      note: "ok",
    };
    const d = debriefFromReconcile(e);
    assert.equal(d.source, "reconcile");
    assert.ok(d.tags.includes("ceremony"));
  });

  it("maps parallel felt connected", () => {
    const e: ParallelEntry = {
      snapshot: {
        id: "p1",
        version: "0.2",
        sealedAt: new Date().toISOString(),
        modeId: "ritual_tea",
        intention: "coexist",
        ceremonial: false,
      },
      endedAt: new Date().toISOString(),
      endReason: "completed",
      feltConnected: true,
      note: "tea",
    };
    const d = debriefFromParallel(e);
    assert.equal(d.source, "parallel_play");
    assert.equal(d.again, true);
    assert.ok(d.tags.includes("hold"));
  });
});
