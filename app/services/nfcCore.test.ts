import assert from "node:assert/strict";
import test from "node:test";
import {
  buildAccept,
  buildFallbackBundle,
  buildOffer,
  buildProfilePlaintext,
  buildSnapshotInitiatePlaintext,
  deriveNfcSessionKey,
  encodeOfferDeepLink,
  generateX25519KeyPair,
  isOfferExpired,
  mayOpenNfcContent,
  openNfcPayload,
  parseOfferDeepLink,
  sealNfcPayload,
  NFC_OFFER_TTL_MS,
} from "./nfcCore.ts";

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

test("offer deep link round-trip preserves intent and consent flags", () => {
  const pair = generateX25519KeyPair(fixedRandom(1));
  const offer = buildOffer({
    intent: "snapshot_initiate",
    pair,
    label: "Soft",
    now: 1_000_000,
    random: fixedRandom(2),
  });
  assert.equal(offer.requiresPostTapConsent, true);
  assert.equal(offer.notConsentToTouch, true);
  assert.equal(offer.notSessionActivation, true);
  const link = encodeOfferDeepLink(offer);
  const parsed = parseOfferDeepLink(link);
  assert.ok(parsed);
  assert.equal(parsed.intent, "snapshot_initiate");
  assert.equal(parsed.sid, offer.sid);
  assert.equal(parsed.code, offer.code);
});

test("expired offers fail closed", () => {
  const pair = generateX25519KeyPair(fixedRandom(3));
  const offer = buildOffer({
    intent: "key_exchange",
    pair,
    now: 1000,
    ttlMs: 500,
    random: fixedRandom(4),
  });
  assert.equal(isOfferExpired(offer, 1400), false);
  assert.equal(isOfferExpired(offer, 1500), true);
  assert.equal(isOfferExpired(offer, 1000 + NFC_OFFER_TTL_MS), true);
});

test("post-tap consent gate requires explicit accept", () => {
  assert.equal(
    mayOpenNfcContent({
      offerValid: true,
      offerExpired: false,
      localAcceptedPostTap: false,
      softCanceled: false,
    }),
    false,
  );
  assert.equal(
    mayOpenNfcContent({
      offerValid: true,
      offerExpired: false,
      localAcceptedPostTap: true,
      softCanceled: false,
    }),
    true,
  );
  assert.equal(
    mayOpenNfcContent({
      offerValid: true,
      offerExpired: false,
      localAcceptedPostTap: true,
      softCanceled: true,
    }),
    false,
  );
});

test("ECDH both sides derive same key; sealed profile opens", () => {
  const a = generateX25519KeyPair(fixedRandom(5));
  const b = generateX25519KeyPair(fixedRandom(6));
  const offer = buildOffer({
    intent: "profile_share",
    pair: a,
    now: Date.now(),
    random: fixedRandom(7),
  });
  const accept = buildAccept({ offer, pair: b });
  const keyA = deriveNfcSessionKey({
    myPrivate: a.privateKey,
    theirPublic: fromB64(accept.epk),
    myPublic: a.publicKey,
    sid: offer.sid,
  });
  const keyB = deriveNfcSessionKey({
    myPrivate: b.privateKey,
    theirPublic: fromB64(offer.epk),
    myPublic: b.publicKey,
    sid: offer.sid,
  });
  assert.deepEqual(Array.from(keyA), Array.from(keyB));

  const plain = buildProfilePlaintext({
    displayName: "River",
    pronouns: "they/them",
    bio: "Soft presence.",
  });
  const sealed = sealNfcPayload(
    keyA,
    offer.sid,
    "profile_share",
    plain,
    fixedRandom(8),
  );
  const opened = openNfcPayload(keyB, sealed);
  assert.deepEqual(opened, plain);
});

test("snapshot initiate payload cannot activate sessions", () => {
  const snap = buildSnapshotInitiatePlaintext({
    rows: [{ label: "Time", value: "Up to 20 minutes" }],
  });
  assert.equal(snap.notSessionActivation, true);
  assert.equal(snap.reviewOnly, true);
  assert.equal(snap.notConsentToTouch, true);
});

test("fallback bundle includes code and non-consent copy", () => {
  const pair = generateX25519KeyPair(fixedRandom(9));
  const offer = buildOffer({
    intent: "profile_share",
    pair,
    random: fixedRandom(10),
  });
  const bundle = buildFallbackBundle(offer);
  assert.equal(bundle.shortCode, offer.code);
  assert.ok(bundle.deepLink.startsWith("litmo://nfc/v1/"));
  assert.ok(bundle.shareMessage.toLowerCase().includes("not consent"));
});

function fromB64(s: string): Uint8Array {
  const pad = s.length % 4 === 0 ? "" : "=".repeat(4 - (s.length % 4));
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/") + pad;
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}
