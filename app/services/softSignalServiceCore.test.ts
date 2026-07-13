import assert from "node:assert/strict";
import test from "node:test";
import {
  createSoftSignalService,
  type SoftSignalRemoteStop,
} from "./softSignalServiceCore.ts";
import type { SoftSignalLogEntry } from "../lib/softSignalCore.ts";

function build(deps: {
  remote?: SoftSignalRemoteStop | (() => Promise<SoftSignalRemoteStop>);
  remoteThrows?: boolean;
  logThrows?: boolean;
  hapticThrows?: boolean;
  hardwareThrows?: boolean;
}) {
  const logs: SoftSignalLogEntry[] = [];
  let remoteCalls = 0;
  let hapticCalls = 0;
  let hardwareCalls = 0;

  const service = createSoftSignalService({
    newId: () => "test-id",
    now: () => "2026-07-14T00:00:00.000Z",
    async stopRemote() {
      remoteCalls += 1;
      if (deps.remoteThrows) throw new Error("network");
      const r = deps.remote ?? { status: "stopped" as const };
      return typeof r === "function" ? r() : r;
    },
    async appendLog(entry) {
      if (deps.logThrows) throw new Error("log_fail");
      logs.push(entry);
    },
    playHaptic() {
      hapticCalls += 1;
      if (deps.hapticThrows) throw new Error("haptic");
    },
    async emitHardware() {
      hardwareCalls += 1;
      if (deps.hardwareThrows) throw new Error("hw");
    },
  });

  return { service, logs, stats: () => ({ remoteCalls, hapticCalls, hardwareCalls }) };
}

test("practice never calls remote and is practice_only", async () => {
  const { service, logs, stats } = build({});
  const result = await service.practice();
  assert.equal(result.localEnded, true);
  assert.equal(result.outcome, "practice_only");
  assert.equal(stats().remoteCalls, 0);
  assert.equal(logs.length, 1);
  assert.equal(logs[0]!.noExplanationRequired, true);
  assert.equal(logs[0]!.notEmergencyServices, true);
});

test("missing sessionId is practice path", async () => {
  const { service, stats } = build({});
  const result = await service.fire({
    source: "active_session",
    sessionId: null,
  });
  assert.equal(result.outcome, "practice_only");
  assert.equal(stats().remoteCalls, 0);
});

test("remote success → stopped_synced", async () => {
  const { service, stats } = build({ remote: { status: "stopped" } });
  const result = await service.fire({
    source: "active_session",
    sessionId: "sess-1",
  });
  assert.equal(result.localEnded, true);
  assert.equal(result.outcome, "stopped_synced");
  assert.equal(stats().remoteCalls, 1);
  assert.equal(stats().hapticCalls, 1);
  assert.equal(stats().hardwareCalls, 1);
});

test("remote pending → pending_sync still localEnded", async () => {
  const { service } = build({
    remote: { status: "stopped_pending_sync" },
  });
  const result = await service.fire({
    source: "active_session",
    sessionId: "sess-2",
  });
  assert.equal(result.localEnded, true);
  assert.equal(result.outcome, "pending_sync");
});

test("remote throws → pending_sync and still localEnded", async () => {
  const { service, logs } = build({ remoteThrows: true });
  const result = await service.fire({
    source: "active_session",
    sessionId: "sess-3",
  });
  assert.equal(result.localEnded, true);
  assert.equal(result.outcome, "pending_sync");
  assert.equal(logs.length, 1);
});

test("log failure never undoes stop", async () => {
  const { service } = build({
    remote: { status: "stopped" },
    logThrows: true,
  });
  const result = await service.fire({
    source: "active_session",
    sessionId: "sess-4",
  });
  assert.equal(result.localEnded, true);
  assert.equal(result.outcome, "stopped_synced");
});

test("haptic and hardware failure never undoes stop", async () => {
  const { service } = build({
    remote: { status: "stopped" },
    hapticThrows: true,
    hardwareThrows: true,
  });
  const result = await service.fire({
    source: "active_session",
    sessionId: "sess-5",
  });
  assert.equal(result.localEnded, true);
  assert.equal(result.outcome, "stopped_synced");
});

test("user message never demands a reason", async () => {
  const { service } = build({ remoteThrows: true });
  const result = await service.fire({
    source: "active_session",
    sessionId: "sess-6",
  });
  assert.doesNotMatch(result.userMessage, /why|reason|explain/i);
});
