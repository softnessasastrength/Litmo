import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  canEnterPanicRoom,
  completeTooMuch,
  defaultTooMuchDraft,
  sealTooMuch,
  suggestedMoves,
  summarizePatterns,
} from "./tooMuchCore.ts";

describe("tooMuchCore", () => {
  it("fails closed without Soft Signal trigger intensity story", () => {
    const d = defaultTooMuchDraft();
    assert.equal(canEnterPanicRoom(d).ok, false);
    d.softSignalAcknowledged = true;
    d.triggerId = "delayed_reply";
    d.intensityId = "activated";
    assert.equal(canEnterPanicRoom(d).ok, false);
    d.storySentence = "My brain says I am too much and they will leave";
    assert.equal(canEnterPanicRoom(d).ok, true);
  });

  it("flooded can skip story", () => {
    const d = defaultTooMuchDraft();
    d.softSignalAcknowledged = true;
    d.triggerId = "quiet_room";
    d.intensityId = "flooded";
    assert.equal(canEnterPanicRoom(d).ok, true);
    const snap = sealTooMuch(d)!;
    assert.ok(snap.storySentence.includes("flooded"));
    assert.ok(suggestedMoves("flooded").includes("soft_signal"));
  });

  it("pattern summary counts triggers", () => {
    const d = defaultTooMuchDraft();
    d.softSignalAcknowledged = true;
    d.triggerId = "after_i_asked";
    d.intensityId = "high";
    d.storySentence = "I asked and now I am too much";
    const snap = sealTooMuch(d)!;
    const entry = completeTooMuch(snap, "reassurance", "completed", 3, 2, {
      stillFlooded: false,
      note: "ok",
      ledgerNamedStory: true,
      ledgerDidNotDumpRaw: true,
      ledgerSoftSignalOk: true,
      ledgerNotTooMuchVerdict: true,
    });
    const p = summarizePatterns([entry]);
    assert.equal(p.total, 1);
    assert.equal(p.named_story_count, 1);
    assert.equal(p.top_triggers[0]?.id, "after_i_asked");
  });
});
