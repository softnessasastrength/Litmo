import assert from "node:assert/strict";
import test from "node:test";
import { privacySafeMetadata } from "./logger.ts";

test("logs recursively redact sensitive keys and disguised sensitive values", () => {
  const result = privacySafeMetadata({
    eventId: "safe-id",
    note: "private text",
    nested: { harmlessName: "withdrawal because unsafe", token: "credential" },
  });
  assert.equal(result.eventId, "safe-id");
  assert.doesNotMatch(
    JSON.stringify(result),
    /private text|withdrawal|unsafe|credential/,
  );
});
