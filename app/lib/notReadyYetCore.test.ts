import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  canExtendOnce,
  canSealNotReady,
  completeNotReady,
  defaultNotReadyDraft,
  extendOnce,
  isSnoozeComplete,
  sealNotReady,
  startNotReadySession,
  summarizeNotReadyHistory,
  tickNotReady,
} from "./notReadyYetCore.ts";

describe("notReadyYetCore", () => {
  it("fails closed without reason snooze Soft Signal exit script", () => {
    const d = defaultNotReadyDraft();
    assert.equal(canSealNotReady(d).ok, false);
    d.reasonId = "want_hold";
    d.snoozeMinutes = 5;
    d.softSignalAcknowledged = true;
    assert.equal(canSealNotReady(d).ok, true);
  });

  it("timer complete and one extend", () => {
    const d = defaultNotReadyDraft();
    d.reasonId = "anxiety";
    d.snoozeMinutes = 2;
    d.softSignalAcknowledged = true;
    const snap = sealNotReady(d)!;
    let s = startNotReadySession(snap);
    s = tickNotReady(s, 2 * 60);
    assert.equal(isSnoozeComplete(s), true);
    assert.equal(canExtendOnce(s), true);
    const ext = extendOnce(s)!;
    assert.equal(ext.extendedOnce, true);
    assert.equal(isSnoozeComplete(ext), false);
    assert.equal(canExtendOnce(ext), false);
  });

  it("soft signal history", () => {
    const d = defaultNotReadyDraft();
    d.reasonId = "still_tired";
    d.snoozeMinutes = 10;
    d.softSignalAcknowledged = true;
    const snap = sealNotReady(d)!;
    const s = startNotReadySession(snap);
    const entry = completeNotReady(s, "soft_signal", {
      guilt: 4,
      note: "up messy",
      ledgerAskedWithoutSpiral: true,
      ledgerExitedWithScript: false,
      ledgerSoftSignalOk: true,
      ledgerNoSelfHate: true,
    });
    const sum = summarizeNotReadyHistory([entry]);
    assert.equal(sum.soft_signal, 1);
    assert.equal(sum.no_self_hate, 1);
  });
});
