/**
 * Continuous Consent Core — pure machine for second-by-second authority.
 *
 * WHAT: Types + pure functions for continuous GREEN/YELLOW/RED/BLACK state,
 *       escalation levels (L0–L8 withdraw, G0–G6 grant), revocation masks,
 *       joint privilege evaluation, check-in clocks, Soft Signal L0.
 * WHY:  Consent must be continuous, granular, and revocable like a security
 *       property — not a one-time checkbox. Executable twin of
 *       docs/CONTINUOUS_CONSENT_SYSTEM.md so agents cannot invent softer law.
 * CONSENT: Soft Signal L0 always 0-logical-time free; re-grant always slow;
 *       fail closed on silence/stale/missing; match≠consent.
 * EDGE CASES: peer offline, double Soft Signal, mask vs seal, heartbeat miss.
 * NEVER: Silence=yes; Soft Signal with reason/peer veto; privilege upgrade
 *        without G3/G5/G6 slow paths; soft_signaled → active.
 * SEE: docs/CONTINUOUS_CONSENT_SYSTEM.md, CONSENT_MICROINTERACTIONS.md,
 *      softSignalCore, sessionLifecycle, consentInteractionCore.
 */

import { CONSENT_TIMING } from "./consentInteractionCore.ts";

// ── Continuous party state ─────────────────────────────────────────────────

/**
 * WHAT: Live continuous authority color per person during an active session.
 * WHY: Joint contact needs both GREEN for full sealed welcomed path.
 * CONSENT: RED/BLACK = no contact privilege; YELLOW caps at soft-limit care.
 */
export type ContinuousColor = "BLACK" | "RED" | "YELLOW" | "GREEN";

/**
 * WHAT: Withdrawal / reduce severity (lower = more complete / faster).
 * WHY: Explicit ladder so UI never invents “sort of stop.”
 * CONSENT: L0–L2 terminal-class; L3–L8 reduce without full terminal.
 */
export type WithdrawLevel =
  | "L0_SOFT_SIGNAL"
  | "L1_QUICK_EXIT"
  | "L2_SAFETY_END"
  | "L3_YELLOW_SLOW"
  | "L4_ZONE_KILL"
  | "L5_MODALITY_KILL"
  | "L6_INTENSITY_DROP"
  | "L7_TIME_TRIM"
  | "L8_CHECK_IN_DEMAND";

/**
 * WHAT: Re-grant ladder (higher = more privilege; always slow).
 * WHY: No implied forever; G6 required to expand map.
 */
export type GrantLevel =
  | "G0_FORBIDDEN"
  | "G1_OBSERVE"
  | "G2_VERBAL"
  | "G3_MICRO_YES"
  | "G4_SOFT_LIMIT_CARE"
  | "G5_SEALED_WELCOMED"
  | "G6_NEW_SEAL";

/**
 * WHAT: Contact privilege lattice rank (higher = more contact).
 * WHY: Joint privilege = min of all axes.
 */
export type PrivilegeRank =
  | 0 // NONE
  | 1 // OBSERVE_ONLY
  | 2 // VERBAL_ONLY
  | 3 // SOFT_LIMIT_CARE
  | 4 // ASK_FIRST
  | 5; // WELCOMED_SEALED

export const PRIVILEGE = {
  NONE: 0 as PrivilegeRank,
  OBSERVE_ONLY: 1 as PrivilegeRank,
  VERBAL_ONLY: 2 as PrivilegeRank,
  SOFT_LIMIT_CARE: 3 as PrivilegeRank,
  ASK_FIRST: 4 as PrivilegeRank,
  WELCOMED_SEALED: 5 as PrivilegeRank,
} as const;

/**
 * WHAT: Timing tokens for continuous layer (ms).
 * WHY: Single table for heartbeat / micro-yes TTL / re-green arm.
 * CONSENT: softSignalLocalCommitMs remains 0 via CONSENT_TIMING (never raised).
 */
