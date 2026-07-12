import assert from "node:assert/strict";
import test from "node:test";
import { createSessionCompleteService } from "./sessionCompleteServiceCore.ts";

function setup(
  remote: () => Promise<string>,
  isRetryable: (error: unknown) => boolean = () => true,
) {
  let stored: string | null = null;
  const service = createSessionCompleteService({
    storage: {
      get: async () => stored,
      set: async (value) => {
        stored = value;
      },
      clear: async () => {
        stored = null;
      },
    },
    completeRemote: remote,
    isRetryable,
    newId: () => "fixed-id",
  });
  return {
    service,
    stored: () => stored,
  };
}

test("queues a durable completion intent when the network fails", async () => {
  const state = setup(async () => {
    throw new Error("offline");
  });
  assert.deepEqual(await state.service.complete("session-1"), {
    status: "pending_sync",
  });
  assert.match(state.stored() ?? "", /session-1/);
  assert.match(state.stored() ?? "", /complete-fixed-id/);
});

test("clears storage after a successful completion", async () => {
  const state = setup(async () => "completed");
  assert.deepEqual(await state.service.complete("session-1"), {
    status: "completed",
    resultingState: "completed",
  });
  assert.equal(state.stored(), null);
});

test("does not leave a permanent invalid transition queued forever", async () => {
  const state = setup(
    async () => {
      throw new Error("not active");
    },
    () => false,
  );
  assert.deepEqual(await state.service.complete("session-1"), {
    status: "failed_closed",
  });
  assert.equal(state.stored(), null);
});

test("reconcile reuses the durable idempotency key and succeeds later", async () => {
  let calls = 0;
  let failOnce = true;
  let lastKey = "";
  const state = setup(async () => {
    calls += 1;
    // Key is asserted via stored payload after the first complete call.
    if (failOnce) {
      failOnce = false;
      throw new Error("offline");
    }
    return "completed";
  });
  assert.equal(
    (await state.service.complete("session-1")).status,
    "pending_sync",
  );
  lastKey = state.stored() ?? "";
  assert.match(lastKey, /complete-fixed-id/);
  assert.deepEqual(await state.service.reconcile(), {
    status: "completed",
    resultingState: "completed",
  });
  assert.equal(calls, 2);
  assert.equal(state.stored(), null);
});

test("reconcile is idle when nothing is pending", async () => {
  const state = setup(async () => "completed");
  assert.deepEqual(await state.service.reconcile(), { status: "idle" });
});
