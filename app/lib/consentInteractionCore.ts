/**
 * Consent micro-interaction grammar — Apple-level granularity.
 *
 * Philosophy:
 * - Granting consent is slow, deliberate, and specific.
 * - Withdrawing consent (Soft Signal) is faster than continuing.
 * - Every consent point has: id, phase machine, timing, weight, copy,
 *   haptic, a11y contract, and non-claims.
 * - No hand-waving. If a surface claims consent, it must map to a ConsentPoint.
 *
 * Source of truth for product review, agents, and UI implementation.
 * Living Constitution Articles I–II bind this module.
 */

import type { SoftSignalOutcome } from "./softSignalCore.ts";

export const CONSENT_INTERACTION_VERSION = 1 as const;

// ── Timing (milliseconds) ──────────────────────────────────────────────────
// Soft Signal must always resolve faster than grant/affirm paths.

export const CONSENT_TIMING = {
  /** Soft Signal: visual commit delay budget (local end is 0ms; UI may fade after). */
  softSignalLocalCommitMs: 0,
  /** Soft Signal: max time before UI shows "stopped" even if haptic lags. */
  softSignalUiStoppedByMs: 120,
  /** Soft Signal: haptic/hardware must not block; budget for fire-and-forget. */
  softSignalSideEffectBudgetMs: 400,
  /** Soft Signal: cover/quiet screen may ease in after local end. */
  softSignalCoverEaseMs: 280,

  /** Grant affirm: minimum dwell before Confirm arms (anti-accidental). */
  grantArmDwellMs: 320,
  /** Grant affirm: Confirm key/button remains disabled until arm. */
  grantConfirmArmMs: 400,
  /** Dual seal: second-party affirm may not auto-fire after first. */
  dualSealIndependentMs: 0,
  /** Checkbox/toggle: no double-tap race window (debounce). */
  toggleDebounceMs: 180,
  /** Share accept: explicit second step before content opens. */
  shareAcceptGateMs: 0,
  /** Post-tap NFC/QR: accept is always required; no auto-timer accept. */
  postTapAutoAcceptMs: null as null,
  /** Snapshot row page transition (calm). */
  snapshotRowTransitionMs: 240,
  /** Reduced motion: use cut or 0–80ms crossfade instead. */
  reducedMotionMaxMs: 80,

  /** Soft Signal vs grant: Soft Signal ease must be strictly less. */
  grantPrimaryEaseMs: 360,
} as const;

/**
 * Constitution check: stop interaction cost < grant interaction cost.
 * Lower number = easier / faster.
 */
export function stopFasterThanGrant(): boolean {
  return (
    CONSENT_TIMING.softSignalLocalCommitMs < CONSENT_TIMING.grantConfirmArmMs &&
    CONSENT_TIMING.softSignalUiStoppedByMs < CONSENT_TIMING.grantPrimaryEaseMs
  );
}

// ── Visual / motor weight ──────────────────────────────────────────────────

/** Relative visual priority (higher = more dominant). Soft Signal ≥ 90. */
export type ConsentWeight =
  | 100 // Soft Signal / panic
  | 90 // Sticky Soft Signal shell
  | 70 // Dual seal primary
  | 60 // Mutual affirm toggle
  | 50 // Snapshot prepare next
  | 40 // Share accept
  | 30 // Decline / not now
  | 20 // Secondary continue
  | 10; // Decorative / informational

export const CONSENT_WEIGHT = {
  softSignal: 100 as ConsentWeight,
  softSignalSticky: 90 as ConsentWeight,
  dualSeal: 70 as ConsentWeight,
  mutualAffirm: 60 as ConsentWeight,
  prepareNext: 50 as ConsentWeight,
  shareAccept: 40 as ConsentWeight,
  decline: 30 as ConsentWeight,
  secondaryContinue: 20 as ConsentWeight,
  informational: 10 as ConsentWeight,
} as const;

// ── Phase machines ─────────────────────────────────────────────────────────

/** Soft Signal phases — never requires arming. */
export type SoftSignalPhase = "idle" | "firing" | "local_ended" | "syncing" | "settled";

