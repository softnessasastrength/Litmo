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
  | "learning_scenario_choice" // educational only — never real consent
  /** First-open / onboarding path */
  | "onboard_welcome_continue"
  | "onboard_entry_demo"
  | "onboard_entry_signin"
  | "onboard_entry_signup"
  | "onboard_platonic_adult_ack"
  | "onboard_age_self_report"
  | "onboard_age_apple_range"
  | "onboard_age_dev_attest"
  | "onboard_profile_name"
  | "onboard_profile_gender"
  | "onboard_profile_orientation"
  | "onboard_vibe_answer"
  | "onboard_vibe_keep"
  | "onboard_touch_language_save"
  | "onboard_boundary_zone"
  | "onboard_boundary_hard_stop"
  | "onboard_boundary_private_note"
  | "onboard_boundary_save"
  | "onboard_nd_default_demo";

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

  // ── First-open onboarding ───────────────────────────────────────────────
  onboard_welcome_continue: {
    id: "onboard_welcome_continue",
    kind: "inform",
    title: "Welcome → entry",
    authorizes: "Open entry choice only. No account, no matching.",
    neverMeans: ["Account created", "Consent to touch", "Real peer contact"],
    weight: CONSENT_WEIGHT.informational,
    requiresArm: false,
    requiresPeer: false,
    worksOffline: true,
    haptic: "presence",
    minTouchTargetPt: 56,
    a11yLabel: "Explore the prototype",
    a11yHint: "Opens entry options. Fictional data only until you choose otherwise.",
    copy: {
      primary: "Explore the prototype",
      secondary:
        "A tap-through prototype using imaginary people and local data.",
    },
    forbidden: ["auto_enter_demo", "skip_to_discovery"],
  },
  onboard_entry_demo: {
    id: "onboard_entry_demo",
    kind: "prepare",
    title: "Enter fictional demo",
    authorizes:
      "Local demo session on this device. No account. No real matching.",
    neverMeans: [
      "Real account",
      "Identity verification",
      "Real person connection",
      "Consent to touch",
    ],
    weight: CONSENT_WEIGHT.prepareNext,
    requiresArm: false,
    requiresPeer: false,
    worksOffline: true,
    haptic: "presence",
    minTouchTargetPt: 56,
    a11yLabel: "Enter the fictional demo",
    a11yHint:
      "Starts demo with no account. Educational signals only. Not consent.",
    copy: {
      primary: "Enter the fictional demo",
      secondary:
        "Compatibility and quizzes are educational only — never consent or safety proof.",
    },
    forbidden: ["unlabeled_demo", "persist_as_real_account"],
  },
  onboard_entry_signin: {
    id: "onboard_entry_signin",
    kind: "prepare",
    title: "Sign in with passkey",
    authorizes: "Begin WebAuthn ceremony for existing account.",
    neverMeans: ["Touches granted", "Age confirmed without gate"],
    weight: CONSENT_WEIGHT.prepareNext,
    requiresArm: false,
    requiresPeer: false,
    worksOffline: false,
    haptic: null,
    minTouchTargetPt: 56,
    a11yLabel: "Sign in with passkey",
    a11yHint: "Passkey-first sign-in. Sensitive screens still re-check owner.",
    copy: {
      primary: "Sign in with passkey",
    },
    forbidden: ["password_fallback_as_default"],
  },
  onboard_entry_signup: {
    id: "onboard_entry_signup",
    kind: "prepare",
    title: "Create account with passkey",
    authorizes: "Begin registration after email ownership proof.",
    neverMeans: ["Immediate matching", "Consent to touch"],
    weight: CONSENT_WEIGHT.prepareNext,
    requiresArm: false,
    requiresPeer: false,
    worksOffline: false,
    haptic: null,
    minTouchTargetPt: 56,
    a11yLabel: "Create account with passkey",
    a11yHint: "Registration after one-time email code, then passkey.",
    copy: {
      primary: "Create account with passkey",
    },
    forbidden: ["skip_email_proof_in_production"],
  },
  onboard_platonic_adult_ack: {
    id: "onboard_platonic_adult_ack",
    kind: "prepare",
    title: "Platonic adult purpose ack",
    authorizes: "Acknowledge product purpose: adults, non-sexual, platonic.",
    neverMeans: ["Age verified by Apple", "Legal identity proof"],
    weight: CONSENT_WEIGHT.mutualAffirm,
    requiresArm: false,
    requiresPeer: false,
    worksOffline: true,
    haptic: null,
    minTouchTargetPt: 48,
    a11yLabel: "I understand Litmo is for consenting adults, platonic only",
    a11yHint: "Purpose acknowledgment. Separate from age gate.",
    copy: {
      primary:
        "I understand Litmo is for consenting adults and non-sexual, platonic connection only",
      secondary: "Consent is specific, mutual, and revocable at any moment.",
    },
    forbidden: ["bury_in_terms_only", "bundle_with_marketing"],
  },
  onboard_age_self_report: {
    id: "onboard_age_self_report",
    kind: "prepare",
    title: "Self-reported age (demo/about-you)",
    authorizes: "Local 18+ self-report for demo path only.",
    neverMeans: [
      "Apple Declared Age Range",
      "Government ID",
      "Consent to touch",
    ],
    weight: CONSENT_WEIGHT.prepareNext,
    requiresArm: false,
    requiresPeer: false,
    worksOffline: true,
    haptic: null,
    minTouchTargetPt: 48,
    a11yLabel: "Your age, adults only",
    a11yHint: "Litmo is for adults 18 or older. Enter age in years.",
    copy: {
      primary: "How many trips around the sun?",
      secondary: "Litmo is for adults only — 18+.",
      failure: "You must be 18 or older to continue.",
    },
    forbidden: ["allow_under_18_continue"],
  },
  onboard_age_apple_range: {
    id: "onboard_age_apple_range",
    kind: "prepare",
    title: "Apple Declared Age Range",
    authorizes: "Store adult-range signal for account eligibility.",
    neverMeans: ["Birthday collected", "ID scan", "Face ID proves age"],
    weight: CONSENT_WEIGHT.prepareNext,
    requiresArm: false,
    requiresPeer: false,
    worksOffline: false,
    haptic: "confirmation",
    minTouchTargetPt: 56,
    a11yLabel: "Confirm adult age range with Apple",
    a11yHint:
      "Privacy-preserving age range. Not birthday. Not ID. Not consent to touch.",
    copy: {
      primary: "Confirm with Apple age range",
      secondary: "We store adult eligibility signal only — not your birthday.",
      failure: "An adult age range was not confirmed. Litmo is 18+.",
    },
    forbidden: ["store_exact_birthday", "reuse_faceid_as_age"],
  },
  onboard_age_dev_attest: {
    id: "onboard_age_dev_attest",
    kind: "prepare",
    title: "Dev self-attest 18+",
    authorizes: "Development-only adult self-attest outside production.",
    neverMeans: ["Production eligibility", "Real identity"],
    weight: CONSENT_WEIGHT.informational,
    requiresArm: false,
    requiresPeer: false,
    worksOffline: true,
    haptic: null,
    minTouchTargetPt: 56,
    a11yLabel: "Development: I confirm I am 18 or older",
    a11yHint: "Development builds only. Not available in production.",
    copy: {
      primary: "Development: I confirm I am 18+",
    },
    forbidden: ["show_in_production"],
  },
  onboard_profile_name: {
    id: "onboard_profile_name",
    kind: "inform",
    title: "Display name",
    authorizes: "Local display name for this device path.",
    neverMeans: ["Legal name verification", "Public directory listing"],
    weight: CONSENT_WEIGHT.informational,
    requiresArm: false,
    requiresPeer: false,
    worksOffline: true,
    haptic: null,
    minTouchTargetPt: 48,
    a11yLabel: "Your name",
    a11yHint: "Display name only. Nothing formal required.",
    copy: {
      primary: "What should we call you?",
      secondary: "Just your name — nothing formal.",
    },
    forbidden: ["require_legal_name"],
  },
  onboard_profile_gender: {
    id: "onboard_profile_gender",
    kind: "inform",
    title: "Gender self-describe",
    authorizes: "Optional self-description for profile.",
    neverMeans: ["Medical classification", "Matching requirement"],
    weight: CONSENT_WEIGHT.informational,
    requiresArm: false,
    requiresPeer: false,
    worksOffline: true,
    haptic: null,
    minTouchTargetPt: 48,
    a11yLabel: "How do you describe your gender",
    a11yHint: "Pick what fits or self-describe. Optional framing.",
    copy: {
      primary: "How do you describe your gender?",
      secondary: "Pick what fits, or tell us in your own words.",
    },
    forbidden: ["binary_only_forced"],
  },
  onboard_profile_orientation: {
    id: "onboard_profile_orientation",
    kind: "inform",
    title: "Orientation self-describe",
    authorizes: "Optional self-description.",
    neverMeans: ["Sexual content invitation", "Consent to touch"],
    weight: CONSENT_WEIGHT.informational,
    requiresArm: false,
    requiresPeer: false,
    worksOffline: true,
    haptic: null,
    minTouchTargetPt: 48,
    a11yLabel: "How do you describe your orientation",
    a11yHint: "Optional. Not used as consent.",
    copy: {
      primary: "How do you describe your orientation?",
    },
    forbidden: ["use_as_consent_signal"],
  },
  onboard_vibe_answer: {
    id: "onboard_vibe_answer",
    kind: "inform",
    title: "Onboarding vibe scene answer",
    authorizes: "Local weather preference signal only.",
    neverMeans: ["Consent to touch", "Safety rating", "Match ranking"],
    weight: CONSENT_WEIGHT.informational,
    requiresArm: false,
    requiresPeer: false,
    worksOffline: true,
    haptic: null,
    minTouchTargetPt: 56,
    a11yLabel: "Vibe scene answer",
    a11yHint: "Weather only. Never consent to touch.",
    copy: {
      primary: "Choose the response that feels closest",
      secondary: "This is weather — not consent.",
    },
    forbidden: ["score_as_safety", "auto_match_from_vibe"],
  },
  onboard_vibe_keep: {
    id: "onboard_vibe_keep",
    kind: "prepare",
    title: "Keep vibe profile",
    authorizes: "Save vibe archetype locally / to account if signed in.",
    neverMeans: ["Consent Snapshot complete", "Ready to touch"],
    weight: CONSENT_WEIGHT.prepareNext,
    requiresArm: false,
    requiresPeer: false,
    worksOffline: true,
    haptic: "confirmation",
    minTouchTargetPt: 56,
    a11yLabel: "Keep this Vibe Profile",
    a11yHint: "Saves weather profile. Not consent to touch.",
    copy: {
      primary: "Keep this Vibe Profile",
      secondary: "Still never consent. Touch Language comes next.",
    },
    forbidden: ["skip_to_session_after_vibe"],
  },
  onboard_touch_language_save: {
    id: "onboard_touch_language_save",
    kind: "prepare",
    title: "Save Touch Language basics",
    authorizes: "Store preference starting point on device / account.",
    neverMeans: ["Consent to touch", "Session activation", "Partner obligation"],
    weight: CONSENT_WEIGHT.prepareNext,
    requiresArm: false,
    requiresPeer: false,
    worksOffline: true,
    haptic: "confirmation",
    minTouchTargetPt: 56,
    a11yLabel: "Save and set body areas",
    a11yHint: "Preferences are a starting point. Not consent.",
    copy: {
      primary: "Save and set body areas",
      secondary: "Your profile is not consent.",
    },
    forbidden: ["label_save_as_consent"],
  },
  onboard_boundary_zone: {
    id: "onboard_boundary_zone",
    kind: "prepare",
    title: "Body zone status",
    authorizes: "Record preferred zone status for future snapshots.",
    neverMeans: ["Partner may touch that zone now", "Session consent"],
    weight: CONSENT_WEIGHT.prepareNext,
    requiresArm: false,
    requiresPeer: false,
    worksOffline: true,
    haptic: null,
    minTouchTargetPt: 48,
    a11yLabel: "Body zone preference",
    a11yHint:
      "Welcomed, ask first, or off limits. Missing later fails closed to off limits.",
    copy: {
      primary: "How is this zone for you?",
      secondary: "Still not consent until a session snapshot is sealed.",
    },
    forbidden: ["unset_means_open"],
  },
  onboard_boundary_hard_stop: {
    id: "onboard_boundary_hard_stop",
    kind: "prepare",
    title: "Hard stop toggle",
    authorizes: "Mark absolute no for a practice/hard-stop item.",
    neverMeans: [
      "Negotiable in session without new yes",
      "Consent to touch",
      "Session consent granted by listing a hard stop",
    ],
    weight: CONSENT_WEIGHT.prepareNext,
    requiresArm: false,
    requiresPeer: false,
    worksOffline: true,
    haptic: null,
    minTouchTargetPt: 48,
    a11yLabel: "Hard stop",
    a11yHint: "Absolute no. Wins over welcomed zones when mapped.",
    copy: {
      primary: "Absolute hard stops",
      secondary: "These win. Soft Signal still ends anything immediately.",
    },
    forbidden: ["hard_stop_negotiable_ui"],
  },
  onboard_boundary_private_note: {
    id: "onboard_boundary_private_note",
    kind: "prepare",
    title: "Private nervous-system note",
    authorizes: "Store private note on device / encrypted vault.",
    neverMeans: ["Shared with partners", "Public bio"],
    weight: CONSENT_WEIGHT.informational,
    requiresArm: false,
    requiresPeer: false,
    worksOffline: true,
    haptic: null,
    minTouchTargetPt: 48,
    a11yLabel: "Private nervous system note",
    a11yHint: "Private to you. Not shared by default.",
    copy: {
      primary: "Private nervous-system note",
      secondary: "Optional. Stays private unless you later choose to share.",
    },
    forbidden: ["default_share_private_note"],
  },
  onboard_boundary_save: {
    id: "onboard_boundary_save",
    kind: "prepare",
    title: "Save boundaries and enter home",
    authorizes: "Persist boundary map; open home. Still no session consent.",
    neverMeans: ["Ready to meet strangers", "Consent Snapshot sealed"],
    weight: CONSENT_WEIGHT.prepareNext,
    requiresArm: false,
    requiresPeer: false,
    worksOffline: true,
    haptic: "confirmation",
    minTouchTargetPt: 56,
    a11yLabel: "Save boundaries and continue",
    a11yHint: "Saves map. Soft Signal and snapshots still required later.",
    copy: {
      primary: "Save boundaries and continue",
      secondary: "Missing zones mean off limits. This map is not consent.",
    },
    forbidden: ["auto_open_discovery_as_consent"],
  },
  onboard_nd_default_demo: {
    id: "onboard_nd_default_demo",
    kind: "inform",
    title: "ND Mode default on demo entry",
    authorizes: "Enable calmer defaults on device for demo path.",
    neverMeans: ["Clinical diagnosis", "Matching trait", "Consent input"],
    weight: CONSENT_WEIGHT.informational,
    requiresArm: false,
    requiresPeer: false,
    worksOffline: true,
    haptic: null,
    minTouchTargetPt: 44,
    a11yLabel: "Neurodivergent Mode on for demo",
    a11yHint: "Device-local calm defaults. Change anytime in Settings.",
    copy: {
      primary: "Neurodivergent Mode turns on for a quieter walkthrough",
      secondary: "Device-local only. Never consent or matching.",
    },
    forbidden: ["use_nd_as_match_signal"],
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

// ── Visual tokens (semantic roles, not free color) ─────────────────────────
/**
 * Map to theme keys only — implementations use useColors().
 * Soft Signal / withdraw always uses `signal` (rose), never moss (grant).
 */

export type ConsentVisualRole =
  | "withdraw" // Soft Signal, block, decline-as-stop
  | "grant" // Dual seal, confirm yes
  | "prepare" // One-sided declaration
  | "share" // Review accept
  | "decline" // Not now
  | "demo" // Practice partner banner
  | "inform"; // Notices

export const CONSENT_VISUAL: Record<
  ConsentVisualRole,
  {
    fillKey: "signal" | "moss" | "plum" | "apricot" | "line";
    softKey: "signalSoft" | "mossSoft" | "plumSoft" | "apricotSoft" | "paper";
    borderWidth: number;
    /** Label never relies on color alone. */
    nonColorCue: string;
  }
> = {
  withdraw: {
    fillKey: "signal",
    softKey: "signalSoft",
    borderWidth: 3,
    nonColorCue: "signal button + label Soft Signal / Withdraw",
  },
  grant: {
    fillKey: "moss",
    softKey: "mossSoft",
    borderWidth: 1.5,
    nonColorCue: "primary moss button + seal copy",
  },
  prepare: {
    fillKey: "moss",
    softKey: "mossSoft",
    borderWidth: 1.5,
    nonColorCue: "next / save primary",
  },
  share: {
    fillKey: "moss",
    softKey: "mossSoft",
    borderWidth: 1.5,
    nonColorCue: "Accept carefully + review-only subtitle",
  },
  decline: {
    fillKey: "signal",
    softKey: "signalSoft",
    borderWidth: 1.5,
    nonColorCue: "signal variant or secondary + Not now",
  },
  demo: {
    fillKey: "apricot",
    softKey: "apricotSoft",
    borderWidth: 1,
    nonColorCue: "DEMO banner uppercase text",
  },
  inform: {
    fillKey: "line",
    softKey: "paper",
    borderWidth: 1,
    nonColorCue: "body text only",
  },
};

export function visualRoleForPoint(id: ConsentPointId): ConsentVisualRole {
  const p = CONSENT_POINTS[id];
  if (p.kind === "withdraw") return "withdraw";
  if (p.kind === "grant") return "grant";
  if (p.kind === "prepare") return "prepare";
  if (p.kind === "share") return "share";
  if (p.kind === "decline") return "decline";
  if (id === "snapshot_mutual_partner_affirm") return "demo";
  return "inform";
}

// ── Gesture policy ─────────────────────────────────────────────────────────
/**
 * Allowed input methods per kind. Soft Signal: single deliberate tap only
 * (no swipe-only, no long-press requirement that delays free exit).
 */

export type ConsentGesture =
  | "single_tap"
  | "checkbox_toggle"
  | "radio_choice"
  | "hardware_button";

export const CONSENT_GESTURES: Record<
  ConsentPointKind,
  {
    primary: ConsentGesture;
    allowed: ConsentGesture[];
    forbidden: string[];
  }
> = {
  withdraw: {
    primary: "single_tap",
    allowed: ["single_tap", "hardware_button"],
    forbidden: [
      "swipe_only_stop",
      "long_press_required_before_stop",
      "force_touch_menu_only",
      "confirm_dialog_before_stop",
    ],
  },
  grant: {
    primary: "single_tap",
    allowed: ["single_tap", "checkbox_toggle", "radio_choice"],
    forbidden: ["swipe_to_consent", "shake_to_agree", "default_selected_yes"],
  },
  share: {
    primary: "single_tap",
    allowed: ["single_tap"],
    forbidden: ["auto_accept_on_scan", "auto_accept_on_decode"],
  },
  decline: {
    primary: "single_tap",
    allowed: ["single_tap"],
    forbidden: ["require_reason_modal"],
  },
  prepare: {
    primary: "checkbox_toggle",
    allowed: ["checkbox_toggle", "single_tap", "radio_choice"],
    forbidden: ["skip_soft_signal_ack"],
  },
  inform: {
    primary: "single_tap",
    allowed: ["single_tap", "radio_choice"],
    forbidden: ["treat_as_real_consent"],
  },
};

// ── Edge-case matrix ───────────────────────────────────────────────────────
/**
 * Explicit outcomes for messy real life. Agents and UI must not invent
 * friendlier-but-unconstitutional behavior under pressure.
 */

export type ConsentEdgeCaseId =
  | "double_tap_soft_signal"
  | "soft_signal_while_sealing"
  | "soft_signal_offline"
  | "network_fail_after_soft_signal"
  | "grant_confirm_before_dwell"
  | "fingerprint_stale_mid_seal"
  | "demo_partner_unlabeled"
  | "scan_without_accept"
  | "decode_without_accept"
  | "reduced_motion_on"
  | "dynamic_type_xxx_large"
  | "background_during_nearby"
  | "one_party_affirms_other_silent";

export type ConsentEdgeCase = {
  id: ConsentEdgeCaseId;
  situation: string;
  requiredBehavior: string;
  forbiddenBehavior: string;
};

export const CONSENT_EDGE_CASES: ConsentEdgeCase[] = [
  {
    id: "double_tap_soft_signal",
    situation: "User hammers Soft Signal twice.",
    requiredBehavior:
      "First press ends; second is no-op (alreadyEnded). Never double-withdraw penalty.",
    forbiddenBehavior: "Error toast blaming user; re-open session.",
  },
  {
    id: "soft_signal_while_sealing",
    situation: "User Soft Signals while dual-seal form is open.",
    requiredBehavior:
      "Stop wins. Seal abandoned. No half-sealed session activation.",
    forbiddenBehavior: "Complete seal after Soft Signal.",
  },
  {
    id: "soft_signal_offline",
    situation: "Airplane mode Soft Signal mid-session.",
    requiredBehavior: "localEnded true; pending_sync; UI shows stopped.",
    forbiddenBehavior: "Block Soft Signal until online.",
  },
  {
    id: "network_fail_after_soft_signal",
    situation: "Remote withdraw fails after local end.",
    requiredBehavior: "Stay ended; retry with same idempotency; never re-enable.",
    forbiddenBehavior: "Return to active timer.",
  },
  {
    id: "grant_confirm_before_dwell",
    situation: "All checkboxes on, user taps Seal immediately.",
    requiredBehavior: "Button disabled/arming until grantArmDwellMs.",
    forbiddenBehavior: "Instant seal on last checkbox tick.",
  },
  {
    id: "fingerprint_stale_mid_seal",
    situation: "Profile changes while reviewing snapshot.",
    requiredBehavior: "Fail closed; require rebuild; no seal on old fingerprint.",
    forbiddenBehavior: "Seal stale package.",
  },
  {
    id: "demo_partner_unlabeled",
    situation: "Single-device dual affirm.",
    requiredBehavior: "DEMO banner visible; copy says practice only.",
    forbiddenBehavior: "Present as two real people.",
  },
  {
    id: "scan_without_accept",
    situation: "NFC tag read succeeds.",
    requiredBehavior: "awaiting_post_tap_consent; content closed until Accept.",
    forbiddenBehavior: "Auto-open payload on NDEF read.",
  },
  {
    id: "decode_without_accept",
    situation: "QR envelope decodes.",
    requiredBehavior: "Review gate; explicit Accept.",
    forbiddenBehavior: "Auto-accept on decode.",
  },
  {
    id: "reduced_motion_on",
    situation: "User has Reduce Motion / ND reduced stimulation.",
    requiredBehavior: "Cuts or ≤ reducedMotionMaxMs; meaning in copy still complete.",
    forbiddenBehavior: "Meaning only in animation.",
  },
  {
    id: "dynamic_type_xxx_large",
    situation: "Largest accessibility text size.",
    requiredBehavior:
      "Soft Signal sticky remains reachable; min touch targets; no clip of stop.",
    forbiddenBehavior: "Soft Signal below fold only without sticky.",
  },
  {
    id: "background_during_nearby",
    situation: "User backgrounds app while radar on.",
    requiredBehavior: "Prefer radio stop / fail closed (documented product path).",
    forbiddenBehavior: "Silent background advertising forever.",
  },
  {
    id: "one_party_affirms_other_silent",
    situation: "Only one person confirmed engine snapshot.",
    requiredBehavior: "Waiting state; no activate; Soft Signal/withdraw free.",
    forbiddenBehavior: "Auto-activate on single confirm.",
  },
];

export function edgeCaseById(id: ConsentEdgeCaseId): ConsentEdgeCase {
  const e = CONSENT_EDGE_CASES.find((c) => c.id === id);
  if (!e) throw new Error(`unknown_edge_case:${id}`);
  return e;
}

/** Easing tokens for RN Animated (when motion allowed). */
export const CONSENT_EASING = {
  /** Soft Signal cover after end — gentle, never delay commit. */
  afterStopEase: "ease-out" as const,
  /** Grant seal success — soft confirmation, not celebratory bounce. */
  grantSealEase: "ease-in-out" as const,
  /** No spring bounce on consent (avoids playful dopamine). */
  banSpringBounceOnConsent: true,
} as const;

export function consentMotionDurationMs(
  kind: "softSignalCover" | "grantEase" | "row",
  reducedMotion: boolean,
): number {
  if (reducedMotion) return CONSENT_TIMING.reducedMotionMaxMs;
  if (kind === "softSignalCover") return CONSENT_TIMING.softSignalCoverEaseMs;
  if (kind === "grantEase") return CONSENT_TIMING.grantPrimaryEaseMs;
  return CONSENT_TIMING.snapshotRowTransitionMs;
}
