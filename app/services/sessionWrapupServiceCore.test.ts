import assert from "node:assert/strict";
import test from "node:test";
import { createSessionWrapupService } from "./sessionWrapupServiceCore.ts";

function setup() {
  const submitted: unknown[] = [];
  let encryptCalls = 0;
  const service = createSessionWrapupService({
    encryptNote: async (sessionId, note) => {
      encryptCalls += 1;
      return `litmo:encrypted:v1:{"sessionId":"${sessionId}","note":"${note}"}`;
    },
    submitRemote: async (input) => {
      submitted.push(input);
      return "wrapup-id";
    },
    newId: () => "generated-id",
  });
  return {
    service,
    submitted: () => submitted,
    encryptCalls: () => encryptCalls,
  };
}

test("submits without encrypting when no private note is given", async () => {
  const state = setup();
  const id = await state.service.submit("session-1", "ended_normally", null);
  assert.equal(id, "wrapup-id");
  assert.equal(state.encryptCalls(), 0);
  assert.deepEqual(state.submitted(), [
    {
      sessionId: "session-1",
      outcome: "ended_normally",
      encryptedNote: null,
      idempotencyKey: "wrapup-generated-id",
    },
  ]);
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