/** Grant/affirm phases — deliberate. */
export type GrantPhase =
  | "idle"
  | "reading"
  | "selecting"
  | "armed"
  | "confirming"
  | "sealed"
  | "withdrawn"
  | "blocked";

/** Share / post-tap phases. */
export type ShareGatePhase =
  | "idle"
  | "payload_ready"
  | "review_offered"
  | "accepted"
  | "declined"
  | "expired";

// ── Consent point catalog ──────────────────────────────────────────────────

export type ConsentPointKind =
  | "withdraw" // Soft Signal, panic, timeout stop
  | "grant" // Dual seal, session confirm
  | "share" // Partner share accept
  | "decline" // Not now, cancel request
  | "prepare" // One-sided declaration (not yet consent)
  | "inform"; // Non-authoritative notice

export type ConsentPointId =
  | "soft_signal_active"
  | "soft_signal_practice"
  | "soft_signal_panic"
  | "soft_signal_quick_exit"
  | "soft_signal_timeout"
  | "soft_signal_proximity"
  | "snapshot_prepare_declaration"
  | "snapshot_soft_signal_ack"
  | "snapshot_mutual_self_affirm"
  | "snapshot_mutual_partner_affirm"
  | "snapshot_dual_seal"
  | "snapshot_withdraw"
  | "session_end_together"
  | "session_engine_confirm"
  | "share_tl_accept"
  | "share_local_accept"
  | "share_quiz_compare"
  | "nfc_post_tap_accept"
  | "qr_invite_accept"
  | "proximity_identity_reveal"
  | "request_decline"
  | "block_and_leave"
  | "privacy_notice_accept"
  | "backup_opt_in"
  | "learning_scenario_choice"; // educational only — never real consent

export type ConsentPointSpec = {
  id: ConsentPointId;
  kind: ConsentPointKind;
  /** Human title for docs and a11y. */
  title: string;
  /** What this point authorizes or refuses. */
  authorizes: string;
  /** Explicit non-claims. */
  neverMeans: string[];
  weight: ConsentWeight;
  /** Soft Signal path is never armed; grants may arm. */
  requiresArm: boolean;
  /** Mutual peer required before effect. */
  requiresPeer: boolean;
  /** Local effect without network. */
  worksOffline: boolean;
  /** Haptic semantic event (or none). */
  haptic: "softSignal" | "confirmation" | "attention" | "presence" | null;
  /** Minimum touch target (pt). */
  minTouchTargetPt: number;
  /** VoiceOver / TalkBack label pattern. */
  a11yLabel: string;
  a11yHint: string;
  /** Primary user-facing copy key. */
  copy: {
    primary: string;
    secondary?: string;
    success?: string;
    failure?: string;
  };
  /** Forbidden UI patterns for this point. */
  forbidden: string[];
};

/**
 * Canonical catalog — every real product consent surface must appear here.
 * Learning scenarios use learning_scenario_choice and never authorize touch.
 */
