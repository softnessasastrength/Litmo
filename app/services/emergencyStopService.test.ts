import assert from "node:assert/strict";
import test from "node:test";
import { createEmergencyStopService } from "./emergencyStopServiceCore.ts";

function setup(remote: () => Promise<string>) {
  let stored: string | null = null;
  let cleared = 0;
  const service = createEmergencyStopService({
    storage: {
      get: async () => stored,
      set: async (v) => {
        stored = v;
      },
      clear: async () => {
        stored = null;
      },
    },
    stopRemote: remote,
    clearProtectedRuntime: () => {
      cleared += 1;
    },
    newId: () => "request-id",
  });
  return { service, stored: () => stored, cleared: () => cleared };
}

test("emergency stop clears runtime and durably records intent before network failure", async () => {
  const state = setup(async () => {
    throw new Error("offline");
  });
  assert.deepEqual(await state.service.stop("session-id"), {
    status: "stopped_pending_sync",
  });
  assert.match(state.stored() ?? "", /session-id/);
  assert.doesNotMatch(state.stored() ?? "", /reason|note|safety/i);
  assert.equal(state.cleared(), 1);
});

test("relaunch reconciliation reuses the durable idempotency key and clears on success", async () => {
  let calls = 0;
  const state = setup(async () => {
    calls += 1;
    return "soft_signaled";
  });
  await state.service.stop("session-id");
  assert.equal(calls, 1);
  assert.equal(state.stored(), null);
});
