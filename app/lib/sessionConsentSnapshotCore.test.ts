import assert from "node:assert/strict";
import { test } from "node:test";
import {
  affirmParty,
  createEmptyDeclaration,
  createMutualSnapshot,
  createPracticePartnerDeclaration,
  isSealed,
  mutualSnapshotRows,
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