export const CONSENT_POINTS: Record<ConsentPointId, ConsentPointSpec> = {
  soft_signal_active: {
    id: "soft_signal_active",
    kind: "withdraw",
    title: "Soft Signal (active session)",
    authorizes: "Immediate unilateral end of the session for both people.",
    neverMeans: [
      "Emergency services dispatch",
      "A reason was collected",
      "The other person must agree",
      "You failed",
      "A public score event",
    ],
    weight: CONSENT_WEIGHT.softSignal,
    requiresArm: false,
    requiresPeer: false,
    worksOffline: true,
    haptic: "softSignal",
    minTouchTargetPt: 68,
    a11yLabel: "Soft Signal, end session now",
    a11yHint:
      "Ends everything immediately. No explanation needed. Not emergency services.",
    copy: {
      primary: "Soft Signal — end now",
      secondary: "No reason. No penalty. You are free.",
      success: "You stopped. That is enough.",
      failure: "Stopped on this device. Sync pending. Session cannot resume.",
    },
    forbidden: [
      "confirm_dialog_before_stop",
      "require_reason_field",
      "swipe_to_stop_only",
      "color_only_meaning",
      "bury_in_overflow_menu",
    ],
  },
  soft_signal_practice: {
    id: "soft_signal_practice",
    kind: "withdraw",
    title: "Soft Signal practice",
    authorizes: "Muscle memory only — no peer, no real session end.",
    neverMeans: [
      "A real session ended",
      "Anyone was notified",
      "Emergency services dispatch",
      "A reason was collected",
    ],
    weight: CONSENT_WEIGHT.softSignal,
    requiresArm: false,
    requiresPeer: false,
    worksOffline: true,
    haptic: "softSignal",
    minTouchTargetPt: 68,
    a11yLabel: "Practice Soft Signal",
    a11yHint: "Practice only. No peer. No real session.",
    copy: {
      primary: "Practice Soft Signal",
      success: "Practice complete. Nothing was shared.",
    },
    forbidden: ["pretend_real_session", "notify_peer"],
  },
  soft_signal_panic: {
    id: "soft_signal_panic",
    kind: "withdraw",
    title: "Panic Soft Signal + cover",
    authorizes: "Same as Soft Signal, then calm cover UI.",
    neverMeans: [
      "Emergency services dispatch",
      "Cover delayed the stop",
      "A reason was collected",
    ],
    weight: CONSENT_WEIGHT.softSignal,
    requiresArm: false,
    requiresPeer: false,
    worksOffline: true,
    haptic: "softSignal",
    minTouchTargetPt: 56,
    a11yLabel: "Panic mode, stop and show calm cover",
    a11yHint: "Ends the session immediately, then shows a simple cover.",
    copy: {
      primary: "Panic mode — stop & cover",
      success: "You are out. The session ended.",
    },
    forbidden: ["delay_stop_for_cover_animation"],
  },
  soft_signal_quick_exit: {
    id: "soft_signal_quick_exit",
    kind: "withdraw",
    title: "Quick exit",
    authorizes: "Soft Signal + wrap-up path without processing pressure.",
    neverMeans: [
      "A softer stop than Soft Signal",
      "Optional negotiation",
      "Emergency services dispatch",
      "A reason was collected",
    ],
    weight: CONSENT_WEIGHT.softSignalSticky,
    requiresArm: false,
    requiresPeer: false,
    worksOffline: true,
    haptic: "softSignal",
    minTouchTargetPt: 56,
    a11yLabel: "Quick exit, end session now",
    a11yHint: "Ends immediately and opens private wrap-up.",
    copy: {
      primary: "Quick exit",
      secondary: "Same stop as Soft Signal. No explanation.",
    },
    forbidden: ["weaker_than_soft_signal"],
  },
  soft_signal_timeout: {
    id: "soft_signal_timeout",
    kind: "withdraw",
    title: "Time-boundary Soft Signal",
    authorizes: "End when agreed time is up (auto or prompted).",
    neverMeans: [
      "Shame for needing more time",
      "Forced re-negotiate",
      "A reason was collected",
      "Emergency services dispatch",
    ],
    weight: CONSENT_WEIGHT.softSignalSticky,
    requiresArm: false,
    requiresPeer: false,
    worksOffline: true,
    haptic: "softSignal",
    minTouchTargetPt: 56,
    a11yLabel: "Soft Signal, time boundary reached",
    a11yHint: "Ends the session for the agreed time boundary.",
    copy: {
      primary: "Soft Signal — end now",
      secondary: "Agreed time is complete. Soft Signal anytime sooner still applied.",
    },
    forbidden: ["shame_countdown", "auto_extend_without_yes"],
  },
  soft_signal_proximity: {
    id: "soft_signal_proximity",
    kind: "withdraw",
    title: "Proximity Soft Signal",
    authorizes: "Tear down nearby radio, keys, and presence.",
    neverMeans: [
      "Physical session Soft Signal",
      "Emergency services dispatch",
      "A reason was collected",
    ],
    weight: CONSENT_WEIGHT.softSignal,
    requiresArm: false,
    requiresPeer: false,
    worksOffline: true,
    haptic: "softSignal",
    minTouchTargetPt: 56,
    a11yLabel: "Soft Signal, end nearby presence",
    a11yHint: "Turns off nearby radio and clears session keys.",
    copy: {
      primary: "Soft Signal — end nearby",
      success: "Nearby is off. You’re quiet again.",
    },
    forbidden: ["leave_radio_on_after_soft_signal"],
  },
  snapshot_prepare_declaration: {
    id: "snapshot_prepare_declaration",
    kind: "prepare",
    title: "Prepare your side",
    authorizes: "Records your current declaration only — not mutual consent.",
    neverMeans: [
      "Mutual consent",
      "Session activation",
      "Permission to touch",
    ],
    weight: CONSENT_WEIGHT.prepareNext,
    requiresArm: false,
    requiresPeer: false,
    worksOffline: true,
    haptic: "presence",
    minTouchTargetPt: 56,
    a11yLabel: "Save declaration for this moment",
    a11yHint: "Saves your side only. Not consent until both people seal.",
    copy: {
      primary: "Save my side for this moment",
      secondary: "This declaration alone is not consent.",
    },
    forbidden: ["label_as_consent", "skip_soft_signal_ack"],
  },
  snapshot_soft_signal_ack: {
    id: "snapshot_soft_signal_ack",
    kind: "prepare",
    title: "Soft Signal understanding (prepare)",
    authorizes: "Confirms you know Soft Signal ends everything immediately.",
    neverMeans: ["You used Soft Signal", "Consent to touch"],
    weight: CONSENT_WEIGHT.mutualAffirm,
    requiresArm: false,
    requiresPeer: false,
    worksOffline: true,
    haptic: null,
    minTouchTargetPt: 44,
    a11yLabel: "Affirm Soft Signal understanding",
    a11yHint: "Required understanding, not a stop.",
    copy: {
      primary: "I understand Soft Signal ends everything immediately",
      secondary: "No explanation. Either person. Anytime.",
    },
    forbidden: ["bundle_with_touch_yes"],
  },
  snapshot_mutual_self_affirm: {
    id: "snapshot_mutual_self_affirm",
    kind: "grant",
    title: "Self affirm snapshot",
    authorizes: "Your yes to this exact fingerprint for this moment.",
    neverMeans: ["Their yes", "Future sessions", "Expansion mid-session"],
    weight: CONSENT_WEIGHT.mutualAffirm,
    requiresArm: true,
    requiresPeer: false,
    worksOffline: true,
    haptic: "attention",
    minTouchTargetPt: 48,
    a11yLabel: "Affirm this snapshot for yourself",
    a11yHint: "Your yes only. Partner must affirm separately.",
    copy: {
      primary: "I affirm this exact package for myself",
      secondary: "This moment only. Soft Signal remains free.",
    },
    forbidden: ["auto_affirm_partner", "skip_reading_intersection"],
  },
  snapshot_mutual_partner_affirm: {
    id: "snapshot_mutual_partner_affirm",
    kind: "grant",
    title: "Partner affirm (demo role)",
    authorizes: "Demo dual-role practice only when labeled.",
    neverMeans: ["Real remote partner consent", "Forged peer identity"],
    weight: CONSENT_WEIGHT.mutualAffirm,
    requiresArm: true,
    requiresPeer: false,
    worksOffline: true,
    haptic: "attention",
    minTouchTargetPt: 48,
    a11yLabel: "Practice partner affirmation, demo only",
    a11yHint: "Demo dual consent on one device. Not a real remote yes.",
    copy: {
      primary: "Practice as partner (demo)",
      secondary: "Labeled practice. Never forge a real remote yes.",
    },
    forbidden: ["unlabeled_demo_partner", "hide_demo_banner"],
  },
  snapshot_dual_seal: {
    id: "snapshot_dual_seal",
    kind: "grant",
    title: "Dual seal",
    authorizes: "Both people sealed the same immutable fingerprint.",
    neverMeans: [
      "Safety certificate",
      "Permanent permission",
      "Soft Signal removed",
    ],
    weight: CONSENT_WEIGHT.dualSeal,
    requiresArm: true,
    requiresPeer: true,
    worksOffline: true,
    haptic: "confirmation",
    minTouchTargetPt: 56,
    a11yLabel: "Seal Consent Snapshot for both people",
    a11yHint: "Only when both have affirmed. Soft Signal still available.",
    copy: {
      primary: "Seal this moment — both affirmed",
      success: "Sealed. Soft Signal remains available to either person.",
      failure: "Both sides must finish protective checks first.",
    },
    forbidden: ["seal_with_one_party", "seal_stale_fingerprint"],
  },
  snapshot_withdraw: {
    id: "snapshot_withdraw",
    kind: "withdraw",
    title: "Withdraw unsealed/sealed snapshot",
    authorizes: "Clear affirmations; nothing proceeds.",
    neverMeans: ["You owe an explanation"],
    weight: CONSENT_WEIGHT.softSignalSticky,
    requiresArm: false,
    requiresPeer: false,
    worksOffline: true,
    haptic: "softSignal",
    minTouchTargetPt: 56,
    a11yLabel: "Withdraw snapshot without granting",
    a11yHint: "Clears the seal path. No explanation needed.",
    copy: {
      primary: "Withdraw — leave without granting",
      success: "Withdrawn. Nothing proceeds.",
    },
    forbidden: ["require_reason"],
  },
  session_end_together: {
    id: "session_end_together",
    kind: "grant",
    title: "End together",
    authorizes: "Mutual calm complete when both are ready.",
    neverMeans: ["Replaces Soft Signal", "Required before Soft Signal"],
    weight: CONSENT_WEIGHT.secondaryContinue,
    requiresArm: false,
    requiresPeer: false,
    worksOffline: false,
    haptic: "confirmation",
    minTouchTargetPt: 56,
    a11yLabel: "End session together",
    a11yHint: "Calm complete. Soft Signal is still available for immediate stop.",
    copy: {
      primary: "End together",
      secondary: "Soft Signal remains if you need to stop immediately.",
    },
    forbidden: ["replace_soft_signal", "harder_than_soft_signal_to_find"],
  },
  session_engine_confirm: {
    id: "session_engine_confirm",
    kind: "grant",
    title: "Engine snapshot confirm",
    authorizes: "Your confirm of server fingerprint for this session.",
    neverMeans: ["Their confirm", "Profile match consent"],
    weight: CONSENT_WEIGHT.dualSeal,
    requiresArm: true,
    requiresPeer: true,
    worksOffline: false,
    haptic: "confirmation",
    minTouchTargetPt: 56,
    a11yLabel: "Confirm consent snapshot for this session",
    a11yHint: "Your confirm only. Both people required.",
    copy: {
      primary: "Yes — this matches what I agree to now",
      secondary: "No — I want to change or stop",
    },
    forbidden: ["default_yes_selected", "auto_confirm"],
  },
  share_tl_accept: {
    id: "share_tl_accept",
    kind: "share",
    title: "Accept Touch Language share",
    authorizes: "Review-only map open. Not touch consent.",
    neverMeans: ["Consent to touch", "Overwrite my map", "Session start"],
    weight: CONSENT_WEIGHT.shareAccept,
    requiresArm: false,
    requiresPeer: false,
    worksOffline: true,
    haptic: "attention",
    minTouchTargetPt: 56,
    a11yLabel: "Accept Touch Language share for review only",
    a11yHint: "Review only. Not consent to touch.",
    copy: {
      primary: "Review carefully — not consent to touch",
      secondary: "Decline is complete.",
    },
    forbidden: ["auto_open_on_scan", "merge_into_local_without_review"],
  },
  share_local_accept: {
    id: "share_local_accept",
    kind: "share",
    title: "Nearby share accept",
    authorizes: "Open discovery profile or snapshot review payload.",
    neverMeans: ["Session activation", "Touch consent"],
    weight: CONSENT_WEIGHT.shareAccept,
    requiresArm: false,
    requiresPeer: false,
    worksOffline: true,
    haptic: "attention",
    minTouchTargetPt: 56,
    a11yLabel: "Accept nearby share for review",
    a11yHint: "Review only. Not consent to touch.",
    copy: {
      primary: "Accept for review",
      secondary: "Not consent. Easy decline.",
    },
    forbidden: ["auto_accept_invite"],
  },
  share_quiz_compare: {
    id: "share_quiz_compare",
    kind: "share",
    title: "Quiz compare consent",
    authorizes: "Compare weather after dual share+compare consents.",
    neverMeans: ["Touch consent", "Safety score", "Match ranking"],
    weight: CONSENT_WEIGHT.shareAccept,
    requiresArm: false,
    requiresPeer: true,
    worksOffline: false,
    haptic: "confirmation",
    minTouchTargetPt: 56,
    a11yLabel: "Consent to compare quiz weather",
    a11yHint: "Weather only. Never consent to touch.",
    copy: {
      primary: "Compare weather (never consent)",
      secondary: "Requires four gates. No is complete.",
    },
    forbidden: ["compare_without_dual_consent", "present_as_safety"],
  },
  nfc_post_tap_accept: {
    id: "nfc_post_tap_accept",
    kind: "share",
    title: "NFC post-tap accept",
    authorizes: "Open tag payload after explicit Accept.",
    neverMeans: ["Scan alone opened content", "Session start"],
    weight: CONSENT_WEIGHT.shareAccept,
    requiresArm: false,
    requiresPeer: false,
    worksOffline: true,
    haptic: "attention",
    minTouchTargetPt: 56,
    a11yLabel: "Accept after NFC tap",
    a11yHint: "Tap alone is not enough. Accept required.",
    copy: {
      primary: "Accept carefully",
      secondary: "A scan is not consent.",
    },
    forbidden: ["auto_open_on_ndef_read"],
  },
  qr_invite_accept: {
    id: "qr_invite_accept",
    kind: "share",
    title: "QR invite accept",
    authorizes: "Open encrypted invite after Accept.",
    neverMeans: ["Decode alone is consent"],
    weight: CONSENT_WEIGHT.shareAccept,
    requiresArm: false,
    requiresPeer: false,
    worksOffline: true,
    haptic: "attention",
    minTouchTargetPt: 56,
    a11yLabel: "Accept QR invite for review",
    a11yHint: "Decode is not accept. Explicit Accept required.",
    copy: {
      primary: "Accept invite for review",
      secondary: "Decline expires cleanly.",
    },
    forbidden: ["auto_accept_on_decode"],
  },
  proximity_identity_reveal: {
    id: "proximity_identity_reveal",
    kind: "share",
    title: "Mutual identity reveal",
    authorizes: "Names after mutual interest + mutual reveal.",
    neverMeans: ["Touch consent", "Safety proof"],
    weight: CONSENT_WEIGHT.shareAccept,
    requiresArm: false,
    requiresPeer: true,
    worksOffline: true,
    haptic: "confirmation",
    minTouchTargetPt: 56,
    a11yLabel: "Reveal identity after mutual interest",
    a11yHint: "Both people required. Not consent to touch.",
    copy: {
      primary: "Reveal identity carefully",
      secondary: "Weather is not consent.",
    },
    forbidden: ["reveal_without_mutual_interest"],
  },
  request_decline: {
    id: "request_decline",
    kind: "decline",
    title: "Decline session request",
    authorizes: "Complete no. No explanation.",
    neverMeans: ["You must explain", "Soft score penalty"],
    weight: CONSENT_WEIGHT.decline,
    requiresArm: false,
    requiresPeer: false,
    worksOffline: false,
    haptic: null,
    minTouchTargetPt: 56,
    a11yLabel: "Decline session request",
    a11yHint: "Decline is complete. No explanation required.",
    copy: {
      primary: "Not now",
      success: "Not now is a complete answer.",
    },
    forbidden: ["require_decline_reason", "guilt_copy"],
  },
  block_and_leave: {
    id: "block_and_leave",
    kind: "withdraw",
    title: "Block and leave",
    authorizes: "Private block + end open pair session.",
    neverMeans: ["They learn who blocked them"],
    weight: CONSENT_WEIGHT.softSignalSticky,
    requiresArm: false,
    requiresPeer: false,
    worksOffline: false,
    haptic: "softSignal",
    minTouchTargetPt: 56,
    a11yLabel: "Block this person and leave",
    a11yHint: "Private block. Soft Signal available without blocking.",
    copy: {
      primary: "Block this person and leave",
      secondary: "They are not told it was you.",
    },
    forbidden: ["notify_blocked_party"],
  },
  privacy_notice_accept: {
    id: "privacy_notice_accept",
    kind: "inform",
    title: "Privacy notice accept",
    authorizes: "Local notice acknowledgment only.",
    neverMeans: ["Legal waiver of constitution", "Touch consent"],
    weight: CONSENT_WEIGHT.informational,
    requiresArm: false,
    requiresPeer: false,
    worksOffline: true,
    haptic: null,
    minTouchTargetPt: 48,
    a11yLabel: "Accept privacy notice",
    a11yHint: "Notice only. Not consent to touch.",
    copy: {
      primary: "I understand this privacy notice",
    },
    forbidden: ["bundle_with_marketing_opt_in"],
  },
  backup_opt_in: {
    id: "backup_opt_in",
    kind: "share",
    title: "Encrypted backup opt-in",
    authorizes: "Upload opaque ciphertext of personal vault domains.",
    neverMeans: ["Staff can read plaintext", "Required for app use"],
    weight: CONSENT_WEIGHT.shareAccept,
    requiresArm: false,
    requiresPeer: false,
    worksOffline: false,
    haptic: "confirmation",
    minTouchTargetPt: 56,
    a11yLabel: "Enable encrypted cloud backup",
    a11yHint: "Optional. Ciphertext only. Recovery code required.",
    copy: {
      primary: "Enable encrypted backup",
      secondary: "Off by default. Recovery code is yours alone.",
    },
    forbidden: ["default_on", "skip_recovery_code"],
  },
  learning_scenario_choice: {
    id: "learning_scenario_choice",
    kind: "inform",
    title: "Learning scenario choice",
    authorizes: "Educational feedback only.",
    neverMeans: [
      "Real consent",
      "Safety certification",
      "Session activation",
    ],
    weight: CONSENT_WEIGHT.informational,
    requiresArm: false,
    requiresPeer: false,
    worksOffline: true,
    haptic: "attention",
    minTouchTargetPt: 56,
    a11yLabel: "Scenario option",
    a11yHint: "Practice only. Not real consent.",
    copy: {
      primary: "Choose a practice response",
      secondary: "Completing modules never certifies safety.",
    },
    forbidden: ["treat_as_real_consent", "score_publicly"],
  },
};

