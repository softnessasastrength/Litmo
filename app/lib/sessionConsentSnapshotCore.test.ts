import assert from "node:assert/strict";
import { test } from "node:test";
import {
  affirmParty,
  createEmptyDeclaration,
  createMutualSnapshot,
  createPracticePartnerDeclaration,
  fingerprintForMutualParties,
  isMutualFingerprintCurrent,
  isSealed,
  isSelfDeclarationCurrentForMutual,
  mutualSnapshotRows,
  parseMutualSnapshot,
  withdrawMutualSnapshot,
  type AffirmationChecks,
} from "./sessionConsentSnapshotCore.ts";

const fullChecks: AffirmationChecks = {
  reviewedBoundaries: true,
  reviewedSafewords: true,
  reviewedAftercare: true,
  affirmedSoftSignal: true,
  thisMomentOnly: true,
  notAGuaranteeOfSafety: true,
};

test("intersection is fail-closed: off_limits wins", () => {
  const a = createEmptyDeclaration({
    boundaries: [
      { zoneId: "hands", label: "Hands", status: "welcomed" },
      { zoneId: "face", label: "Face", status: "welcomed" },
    ],
  });
  const b = createEmptyDeclaration({
    boundaries: [
      { zoneId: "hands", label: "Hands", status: "ask_first" },
      { zoneId: "face", label: "Face", status: "off_limits" },
    ],
  });
  const snap = createMutualSnapshot(a, b);
  assert.ok(snap.intersection.askFirst.includes("Hands"));
  assert.ok(snap.intersection.excluded.includes("Face"));
  assert.ok(!snap.intersection.welcomed.includes("Face"));
  assert.equal(snap.notConsentUntilSealed, true);
  assert.equal(snap.softSignalAlwaysAvailable, true);
  assert.equal(isSealed(snap), false);
});

test("mutual seal requires both affirmations", () => {
  const snap0 = createMutualSnapshot(
    createEmptyDeclaration(),
    createPracticePartnerDeclaration(),
  );
  const snap1 = affirmParty(snap0, "partyA", fullChecks);
  assert.equal(isSealed(snap1), false);
  const snap2 = affirmParty(snap1, "partyB", fullChecks);
  assert.equal(isSealed(snap2), true);
  assert.ok(snap2.sealedAt);
});

test("withdrawal clears seal", () => {
  let snap = createMutualSnapshot(
    createEmptyDeclaration(),
    createPracticePartnerDeclaration(),
  );
  snap = affirmParty(snap, "partyA", fullChecks);
  snap = affirmParty(snap, "partyB", fullChecks);
  assert.equal(isSealed(snap), true);
  snap = withdrawMutualSnapshot(snap, "partyA");
  assert.equal(isSealed(snap), false);
  assert.ok(snap.withdrawnAt);
});

test("rows include Soft Signal and safewords", () => {
  const snap = createMutualSnapshot(
    createEmptyDeclaration({
      safewords: { stop: "Soft Signal", slow: "Yellow", ok: "Green" },
    }),
    createPracticePartnerDeclaration(),
  );
  const rows = mutualSnapshotRows(snap);
  assert.ok(rows.some((r) => r.label === "Soft Signal"));
  assert.ok(rows.some((r) => r.label.includes("safewords")));
  assert.ok(rows.some((r) => r.value.includes("this moment only") || r.label === "Protective truth"));
});

test("fingerprint helpers detect prepare edit mid-seal (Agent 06)", () => {
  const self = createEmptyDeclaration({ mood: "grounded" });
  const partner = createPracticePartnerDeclaration();
  const snap = createMutualSnapshot(self, partner);
  assert.equal(
    fingerprintForMutualParties(self, partner),
    snap.fingerprint,
  );
  assert.equal(isMutualFingerprintCurrent(snap), true);
  assert.equal(isSelfDeclarationCurrentForMutual(snap, self), true);

  // Re-prepare with material content change → package no longer current.
  const edited = createEmptyDeclaration({
    ...self,
    mood: "guarded",
    updatedAt: new Date().toISOString(),
  });
  assert.equal(isSelfDeclarationCurrentForMutual(snap, edited), false);
  assert.notEqual(
    fingerprintForMutualParties(edited, partner),
    snap.fingerprint,
  );
});

test("Soft Signal mid-seal withdraw clears seal (Agent 06)", () => {
  let snap = createMutualSnapshot(
    createEmptyDeclaration(),
    createPracticePartnerDeclaration(),
  );
  snap = affirmParty(snap, "partyA", fullChecks);
  snap = affirmParty(snap, "partyB", fullChecks);
  assert.equal(isSealed(snap), true);
  // soft_signal_while_sealing / post-seal abandon — same withdraw core as Soft Signal mid-seal UI.
  snap = withdrawMutualSnapshot(snap, "partyA");
  assert.equal(isSealed(snap), false);
  assert.ok(snap.withdrawnAt);
  assert.equal(snap.affirmations.partyAAffirmedAt, null);
  assert.equal(snap.affirmations.partyBAffirmedAt, null);
});

test("parseMutualSnapshot wipes seal when stored fingerprint is stale", () => {
  const self = createEmptyDeclaration();
  const partner = createPracticePartnerDeclaration();
  let sealed = createMutualSnapshot(self, partner);
  sealed = affirmParty(sealed, "partyA", fullChecks);
  sealed = affirmParty(sealed, "partyB", fullChecks);
  assert.equal(isSealed(sealed), true);

  const tampered = parseMutualSnapshot({
    ...sealed,
    fingerprint: "not-the-content-fingerprint",
  });
  assert.ok(tampered);
  // Fail-closed: content fingerprint restored; seal + affirmations wiped.
  assert.equal(tampered!.fingerprint, sealed.fingerprint);
  assert.equal(tampered!.sealedAt, null);
  assert.equal(tampered!.affirmations.partyAAffirmedAt, null);
  assert.equal(isSealed(tampered!), false);
});
