import assert from "node:assert/strict";
import test from "node:test";
import {
  generateX25519KeyPair,
  initRatchetAsAlice,
  initRatchetAsBob,
  ratchetDecrypt,
  ratchetEncrypt,
  x3dhAsInitiator,
  x3dhAsResponder,
} from "./doubleRatchetCore.ts";

const SESSION_OPEN = JSON.stringify({ t: "session-open", v: 1 });

test("X3DH initiator and responder agree on shared secret", () => {
  const hostIk = generateX25519KeyPair();
  const hostSpk = generateX25519KeyPair();
  const peerIk = generateX25519KeyPair();
  const peerEk = generateX25519KeyPair();

  const sharedPeer = x3dhAsInitiator({
    identityPrivateA: peerIk.privateKey,
    ephemeralPrivateA: peerEk.privateKey,
    identityPublicB: hostIk.publicKey,
    signedPrekeyPublicB: hostSpk.publicKey,
  });
  const sharedHost = x3dhAsResponder({
    identityPrivateB: hostIk.privateKey,
    signedPrekeyPrivateB: hostSpk.privateKey,
    identityPublicA: peerIk.publicKey,
    ephemeralPublicA: peerEk.publicKey,
  });
  assert.deepEqual(Array.from(sharedPeer), Array.from(sharedHost));
});

test("Double Ratchet encrypt/decrypt round-trip both directions", () => {
  const hostIk = generateX25519KeyPair();
  const hostSpk = generateX25519KeyPair();
  const peerIk = generateX25519KeyPair();
  const peerEk = generateX25519KeyPair();

  const shared = x3dhAsInitiator({
    identityPrivateA: peerIk.privateKey,
    ephemeralPrivateA: peerEk.privateKey,
    identityPublicB: hostIk.publicKey,
    signedPrekeyPublicB: hostSpk.publicKey,
  });

  let alice = initRatchetAsAlice(shared, hostSpk.publicKey);
  let bob = initRatchetAsBob(shared, hostSpk);

  const enc = ratchetEncrypt(
    alice,
    JSON.stringify({ hello: "world" }),
    "quiz:vibe-short",
  );
  alice = enc.state;
  const dec = ratchetDecrypt(bob, enc.message, "quiz:vibe-short");
  assert.ok(dec);
  assert.equal(JSON.parse(dec.plaintext).hello, "world");
  bob = dec.state;

  const enc2 = ratchetEncrypt(
    bob,
    JSON.stringify({ reply: true }),
    "quiz:vibe-short",
  );
  const dec2 = ratchetDecrypt(alice, enc2.message, "quiz:vibe-short");
  assert.ok(dec2);
  assert.equal(JSON.parse(dec2.plaintext).reply, true);
});

test("wrong AAD fails closed", () => {
  const hostIk = generateX25519KeyPair();
  const hostSpk = generateX25519KeyPair();
  const peerIk = generateX25519KeyPair();
  const peerEk = generateX25519KeyPair();
  const shared = x3dhAsInitiator({
    identityPrivateA: peerIk.privateKey,
    ephemeralPrivateA: peerEk.privateKey,
    identityPublicB: hostIk.publicKey,
    signedPrekeyPublicB: hostSpk.publicKey,
  });
  const alice = initRatchetAsAlice(shared, hostSpk.publicKey);
  const bob = initRatchetAsBob(shared, hostSpk);
  const enc = ratchetEncrypt(alice, "secret", "aad-a");
  const bad = ratchetDecrypt(bob, enc.message, "aad-b");
  assert.equal(bad, null);
});