export const CONSENT_POINT_IDS = Object.keys(
  CONSENT_POINTS,
) as ConsentPointId[];

// ── Micro-interaction rules ────────────────────────────────────────────────

export type ConsentMicroRule = {
  id: string;
  statement: string;
  check: () => boolean;
};

export const CONSENT_MICRO_RULES: ConsentMicroRule[] = [
  {
    id: "stop_faster_than_grant",
    statement:
      "Soft Signal local commit is faster than grant Confirm arm (constitution I.4).",
    check: stopFasterThanGrant,
  },
  {
    id: "soft_signal_no_arm",
    statement: "Soft Signal points never require arming.",
    check: () =>
      CONSENT_POINT_IDS.filter((id) => CONSENT_POINTS[id].kind === "withdraw")
        .filter((id) => id.startsWith("soft_signal"))
        .every((id) => CONSENT_POINTS[id].requiresArm === false),
  },
  {
    id: "soft_signal_offline",
    statement: "All Soft Signal points work offline.",
    check: () =>
      CONSENT_POINT_IDS.filter((id) => id.startsWith("soft_signal")).every(
        (id) => CONSENT_POINTS[id].worksOffline,
      ),
  },
  {
    id: "soft_signal_weight",
    statement: "Soft Signal weight is always ≥ 90.",
    check: () =>
      CONSENT_POINT_IDS.filter((id) => id.startsWith("soft_signal")).every(
        (id) => CONSENT_POINTS[id].weight >= 90,
      ),
  },
  {
    id: "prepare_not_grant",
    statement: "Prepare declaration never authorizes touch.",
    check: () =>
      CONSENT_POINTS.snapshot_prepare_declaration.neverMeans.some((s) =>
        /mutual consent|permission to touch|session activation/i.test(s),
      ),
  },
  {
    id: "learning_not_real",
    statement: "Learning scenarios never authorize real consent.",
    check: () =>
      CONSENT_POINTS.learning_scenario_choice.kind === "inform" &&
      CONSENT_POINTS.learning_scenario_choice.neverMeans.includes(
        "Real consent",
      ),
  },
  {
    id: "no_post_tap_auto_accept",
    statement: "Post-tap auto-accept is disabled (null ms).",
    check: () => CONSENT_TIMING.postTapAutoAcceptMs === null,
  },
  {
    id: "grant_arm_when_required",
    statement: "Dual seal and engine confirm require arming.",
    check: () =>
      CONSENT_POINTS.snapshot_dual_seal.requiresArm &&
      CONSENT_POINTS.session_engine_confirm.requiresArm,
  },
];

