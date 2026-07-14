import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  PURGE_CONFIRMATION_PHRASE,
  PURGE_GATE_ORDER,
  PURGE_GATES,
  PURGE_REASON_OPTIONS,
  findPurgeGate,
  nextPurgeGate,
  purgeConfirmationMatches,
} from "./cathedralPurgeCore.ts";

describe("cathedral purge core", () => {
  it("gate order is strictly linear and ends at 'done'", () => {
    assert.equal(PURGE_GATE_ORDER[0], "intro");
    assert.equal(PURGE_GATE_ORDER[PURGE_GATE_ORDER.length - 1], "done");
    assert.equal(PURGE_GATE_ORDER.length, PURGE_GATES.length);
  });

  it("every gate but executing/done is cancelable", () => {
    for (const gate of PURGE_GATES) {
      if (gate.id === "executing" || gate.id === "done") {
        assert.equal(gate.cancelable, false);
      } else {
        assert.equal(gate.cancelable, true);
      }
    }
  });

  it("nextPurgeGate walks forward in strict order and stops after done", () => {
    let current = PURGE_GATE_ORDER[0]!;
    let steps = 0;
    while (true) {
      const next = nextPurgeGate(current);
      if (next === null) break;
      current = next;
      steps += 1;
      assert.ok(steps <= PURGE_GATE_ORDER.length, "must terminate");
    }
    assert.equal(current, "done");
    assert.equal(steps, PURGE_GATE_ORDER.length - 1);
  });

  it("nextPurgeGate never goes backward and never skips", () => {
    for (let i = 0; i < PURGE_GATE_ORDER.length - 1; i++) {
      assert.equal(nextPurgeGate(PURGE_GATE_ORDER[i]!), PURGE_GATE_ORDER[i + 1]);
    }
  });

  it("findPurgeGate returns a real gate for every id", () => {
    for (const gate of PURGE_GATES) {
      assert.equal(findPurgeGate(gate.id).id, gate.id);
    }
  });

  it("reason options are all optional — 'none of these' is always present", () => {
    assert.ok(PURGE_REASON_OPTIONS.some((r) => r.id === "none_of_these"));
  });

  it("confirmation phrase must match exactly (tolerant of case/whitespace only)", () => {
    assert.equal(purgeConfirmationMatches(PURGE_CONFIRMATION_PHRASE), true);
    assert.equal(purgeConfirmationMatches(`  ${PURGE_CONFIRMATION_PHRASE.toUpperCase()}  `), true);
    assert.equal(purgeConfirmationMatches("I release this"), false);
    assert.equal(purgeConfirmationMatches(""), false);
    assert.equal(purgeConfirmationMatches("i release this, not in anger"), false); // missing period
  });
});
