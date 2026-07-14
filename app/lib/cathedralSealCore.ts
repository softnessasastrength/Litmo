/**
 * The Cathedral Seal — a small SecureStore marker representing "this device
 * is bonded to the cathedral."
 *
 * WHAT: A single timestamp record, created quietly the first time the app
 *   is really used, removed only as the deliberate first act of the
 *   Cathedral Purge ritual (app/app/cathedral-purge/index.tsx). It is not a
 *   real Passkey and does not touch Apple's actual Keychain-managed
 *   WebAuthn credential — third-party apps cannot observe or react to
 *   deletion of a real system Passkey, and treating an ambiguous
 *   passkey-auth failure as "nuke everything" would be a fail-open
 *   disaster (network blips, un-synced iCloud Keychain, and a genuine
 *   deletion all look identical from inside the app). This seal exists so
 *   the ritual has something *real* to remove, on purpose, in the moment,
 *   witnessed — not a background trigger nobody's watching.
 * WHY: The purge ritual needs one honest, deliberate, irreversible-feeling
 *   gesture that isn't just "tap a red button." Removing your own seal, in
 *   the ritual, is that gesture.
 * CONSENT: Ensuring the seal exists is not a data-collection event — it is
 *   a single timestamp, never synced, never exported with content, present
 *   only as a boolean in the GDPR local-data inventory.
 * NEVER: Treat seal absence (e.g. after a fresh install) as evidence a
 *   purge happened. Sync the seal off-device. Require the seal to exist
 *   before any other Litmo feature works.
 * SEE: app/services/cathedralSealStore.ts, app/lib/cathedralPurgeCore.ts,
 *   docs/CATHEDRAL_PURGE.md.
 */

export const CATHEDRAL_SEAL_VERSION = 1 as const;

export type CathedralSeal = {
  version: typeof CATHEDRAL_SEAL_VERSION;
  sealedAt: string;
};

export function createSeal(): CathedralSeal {
  return { version: CATHEDRAL_SEAL_VERSION, sealedAt: new Date().toISOString() };
}

/** Defensive parse — malformed/missing data means "not sealed," never throws. */
export function parseSeal(raw: unknown): CathedralSeal | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Partial<CathedralSeal>;
  if (typeof o.sealedAt !== "string") return null;
  return { version: CATHEDRAL_SEAL_VERSION, sealedAt: o.sealedAt };
}
