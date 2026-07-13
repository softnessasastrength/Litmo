import assert from "node:assert/strict";
import test from "node:test";
import { PublicAppError } from "./errors.ts";

/**
 * Pure-ish tests for ceremony gate decision shaping without invoking network.
 * The live client is integration-tested when Edge is deployed.
 */

test("rate limit PublicAppError is retryable and non-leaking", () => {
  const err = new PublicAppError(
    "auth_rate_limited",
    "You're doing that too often — try again later.",
    true,
  );
  assert.equal(err.code, "auth_rate_limited");
  assert.equal(err.retryable, true);
  assert.ok(!err.message.toLowerCase().includes("secret"));
});

test("device-required error steers to passkey re-bind", () => {
  const err = new PublicAppError(
    "auth_device_required",
    "Confirm consent only from a passkey-registered device on this phone. Sign in with your passkey, then try again.",
  );
  assert.equal(err.code, "auth_device_required");
  assert.ok(err.message.toLowerCase().includes("passkey"));
});
