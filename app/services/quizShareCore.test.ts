import assert from "node:assert/strict";
import test from "node:test";
import {
  buildComparison,
  canCompare,
  compareInvite,
  createInvite,
  openSealed,
  sealResult,
  withLocalCompareConsent,
  withLocalShareConsent,
  withPartnerShare,
  type ShareableQuizResult,
} from "./quizShareCore.ts";

const sample = (
  primary: "hearth" | "lantern" | "tidepool",
): ShareableQuizResult => ({
  quizId: "vibe-short",
  primary,
  secondary: null,
  mixPercent: {
    hearth: primary === "hearth" ? 70 : 10,
    lantern: primary === "lantern" ? 70 : 10,
    tidepool: primary === "tidepool" ? 70 : 20,
  },
  completedAt: "2026-07-13T00:00:00.000Z",
  notes: ["Soft note"],
});

test("legacy seal round-trips with correct key and fails closed with wrong key", () => {
  const sealed = sealResult(sample("lantern"), "secret-seal");
  const open = openSealed(sealed, "secret-seal");
  assert.equal(open?.primary, "lantern");
  assert.equal(openSealed(sealed, "wrong"), null);
});

test("comparison requires dual share and dual compare consent (E2E plaintext path)", () => {
  let invite = createInvite(
    "vibe-short",
    "inv1",
    "host",
    "2026-07-13T00:00:00.000Z",
  );
  assert.equal(canCompare(invite), false);
  invite = withLocalShareConsent(
    invite,
    true,
    sample("hearth"),
    JSON.stringify({ v: 3, kind: "result", message: { ciphertext: "x" } }),
  );
  invite = withLocalCompareConsent(invite, true);
  const imported = withPartnerShare(invite, {
    result: sample("tidepool"),
    consentToShare: true,
    consentToCompare: false,
    cipherPackage: JSON.stringify({ v: 3, kind: "result" }),
  });
  assert.ok(!("error" in imported));
  assert.equal(canCompare(imported), false);
  const ready = {
    ...imported,
    peerConsentToCompare: true,
  };
  assert.equal(canCompare(ready), true);
  const comparison = compareInvite(ready);
  assert.ok(!("error" in comparison));
  assert.ok(comparison.notes.some((n) => n.kind === "safety"));
  assert.match(comparison.consentReminder, /never consent/i);
});

test("buildComparison never claims safety", () => {
  const c = buildComparison(sample("hearth"), sample("hearth"));
  assert.ok(c.notes.some((n) => n.kind === "same-primary"));
  assert.ok(c.consentReminder.includes("Consent Snapshot"));
});

test("share consent fails closed without a result and cipher package", () => {
  const invite = createInvite(
    "vibe-short",
    "inv1",
    "host",
    "2026-07-13T00:00:00.000Z",
  );
  const attempted = withLocalShareConsent(invite, true, null, null);
  assert.equal(attempted.hostConsentToShare, false);
  assert.equal(attempted.hostResult, null);
  assert.equal(canCompare(attempted), false);

  const half = withLocalShareConsent(invite, true, sample("hearth"), null);
  assert.equal(half.hostConsentToShare, false);
});

test("partner share without consent fails closed", () => {
  const invite = createInvite(
    "vibe-short",
    "inv1",
    "host",
    "2026-07-13T00:00:00.000Z",
  );
  const bad = withPartnerShare(invite, {
    result: sample("lantern"),
    consentToShare: false,
    consentToCompare: true,
    cipherPackage: null,
  });
  assert.ok("error" in bad);
});

test("withdraw local share clears plaintext and cipher", () => {
  let invite = createInvite(
    "vibe-short",
    "inv1",
    "host",
    "2026-07-13T00:00:00.000Z",
  );
  invite = withLocalShareConsent(
    invite,
    true,
    sample("hearth"),
    '{"cipher":true}',
  );
  assert.equal(invite.hostConsentToShare, true);
  invite = withLocalShareConsent(invite, false, null, null);
  assert.equal(invite.hostConsentToShare, false);
  assert.equal(invite.hostResult, null);
  assert.equal(invite.hostCipherPackage, null);
});