test("peer session-open then host can send (host-first share path)", () => {
  const hostIk = generateX25519KeyPair();
  const hostSpk = generateX25519KeyPair();
  const peerIk = generateX25519KeyPair();
  const peerEk = generateX25519KeyPair();
  const shared = x3dhAsInitiator({
    identityPrivateA: peerIk.privateKey,
    ephemeralPrivateA: peerEk.privateKey,
    identityPublicB: hostIk.publicKey,
    signedPrekeyPublicB: hostSpk.publicKey,
  });
  let alice = initRatchetAsAlice(shared, hostSpk.publicKey);
  let bob = initRatchetAsBob(shared, hostSpk);

  // Bob cannot send yet
  assert.equal(bob.chainKeySend, null);
  assert.throws(() => ratchetEncrypt(bob, "nope", "aad"));

  // Peer session-open establishes Bob send chain
  const open = ratchetEncrypt(alice, SESSION_OPEN, "aad");
  alice = open.state;
  const openDec = ratchetDecrypt(bob, open.message, "aad");
  assert.ok(openDec);
  assert.equal(openDec.plaintext, SESSION_OPEN);
  bob = openDec.state;
  assert.ok(bob.chainKeySend);

  // Host encrypts result first
  const hostEnc = ratchetEncrypt(
    bob,
    JSON.stringify({ quizId: "vibe-short", primary: "hearth" }),
    "aad",
  );
  bob = hostEnc.state;
  const hostDec = ratchetDecrypt(alice, hostEnc.message, "aad");
  assert.ok(hostDec);
  assert.equal(JSON.parse(hostDec.plaintext).primary, "hearth");
  alice = hostDec.state;

  // Peer can still send
  const peerEnc = ratchetEncrypt(
    alice,
    JSON.stringify({ quizId: "vibe-short", primary: "lantern" }),
    "aad",
  );
  const peerDec = ratchetDecrypt(bob, peerEnc.message, "aad");
  assert.ok(peerDec);
  assert.equal(JSON.parse(peerDec.plaintext).primary, "lantern");
});

test("outsider without matching X3DH session cannot decrypt partner result", () => {
  const hostIk = generateX25519KeyPair();
  const hostSpk = generateX25519KeyPair();
  const peerIk = generateX25519KeyPair();
  const peerEk = generateX25519KeyPair();
  const outsiderIk = generateX25519KeyPair();
  const outsiderEk = generateX25519KeyPair();

  const sharedPeer = x3dhAsInitiator({
    identityPrivateA: peerIk.privateKey,
    ephemeralPrivateA: peerEk.privateKey,
    identityPublicB: hostIk.publicKey,
    signedPrekeyPublicB: hostSpk.publicKey,
  });
  let alice = initRatchetAsAlice(sharedPeer, hostSpk.publicKey);
  let bob = initRatchetAsBob(sharedPeer, hostSpk);

  const open = ratchetEncrypt(alice, SESSION_OPEN, "aad|host:H");
  alice = open.state;
  const openDec = ratchetDecrypt(bob, open.message, "aad|host:H");
  assert.ok(openDec);
  bob = openDec.state;

  const result = ratchetEncrypt(
    alice,
    JSON.stringify({ primary: "tidepool", quizId: "vibe-short" }),
    "aad|host:H",
  );

  // Wrong AAD (different host binding) fails closed before any consume
  assert.equal(ratchetDecrypt(bob, result.message, "aad|host:OTHER"), null);

  // Outsider who ran X3DH against same host public keys but different ephemeral
  // still cannot open Alice's ciphertext (different session keys).
  const outsiderShared = x3dhAsInitiator({
    identityPrivateA: outsiderIk.privateKey,
    ephemeralPrivateA: outsiderEk.privateKey,
    identityPublicB: hostIk.publicKey,
    signedPrekeyPublicB: hostSpk.publicKey,
  });
  const outsiderAlice = initRatchetAsAlice(outsiderShared, hostSpk.publicKey);
  assert.equal(
    ratchetDecrypt(outsiderAlice, result.message, "aad|host:H"),
    null,
  );

  // Legitimate host decrypts
  const hostRead = ratchetDecrypt(bob, result.message, "aad|host:H");
  assert.ok(hostRead);
  assert.equal(JSON.parse(hostRead.plaintext).primary, "tidepool");
});

test("tampered ciphertext fails closed", () => {
  const hostSpk = generateX25519KeyPair();
  const peerIk = generateX25519KeyPair();
  const peerEk = generateX25519KeyPair();
  const hostIk = generateX25519KeyPair();
  const shared = x3dhAsInitiator({
    identityPrivateA: peerIk.privateKey,
    ephemeralPrivateA: peerEk.privateKey,
    identityPublicB: hostIk.publicKey,
    signedPrekeyPublicB: hostSpk.publicKey,
  });
  const alice = initRatchetAsAlice(shared, hostSpk.publicKey);
  const bob = initRatchetAsBob(shared, hostSpk);
  const enc = ratchetEncrypt(alice, "secret-weather", "aad");
  const tampered = {
    ...enc.message,
    ciphertext: enc.message.ciphertext.slice(0, -4) + "XXXX",
  };
  assert.equal(ratchetDecrypt(bob, tampered, "aad"), null);
});
