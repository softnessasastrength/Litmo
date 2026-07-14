import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createSeal, parseSeal } from "./cathedralSealCore.ts";

describe("cathedral seal core", () => {
  it("createSeal produces a valid, present-tense timestamp", () => {
    const seal = createSeal();
    assert.equal(seal.version, 1);
    assert.ok(!Number.isNaN(Date.parse(seal.sealedAt)));
  });

  it("parseSeal rejects garbage without throwing", () => {
    assert.equal(parseSeal(null), null);
    assert.equal(parseSeal("nope"), null);
    assert.equal(parseSeal(42), null);
    assert.equal(parseSeal({}), null);
    assert.equal(parseSeal({ sealedAt: 12345 }), null);
  });

  it("parseSeal round-trips a real seal", () => {
    const seal = createSeal();
    const parsed = parseSeal(JSON.parse(JSON.stringify(seal)));
    assert.deepEqual(parsed, seal);
  });
});
