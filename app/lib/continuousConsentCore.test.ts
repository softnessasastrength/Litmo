/**
 * WHAT: Continuous consent pure law tests.
 * WHY: Second-by-second authority must not regress into silence=yes or slow stop.
 * CONSENT: Soft Signal L0 free; joint green required for welcomed; mask wins.
 * SEE: docs/CONTINUOUS_CONSENT_SYSTEM.md
 */

import assert from "node:assert/strict";
import test from "node:test";
import {
  PRIVILEGE,
  applyReGreen,
  applySoftSignalL0,
  applyYellow,
  continuousMayFireSoftSignal,
  continuousStopFasterThanReGreen,
  effectiveZonePrivilege,
  emptyMask,
  jointContactAllowed,
  jointPrivilegeCap,
  killZone,
  privilegeCapForColor,
  privilegeForSealedStatus,
  unionMasks,
  withdrawLevelIsTerminalSession,
  zoneContactAllowed,
  type ContinuousSessionSnapshot,
  type ContinuousPartyState,
} from "./continuousConsentCore.ts";

function party(
  color: ContinuousPartyState["color"],
  entered = true,
): ContinuousPartyState {
  return {
    color,
    lastHeartbeatAtMs: 1,
    lastSoftSignalAtMs: null,
    enteredContinuous: entered,
  };
}

function baseSnap(
  partial?: Partial<ContinuousSessionSnapshot>,
): ContinuousSessionSnapshot {
  return {
    sessionId: "s1",
    lifecycleActive: true,
    sealed: true,
    fingerprintCurrent: true,
    withdrawn: false,
    partyA: party("GREEN"),
    partyB: party("GREEN"),
    maskA: emptyMask(),
    maskB: emptyMask(),
    continuousExpiresAtMs: 1_000_000,
    hardEndsAtMs: null,
    nowMs: 0,
    ...partial,
  };
}

test("stop is faster than re-green arm", () => {
  assert.equal(continuousStopFasterThanReGreen(), true);
});

test("Soft Signal L0 forces non-green", () => {
  const next = applySoftSignalL0(party("GREEN"), 42);
  assert.equal(next.color, "RED");
  assert.equal(next.lastSoftSignalAtMs, 42);
});

test("yellow caps joint privilege below welcomed", () => {
  assert.equal(jointPrivilegeCap("GREEN", "GREEN"), PRIVILEGE.WELCOMED_SEALED);
  assert.equal(jointPrivilegeCap("GREEN", "YELLOW"), PRIVILEGE.SOFT_LIMIT_CARE);
  assert.equal(jointPrivilegeCap("GREEN", "RED"), PRIVILEGE.NONE);
});

test("jointContactAllowed requires dual green and seal", () => {
  assert.equal(
    jointContactAllowed(baseSnap(), PRIVILEGE.WELCOMED_SEALED),
    true,
  );
  assert.equal(
    jointContactAllowed(
      baseSnap({ partyB: party("YELLOW") }),
      PRIVILEGE.WELCOMED_SEALED,
    ),
    false,
  );
  assert.equal(
    jointContactAllowed(
      baseSnap({ partyB: party("YELLOW") }),
      PRIVILEGE.SOFT_LIMIT_CARE,
    ),
    true,
  );
  assert.equal(
    jointContactAllowed(baseSnap({ sealed: false }), PRIVILEGE.SOFT_LIMIT_CARE),
    false,
  );
  assert.equal(
    jointContactAllowed(baseSnap({ withdrawn: true }), PRIVILEGE.SOFT_LIMIT_CARE),
    false,
  );
});

test("heartbeat expiry fails closed", () => {
  assert.equal(
    jointContactAllowed(
      baseSnap({ continuousExpiresAtMs: 10, nowMs: 10 }),
      PRIVILEGE.SOFT_LIMIT_CARE,
    ),
    false,
  );
});

test("hard end fails closed", () => {
  assert.equal(
    jointContactAllowed(
      baseSnap({ hardEndsAtMs: 5, nowMs: 5 }),
      PRIVILEGE.SOFT_LIMIT_CARE,
    ),
    false,
  );
});

test("zone kill mask beats sealed welcomed", () => {
  const snap = baseSnap({
    maskA: killZone(emptyMask(), "shoulders"),
  });
  assert.equal(
    zoneContactAllowed(snap, "shoulders", PRIVILEGE.WELCOMED_SEALED),
    false,
  );
  assert.equal(
    zoneContactAllowed(snap, "hands", PRIVILEGE.WELCOMED_SEALED),
    true,
  );
  assert.equal(
    effectiveZonePrivilege(snap, "shoulders", "welcomed"),
    PRIVILEGE.NONE,
  );
});

test("union masks combine kills", () => {
  const u = unionMasks(killZone(emptyMask(), "face"), killZone(emptyMask(), "neck"));
  assert.equal(u.zonesOff.has("face"), true);
  assert.equal(u.zonesOff.has("neck"), true);
});

test("soft_limit sealed status is first-class care rank", () => {
  assert.equal(privilegeForSealedStatus("soft_limit"), PRIVILEGE.SOFT_LIMIT_CARE);
  assert.equal(privilegeForSealedStatus("off_limits"), PRIVILEGE.NONE);
  assert.equal(privilegeForSealedStatus("unknown"), PRIVILEGE.NONE);
});

test("re-green only from yellow/green", () => {
  assert.equal(applyReGreen(party("YELLOW"), 9).color, "GREEN");
  assert.equal(applyReGreen(party("RED"), 9).color, "RED");
  assert.equal(applyYellow(party("GREEN")).color, "YELLOW");
  assert.equal(applyYellow(party("RED")).color, "RED");
});

test("Soft Signal may fire unless BLACK", () => {
  assert.equal(continuousMayFireSoftSignal(party("GREEN")), true);
  assert.equal(continuousMayFireSoftSignal(party("RED")), true);
  assert.equal(continuousMayFireSoftSignal(party("BLACK")), false);
});

test("L0–L2 are terminal session withdraw levels", () => {
  assert.equal(withdrawLevelIsTerminalSession("L0_SOFT_SIGNAL"), true);
  assert.equal(withdrawLevelIsTerminalSession("L3_YELLOW_SLOW"), false);
});

test("privilege caps by color", () => {
  assert.equal(privilegeCapForColor("GREEN"), PRIVILEGE.WELCOMED_SEALED);
  assert.equal(privilegeCapForColor("YELLOW"), PRIVILEGE.SOFT_LIMIT_CARE);
  assert.equal(privilegeCapForColor("RED"), PRIVILEGE.NONE);
});

test("must enter continuous before joint contact", () => {
  assert.equal(
    jointContactAllowed(
      baseSnap({ partyA: party("GREEN", false) }),
      PRIVILEGE.SOFT_LIMIT_CARE,
    ),
    false,
  );
});
