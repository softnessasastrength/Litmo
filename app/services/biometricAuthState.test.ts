import assert from "node:assert/strict";
import test from "node:test";
import {
  BACKGROUND_REAUTH_MS,
  biometricReducer,
  biometricRequiredForAuthStatus,
  canRevealAfterAuthentication,
  initialBiometricState,
  shouldRequireReauthentication,
} from "./biometricAuthState.ts";

test("launch starts fully covered and locked", () => {
  assert.equal(initialBiometricState.status, "locked");
  assert.equal(initialBiometricState.privacyShielded, true);
});

test("Face ID is required only for real account sessions", () => {
  for (const status of [
    "authenticated",
    "onboarding",
    "authenticating",
    "registering",
  ] as const) {
    assert.equal(biometricRequiredForAuthStatus(status), true);
  }
  for (const status of [
    "locked",
    "demo",
    "error",
    "expired",
    "revoked",
  ] as const) {
    assert.equal(biometricRequiredForAuthStatus(status), false);
  }
});

test("content remains covered while checking and authenticating", () => {
  const checking = biometricReducer(initialBiometricState, { type: "CHECK" });
  const authenticating = biometricReducer(checking, { type: "AUTHENTICATE" });
  assert.equal(checking.privacyShielded, true);
  assert.equal(authenticating.privacyShielded, true);
});

test("only successful system authentication reveals content", () => {
  const unlocked = biometricReducer(initialBiometricState, { type: "UNLOCK" });
  assert.deepEqual(unlocked, {
    status: "unlocked",
    message: "",
    privacyShielded: false,
  });
});

test("unavailable and error states fail closed with clear copy", () => {
  for (const status of ["unavailable", "error"] as const) {
    const failed = biometricReducer(initialBiometricState, {
      type: "FAIL",
      status,
      message: "Face ID cannot be used.",
    });
    assert.equal(failed.status, status);
    assert.equal(failed.privacyShielded, true);
    assert.match(failed.message, /Face ID/);
  }
});

test("background threshold is inclusive and does not lock short interruptions", () => {
  assert.equal(shouldRequireReauthentication(1_000, 1_000 + 29_999), false);
  assert.equal(
    shouldRequireReauthentication(1_000, 1_000 + BACKGROUND_REAUTH_MS),
    true,
  );
  assert.equal(shouldRequireReauthentication(null, 99_000), false);
});

test("locking immediately restores the privacy shield", () => {
  const unlocked = biometricReducer(initialBiometricState, { type: "UNLOCK" });
  const locked = biometricReducer(unlocked, { type: "LOCK" });
  assert.equal(locked.status, "locked");
  assert.equal(locked.privacyShielded, true);
});

test("a late authentication result cannot reveal a backgrounded app", () => {
  assert.equal(canRevealAfterAuthentication("active"), true);
  assert.equal(canRevealAfterAuthentication("inactive"), false);
  assert.equal(canRevealAfterAuthentication("background"), false);
});
