import assert from "node:assert/strict";
import test from "node:test";
import {
  createBackupMasterKey,
  exportRecoveryCode,
  importRecoveryCode,
  openPersonalBackup,
  parseBackupEnvelope,
  sealPersonalBackup,
} from "./encryptedBackupCore.ts";

test("seal and open round-trip for touch language domain", () => {
  const key = createBackupMasterKey();
  const plain = JSON.stringify({
    version: 1,
    hello: "private touch language",
  });
  const env = sealPersonalBackup("touch_language", plain, key);
  assert.equal(env.opaque, true);
  assert.equal(env.domain, "touch_language");
  assert.equal(env.v, 1);
  const opened = openPersonalBackup(env, key);
  assert.equal(opened, plain);
});

test("wrong key fails closed", () => {
  const key = createBackupMasterKey();
  const other = createBackupMasterKey();
  const env = sealPersonalBackup(
    "soft_signal_log",
    JSON.stringify([{ id: "1" }]),
    key,
  );
  assert.equal(openPersonalBackup(env, other), null);
});

test("recovery code export/import", () => {
  const key = createBackupMasterKey();
  const code = exportRecoveryCode(key);
  const restored = importRecoveryCode(code);
  assert.ok(restored);
  assert.equal(restored!.length, 32);
  const env = sealPersonalBackup("private_history", '{"version":1}', key);
  assert.equal(openPersonalBackup(env, restored!), '{"version":1}');
});

test("tampered envelope fails closed", () => {
  const key = createBackupMasterKey();
  const env = sealPersonalBackup("quiz_results", "{}", key);
  const tampered = { ...env, ct: env.ct.slice(0, -4) + "xxxx" };
  assert.equal(openPersonalBackup(tampered, key), null);
});

test("parseBackupEnvelope rejects non-opaque", () => {
  assert.equal(parseBackupEnvelope({ v: 1, opaque: false }), null);
  assert.equal(parseBackupEnvelope(null), null);
});
