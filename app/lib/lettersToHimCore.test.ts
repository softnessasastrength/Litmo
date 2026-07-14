import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  canSealLetter,
  defaultLetterDraft,
  parseLetterHistory,
  releaseLetter,
  sealLetter,
} from "./lettersToHimCore.ts";

describe("letters to him core", () => {
  it("default draft has empty fields", () => {
    const d = defaultLetterDraft();
    assert.equal(d.regret, "");
    assert.equal(d.didntKnowYet, "");
    assert.equal(d.grace, "");
  });

  it("canSealLetter requires only grace, not regret/didntKnowYet", () => {
    const draft = { regret: "", didntKnowYet: "", grace: "I forgive you." };
    const result = canSealLetter(draft);
    assert.equal(result.ok, true);
  });

  it("canSealLetter rejects an empty/whitespace-only grace field", () => {
    assert.equal(canSealLetter({ regret: "x", didntKnowYet: "y", grace: "" }).ok, false);
    assert.equal(
      canSealLetter({ regret: "x", didntKnowYet: "y", grace: "   " }).ok,
      false,
    );
    const reason = canSealLetter({ regret: "", didntKnowYet: "", grace: "" }).reason;
    assert.ok(reason.length > 0);
  });

  it("sealLetter returns null when canSealLetter is false", () => {
    const sealed = sealLetter({ regret: "x", didntKnowYet: "y", grace: "" });
    assert.equal(sealed, null);
  });

  it("sealLetter produces a valid entry with released:false when grace is present", () => {
    const sealed = sealLetter({
      regret: "",
      didntKnowYet: "",
      grace: "You did the best you could with what you knew.",
    });
    assert.ok(sealed);
    assert.equal(sealed!.released, false);
    assert.equal(sealed!.grace, "You did the best you could with what you knew.");
    assert.equal(sealed!.regret, "");
    assert.equal(sealed!.didntKnowYet, "");
    assert.equal(typeof sealed!.id, "string");
    assert.ok(sealed!.id.length > 0);
    assert.equal(typeof sealed!.writtenAt, "string");
    assert.ok(!Number.isNaN(Date.parse(sealed!.writtenAt)));
  });

  it("releaseLetter flips released to true without mutating the input (pure)", () => {
    const sealed = sealLetter({ regret: "", didntKnowYet: "", grace: "Grace." });
    assert.ok(sealed);
    const released = releaseLetter(sealed!);
    assert.equal(released.released, true);
    assert.equal(sealed!.released, false);
  });

  it("parseLetterHistory rejects garbage (null, string, number) without throwing", () => {
    assert.deepEqual(parseLetterHistory(null), []);
    assert.deepEqual(parseLetterHistory("nope"), []);
    assert.deepEqual(parseLetterHistory(42), []);
  });

  it("parseLetterHistory filters out malformed entries from a mixed array", () => {
    const good = sealLetter({ regret: "", didntKnowYet: "", grace: "Grace." });
    assert.ok(good);
    const mixed = [good, null, "garbage", { id: "missing-fields" }, 42];
    const parsed = parseLetterHistory(mixed);
    assert.equal(parsed.length, 1);
    assert.equal(parsed[0]!.id, good!.id);
  });

  it("parseLetterHistory round-trips a real sealed entry through JSON.parse(JSON.stringify(...))", () => {
    const sealed = sealLetter({
      regret: "Old regret.",
      didntKnowYet: "Didn't know yet.",
      grace: "Grace line.",
    });
    assert.ok(sealed);
    const roundTripped = JSON.parse(JSON.stringify([sealed]));
    const parsed = parseLetterHistory(roundTripped);
    assert.deepEqual(parsed, [sealed]);
  });
});
