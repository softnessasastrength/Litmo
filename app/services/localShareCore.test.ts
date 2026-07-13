import assert from "node:assert/strict";
import test from "node:test";
import {
  buildConsentSnapshotReviewPayload,
  buildDiscoveryProfilePayload,
  decryptSharePayload,
  deriveLocalShareSessionKey,
  encodeWireMessage,
  encryptSharePayload,
  generateX25519KeyPair,
  isShareSessionExpired,
  isValidSharePayload,
  LOCAL_SHARE_DEFAULT_TIMEOUT_MS,
  parseWireMessage,
  shareKindLabel,
} from "./localShareCore.ts";

function fixedRandom(seed: number): (n: number) => Uint8Array {
  return (n) => {
    const out = new Uint8Array(n);
    for (let i = 0; i < n; i++) {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      out[i] = seed & 0xff;
    }
    return out;
  };
}

test("ephemeral ECDH both sides derive the same session key", () => {
  const a = generateX25519KeyPair(fixedRandom(1));
  const b = generateX25519KeyPair(fixedRandom(2));
  const keyA = deriveLocalShareSessionKey({
    myPrivate: a.privateKey,
    theirPublic: b.publicKey,
    myPublic: a.publicKey,
  });
  const keyB = deriveLocalShareSessionKey({
    myPrivate: b.privateKey,
    theirPublic: a.publicKey,
    myPublic: b.publicKey,
  });
  assert.deepEqual(Array.from(keyA), Array.from(keyB));
  assert.equal(keyA.length, 32);
});

test("encrypt and decrypt discovery profile payload", () => {
  const a = generateX25519KeyPair(fixedRandom(3));
  const b = generateX25519KeyPair(fixedRandom(4));
  const key = deriveLocalShareSessionKey({
    myPrivate: a.privateKey,
    theirPublic: b.publicKey,
    myPublic: a.publicKey,
  });
  const payload = buildDiscoveryProfilePayload({
    displayName: "Maya",
    pronouns: "she/her",
    bio: "Soft presence, clear stops.",
    now: "2026-07-13T12:00:00.000Z",
  });
  assert.equal(payload.notConsentToTouch, true);
  assert.ok(payload.disclaimer.includes("never consent"));

  const ct = encryptSharePayload(key, payload, fixedRandom(5));
  const opened = decryptSharePayload(key, ct, "discovery_profile");
  assert.deepEqual(opened, payload);
});

test("wrong kind AAD fails closed", () => {
  const a = generateX25519KeyPair(fixedRandom(6));
  const b = generateX25519KeyPair(fixedRandom(7));
  const key = deriveLocalShareSessionKey({
    myPrivate: a.privateKey,
    theirPublic: b.publicKey,
    myPublic: a.publicKey,
  });
  const payload = buildConsentSnapshotReviewPayload({
    rows: [{ label: "Welcomed", value: "Hands, upper back" }],
    now: "2026-07-13T12:00:00.000Z",
  });
  const ct = encryptSharePayload(key, payload, fixedRandom(8));
  assert.equal(decryptSharePayload(key, ct, "discovery_profile"), null);
  assert.ok(decryptSharePayload(key, ct, "consent_snapshot_review"));
});

test("snapshot payload asserts not session activation", () => {
  const payload = buildConsentSnapshotReviewPayload({
    title: "Tonight's review",
    rows: [{ label: "Time", value: "Up to 20 minutes" }],
  });
  assert.equal(payload.notSessionActivation, true);
  assert.equal(payload.notConsentToTouch, true);
  assert.ok(isValidSharePayload(payload));
  assert.equal(isValidSharePayload({ kind: "discovery_profile", v: 1 }), false);
});

test("wire message round-trip and reject unknown version", () => {
  const hello = encodeWireMessage({
    t: "hello",
    v: 1,
    ephemeralPublic: "abc",
    shareKind: "discovery_profile",
    displayLabel: "Maya",
  });
  const parsed = parseWireMessage(hello);
  assert.equal(parsed?.t, "hello");
  assert.equal(parseWireMessage('{"t":"hello","v":99}'), null);
  assert.equal(parseWireMessage("not-json"), null);
});

test("session timeout helper", () => {
  const start = 1_000_000;
  assert.equal(isShareSessionExpired(start, start + 1000), false);
  assert.equal(
    isShareSessionExpired(start, start + LOCAL_SHARE_DEFAULT_TIMEOUT_MS),
    true,
  );
});

test("share kind labels are human-readable", () => {
  assert.equal(shareKindLabel("discovery_profile"), "Discovery profile");
  assert.equal(
    shareKindLabel("consent_snapshot_review"),
    "Consent Snapshot review",
  );
});

test("empty display name is rejected", () => {
  assert.throws(() => buildDiscoveryProfilePayload({ displayName: "  " }));
});
