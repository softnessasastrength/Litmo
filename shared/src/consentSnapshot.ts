import { z } from "zod";
import {
  computeCompatibility,
  type CompatibilityResult,
} from "./consentEngine.ts";

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
export type ConsentLifecycleState = (typeof consentLifecycleStates)[number];
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
  const compatibility = computeCompatibility(
    input.profileA,
    input.profileB,
    new Date(input.createdAt),
  );
  if (!compatibility.profileA || !compatibility.profileB)
    throw new Error("valid_profile_versions_required");
  const payload = {
    sessionId: input.sessionId,
    profileA: compatibility.profileA,
    profileB: compatibility.profileB,
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
    confirmations: {},
    withdrawnBy: null,
    withdrawnAt: null,
  };
}
export function confirmSnapshot(
  snapshot: ConsentSnapshotRecord,
  userId: string,
  fingerprint: string,
  confirmedAt: string,
) {
  uuid.parse(userId);
  z.iso.datetime({ offset: true }).parse(confirmedAt);
  if (snapshot.withdrawnAt || fingerprint !== snapshot.fingerprint)
    throw new Error("snapshot_confirmation_rejected");
  return {
    ...snapshot,
    confirmations: { ...snapshot.confirmations, [userId]: confirmedAt },
  };
}
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
  return next.fingerprint === snapshot.fingerprint ? snapshot : next;
}
export function withdrawConsent(
  snapshot: ConsentSnapshotRecord,
  actorId: string,
  state: ConsentLifecycleState,
  withdrawnAt: string,
) {
  uuid.parse(actorId);
  z.enum(consentLifecycleStates).parse(state);
  z.iso.datetime({ offset: true }).parse(withdrawnAt);
  return { ...snapshot, confirmations: {}, withdrawnBy: actorId, withdrawnAt };
}