export function allConsentMicroRulesPass(): {
  ok: boolean;
  failed: string[];
} {
  const failed = CONSENT_MICRO_RULES.filter((r) => !r.check()).map((r) => r.id);
  return { ok: failed.length === 0, failed };
}

// ── Soft Signal outcome → micro phase ──────────────────────────────────────

export function softSignalPhaseFromOutcome(
  outcome: SoftSignalOutcome,
): SoftSignalPhase {
  switch (outcome) {
    case "pending_sync":
      return "syncing";
    case "stopped_local":
    case "stopped_synced":
    case "practice_only":
    case "already_ended":
      return "settled";
    default:
      return "settled";
  }
}

// ── Grant arming helper ────────────────────────────────────────────────────

/**
 * Whether a grant Confirm control may enable.
 * Apple-level: both content readiness AND minimum dwell.
 */
export function mayEnableGrantConfirm(input: {
  contentReady: boolean;
  requiredTogglesAllOn: boolean;
  dwellMs: number;
  fingerprintCurrent: boolean;
  withdrawn: boolean;
}): boolean {
  if (input.withdrawn) return false;
  if (!input.contentReady) return false;
  if (!input.requiredTogglesAllOn) return false;
  if (!input.fingerprintCurrent) return false;
  if (input.dwellMs < CONSENT_TIMING.grantArmDwellMs) return false;
  return true;
}

