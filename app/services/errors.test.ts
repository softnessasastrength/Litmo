import assert from "node:assert/strict";
import test from "node:test";
import { mapExternalError } from "./errors.ts";
test("invalid credentials map to stable safe copy", () =>
  assert.equal(
    mapExternalError({ message: "Invalid login credentials" }).code,
    "auth_invalid_credentials",
  ));
test("database permission details are not exposed", () => {
  const result = mapExternalError({
    status: 403,
    message: "private table policy internals",
  });
  assert.equal(result.code, "permission_denied");
  assert.equal(result.message.includes("policy"), false);
});
test("network failures are retryable", () =>
  assert.equal(
    mapExternalError(new Error("network request failed")).retryable,
    true,
  ));
test("an invalid session lifecycle transition is not retryable", () => {
  const result = mapExternalError({
    code: "55000",
    message: "invalid session lifecycle transition",
  });
  assert.equal(result.code, "validation_failed");
  assert.equal(result.retryable, false);
});
