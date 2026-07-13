import assert from "node:assert/strict";
import test from "node:test";
import {
  buildComparison,
  canCompare,
  compareInvite,
  createInvite,
  exportHostPackage,
  importPeerPackage,
  openSealed,
  sealResult,
  withHostCompareConsent,
  withHostShareConsent,
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

test("seal round-trips with correct key and fails closed with wrong key", () => {
  const sealed = sealResult(sample("lantern"), "secret-seal");
  const open = openSealed(sealed, "secret-seal");
  assert.equal(open?.primary, "lantern");
  assert.equal(openSealed(sealed, "wrong"), null);
});

test("comparison requires dual share and dual compare consent", () => {
  let invite = createInvite(
    "vibe-short",
    "inv1",
    "seal",
    "2026-07-13T00:00:00.000Z",
  );
  const hostSealed = sealResult(sample("hearth"), "seal");
  const peerSealed = sealResult(sample("tidepool"), "seal");
  assert.equal(canCompare(invite), false);
  invite = withHostShareConsent(invite, true, hostSealed);
  invite = withHostCompareConsent(invite, true);
  const imported = importPeerPackage(invite, {
    sealed: peerSealed,
    consentToShare: true,
    consentToCompare: false,
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

test("export package omits sealed result without share consent", () => {
  const invite = createInvite(
    "vibe-short",
    "inv1",
    "seal",
    "2026-07-13T00:00:00.000Z",
  );
  const pack = exportHostPackage(invite);
  assert.equal(pack.sealed, null);
  assert.equal(pack.consentToShare, false);
});
