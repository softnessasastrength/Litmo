import assert from "node:assert/strict";
import test from "node:test";
import { guidePartnerFlow } from "./quizPartnerFlowCore.ts";
import {
  createInvite,
  withLocalCompareConsent,
  withLocalShareConsent,
  withPartnerShare,
  type ShareableQuizResult,
} from "./quizShareCore.ts";

const sample = (primary: "hearth" | "lantern"): ShareableQuizResult => ({
  quizId: "vibe-short",
  primary,
  secondary: null,
  mixPercent: { hearth: 40, lantern: 40, tidepool: 20 },
  completedAt: "2026-07-13T00:00:00.000Z",
  notes: ["soft"],
});

test("no invite guides create", () => {
  const g = guidePartnerFlow(null, {
    hasLocalQuizResult: false,
    isDemo: false,
  });
  assert.equal(g.primaryAction, "create");
  assert.match(g.safetyLine, /never consent/i);
});

test("host without session guides package or demo practice", () => {
  const inv = createInvite(
    "vibe-short",
    "i1",
    "host",
    "2026-07-13T00:00:00.000Z",
    "{}",
  );
  assert.equal(
    guidePartnerFlow(inv, { hasLocalQuizResult: true, isDemo: false })
      .primaryAction,
    "show_package",
  );
  assert.equal(
    guidePartnerFlow(inv, { hasLocalQuizResult: true, isDemo: true })
      .primaryAction,
    "practice_demo",
  );
});

test("ready session without share asks for share after quiz", () => {
  let inv = createInvite(
    "vibe-short",
    "i1",
    "host",
    "2026-07-13T00:00:00.000Z",
    "{}",
  );
  inv = { ...inv, sessionReady: true };
  assert.equal(
    guidePartnerFlow(inv, { hasLocalQuizResult: false, isDemo: false })
      .primaryAction,
    "take_quiz",
  );
  assert.equal(
    guidePartnerFlow(inv, { hasLocalQuizResult: true, isDemo: false })
      .primaryAction,
    "share",
  );
});

test("mutual consent path reaches open_compare", () => {
  let inv = createInvite(
    "vibe-short",
    "i1",
    "host",
    "2026-07-13T00:00:00.000Z",
    "{}",
  );
  inv = withLocalShareConsent(
    { ...inv, sessionReady: true },
    true,
    sample("hearth"),
    '{"cipher":true}',
  );
  inv = withLocalCompareConsent(inv, true);
  const withPeer = withPartnerShare(inv, {
    result: sample("lantern"),
    consentToShare: true,
    consentToCompare: true,
    cipherPackage: "{}",
  });
  assert.ok(!("error" in withPeer));
  const g = guidePartnerFlow(withPeer, {
    hasLocalQuizResult: true,
    isDemo: false,
  });
  assert.equal(g.primaryAction, "open_compare");
  assert.equal(g.stepIndex, 4);
});