export const CONTINUOUS_TIMING = {
  /** How often both parties must re-affirm green while active. */
  heartbeatIntervalMs: 300_000,
  /** Window for dual Yes on check-in before fail closed to YELLOW. */
  checkInResponseWindowMs: 60_000,
  /** Ask-first micro-yes lifetime. */
  microYesTtlMs: 60_000,
  /** Re-green and micro-yes arm dwell (matches grant anti-accident). */
  reGreenArmMs: CONSENT_TIMING.grantArmDwellMs,
  /** Soft-limit care ack freshness. */
  softLimitCareAckMaxAgeMs: 120_000,
  /** Soft Signal local commit — re-export law: always 0. */
  softSignalLocalCommitMs: CONSENT_TIMING.softSignalLocalCommitMs,
} as const;

export type RevocationMask = {
  /** Zones forced off for remainder of session (cannot un-kill without new seal). */
  zonesOff: ReadonlySet<string>;
  /** Modalities forbidden. */
  modalitiesOff: ReadonlySet<string>;
  /** Optional pressure cap (lighter wins with seal). */
  maxPressure: "light" | "medium" | "firm" | null;
};

export type ContinuousPartyState = {
  color: ContinuousColor;
  lastHeartbeatAtMs: number | null;
  lastSoftSignalAtMs: number | null;
  /** True if this party completed enter-active continuous protocol. */
  enteredContinuous: boolean;
};

export type ContinuousSessionSnapshot = {
  sessionId: string;
  lifecycleActive: boolean;
  sealed: boolean;
  fingerprintCurrent: boolean;
  withdrawn: boolean;
  partyA: ContinuousPartyState;
  partyB: ContinuousPartyState;
  maskA: RevocationMask;
  maskB: RevocationMask;
  /** Next deadline for dual heartbeat; null = no heartbeat scheduled yet. */
  continuousExpiresAtMs: number | null;
  hardEndsAtMs: number | null;
  nowMs: number;
};

// ── Mask helpers ───────────────────────────────────────────────────────────

/**
 * WHAT: Empty revocation mask.
 * WHY: Default session start before any L4–L6 kills.
 * CONSENT: Empty mask does not grant anything; seal still required.
 */
export function emptyMask(): RevocationMask {
  return {
    zonesOff: new Set(),
    modalitiesOff: new Set(),
    maxPressure: null,
  };
}

/**
 * WHAT: Add zone to off mask (immutable).
 * WHY: L4 zone kill — privilege only decreases.
 * CONSENT: Cannot remove zone from mask via this function (use new seal / G6).
 * EDGE CASES: Already off → same set membership.
 * NEVER: Un-kill without G6 path (not provided here by design).
 */
export function killZone(mask: RevocationMask, zoneId: string): RevocationMask {
  const zonesOff = new Set(mask.zonesOff);
  zonesOff.add(zoneId);
  return { ...mask, zonesOff };
}

/**
 * WHAT: Union of two masks (stricter).
 * WHY: Peer and self masks both apply; joint = union of kills.
 * CONSENT: More kills = less privilege (fail closed).
 */
export function unionMasks(a: RevocationMask, b: RevocationMask): RevocationMask {
  const zonesOff = new Set([...a.zonesOff, ...b.zonesOff]);
  const modalitiesOff = new Set([...a.modalitiesOff, ...b.modalitiesOff]);
  const maxPressure = stricterPressure(a.maxPressure, b.maxPressure);
  return { zonesOff, modalitiesOff, maxPressure };
}

function stricterPressure(
  a: RevocationMask["maxPressure"],
  b: RevocationMask["maxPressure"],
): RevocationMask["maxPressure"] {
  const rank = { light: 0, medium: 1, firm: 2 } as const;
  if (a == null) return b;
  if (b == null) return a;
  return rank[a] <= rank[b] ? a : b;
}

// ── Continuous color transitions ───────────────────────────────────────────

/**
 * WHAT: Apply Soft Signal L0 to a party (instant RED + timestamp).
 * WHY: Body free before beauty; continuous must reflect kill switch.
 * CONSENT: Unilateral; no peer field required.
 * EDGE CASES: Already RED/BLACK stays non-GREEN; timestamp updates.
 * NEVER: Transition Soft Signal to GREEN without new seal protocol.
 */
