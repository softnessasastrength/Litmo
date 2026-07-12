import assert from "node:assert/strict";
import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import test from "node:test";
import {
  createSensitiveDataService,
  encryptedValuePrefix,
  type SensitiveEnvelope,
} from "./sensitiveDataServiceCore.ts";

function authenticatedPlatformVault() {
  let current = 1;
  const keys = new Map<number, Buffer>([[1, randomBytes(32)]]);
  return {
    async encryptSensitive(plaintext: string, purpose: string) {
      const nonce = randomBytes(12);
      const cipher = createCipheriv("aes-256-gcm", keys.get(current)!, nonce);
      cipher.setAAD(Buffer.from(purpose));
      const ciphertext = Buffer.concat([
        cipher.update(plaintext),
        cipher.final(),
      ]);
      return {
        format: 1,
        keyVersion: current,
        ciphertext: Buffer.concat([
          nonce,
          cipher.getAuthTag(),
          ciphertext,
        ]).toString("base64url"),
      };
    },
    async decryptSensitive(envelope: SensitiveEnvelope, purpose: string) {
      const key = keys.get(envelope.keyVersion);
      if (!key) throw new Error("key_unavailable");
      const combined = Buffer.from(envelope.ciphertext, "base64url");
      const decipher = createDecipheriv(
        "aes-256-gcm",
        key,
        combined.subarray(0, 12),
      );
      decipher.setAAD(Buffer.from(purpose));
      decipher.setAuthTag(combined.subarray(12, 28));
      return Buffer.concat([
        decipher.update(combined.subarray(28)),
        decipher.final(),
      ]).toString();
    },
    async rotateSensitiveKey() {
      current += 1;
      keys.set(current, randomBytes(32));
      return current;
    },
    async retireSensitiveKey(version: number) {
      keys.delete(version);
    },
    async clearSensitiveKeys() {
      keys.clear();
    },
  };
}

test("sensitive plaintext is encrypted before persistence and inaccessible while locked", async () => {
  const service = createSensitiveDataService(authenticatedPlatformVault());
  await assert.rejects(service.encryptText("private safety note", "note"));
  service.unlock();
  const stored = await service.encryptText("private safety note", "note");
  assert.ok(stored?.startsWith(encryptedValuePrefix));
  assert.doesNotMatch(stored ?? "", /private safety note/);
  service.lock();
  await assert.rejects(service.decryptText(stored, "note"));
});

test("tampered ciphertext and wrong-purpose access fail closed", async () => {
  const service = createSensitiveDataService(authenticatedPlatformVault());
  service.unlock();
  const stored = (await service.encryptText("private", "touch-note"))!;
  await assert.rejects(
    service.decryptText(`${stored.slice(0, -1)}A`, "touch-note"),
  );
  await assert.rejects(service.decryptText(stored, "consent-note"));
});

test("rotation preserves access until atomic replacement then rejects the retired key", async () => {
  const service = createSensitiveDataService(authenticatedPlatformVault());
  service.unlock();
  const original = (await service.encryptText("private", "note"))!;
  const rotation = await service.rotateText(original, "note");
  assert.equal(await service.decryptText(rotation.rotated, "note"), "private");
  await rotation.retirePrior();
  await assert.rejects(service.decryptText(original, "note"));
});

test("clearing persistent keys invalidates ciphertext and returns to locked state", async () => {
  const service = createSensitiveDataService(authenticatedPlatformVault());
  service.unlock();
  const stored = await service.encryptText("private", "note");
  await service.clearPersistentKeys();
  assert.equal(service.isUnlocked(), false);
  service.unlock();
  await assert.rejects(service.decryptText(stored, "note"));
});
