/**
 * Nuclear session lifecycle + Consent Snapshot machine tests.
 * SEE: sessionConsentNuclear.ts · ADR 0062
 */
import assert from "node:assert/strict";
import test from "node:test";
import {
  confirmSnapshot,
  createConsentSnapshot,
  hasDualConfirmation,
  verifyConsentSnapshotIntegrity,
  withdrawConsent,
} from "./consentSnapshot.ts";
import {
  applyNuclearEvent,
  applyWrapUp,
  canActivateSession,
  detectIllegalSnapshotMutation,
  deriveMicrostate,
  emptyWrapUpView,
  evaluateNuclearSessionFeature,
  isMutuallyConfirmed,
  lifecycleAfterRevocation,
  orderOfflineIntents,
  phaseForLifecycle,
  projectNuclearView,
  propagateRevocation,
  reconcileOfflineQueue,
  resolveOfflineIntent,
  type OfflineIntent,
  type SealAuthorityView,
} from "./sessionConsentNuclear.ts";

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

const makeSnapshot = () =>
  createConsentSnapshot({
    id: ids.snapshot,
    sessionId: ids.session,
    profileA: profile("a"),
    profileB: profile("b"),
    createdAt: "2026-07-11T12:00:00Z",
  });

function sealFrom(
  snapshot: ReturnType<typeof makeSnapshot>,
  confA: boolean,
  confB: boolean,
  extra?: Partial<SealAuthorityView>,
): SealAuthorityView {
  return {
    hasSnapshot: true,
    fingerprint: snapshot.fingerprint,
    withdrawn: Boolean(snapshot.withdrawnAt),
    invalidated: false,
    confirmedByA: confA,
    confirmedByB: confB,
    userAId: ids.a,
    userBId: ids.b,
    confirmFingerprintA: confA ? snapshot.fingerprint : null,
    confirmFingerprintB: confB ? snapshot.fingerprint : null,
    ...extra,
  };
}

test("phase map covers coarse lifecycle", () => {
  assert.equal(phaseForLifecycle("consent_pending"), "consent_seal");
  assert.equal(phaseForLifecycle("active"), "active_contact");
  assert.equal(phaseForLifecycle("soft_signaled"), "wrap_up");
  assert.equal(phaseForLifecycle("cancelled"), "terminal");
});

test("dual seal integrity and mutual confirmation", () => {
  const base = makeSnapshot();
  assert.equal(verifyConsentSnapshotIntegrity(base), true);
  assert.equal(hasDualConfirmation(base, ids.a, ids.b), false);

  const one = confirmSnapshot(
    base,
    ids.a,
    base.fingerprint,
    "2026-07-11T12:01:00Z",
  );
  const two = confirmSnapshot(
    one,
    ids.b,
    base.fingerprint,
    "2026-07-11T12:02:00Z",
  );
  assert.equal(hasDualConfirmation(two, ids.a, ids.b), true);
  assert.equal(verifyConsentSnapshotIntegrity(two), true);

  const seal = sealFrom(two, true, true);
  assert.equal(isMutuallyConfirmed(seal), true);
  assert.deepEqual(
    canActivateSession({ lifecycle: "ready", seal }),
    { ok: true },
  );
  assert.equal(
    canActivateSession({ lifecycle: "consent_pending", seal }).ok,
    false,
  );
});

test("illegal in-place fingerprint mutation is detected", () => {
  const base = makeSnapshot();
  const mutated = { ...base, fingerprint: "a".repeat(64) };
  assert.ok(detectIllegalSnapshotMutation(base, mutated).includes("fingerprint"));
});

test("revocation propagation clears confirmations and Soft Signal ends active", () => {
  const dual = confirmSnapshot(
    confirmSnapshot(
      makeSnapshot(),
      ids.a,
      makeSnapshot().fingerprint,
      "2026-07-11T12:01:00Z",
    ),
    ids.b,
    makeSnapshot().fingerprint,
    "2026-07-11T12:02:00Z",
  );
  const prop = propagateRevocation({
    snapshot: dual,
    lifecycle: "active",
    actorId: ids.a,
    cause: "soft_signal",
    at: "2026-07-11T12:10:00Z",
  });
  assert.deepEqual(prop.snapshot?.confirmations, {});
  assert.equal(prop.snapshot?.withdrawnBy, ids.a);
  assert.equal(prop.contactPrivilege, "none");
  assert.equal(prop.lifecycleTransition.ok, true);
  if (prop.lifecycleTransition.ok) {
    assert.equal(prop.lifecycleTransition.state, "soft_signaled");
  }
  assert.equal(lifecycleAfterRevocation("ready", "unilateral_withdraw"), "cancelled");
  assert.equal(
    lifecycleAfterRevocation("ready", "material_invalidation"),
    "consent_pending",
  );
});

