import assert from "node:assert/strict";
import test from "node:test";
import {
  buildEncryptedQr,
  buildProximityInviteInner,
  buildSnapshotStartInner,
  isEnvelopeExpired,
  isProximityInviteInner,
  isSnapshotStartInner,
  nextConnectTransport,
  openEncryptedQr,
  QR_DEFAULT_TTL_MS,
} from "./qrInviteCore.ts";

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

test("colocated encrypted QR round-trips without unlock code", () => {
  const inner = buildProximityInviteInner({
    token: "tok12345",
    beacon: "v1|p1r1s1e1|wn|q1|tabc12xy",
    label: "·demo",
  });
  const built = buildEncryptedQr({
    kind: "proximity_invite",
    inner,
    mode: "colocated",
    now: 1_000_000,
    random: fixedRandom(1),
  });
  assert.ok(built.deepLink.startsWith("litmo://q/v1/"));
  assert.equal(built.envelope.reqConsent, true);
  assert.ok(built.envelope.mk);

  const opened = openEncryptedQr(built.deepLink, { now: 1_000_100 });
  assert.equal(opened.ok, true);
  if (!opened.ok) return;
  assert.equal(opened.kind, "proximity_invite");
  assert.ok(isProximityInviteInner(opened.inner));
  assert.equal(
    (opened.inner as { token: string }).token,
    "tok12345",
  );
});

test("split mode requires unlock code", () => {
  const inner = buildSnapshotStartInner({
    title: "Tonight",
    rows: [{ label: "Time", value: "20 min" }],
  });
  const built = buildEncryptedQr({
    kind: "snapshot_start",
    inner,
    mode: "split",
    now: 2_000_000,
    random: fixedRandom(2),
  });
  assert.equal(built.envelope.mk, undefined);

  const need = openEncryptedQr(built.deepLink, { now: 2_000_100 });
  assert.equal(need.ok, false);
  if (need.ok) return;
  assert.equal(need.reason, "need_unlock");

  const opened = openEncryptedQr(built.deepLink, {
    now: 2_000_100,
    unlockCode: built.unlockCode,
  });
  assert.equal(opened.ok, true);
  if (!opened.ok) return;
  assert.ok(isSnapshotStartInner(opened.inner));
  assert.equal(
    (opened.inner as { notSessionActivation: true }).notSessionActivation,
    true,
  );
});

test("expired envelopes fail closed", () => {
  const built = buildEncryptedQr({
    kind: "nfc_offer",
    inner: { hello: true, notConsentToTouch: true },
    now: 1000,
    ttlMs: 500,
    random: fixedRandom(3),
  });
  assert.equal(isEnvelopeExpired(built.envelope, 1499), false);
  assert.equal(isEnvelopeExpired(built.envelope, 1500), true);
  const opened = openEncryptedQr(built.deepLink, { now: 1000 + QR_DEFAULT_TTL_MS });
  assert.equal(opened.ok, false);
  if (opened.ok) return;
  assert.equal(opened.reason, "expired");
});

test("wrong unlock fails closed", () => {
  const built = buildEncryptedQr({
    kind: "snapshot_start",
    inner: buildSnapshotStartInner({ rows: [{ label: "A", value: "B" }] }),
    mode: "split",
    random: fixedRandom(4),
  });
  const opened = openEncryptedQr(built.deepLink, {
    unlockCode: "not-the-right-key-value!!",
  });
  assert.equal(opened.ok, false);
});

test("degradation ladder prefers NFC then QR then manual", () => {
  assert.equal(
    nextConnectTransport(null, { nfc: true, qr: true }),
    "nfc",
  );
  assert.equal(
    nextConnectTransport(null, { nfc: false, qr: true }),
    "qr",
  );
  assert.equal(
    nextConnectTransport("nfc", { nfc: true, qr: true }),
    "qr",
  );
  assert.equal(
    nextConnectTransport("qr", { nfc: false, qr: true }),
    "manual",
  );
  assert.equal(
    nextConnectTransport(null, { nfc: false, qr: false }),
    "manual",
  );
});

test("share message never claims consent", () => {
  const built = buildEncryptedQr({
    kind: "proximity_invite",
    inner: buildProximityInviteInner({
      token: "x",
      beacon: "v1|p0r0s0e0|wn|q1|tabc12xy",
    }),
    random: fixedRandom(5),
  });
  assert.ok(built.shareMessage.toLowerCase().includes("not consent"));
});
