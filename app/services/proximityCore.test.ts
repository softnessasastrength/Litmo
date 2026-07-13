import assert from "node:assert/strict";
import test from "node:test";
import {
  bandForResonance,
  buildBeacon,
  buildIdentityReveal,
  buildRadarMatch,
  computeResonance,
  decodeBeaconFromDiscovery,
  encodeBeaconForDiscovery,
  mayRevealIdentity,
  nextDisclosurePhase,
  openIdentityReveal,
  parseProximityWire,
  sealIdentityReveal,
  deriveLocalShareSessionKey,
  generateX25519KeyPair,
  encodeProximityWire,
} from "./proximityCore.ts";

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

test("beacon discovery encode/decode round-trip", () => {
  const beacon = buildBeacon({
    axes: { pace: 2, presence: 1, sensory: 0, repair: 3 },
    weather: "hearth",
    quiet: true,
    token: "abc12xyz",
    now: 1,
    tlAnon: { pressure: 1, speed: 2, duration: 0, openness: 2 },
  });
  const encoded = encodeBeaconForDiscovery(beacon);
  const decoded = decodeBeaconFromDiscovery(encoded);
  assert.ok(decoded);
  assert.equal(decoded.token, "abc12xyz");
  assert.equal(decoded.weather, "hearth");
  assert.equal(decoded.quiet, true);
  assert.deepEqual(decoded.axes, beacon.axes);
  assert.deepEqual(decoded.tlAnon, beacon.tlAnon);
});

test("beacon without TL axes still decodes", () => {
  const beacon = buildBeacon({
    axes: { pace: 1, presence: 1, sensory: 1, repair: 1 },
    token: "notlnotl",
  });
  assert.equal(beacon.tlAnon, null);
  const decoded = decodeBeaconFromDiscovery(encodeBeaconForDiscovery(beacon));
  assert.ok(decoded);
  assert.equal(decoded.tlAnon, null);
});

test("decode rejects malformed or identity-like payloads", () => {
  assert.equal(decodeBeaconFromDiscovery("Maya|she/her"), null);
  assert.equal(decodeBeaconFromDiscovery(""), null);
  assert.equal(decodeBeaconFromDiscovery("v1|bad"), null);
});

test("resonance is high for similar axes and low for opposite", () => {
  const a = { pace: 1, presence: 1, sensory: 1, repair: 1 };
  const similar = { pace: 1, presence: 2, sensory: 1, repair: 1 };
  const opposite = { pace: 3, presence: 3, sensory: 3, repair: 3 };
  assert.ok(computeResonance(a, similar) > computeResonance(a, opposite));
  assert.equal(bandForResonance(90), "very_aligned");
  assert.equal(bandForResonance(10), "distant");
});

test("radar match never claims safety", () => {
  const self = buildBeacon({
    axes: { pace: 1, presence: 1, sensory: 1, repair: 1 },
    token: "selfself",
  });
  const peer = buildBeacon({
    axes: { pace: 1, presence: 1, sensory: 1, repair: 1 },
    token: "peerpeer",
  });
  const match = buildRadarMatch({
    peerKey: "p1",
    ephemeralLabel: "·peer",
    selfBeacon: self,
    peerBeacon: peer,
  });
  assert.ok(match.disclaimer.toLowerCase().includes("not safety"));
  assert.ok(match.disclaimer.toLowerCase().includes("not consent"));
  assert.equal(match.tlCompatibility, null);
});

test("radar match includes TL compatibility when both broadcast axes", () => {
  const self = buildBeacon({
    axes: { pace: 1, presence: 1, sensory: 1, repair: 1 },
    token: "selfself",
    tlAnon: { pressure: 1, speed: 1, duration: 1, openness: 1 },
  });
  const peer = buildBeacon({
    axes: { pace: 1, presence: 1, sensory: 1, repair: 1 },
    token: "peerpeer",
    tlAnon: { pressure: 1, speed: 1, duration: 1, openness: 1 },
  });
  const match = buildRadarMatch({
    peerKey: "p1",
    ephemeralLabel: "·peer",
    selfBeacon: self,
    peerBeacon: peer,
  });
  assert.equal(match.tlCompatibility, 100);
  assert.ok(match.tlDisclaimer.toLowerCase().includes("not consent"));
});

test("identity reveal requires mutual consent and encrypted channel", () => {
  assert.equal(
    mayRevealIdentity({
      localAcceptedReveal: true,
      peerAcceptedReveal: true,
      encryptedChannelReady: true,
      softSignaled: false,
    }),
    true,
  );
  assert.equal(
    mayRevealIdentity({
      localAcceptedReveal: true,
      peerAcceptedReveal: false,
      encryptedChannelReady: true,
      softSignaled: false,
    }),
    false,
  );
  assert.equal(
    mayRevealIdentity({
      localAcceptedReveal: true,
      peerAcceptedReveal: true,
      encryptedChannelReady: true,
      softSignaled: true,
    }),
    false,
  );
});

test("disclosure phases fail closed toward radar", () => {
  assert.equal(
    nextDisclosurePhase({
      radioOn: true,
      softSignaled: false,
      connected: false,
      encrypted: false,
      mutualInterest: false,
      localReveal: false,
      peerReveal: false,
      identityShown: false,
    }),
    "radar",
  );
  assert.equal(
    nextDisclosurePhase({
      radioOn: true,
      softSignaled: true,
      connected: true,
      encrypted: true,
      mutualInterest: true,
      localReveal: true,
      peerReveal: true,
      identityShown: true,
    }),
    "soft_signaled",
  );
});

test("identity seal/open under ephemeral ECDH", () => {
  const a = generateX25519KeyPair(fixedRandom(1));
  const b = generateX25519KeyPair(fixedRandom(2));
  const key = deriveLocalShareSessionKey({
    myPrivate: a.privateKey,
    theirPublic: b.publicKey,
    myPublic: a.publicKey,
  });
  const identity = buildIdentityReveal({
    displayName: "Sam",
    pronouns: "they/them",
    shortIntro: "Soft hello.",
  });
  const ct = sealIdentityReveal(key, identity);
  const opened = openIdentityReveal(key, ct);
  assert.ok(opened);
  assert.equal(opened.displayName, "Sam");
  assert.equal(opened.notConsentToTouch, true);
  assert.equal(opened.notSessionActivation, true);
});

test("wire parse rejects unknown version", () => {
  const ok = encodeProximityWire({
    t: "px_soft_signal",
    v: 1,
    reason: "soft_signal",
  });
  assert.equal(parseProximityWire(ok)?.t, "px_soft_signal");
  assert.equal(parseProximityWire('{"t":"px_soft_signal","v":99}'), null);
});
