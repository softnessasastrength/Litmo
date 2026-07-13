import assert from "node:assert/strict";
import test from "node:test";
import {
  confirmSnapshot,
  consentLifecycleStates,
  createConsentSnapshot,
  hasDualConfirmation,
  invalidateForMaterialChange,
  verifyConsentSnapshotIntegrity,
  withdrawConsent,
} from "./consentSnapshot.ts";
const ids = {
  a: "10000000-0000-4000-8000-000000000001",
  b: "10000000-0000-4000-8000-000000000002",
  pa: "20000000-0000-4000-8000-000000000001",
  pb: "20000000-0000-4000-8000-000000000002",
  snapshot: "30000000-0000-4000-8000-000000000001",
  session: "40000000-0000-4000-8000-000000000001",
};
const profile = (side: "a" | "b", version = 1) => ({
  id: side === "a" ? ids.pa : ids.pb,
  userId: ids[side],
  version,
  createdAt: "2026-07-11T10:00:00Z",
  rules: [
    {
      dimension: "contact_type",
      value: "side_by_side",
      state: "welcomed",
      canReceive: true,
      canOffer: true,
    },
  ],
});
const make = () =>
  createConsentSnapshot({
    id: ids.snapshot,
    sessionId: ids.session,
    profileA: profile("a"),
    profileB: profile("b"),
    createdAt: "2026-07-11T12:00:00Z",
  });
test("snapshot references exact immutable profile versions", () => {
  const snapshot = make();
  assert.equal(snapshot.profileAVersion, 1);
  assert.equal(snapshot.profileBVersion, 1);
  assert.equal(snapshot.compatibility.consentGranted, false);
});
test("confirmation requires the exact fingerprint", () => {
  const snapshot = confirmSnapshot(
    make(),
    ids.a,
    make().fingerprint,
    "2026-07-11T12:01:00Z",
  );
  assert.ok(snapshot.confirmations[ids.a]);
  assert.throws(() =>
    confirmSnapshot(snapshot, ids.b, "changed", "2026-07-11T12:02:00Z"),
  );
});
test("material version change invalidates all confirmations", () => {
  const confirmed = confirmSnapshot(
    make(),
    ids.a,
    make().fingerprint,
    "2026-07-11T12:01:00Z",
  );
  const changed = invalidateForMaterialChange(
    confirmed,
    profile("a", 2),
    profile("b"),
    "2026-07-11T12:02:00Z",
  );
  assert.deepEqual(changed.confirmations, {});
  assert.notEqual(changed.fingerprint, confirmed.fingerprint);
});
for (const state of consentLifecycleStates)
  test(`withdrawal fails closed during ${state}`, () => {
    const withdrawn = withdrawConsent(
      make(),
      ids.a,
      state,
      "2026-07-11T12:03:00Z",
    );
    assert.equal(withdrawn.withdrawnBy, ids.a);
    assert.deepEqual(withdrawn.confirmations, {});
    assert.throws(() =>
      confirmSnapshot(
        withdrawn,
        ids.b,
        withdrawn.fingerprint,
        "2026-07-11T12:04:00Z",
      ),
    );
  });

test("hasDualConfirmation and verifyConsentSnapshotIntegrity", () => {
  const base = make();
  assert.equal(verifyConsentSnapshotIntegrity(base), true);
  assert.equal(hasDualConfirmation(base, ids.a, ids.b), false);
  const dual = confirmSnapshot(
    confirmSnapshot(base, ids.a, base.fingerprint, "2026-07-11T12:01:00Z"),
    ids.b,
    base.fingerprint,
    "2026-07-11T12:02:00Z",
  );
  assert.equal(hasDualConfirmation(dual, ids.a, ids.b), true);
  assert.equal(verifyConsentSnapshotIntegrity(dual), true);
});
