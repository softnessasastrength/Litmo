import assert from "node:assert/strict";
import test from "node:test";
import {
  generateX25519KeyPair,
  initRatchetAsBob,
  ratchetDecrypt,
  x3dhAsResponder,
} from "./doubleRatchetCore.ts";
import {
  buildDemoPeerResultPackage,
  fictionalPeerResult,
} from "./quizDemoPartner.ts";
import {
  QUIZ_E2E_SESSION_OPEN_PLAIN,
  quizE2eAad,
  type E2eInvitePublic,
} from "./quizE2eProtocol.ts";

function b64url(bytes: Uint8Array): string {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function fromB64url(s: string): Uint8Array {
  const pad = s.length % 4 === 0 ? "" : "=".repeat(4 - (s.length % 4));
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/") + pad;
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

test("demo peer package decrypts for host and fails for wrong host keys", () => {
  const hostIk = generateX25519KeyPair();
  const hostSpk = generateX25519KeyPair();
  const invite: E2eInvitePublic = {
    v: 3,
    kind: "public-invite",
    protocol: "x3dh+double-ratchet",
    invitePublicId: "inv_demo_1",
    quizId: "vibe-short",
    hostBundle: {
      identityPublic: b64url(hostIk.publicKey),
      signedPrekeyPublic: b64url(hostSpk.publicKey),
    },
    createdAt: "2026-07-13T00:00:00.000Z",
  };

  const peerResult = fictionalPeerResult("vibe-short", invite.createdAt);
  const pack = buildDemoPeerResultPackage(invite, peerResult, {
    consentToCompare: true,
  });
  assert.ok(!("error" in pack));
  assert.equal(pack.consentToShare, true);
  assert.ok(pack.handshake);

  const shared = x3dhAsResponder({
    identityPrivateB: hostIk.privateKey,
    signedPrekeyPrivateB: hostSpk.privateKey,
    identityPublicA: fromB64url(pack.handshake!.peerIdentityPublic),
    ephemeralPublicA: fromB64url(pack.handshake!.peerEphemeralPublic),
  });
  let bob = initRatchetAsBob(shared, hostSpk);
  const aad = quizE2eAad(
    invite.quizId,
    invite.invitePublicId,
    invite.hostBundle.identityPublic,
  );
  const openDec = ratchetDecrypt(bob, pack.handshake!.sessionOpen, aad);
  assert.ok(openDec);
  assert.equal(openDec.plaintext, QUIZ_E2E_SESSION_OPEN_PLAIN);
  bob = openDec.state;
  const resultDec = ratchetDecrypt(bob, pack.message, aad);
  assert.ok(resultDec);
  assert.equal(JSON.parse(resultDec.plaintext).primary, "lantern");

  // Wrong host private keys cannot open
  const otherIk = generateX25519KeyPair();
  const otherSpk = generateX25519KeyPair();
  const badShared = x3dhAsResponder({
    identityPrivateB: otherIk.privateKey,
    signedPrekeyPrivateB: otherSpk.privateKey,
    identityPublicA: fromB64url(pack.handshake!.peerIdentityPublic),
    ephemeralPublicA: fromB64url(pack.handshake!.peerEphemeralPublic),
  });
  const badBob = initRatchetAsBob(badShared, otherSpk);
  assert.equal(
    ratchetDecrypt(badBob, pack.handshake!.sessionOpen, aad),
    null,
  );
});

test("fictional peer result is clearly non-authority weather", () => {
  const r = fictionalPeerResult("vibe-short");
  assert.equal(r.quizId, "vibe-short");
  assert.match(r.notes.join(" "), /Fictional demo|never grant consent/i);
});