export function applySoftSignalL0(
  party: ContinuousPartyState,
  atMs: number,
): ContinuousPartyState {
  return {
    ...party,
    color: party.color === "BLACK" ? "BLACK" : "RED",
    lastSoftSignalAtMs: atMs,
  };
}

/**
 * WHAT: Apply L3 yellow/slow reduce.
 * WHY: Pause without full session terminal when product chooses L3.
 * CONSENT: Instant; no reason; Soft Signal still available.
 * EDGE CASES: RED/BLACK unchanged (cannot yellow after hard stop).
 * NEVER: Auto-return to GREEN.
 */
export function applyYellow(party: ContinuousPartyState): ContinuousPartyState {
  if (party.color === "RED" || party.color === "BLACK") return party;
  return { ...party, color: "YELLOW" };
}

/**
 * WHAT: Whether re-green protocol may start (both not hard-stopped).
 * WHY: Re-green is slow dual path; forbidden from RED/BLACK.
 */
export function mayStartReGreen(party: ContinuousPartyState): boolean {
  return party.color === "YELLOW" || party.color === "GREEN";
}

/**
 * WHAT: Apply successful dual re-green (after arm dwell outside this pure fn).
 * WHY: Only YELLOW→GREEN here; RED requires new session/seal at higher layer.
 * CONSENT: Caller must ensure arm dwell + dual Yes first.
 */
export function applyReGreen(
  party: ContinuousPartyState,
  atMs: number,
): ContinuousPartyState {
  if (party.color !== "YELLOW" && party.color !== "GREEN") return party;
  return {
    ...party,
    color: "GREEN",
    lastHeartbeatAtMs: atMs,
    enteredContinuous: true,
  };
}

// ── Joint evaluation ───────────────────────────────────────────────────────

/**
 * WHAT: Max privilege rank allowed by continuous color alone.
 * WHY: Color is a hard cap before seal intersection is considered.
 * CONSENT: GREEN allows up to WELCOMED_SEALED; YELLOW caps at SOFT_LIMIT_CARE.
 */
export function privilegeCapForColor(color: ContinuousColor): PrivilegeRank {
  switch (color) {
    case "BLACK":
    case "RED":
      return PRIVILEGE.NONE;
    case "YELLOW":
      return PRIVILEGE.SOFT_LIMIT_CARE;
    case "GREEN":
      return PRIVILEGE.WELCOMED_SEALED;
  }
}

/**
 * WHAT: Joint privilege cap for both parties.
 * WHY: min() — one yellow/red collapses joint path.
 * CONSENT: Mutual continuous green required for full sealed welcomed.
 */
export function jointPrivilegeCap(
  a: ContinuousColor,
  b: ContinuousColor,
): PrivilegeRank {
  return Math.min(
    privilegeCapForColor(a),
    privilegeCapForColor(b),
  ) as PrivilegeRank;
}

/**
 * WHAT: Whether joint contact of a given sealed-path kind is allowed right now.
 * WHY: Single fail-closed gate for active-session UI and future controllers.
 * CONSENT: All axes must pass; Soft Signal path not evaluated here (always allowed).
 * EDGE CASES: Heartbeat expiry / hard end → false; withdrawn/unsealed → false.
 * NEVER: Return true for WELCOMED when either party is YELLOW.
 */
export function jointContactAllowed(
  snap: ContinuousSessionSnapshot,
  desired: PrivilegeRank,
): boolean {
  if (!snap.lifecycleActive) return false;
  if (!snap.sealed || snap.withdrawn || !snap.fingerprintCurrent) return false;
  if (snap.hardEndsAtMs != null && snap.nowMs >= snap.hardEndsAtMs) return false;
  if (
    snap.continuousExpiresAtMs != null &&
    snap.nowMs >= snap.continuousExpiresAtMs
  ) {
    // Missed heartbeat window — fail closed (not silence=yes).
    return false;
  }
  if (!snap.partyA.enteredContinuous || !snap.partyB.enteredContinuous) {
    return false;
  }
  const cap = jointPrivilegeCap(snap.partyA.color, snap.partyB.color);
  return desired <= cap && cap > PRIVILEGE.NONE;
}

