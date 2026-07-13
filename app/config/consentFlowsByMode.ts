/**
 * Consent flow behavior matrix — Maximum Mode vs App Store Safe.
 *
 * WHAT: Machine-readable description of how each consent-critical flow
 *       behaves under MAXIMUM_MODE vs APP_STORE_SAFE. Used by docs generators,
 *       diagnostics, and tests — not a second consent engine.
 * WHY:  Agents and reviewers must not hand-wave “we sanitize iOS.” Every step
 *       is explicit: same fail-closed core, different surfaces and copy.
 * CONSENT: Nothing here grants touch. softSignalStop / dualSeal / ageGate are
 *       always present in both modes.
 * SEE: docs/DUAL_MODE_ARCHITECTURE.md § consent flows
 */

import type { LitmoBuildMode } from "./buildMode.ts";
import { featuresForMode, type LitmoFeatureFlags } from "./features.ts";
import { copyForMode } from "./copy/index.ts";

/**
 * One atomic step in a product flow as experienced under a mode.
 */
export type ConsentFlowStep = {
  id: string;
  /** Screen or domain surface */
  surface: string;
  /** What the user does */
  userAction: string;
  /** What the system does */
  systemBehavior: string;
  /** ConsentPointId or grammar family when applicable */
  consentPoint?: string;
  /** true if this step is omitted or replaced under the mode */
  present: boolean;
  /** Copy / chrome notes */
  presentation: string;
};

export type ConsentFlowDefinition = {
  id: string;
  title: string;
  /** Why this flow exists philosophically */
  philosophy: string;
  /** Steps that are identical in meaning across modes */
  invariantSafetyRules: string[];
  maximum: ConsentFlowStep[];
  appStore: ConsentFlowStep[];
};

/**
 * WHAT: Full catalog of dual-mode consent flows.
 * WHY:  Single source for architecture docs + tests asserting both modes
 *       keep Soft Signal and dual-seal present.
 */
