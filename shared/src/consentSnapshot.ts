/**
 * Consent Snapshot — session-specific, fingerprint-bound mutual affirmation state.
 *
 * Product philosophy:
 * - A snapshot freezes profile versions + compatibility at a point in time
 * - Compatibility eligible ≠ consent; affirmations are explicit per userId
 * - Fingerprint mismatch or withdrawal clears path — fail closed
 * - Soft Signal / withdraw clears confirmations without peer permission
 * - soft_limit rows from computeCompatibility remain first-class inside compatibility
 * - private nervous-system notes never appear in fingerprints via engine (engine omits them)
 *
 * SEE: shared/src/consentEngine.ts · docs/LITMO_CONSTITUTION.md ·
 *      docs/CODE_COMMENT_STANDARD.md
 */

import { z } from "zod";
import {
  computeCompatibility,
  type CompatibilityResult,
} from "./consentEngine.ts";

/**
 * WHAT: Session/consent lifecycle states including Soft Signal and safety end.
 * WHY: Shared vocabulary for snapshot-adjacent session machines.
 * CONSENT: soft_signaled / safety_ended / declined are full stops — not penalties.
 * NEVER: Treat ready/active as permanent; withdrawal always possible.
 */
export const consentLifecycleStates = [
  "draft",
  "requested",
  "accepted",
  "consent_pending",
  "ready",
  "active",
  "completed",
  "declined",
  "cancelled",
  "expired",
  "soft_signaled",
  "safety_ended",
] as const;

/**
 * WHAT: Type of consent lifecycle state strings.
 * WHY: Type-safe session state for withdrawConsent and callers.
 * CONSENT: soft_signaled is a valid terminal path without reason.
 */
export type ConsentLifecycleState = (typeof consentLifecycleStates)[number];

/**
 * WHAT: Immutable-ish record of a Consent Snapshot for a session.
 * WHY: Pin profile versions, compatibility, fingerprint, and per-user confirmations.
 * CONSENT: confirmations empty means not mutually affirmed; compatibility.consentGranted is always false.
 * NEVER: Infer touch permission from fingerprint alone without both confirmations and active lifecycle.
 */
export type ConsentSnapshotRecord = {
  id: string;
  sessionId: string;
  profileAId: string;
  profileAVersion: number;
  profileBId: string;
  profileBVersion: number;
  fingerprint: string;
  createdAt: string;
  compatibility: CompatibilityResult;
  confirmations: Record<string, string>;
  withdrawnBy: string | null;
  withdrawnAt: string | null;
};

const uuid = z.uuid();

/**
 * WHAT: Deep-canonicalizes values (sorted object keys, mapped arrays) for stable hashing.
 * WHY: Fingerprints must not flip on key insertion order across runtimes.
 * CONSENT: Not a consent surface — pure determinism for snapshot identity.
 * EDGE CASES: non-object primitives returned as-is; arrays preserve order after mapping children.
 * NEVER: Include wall-clock "now" or random ids inside values destined for fingerprints.
 */
function canonical(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === "object")
    return Object.fromEntries(
      Object.entries(value)
        .sort(([a], [b]) => a.localeCompare(b, "en-US"))
        .map(([key, item]) => [key, canonical(item)]),
    );
  return value;
}

/**
 * WHAT: Produces a stable hex fingerprint for an arbitrary JSON-like value.
 * WHY: Detect material profile/compatibility changes so affirmations cannot stick to stale maps.
 * CONSENT: Fingerprint equality is not consent; it is identity of the proposed map.
 * EDGE CASES:
 *   - 8 FNV-1a inspired seeds concatenated → 64 hex chars
 *   - order-sensitive only after canonical sort of object keys
 * NEVER: Treat fingerprint match as mutual yes without confirmations map.
 * SEE: createConsentSnapshot · confirmSnapshot · invalidateForMaterialChange
 */
