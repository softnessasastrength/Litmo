import assert from "node:assert/strict";
import test from "node:test";
import { createSessionWrapupService } from "./sessionWrapupServiceCore.ts";

function setup(remote?: (input: unknown) => Promise<string>) {
  const submitted: unknown[] = [];
  let encryptCalls = 0;
  let stored: string | null = null;
  const service = createSessionWrapupService({
    encryptNote: async (sessionId, note) => {
      encryptCalls += 1;
      return `litmo:encrypted:v1:{"sessionId":"${sessionId}","note":"${note}"}`;
    },
    submitRemote: async (input) => {
      submitted.push(input);
      if (remote) return remote(input);
      return "wrapup-id";
    },
    newId: () => "generated-id",
    storage: {
      get: async () => stored,
      set: async (value) => {
        stored = value;
      },
      clear: async () => {
        stored = null;
      },
    },
  });
  return {
    service,
    submitted: () => submitted,
    encryptCalls: () => encryptCalls,
    stored: () => stored,
  };
}

test("submits without encrypting when no private note is given", async () => {
  const state = setup();
  const result = await state.service.submit(
    "session-1",
    "ended_normally",
    null,
  );
  assert.deepEqual(result, { status: "saved", id: "wrapup-id" });
  assert.equal(state.encryptCalls(), 0);
  assert.deepEqual(state.submitted(), [
    {
      sessionId: "session-1",
      outcome: "ended_normally",
      encryptedNote: null,
      idempotencyKey: "wrapup-generated-id",
    },
  ]);
  assert.equal(state.stored(), null);
});

test("treats a whitespace-only note the same as no note", async () => {
  const state = setup();
  await state.service.submit("session-1", "completed_comfortably", "   ");
  assert.equal(state.encryptCalls(), 0);
  assert.equal(
    (state.submitted()[0] as { encryptedNote: unknown }).encryptedNote,
    null,
  );
});

test("encrypts a real private note before submitting", async () => {
  const state = setup();
  await state.service.submit(
    "session-1",
    "felt_uncomfortable",
    "  it felt rushed  ",
  );
  assert.equal(state.encryptCalls(), 1);
  const call = state.submitted()[0] as { encryptedNote: string };
  assert.match(call.encryptedNote, /^litmo:encrypted:v1:/);
  assert.match(call.encryptedNote, /it felt rushed/);
});

test("a network failure durably queues the submission for later retry", async () => {
  const state = setup(async () => {
    throw new Error("offline");
  });
  const result = await state.service.submit(
    "session-1",
    "ended_normally",
    null,
  );
  assert.deepEqual(result, { status: "pending_sync" });
  assert.match(state.stored() ?? "", /session-1/);
});

test("reconcile is a no-op when nothing is pending", async () => {
  const state = setup();
  assert.deepEqual(await state.service.reconcile(), { status: "idle" });
});

test("reconcile retries a durably queued submission and clears it on success", async () => {
  let calls = 0;
  const state = setup(async () => {
    calls += 1;
    if (calls === 1) throw new Error("offline");
    return "wrapup-id-2";
  });
  await state.service.submit("session-2", "safety_concern", null);
  assert.equal(calls, 1);
  const result = await state.service.reconcile();
  assert.deepEqual(result, { status: "saved", id: "wrapup-id-2" });
  assert.equal(calls, 2);
  assert.equal(state.stored(), null);
});

test("reconcile discards an unparseable pending record instead of looping forever", async () => {
  const corrupted = createSessionWrapupService({
    encryptNote: async () => "litmo:encrypted:v1:{}",
    submitRemote: async () => "unused",
    newId: () => "id",
    storage: {
      get: async () => "not-json",
      set: async () => {},
      clear: async () => {},
    },
  });
  assert.deepEqual(await corrupted.reconcile(), { status: "idle" });
});
