import assert from "node:assert/strict";
import { test } from "node:test";
import {
  buildHardwareCommand,
  createLogEntry,
  parseLog,
  parseLogEntry,
  userMessageForOutcome,
} from "./softSignalCore.ts";

test("log entry always carries protective flags", () => {
  const entry = createLogEntry({
    id: "ss_1",
    firedAt: new Date().toISOString(),
    source: "practice",
    outcome: "practice_only",
    sessionId: null,
    privateJournalNote: null,
    surface: "mobile_app",
  });
  assert.equal(entry.notEmergencyServices, true);
  assert.equal(entry.noExplanationRequired, true);
  assert.ok(parseLogEntry(entry));
});

test("parseLog rejects malformed and sorts newest first", () => {
  const a = createLogEntry({
    id: "a",
    firedAt: "2026-07-13T10:00:00.000Z",
    source: "practice",
    outcome: "practice_only",
    sessionId: null,
    privateJournalNote: null,
    surface: "mobile_app",
  });
  const b = createLogEntry({
    id: "b",
    firedAt: "2026-07-13T12:00:00.000Z",
    source: "active_session",
    outcome: "stopped_local",
    sessionId: "sess",
    privateJournalNote: "I needed quiet",
    surface: "mobile_app",
  });
  const list = parseLog([b, a, { bad: true }]);
  assert.equal(list.length, 2);
  assert.equal(list[0]!.id, "b");
});

test("hardware command is local-only and preempting", () => {
  const cmd = buildHardwareCommand("gentle");
  assert.equal(cmd.kind, "soft_signal");
  assert.equal(cmd.preempt, true);
  assert.equal(cmd.localOnly, true);
  assert.equal(cmd.patternId, "breathLeave");
  assert.equal(cmd.visualHint, "calm_end_field");
});

test("user messages are non-punitive", () => {
  assert.match(userMessageForOutcome("stopped_local"), /do not owe|ended/i);
  assert.match(userMessageForOutcome("pending_sync"), /Stopped on this device/i);
  assert.doesNotMatch(userMessageForOutcome("stopped_synced"), /fail|punish|abort/i);
});
