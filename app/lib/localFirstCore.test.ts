import assert from "node:assert/strict";
import test from "node:test";
import {
  appendPrivateHistoryEntry,
  BACKUP_ELIGIBLE_DOMAINS,
  createEmptyPrivateHistory,
  defaultBackupPrefs,
  isBackupEligible,
  parseBackupPrefs,
  parsePrivateHistory,
} from "./localFirstCore.ts";

test("backup prefs default is disabled", () => {
  const p = defaultBackupPrefs();
  assert.equal(p.enabled, false);
  assert.equal(p.version, 1);
});

test("parseBackupPrefs rejects garbage", () => {
  assert.equal(parseBackupPrefs(null), null);
  assert.equal(parseBackupPrefs({ version: 2 }), null);
  assert.ok(
    parseBackupPrefs({
      version: 1,
      enabled: true,
      lastBackupAt: null,
      lastErrorCode: null,
      domainsOk: ["touch_language", "nope"],
      recoveryCodeAcknowledged: true,
      updatedAt: "2026-01-01T00:00:00.000Z",
    }),
  );
});

test("backup eligible domains are personal only", () => {
  assert.ok(isBackupEligible("touch_language"));
  assert.ok(isBackupEligible("consent_mutual"));
  assert.ok(isBackupEligible("soft_signal_log"));
  assert.ok(isBackupEligible("private_history"));
  assert.equal(isBackupEligible("backup_prefs"), false);
  assert.equal(isBackupEligible("partner_e2e_keys"), false);
  assert.ok(BACKUP_ELIGIBLE_DOMAINS.includes("quiz_results"));
});

test("private history append preserves invariants", () => {
  const empty = createEmptyPrivateHistory();
  const next = appendPrivateHistoryEntry(empty, {
    id: "1",
    kind: "soft_signal",
    occurredAt: "2026-07-13T00:00:00.000Z",
    summary: "Stopped",
    privateNote: "x".repeat(600),
    sessionId: null,
  });
  assert.equal(next.entries.length, 1);
  assert.equal(next.entries[0]!.notScore, true);
  assert.equal(next.entries[0]!.notConsent, true);
  assert.ok((next.entries[0]!.privateNote?.length ?? 0) <= 500);
});

test("parsePrivateHistory fails closed", () => {
  assert.equal(parsePrivateHistory(null), null);
  assert.equal(parsePrivateHistory({ version: 1, entries: "no" }), null);
  const ok = parsePrivateHistory({
    version: 1,
    updatedAt: "t",
    entries: [
      {
        id: "a",
        kind: "wrap_up",
        occurredAt: "t",
        summary: "ok",
      },
    ],
  });
  assert.ok(ok);
  assert.equal(ok!.entries[0]!.notScore, true);
});
