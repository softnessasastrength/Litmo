import assert from "node:assert/strict";
import test from "node:test";
import {
  assertNoViolations,
  boundaryOutranksScore,
  demoMustBeLabeled,
  evaluateFeatureConstitutionally,
  failClosedWhenUncertain,
  isForbiddenEngagementPattern,
  mustNotImplyEmergencyServices,
  sharingRequiresExplicitAction,
  softSignalConstitutionContract,
  socialFactsNeverAuthorizeTouch,
  stopIsEasierThanContinue,
  strictestBoundary,
  trustNeverCertifiesSafety,
  unilateralStopValid,
} from "./constitutionInvariants.ts";

test("Article I: strictest boundary always wins", () => {
  assert.equal(strictestBoundary("welcomed", "off_limits"), "off_limits");
  assert.equal(strictestBoundary("soft_limit", "ask_first"), "soft_limit");
  assert.equal(strictestBoundary("welcomed", "soft_limit"), "soft_limit");
});

test("Article I: Soft Signal easier than continue", () => {
  assert.equal(
    stopIsEasierThanContinue({
      softSignalOrStop: 1,
      continueOrExpand: 5,
    }),
    true,
  );
  assert.equal(
    stopIsEasierThanContinue({
      softSignalOrStop: 10,
      continueOrExpand: 2,
    }),
    false,
  );
});

test("Article I: unilateral stop never needs peer or reason", () => {
  assert.equal(
    unilateralStopValid({ peerConsentedToStop: false, reasonProvided: false }),
    true,
  );
  assert.equal(
    unilateralStopValid({ reasonRequiredBySystem: true }),
    false,
  );
});

test("Article I: social facts never authorize touch", () => {
  assert.equal(socialFactsNeverAuthorizeTouch(), true);
});

test("Article II: no public safety scores", () => {
  assert.ok(trustNeverCertifiesSafety({ publicSafetyScore: true }));
  assert.equal(trustNeverCertifiesSafety({}), null);
});

test("Article II: no false emergency dispatch copy", () => {
  assert.equal(
    mustNotImplyEmergencyServices("Soft Signal is not emergency services."),
    true,
  );
  assert.equal(
    mustNotImplyEmergencyServices("We will send help and dispatch emergency."),
    false,
  );
});

test("Article III: sharing requires explicit action", () => {
  assert.equal(
    sharingRequiresExplicitAction({
      userInitiatedShare: true,
      autoSharedWithNetwork: false,
      defaultPublicProfile: false,
    }),
    true,
  );
  assert.equal(
    sharingRequiresExplicitAction({
      userInitiatedShare: true,
      autoSharedWithNetwork: true,
      defaultPublicProfile: false,
    }),
    false,
  );
});

test("Article IV: forbidden engagement patterns listed", () => {
  assert.equal(isForbiddenEngagementPattern("streak_punishment"), true);
  assert.equal(isForbiddenEngagementPattern("helpful_reminder"), false);
  assert.equal(
    boundaryOutranksScore({
      explicitBoundary: "off_limits",
      algorithmWants: "welcomed",
    }),
    "off_limits",
  );
});

test("Article V/VII: fail closed and labeled demo", () => {
  assert.equal(
    failClosedWhenUncertain({
      consentDataMissing: true,
      authorizationUncertain: false,
      proposedAction: "allow",
    }),
    "deny",
  );
  assert.equal(demoMustBeLabeled({ isDemo: true, labeledAsDemo: true }), true);
  assert.equal(demoMustBeLabeled({ isDemo: true, labeledAsDemo: false }), false);
});

test("Soft Signal contract is sacred and non-negotiable", () => {
  const c = softSignalConstitutionContract();
  assert.equal(c.unilateral, true);
  assert.equal(c.noReasonRequired, true);
  assert.equal(c.notAPenalty, true);
  assert.equal(c.notEmergencyServices, true);
  assert.equal(c.localStopAuthoritative, true);
});

test("evaluateFeatureConstitutionally rejects nuclear anti-patterns", () => {
  const v = evaluateFeatureConstitutionally({
    name: "EvilSwipe",
    infersConsentFromMatch: true,
    publicSafetyScore: true,
    engagementPattern: "swipe_to_consent",
    softSignalHarderThanContinue: true,
  });
  assert.ok(v.length >= 3);
  assert.throws(() => assertNoViolations(v));
  assertNoViolations(
    evaluateFeatureConstitutionally({
      name: "CarefulHold",
      infersConsentFromMatch: false,
    }),
  );
});