test("microstate derives dual_sealed and active_local_soft_signal", () => {
  const snap = makeSnapshot();
  const dual = sealFrom(snap, true, true);
  assert.equal(
    deriveMicrostate({
      lifecycle: "ready",
      seal: dual,
      wrap: emptyWrapUpView(),
    }),
    "dual_sealed",
  );
  assert.equal(
    deriveMicrostate({
      lifecycle: "active",
      seal: dual,
      wrap: emptyWrapUpView(),
      continuousHint: "local_stop",
    }),
    "active_local_soft_signal",
  );
});

test("offline Soft Signal beats offline complete", () => {
  const snap = makeSnapshot();
  const seal = sealFrom(snap, true, true);
  const intents: OfflineIntent[] = [
    {
      kind: "complete",
      sessionId: ids.session,
      actorId: ids.a,
      idempotencyKey: "c1",
      createdAtMs: 100,
    },
    {
      kind: "soft_signal",
      sessionId: ids.session,
      actorId: ids.b,
      idempotencyKey: "s1",
      createdAtMs: 200,
    },
  ];
  const ordered = orderOfflineIntents(intents);
  assert.equal(ordered[0]?.kind, "soft_signal");

  const recon = reconcileOfflineQueue(intents, {
    lifecycle: "active",
    seal,
    serverClockMs: 1000,
  });
  assert.equal(recon.finalLifecycle, "soft_signaled");

  const softOnTerminal = resolveOfflineIntent(
    {
      kind: "complete",
      sessionId: ids.session,
      actorId: ids.a,
      idempotencyKey: "c2",
      createdAtMs: 300,
    },
    {
      lifecycle: "soft_signaled",
      seal: { ...seal, withdrawn: true },
      serverClockMs: 2000,
    },
  );
  assert.equal(softOnTerminal.action, "noop_already_terminal");
});

test("confirm offline rejects withdrawn fingerprint", () => {
  const snap = withdrawConsent(
    makeSnapshot(),
    ids.a,
    "consent_pending",
    "2026-07-11T12:05:00Z",
  );
  const seal = sealFrom(snap, false, false, { withdrawn: true });
  const r = resolveOfflineIntent(
    {
      kind: "confirm_snapshot",
      sessionId: ids.session,
      actorId: ids.b,
      idempotencyKey: "f1",
      createdAtMs: 1,
      fingerprint: snap.fingerprint,
    },
    { lifecycle: "consent_pending", seal, serverClockMs: 1 },
  );
  assert.equal(r.action, "reject");
});

test("wrap-up is independent per party after Soft Signal", () => {
  let view = emptyWrapUpView();
  const a = applyWrapUp(view, "a", "soft_signal_used", "soft_signaled");
  assert.equal(a.ok, true);
  if (a.ok) view = a.view;
  const b = applyWrapUp(view, "b", "ended_normally", "soft_signaled");
  assert.equal(b.ok, true);
  if (b.ok) {
    assert.equal(b.view.bothDone, true);
    assert.equal(b.view.aOutcome, "soft_signal_used");
  }
  assert.equal(
    applyWrapUp(emptyWrapUpView(), "a", "skipped", "active").ok,
    false,
  );
});

test("nuclear events map Soft Signal and dual seal correctly", () => {
  const soft = applyNuclearEvent("active", "SOFT_SIGNAL");
  assert.equal(soft.ok, true);
  if (soft.ok) assert.equal(soft.state, "soft_signaled");

  const dual = applyNuclearEvent("consent_pending", "SNAPSHOT_DUAL_SEALED");
  assert.equal(dual.ok, true);
  if (dual.ok) assert.equal(dual.state, "ready");

  const reopen = applyNuclearEvent("soft_signaled", "SESSION_ACTIVATED");
  assert.equal(reopen.ok, false);
});

test("projectNuclearView contact privilege fail-closed on local Soft Signal", () => {
  const seal = sealFrom(makeSnapshot(), true, true);
  const view = projectNuclearView({
    lifecycle: "active",
    seal,
    wrap: emptyWrapUpView(),
    continuousHint: "local_stop",
  });
  assert.equal(view.contactPrivilege, "none");
  assert.equal(view.microstate, "active_local_soft_signal");
});

test("constitution nuclear feature gate", () => {
  const bad = evaluateNuclearSessionFeature({
    allowsConfirmAfterWithdraw: true,
    allowsActivateWithoutDualSeal: true,
    offlineCompleteBeatsSoftSignal: true,
    mutatesFingerprintInPlace: true,
    softSignalRequiresPeer: true,
    documentsMachine: false,
  });
  assert.equal(bad.ok, false);
  const good = evaluateNuclearSessionFeature({
    allowsConfirmAfterWithdraw: false,
    allowsActivateWithoutDualSeal: false,
    offlineCompleteBeatsSoftSignal: false,
    mutatesFingerprintInPlace: false,
    softSignalRequiresPeer: false,
    documentsMachine: true,
  });
  assert.equal(good.ok, true);
});