export function stableFingerprint(value: unknown) {
  const text = JSON.stringify(canonical(value));
  let output = "";
  for (let seed = 0; seed < 8; seed++) {
    let hash = (2166136261 ^ seed) >>> 0;
    for (let index = 0; index < text.length; index++) {
      hash ^= text.charCodeAt(index);
      hash = Math.imul(hash, 16777619) >>> 0;
    }
    output += hash.toString(16).padStart(8, "0");
  }
  return output;
}

/**
 * WHAT: Creates a Consent Snapshot from two profile payloads at createdAt.
 * WHY: Freeze mutual preference language for session-specific affirmation.
 * CONSENT: Starts with empty confirmations; computeCompatibility always consentGranted false.
 * EDGE CASES:
 *   - invalid uuid/id or createdAt → zod throw
 *   - invalid/stale profiles → throw valid_profile_versions_required (no half-open snapshot)
 *   - softLimit rows included inside compatibility payload/fingerprint (first-class)
 * NEVER: Pre-fill confirmations; never treat create as dual yes; Soft Signal still free after create.
 * SEE: computeCompatibility · confirmSnapshot
 */
export function createConsentSnapshot(input: {
  id: string;
  sessionId: string;
  profileA: unknown;
  profileB: unknown;
  createdAt: string;
}): ConsentSnapshotRecord {
  uuid.parse(input.id);
  uuid.parse(input.sessionId);
  z.iso.datetime({ offset: true }).parse(input.createdAt);
  // Use createdAt as "now" so snapshot validity is pinned to seal time, not wall clock later.
  const compatibility = computeCompatibility(
    input.profileA,
    input.profileB,
    new Date(input.createdAt),
  );
  // Fail closed: no snapshot without two resolved profile version identities.
  if (!compatibility.profileA || !compatibility.profileB)
    throw new Error("valid_profile_versions_required");
  const payload = {
    sessionId: input.sessionId,
    profileA: compatibility.profileA,
    profileB: compatibility.profileB,
    // Includes permitted, askFirst, softLimit, excluded — soft_limit is first-class.
    compatibility,
  };
  return {
    id: input.id,
    sessionId: input.sessionId,
    profileAId: compatibility.profileA.id,
    profileAVersion: compatibility.profileA.version,
    profileBId: compatibility.profileB.id,
    profileBVersion: compatibility.profileB.version,
    fingerprint: stableFingerprint(payload),
    createdAt: input.createdAt,
    compatibility,
    // Explicit affirmations only — never auto-confirm on create or match.
    confirmations: {},
    withdrawnBy: null,
    withdrawnAt: null,
  };
}

/**
 * WHAT: Records one user's affirmation of a snapshot if fingerprint still matches.
 * WHY: Mutual consent requires each person to affirm the same frozen map.
 * CONSENT: Session-specific explicit affirm; fails if withdrawn or fingerprint stale.
 * EDGE CASES:
 *   - withdrawnAt set → throw snapshot_confirmation_rejected
 *   - fingerprint !== snapshot.fingerprint → throw (material change or wrong map)
 *   - re-confirm same user overwrites their timestamp
 * NEVER: Auto-confirm peer; never accept confirm after Soft Signal withdraw without new snapshot.
 * SEE: withdrawConsent · invalidateForMaterialChange
 */
export function confirmSnapshot(
  snapshot: ConsentSnapshotRecord,
  userId: string,
  fingerprint: string,
  confirmedAt: string,
) {
  uuid.parse(userId);
  z.iso.datetime({ offset: true }).parse(confirmedAt);
  // Fail closed: withdrawn or fingerprint drift means this map is no longer affirmable.
  if (snapshot.withdrawnAt || fingerprint !== snapshot.fingerprint)
    throw new Error("snapshot_confirmation_rejected");
  return {
    ...snapshot,
    confirmations: { ...snapshot.confirmations, [userId]: confirmedAt },
  };
}