export const CONSENT_FLOWS_BY_MODE: ConsentFlowDefinition[] = [
  {
    id: "first_open_onboarding",
    title: "First-open onboarding (prepare only)",
    philosophy:
      "Onboarding builds maps and weather. It never seals a session and never authorizes touch.",
    invariantSafetyRules: [
      "Under-18 cannot continue About You self-report (demo) or age gate (real).",
      "Unset body zones fail closed to off_limits.",
      "Profile / vibe / TL save are prepare, not mutual consent.",
      "No Soft Signal session stop required during pure onboarding (practice available later).",
    ],
    maximum: [
      {
        id: "welcome",
        surface: "/",
        userAction: "Tap primary",
        systemBehavior: "push /entry",
        consentPoint: "onboard_welcome_continue",
        present: true,
        presentation: "“Connection can be soft.” / Explore the prototype",
      },
      {
        id: "entry_demo",
        surface: "/entry",
        userAction: "Enter fictional demo",
        systemBehavior: "demo status + ND default on + About You",
        consentPoint: "onboard_entry_demo",
        present: true,
        presentation: "Full prototype honesty + MAXIMUM badge",
      },
      {
        id: "about_age",
        surface: "/onboarding/about-you",
        userAction: "Enter age ≥ 18",
        systemBehavior: "gate Next",
        consentPoint: "onboard_age_self_report",
        present: true,
        presentation: "Trips around the sun — adults only",
      },
      {
        id: "boundaries_soft_limit",
        surface: "/onboarding/boundaries",
        userAction: "Set zone welcomed|ask_first|off_limits (+ soft_limit in TL editor)",
        systemBehavior: "local map; unset = off limits",
        consentPoint: "onboard_boundary_zone",
        present: true,
        presentation: "Expanded map, hard stops, private note, sacred non-claims",
      },
      {
        id: "home",
        surface: "/home",
        userAction: "Continue",
        systemBehavior: "open prepare tools only",
        consentPoint: "onboard_boundary_save",
        present: true,
        presentation: "Discovery + learning + Soft Signal practice entry points visible",
      },
    ],
    appStore: [
      {
        id: "welcome",
        surface: "/",
        userAction: "Tap primary",
        systemBehavior: "push /entry",
        consentPoint: "onboard_welcome_continue",
        present: true,
        presentation: "“Clear boundaries. Soft connection.” / Continue",
      },
      {
        id: "entry_demo",
        surface: "/entry",
        userAction: "Demo",
        systemBehavior: "hidden when demoModeSurface false (production app_store)",
        consentPoint: "onboard_entry_demo",
        present: false,
        presentation: "Demo card omitted; passkey path primary",
      },
      {
        id: "about_age",
        surface: "/onboarding/about-you",
        userAction: "Enter age ≥ 18",
        systemBehavior: "gate Next (same)",
        consentPoint: "onboard_age_self_report",
        present: true,
        presentation: "Same gate; calmer surrounding copy on entry/welcome",
      },
      {
        id: "boundaries",
        surface: "/onboarding/boundaries",
        userAction: "Set zones",
        systemBehavior: "same fail-closed map",
        consentPoint: "onboard_boundary_zone",
        present: true,
        presentation: "Map remains; avoid sacred liturgy in surrounding chrome",
      },
      {
        id: "home",
        surface: "/home",
        userAction: "Continue",
        systemBehavior: "open app without RF discovery hubs",
        consentPoint: "onboard_boundary_save",
        present: true,
        presentation: "Proximity/NFC hubs unavailable; consent prepare still present",
      },
    ],
  },
  {
    id: "consent_snapshot_prepare_mutual",
    title: "Consent Snapshot prepare → dual seal",
    philosophy:
      "One-sided declaration is not consent. Both people independently affirm the same fingerprint. Soft Signal always available.",
    invariantSafetyRules: [
      "notConsentAlone / notConsentUntilSealed forced true",
      "soft_limit first-class in intersection",
      "missing zone → off_limits",
      "withdraw clears seal; no reason required",
      "grant arm dwell before Confirm (mayEnableGrantConfirm)",
      "Soft Signal never requires arm",
    ],
    maximum: [
      {
        id: "prepare",
        surface: "/consent-snapshot/prepare",
        userAction: "Mood, energy, boundaries, safewords, aftercare, Soft Signal acks, optional max duration",
        systemBehavior: "save declaration local/account; not sealed",
        consentPoint: "snapshot_prepare_declaration",
        present: true,
        presentation: "Full aftercare + safeword vocabulary + Soft Signal sacred acks",
      },
      {
        id: "mutual",
        surface: "/consent-snapshot/mutual",
        userAction: "Review intersection; affirm self (+ demo partner labeled)",
        systemBehavior: "arm dwell → seal when both; Soft Signal sticky",
        consentPoint: "snapshot_dual_seal",
        present: true,
        presentation: "DEMO banner if practice partner; sacred Soft Signal chrome",
      },
      {
        id: "withdraw",
        surface: "mutual / active",
        userAction: "Soft Signal or withdraw",
        systemBehavior: "local end 0ms; clear affirmations",
        consentPoint: "soft_signal_active / snapshot_withdraw",
        present: true,
        presentation: "“Soft Signal — end now” / sacred banner",
      },
    ],
    appStore: [
      {
        id: "prepare",
        surface: "/consent-snapshot/prepare",
        userAction: "Same structural fields",
        systemBehavior: "same domain createEmptyDeclaration / parse",
        consentPoint: "snapshot_prepare_declaration",
        present: true,
        presentation: "Safewords/aftercare on; calmer instructional copy",
      },
      {
        id: "mutual",
        surface: "/consent-snapshot/mutual",
        userAction: "Same dual affirm + arm",
        systemBehavior: "same affirmParty / isSealed",
        consentPoint: "snapshot_dual_seal",
        present: true,
        presentation: "DEMO still labeled; Soft Signal button uses “End session now”",
      },
      {
        id: "withdraw",
        surface: "mutual / active",
        userAction: "End now",
        systemBehavior: "identical local-first stop pipeline",
        consentPoint: "soft_signal_active",
        present: true,
        presentation: "Calm end-session voice; still no reason field",
      },
    ],
  },
  {
    id: "soft_signal_active_session",
    title: "Active session Soft Signal",
    philosophy:
      "Body freedom before beauty. Stop faster than grant. Local authoritative.",
    invariantSafetyRules: [
      "softSignalLocalCommitMs === 0",
      "no reason modal",
      "log/haptic/hardware failure never undoes stop",
      "not emergency services disclaimer always",
    ],
    maximum: [
      {
        id: "sticky",
        surface: "/session/active",
        userAction: "Tap Soft Signal",
        systemBehavior: "softSignalService.fire → emergencyStop → free",
        consentPoint: "soft_signal_active",
        present: true,
        presentation: "Sacred sticky weight-100 control",
      },
      {
        id: "practice",
        surface: "/soft-signal/practice",
        userAction: "Practice fire",
        systemBehavior: "practice_only; no peer notify",
        consentPoint: "soft_signal_practice",
        present: true,
        presentation: "Muscle memory for freedom",
      },
      {
        id: "hardware",
        surface: "device bridge",
        userAction: "Hardware Soft Signal",
        systemBehavior: "emit warmDescent localOnly preempt",
        consentPoint: "soft_signal_active",
        present: true,
        presentation: "Hardware bridge language on",
      },
    ],
    appStore: [
      {
        id: "sticky",
        surface: "/session/active",
        userAction: "Tap End session now",
        systemBehavior: "same fire pipeline",
        consentPoint: "soft_signal_active",
        present: true,
        presentation: "Review-safe labels; same authority",
      },
      {
        id: "practice",
        surface: "/soft-signal/practice",
        userAction: "Practice ending",
        systemBehavior: "practice_only",
        consentPoint: "soft_signal_practice",
        present: true,
        presentation: "Calmer practice copy",
      },
      {
        id: "hardware",
        surface: "device bridge",
        userAction: "—",
        systemBehavior: "feature hardwareSoftSignal false; null bridge",
        present: false,
        presentation: "No hardware Soft Signal marketing in UI",
      },
    ],
  },
  {
    id: "proximity_nfc_share",
    title: "Proximity / NFC / Multipeer share",
    philosophy:
      "Scan ≠ accept. RF is optional Maximum intensity. App Store omits continuous radio social.",
    invariantSafetyRules: [
      "When present, post-tap Accept required (ConsentAcceptGate)",
      "Decline needs no reason",
      "Never auto-accept on decode",
    ],
    maximum: [
      {
        id: "radar",
        surface: "/proximity",
        userAction: "Enable radar / interest",
        systemBehavior: "opt-in Multipeer interest after gates",
        consentPoint: "proximity_identity_reveal",
        present: true,
        presentation: "Full Proximity Layer hub",
      },
      {
        id: "nfc",
        surface: "/nfc/connect",
        userAction: "Tap tag then Accept",
        systemBehavior: "awaiting_post_tap_consent until Accept",
        consentPoint: "nfc_post_tap_accept",
        present: true,
        presentation: "Careful-connect + QR fallback",
      },
      {
        id: "share",
        surface: "/share/local",
        userAction: "Accept review payload",
        systemBehavior: "review-only TL/snapshot",
        consentPoint: "share_local_accept",
        present: true,
        presentation: "AirDrop-style Multipeer",
      },
    ],
    appStore: [
      {
        id: "radar",
        surface: "/proximity",
        userAction: "Open hub",
        systemBehavior: "Unavailable screen; no RF start",
        present: false,
        presentation: "Honest “not in this build”",
      },
      {
        id: "nfc",
        surface: "/nfc/connect",
        userAction: "Open",
        systemBehavior: "Unavailable; no NDEF session",
        present: false,
        presentation: "Scan never offered",
      },
      {
        id: "share",
        surface: "/share/local",
        userAction: "—",
        systemBehavior: "localMultipeerShare false",
        present: false,
        presentation: "Gate at entry points",
      },
    ],
  },
  {
    id: "age_gate_real",
    title: "Real-account age eligibility",
    philosophy:
      "Adults only. Apple Declared Age Range when available. Not a trust score.",
    invariantSafetyRules: [
      "Production never uses dev self-attest",
      "Not adult → blocked; no home",
      "Face ID is not age proof",
    ],
    maximum: [
      {
        id: "apple",
        surface: "/onboarding/age-gate",
        userAction: "Continue with Apple age range",
        systemBehavior: "record coarse adult signal",
        consentPoint: "onboard_age_apple_range",
        present: true,
        presentation: "Full honesty about what is stored",
      },
      {
        id: "dev_attest",
        surface: "/onboarding/age-gate",
        userAction: "Dev self-attest (non-prod, no native)",
        systemBehavior: "development only",
        consentPoint: "onboard_age_dev_attest",
        present: true,
        presentation: "Available outside production when native missing",
      },
    ],
    appStore: [
      {
        id: "apple",
        surface: "/onboarding/age-gate",
        userAction: "Continue with Apple age range",
        systemBehavior: "same service",
        consentPoint: "onboard_age_apple_range",
        present: true,
        presentation: "Required path for production iOS",
      },
      {
        id: "dev_attest",
        surface: "/onboarding/age-gate",
        userAction: "—",
        systemBehavior: "hidden in production",
        consentPoint: "onboard_age_dev_attest",
        present: false,
        presentation: "Never in App Store production binary path",
      },
    ],
  },
];

