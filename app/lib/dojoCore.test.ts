import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  DEFENSE_INVENTORY,
  appendUrge,
  burnReadinessScore,
  defaultDojoState,
  parseDojoState,
  setBurnGate,
  shouldPreferNotToBuild,
} from "./dojoCore.ts";

describe("dojoCore", () => {
  it("inventory has 24 defenses including meta D23 D24", () => {
    assert.equal(DEFENSE_INVENTORY.length, 24);
    assert.ok(DEFENSE_INVENTORY.some((d) => d.id === "D23"));
    assert.ok(DEFENSE_INVENTORY.some((d) => d.id === "D24"));
  });

  it("parse fails closed on garbage", () => {
    assert.deepEqual(parseDojoState(null), defaultDojoState());
    assert.deepEqual(parseDojoState("x"), defaultDojoState());
  });

  it("append urge and burn score", () => {
    let s = defaultDojoState();
    s = appendUrge(s, {
      fearSentence: "If I leave a gap they will take what was not offered",
      defenseId: "D01",
      choseNotToBuild: true,
      note: "",
    });
    assert.equal(s.urgeLog.length, 1);
    s = setBurnGate(s, "G1", true);
    s = setBurnGate(s, "G2", true);
    s = setBurnGate(s, "G3", true);
    s = setBurnGate(s, "G4", true);
    const score = burnReadinessScore(s);
    assert.equal(score.checked, 4);
    assert.equal(score.readyEnough, true);
  });

  it("prefer not to build on D23/D24", () => {
    const r = shouldPreferNotToBuild({
      defenseId: "D23",
      fearAlreadyNamedInLog: false,
      isSoftSignalOrStopPath: false,
    });
    assert.equal(r.preferNotToBuild, true);
  });

  it("Soft Signal path stays craftable", () => {
    const r = shouldPreferNotToBuild({
      defenseId: "D03",
      fearAlreadyNamedInLog: true,
      isSoftSignalOrStopPath: true,
    });
    assert.equal(r.preferNotToBuild, false);
  });
});