/**
 * Soft Signal may fire whenever idle — no dwell, no peer, no reason.
 */
export function mayFireSoftSignal(input: {
  alreadyEnded: boolean;
  phase: SoftSignalPhase;
}): boolean {
  if (input.alreadyEnded) return false;
  if (input.phase === "firing" || input.phase === "local_ended") return false;
  return true;
}

// ── Forbidden language (user-facing) ───────────────────────────────────────

/** Strings that must not appear as primary labels on grant/withdraw controls. */
export const FORBIDDEN_CONSENT_LABELS = [
  /swipe to (agree|consent|yes)/i,
  /by continuing you agree/i,
  /you must explain/i,
  /why did you stop/i,
  /rate your partner/i,
  /verified safe/i,
  /safety score/i,
  /certified ready/i,
] as const;

export function labelViolatesConsentGrammar(label: string): boolean {
  return FORBIDDEN_CONSENT_LABELS.some((re) => re.test(label));
}

// ── Inventory helpers ──────────────────────────────────────────────────────

export function consentPointsByKind(
  kind: ConsentPointKind,
): ConsentPointSpec[] {
  return CONSENT_POINT_IDS.map((id) => CONSENT_POINTS[id]).filter(
    (p) => p.kind === kind,
  );
}

export function assertConsentPoint(id: ConsentPointId): ConsentPointSpec {
  const p = CONSENT_POINTS[id];
  if (!p) throw new Error(`unknown_consent_point:${id}`);
  return p;
}