/**
 * WHAT: Assert Soft Signal + dual seal present in both mode step lists.
 * WHY:  CI guard against “sanitize” accidentally removing stop.
 */
export function assertSafetyCorePresentInFlowCatalog(): {
  ok: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  for (const flow of CONSENT_FLOWS_BY_MODE) {
    const maxStop = flow.maximum.some(
      (s) => s.present && /soft_signal|End session|withdraw/i.test(
        `${s.consentPoint ?? ""} ${s.userAction} ${s.systemBehavior}`,
      ),
    );
    const storeStop = flow.appStore.some(
      (s) =>
        s.present &&
        /soft_signal|End session|withdraw|end now/i.test(
          `${s.consentPoint ?? ""} ${s.userAction} ${s.systemBehavior}`,
        ),
    );
    // Only enforce on flows that are about stopping / sealing
    if (flow.id === "soft_signal_active_session" || flow.id === "consent_snapshot_prepare_mutual") {
      if (!maxStop) errors.push(`${flow.id}: maximum missing stop/seal step`);
      if (!storeStop) errors.push(`${flow.id}: app_store missing stop/seal step`);
    }
  }
  for (const mode of ["maximum", "app_store"] as const) {
    const f = featuresForMode(mode);
    if (!f.softSignalStop) errors.push(`${mode}: softSignalStop false`);
    if (!f.consentDualSeal) errors.push(`${mode}: consentDualSeal false`);
    if (!f.ageGate) errors.push(`${mode}: ageGate false`);
  }
  return { ok: errors.length === 0, errors };
}

/**
 * WHAT: Human summary of Soft Signal button label by mode.
 * WHY:  Quick audit without reading full copy packs.
 */
export function softSignalButtonLabel(mode: LitmoBuildMode): string {
  return copyForMode(mode).softSignal.button;
}

/**
 * WHAT: Features that differ between modes (RF, NFC, copy intensity…).
 */
export function modeFeatureDiff(): Array<{
  key: keyof LitmoFeatureFlags;
  maximum: boolean | true;
  app_store: boolean | true;
}> {
  const max = featuresForMode("maximum");
  const store = featuresForMode("app_store");
  return (Object.keys(max) as Array<keyof LitmoFeatureFlags>)
    .filter((k) => max[k] !== store[k])
    .map((k) => ({
      key: k,
      maximum: max[k] as boolean,
      app_store: store[k] as boolean,
    }));
}