/**
 * WHAT: Rebuilds snapshot from next profiles; keeps old only if fingerprint unchanged.
 * WHY: Material preference changes must invalidate prior affirmations path (new fingerprint).
 * CONSENT: New fingerprint implies prior confirmations on caller side must not be trusted as current.
 * EDGE CASES:
 *   - same content → return original snapshot reference/object equality of fingerprint
 *   - change → new record via createConsentSnapshot (empty confirmations)
 * NEVER: Preserve confirmations across fingerprint change.
 * SEE: stableFingerprint · createConsentSnapshot
 */
export function invalidateForMaterialChange(
  snapshot: ConsentSnapshotRecord,
  nextProfileA: unknown,
  nextProfileB: unknown,
  changedAt: string,
) {
  const next = createConsentSnapshot({
    id: snapshot.id,
    sessionId: snapshot.sessionId,
    profileA: nextProfileA,
    profileB: nextProfileB,
    createdAt: changedAt,
  });
  // Same fingerprint: no material change — keep existing affirmations/withdraw state.
  return next.fingerprint === snapshot.fingerprint ? snapshot : next;
}

/**
 * WHAT: Withdraws consent on a snapshot: clears all confirmations, stamps actor and time.
 * WHY: Consent is revocable; Soft Signal / any lifecycle end must not require peer OK.
 * CONSENT: Unilateral withdraw path — peer permission not required; reason not on this API.
 * EDGE CASES:
 *   - confirmations always wiped to {}
 *   - state is validated as lifecycle enum but not stored on the record (caller owns session state)
 * NEVER: Require peer consent to withdraw; never keep peer confirmation after withdraw.
 * SEE: softSignalConstitutionContract · Living Constitution I.3
 */
export function withdrawConsent(
  snapshot: ConsentSnapshotRecord,
  actorId: string,
  state: ConsentLifecycleState,
  withdrawnAt: string,
) {
  uuid.parse(actorId);
  // Validate lifecycle vocabulary; Soft Signal states are included in the enum.
  z.enum(consentLifecycleStates).parse(state);
  z.iso.datetime({ offset: true }).parse(withdrawnAt);
  // Clear all affirmations — withdraw is total for this fingerprint/session map.
  return { ...snapshot, confirmations: {}, withdrawnBy: actorId, withdrawnAt };
}

/**
 * WHAT: True when both participant user ids confirmed this exact fingerprint.
 * WHY: Dual mutual seal is the only path to ready/active (with lifecycle).
 * CONSENT: Does not grant touch alone — lifecycle must still be ready/active.
 * EDGE: Missing userId, withdrawn snapshot, or fingerprint mismatch → false.
 * NEVER: Infer the second confirmation from match or profile.
 * SEE: sessionConsentNuclear.isMutuallyConfirmed · ADR 0006
 */
export function hasDualConfirmation(
  snapshot: ConsentSnapshotRecord,
  userAId: string,
  userBId: string,
): boolean {
  if (snapshot.withdrawnAt) return false;
  const a = snapshot.confirmations[userAId];
  const b = snapshot.confirmations[userBId];
  return Boolean(a && b);
}

/**
 * WHAT: Re-fingerprint core identity fields and compare to stored value.
 * WHY: Verifiable immutability of the sealed package (nuclear session pass).
 * CONSENT: Integrity check only — not a consent grant.
 * EDGE: Uses profile objects + compatibility from the record's compatibility tree.
 * NEVER: Allow in-place fingerprint rewrite after create.
 */
export function verifyConsentSnapshotIntegrity(
  snapshot: ConsentSnapshotRecord,
): boolean {
  if (!snapshot.compatibility.profileA || !snapshot.compatibility.profileB) {
    return false;
  }
  const payload = {
    sessionId: snapshot.sessionId,
    profileA: snapshot.compatibility.profileA,
    profileB: snapshot.compatibility.profileB,
    compatibility: snapshot.compatibility,
  };
  return stableFingerprint(payload) === snapshot.fingerprint;
}