/**
 * WHAT: Whether a specific zone may receive contact under masks.
 * WHY: L4 kills beat sealed welcomed for that zone.
 * CONSENT: Fail closed if either mask lists zone.
 */
export function zoneContactAllowed(
  snap: ContinuousSessionSnapshot,
  zoneId: string,
  desired: PrivilegeRank,
): boolean {
  if (!jointContactAllowed(snap, desired)) return false;
  const joint = unionMasks(snap.maskA, snap.maskB);
  if (joint.zonesOff.has(zoneId)) return false;
  return true;
}

/**
 * WHAT: Evaluate Soft Signal may fire (continuous layer).
 * WHY: Soft Signal never requires GREEN; RED already free still idempotent.
 * CONSENT: Always true unless already BLACK terminal from controller view.
 * EDGE CASES: RED → still mayFire for idempotent UI disable at higher layer.
 */
export function continuousMayFireSoftSignal(
  party: ContinuousPartyState,
): boolean {
  // BLACK = session already gone; UI should not re-fire productively.
  return party.color !== "BLACK";
}

/**
 * WHAT: Next continuous color after heartbeat timeout without dual Yes.
 * WHY: Silence is not consent; drop to YELLOW first (then controller may RED).
 * CONSENT: Fail closed.
 */
export function colorAfterMissedHeartbeat(
  party: ContinuousPartyState,
): ContinuousColor {
  if (party.color === "RED" || party.color === "BLACK") return party.color;
  return "YELLOW";
}

/**
 * WHAT: Whether stop is faster than re-green arm (constitution).
 * WHY: Continuous layer must not invent re-green faster than Soft Signal.
 * CONSENT: Stop < Continue.
 */
export function continuousStopFasterThanReGreen(): boolean {
  return (
    CONTINUOUS_TIMING.softSignalLocalCommitMs < CONTINUOUS_TIMING.reGreenArmMs
  );
}

/**
 * WHAT: Map withdraw level to whether session should terminal soft_signal path.
 * WHY: L0–L2 end session; L3–L8 reduce privilege only.
 */
export function withdrawLevelIsTerminalSession(
  level: WithdrawLevel,
): boolean {
  return (
    level === "L0_SOFT_SIGNAL" ||
    level === "L1_QUICK_EXIT" ||
    level === "L2_SAFETY_END"
  );
}

/**
 * WHAT: Privilege rank for a sealed zone status string.
 * WHY: Bridge continuous eval to soft_limit first-class statuses.
 * CONSENT: Unknown → NONE (fail closed).
 */
export function privilegeForSealedStatus(
  status: "welcomed" | "ask_first" | "soft_limit" | "off_limits" | string,
): PrivilegeRank {
  switch (status) {
    case "welcomed":
      return PRIVILEGE.WELCOMED_SEALED;
    case "ask_first":
      return PRIVILEGE.ASK_FIRST;
    case "soft_limit":
      return PRIVILEGE.SOFT_LIMIT_CARE;
    case "off_limits":
    default:
      return PRIVILEGE.NONE;
  }
}

/**
 * WHAT: Effective privilege for a zone = min(sealed status rank, joint continuous cap).
 * WHY: Continuous yellow cannot exercise full welcomed even if seal said so.
 * CONSENT: Mask off always NONE.
 */
export function effectiveZonePrivilege(
  snap: ContinuousSessionSnapshot,
  zoneId: string,
  sealedStatus: "welcomed" | "ask_first" | "soft_limit" | "off_limits" | string,
): PrivilegeRank {
  if (unionMasks(snap.maskA, snap.maskB).zonesOff.has(zoneId)) {
    return PRIVILEGE.NONE;
  }
  const sealed = privilegeForSealedStatus(sealedStatus);
  const cap = jointPrivilegeCap(snap.partyA.color, snap.partyB.color);
  return Math.min(sealed, cap) as PrivilegeRank;
}
