import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  TOO_MUCH_COPY,
  TOO_MUCH_TRIGGERS,
  canEnterPanicRoom,
  completeTooMuch,
  containmentScriptFor,
  defaultTooMuchDraft,
  recommendProtocol,
  sealTooMuch,
  suggestedMoves,
  summarizePatterns,
  toggleCoTrigger,
} from "./tooMuchCore.ts";

describe("tooMuchCore v0.2", () => {
  it("has dense trigger set", () => {
    assert.ok(TOO_MUCH_TRIGGERS.filter((t) => t.id !== "undecided").length >= 13);
  });

  it("fails closed then seals; flooded skips story; dual tracks", () => {
    const d = defaultTooMuchDraft();
    assert.equal(canEnterPanicRoom(d).ok, false);
    d.softSignalAcknowledged = true;
    d.triggerId = "delayed_reply";
    d.intensityId = "activated";
    d.storySentence = "My brain says I am too much and they will leave";
    assert.equal(canEnterPanicRoom(d).ok, true);
    const snap = sealTooMuch(d)!;
    assert.equal(snap.protocolVersion, "0.2");
    assert.equal(snap.containmentTrack, "standard");
    assert.ok(containmentScriptFor("standard").length >= 8);
    assert.ok(containmentScriptFor("flood").length >= 4);

    const f = defaultTooMuchDraft();
    f.softSignalAcknowledged = true;
    f.triggerId = "quiet_room";
    f.intensityId = "flooded";
    assert.equal(canEnterPanicRoom(f).ok, true);
    assert.equal(sealTooMuch(f)!.containmentTrack, "flood");
  });

  it("co-triggers and suggested moves", () => {
    let co: import("./tooMuchCore.ts").TooMuchTriggerId[] = [];
    co = toggleCoTrigger(co, "after_i_asked");
    co = toggleCoTrigger(co, "after_i_asked");
    assert.equal(co.length, 0);
    assert.ok(suggestedMoves("flooded", "delayed_reply").includes("soft_signal"));
    assert.ok(
      suggestedMoves("whisper", "after_conflict").includes("link_interest_re"),
    );
  });

  it("patterns + recommend", () => {
    const d = defaultTooMuchDraft();
    d.softSignalAcknowledged = true;
    d.triggerId = "after_i_asked";
    d.intensityId = "high";
    d.storySentence = "I asked and now I am too much";
    const snap = sealTooMuch(d)!;
    const entry = completeTooMuch(snap, "reassurance", "completed", 5, 3, {
      stillFlooded: false,
      note: "ok",
      ledgerNamedStory: true,
      ledgerDidNotDumpRaw: true,
      ledgerSoftSignalOk: true,
      ledgerNotTooMuchVerdict: true,
      ledgerUsedRoomWithoutShame: true,
    });
    const p = summarizePatterns([entry]);
    assert.equal(p.total, 1);
    assert.equal(p.named_without_dump_streak, 1);
    assert.equal(p.recommended_protocol, "attachment-repair");
    const r = recommendProtocol([entry]);
    assert.equal(r.protocol, "attachment-repair");
  });

  it("never bakes the real partner name into shared copy — placeholder only, swapped per build mode at render time", () => {
    assert.ok(!/\bRenn\b/.test(TOO_MUCH_COPY.purpose));
    assert.ok(TOO_MUCH_COPY.purpose.includes("{{PARTNER}}"));
  });
});
