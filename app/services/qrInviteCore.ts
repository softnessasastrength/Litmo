/**
 * Time-limited encrypted QR envelopes for Litmo careful-connect.
 *
 * Used as the robust fallback ladder:
 *   NFC tag → on-screen QR → manual deep link / unlock code
 *
 * Security model:
 * - AES-256-GCM seals the inner invite (no raw PII in the QR plaintext JSON).
 * - Short TTL (default 3 minutes) fails closed after expiry.
 * - Co-located mode embeds a media key in the envelope (ease when both present).
 * - Split mode omits the media key; host shows a short unlock code (higher privacy).
 * - Opening content still requires explicit in-app Accept (consent-first).
 * - neverConsentToTouch / notSessionActivation are mandatory on inner payloads.
 */

import { gcm } from "@noble/ciphers/aes.js";
import { hkdf } from "@noble/hashes/hkdf.js";
import { sha256 } from "@noble/hashes/sha2.js";
import { randomBytes } from "@noble/hashes/utils.js";
import { b64url, fromB64url } from "./localShareCore.ts";

export const QR_INVITE_VERSION = 1 as const;
export const QR_DEFAULT_TTL_MS = 3 * 60 * 1000;
export const QR_URI_PREFIX = "litmo://q/v1/";
export const QR_INFO = new TextEncoder().encode("LitmoQrInvite-v1");

export type QrPayloadKind =
  | "nfc_offer"
  | "nfc_accept"
  | "nfc_sealed"
  | "proximity_invite"
  | "snapshot_start"
  | "manual_link";

export type QrPrivacyMode = "colocated" | "split";

/** Wire envelope encoded into the QR / deep link (ciphertext + metadata). */
export type QrEnvelope = {
  v: typeof QR_INVITE_VERSION;
  /** Payload kind — also bound into AAD. */
  k: QrPayloadKind;
  /** Envelope id (not an account id). */
  id: string;
  /** Expiry epoch ms. */
  exp: number;
  /** AES-GCM combined nonce||ciphertext||tag (base64url). */
  ct: string;
  /**
   * Media key (base64url), only in colocated mode.
   * Omitted in split mode — unlock code required.
   */
  mk?: string;
  reqConsent: true;
  notTouch: true;
};

export type QrBuildResult = {
  envelope: QrEnvelope;
  /** Full deep link for QR and manual copy. */
  deepLink: string;
  /** Short unlock code (always generated; required to open in split mode). */
  unlockCode: string;
  /** Privacy mode used. */
  mode: QrPrivacyMode;
  /** Expiry for UI. */
  exp: number;
  /** Inner kind. */
  kind: QrPayloadKind;
  /** Share sheet message (consent-first copy). */
  shareMessage: string;
};

export type ProximityInviteInner = {
  kind: "proximity_invite";
  v: 1;
  /** Anonymous radar token / peer handshake bootstrap. */
  token: string;
  /** Compact beacon string (same as Multipeer discovery). */
  beacon: string;
  /** Optional X25519 public for ECDH bootstrap. */
  epk: string | null;
  /** Host anonymous label. */
  label: string | null;
  notConsentToTouch: true;
  requiresPostTapConsent: true;
  disclaimer: string;
};

export type SnapshotStartInner = {
  kind: "snapshot_start";
  v: 1;
  title: string;
  rows: { label: string; value: string }[];
  notConsentToTouch: true;
  notSessionActivation: true;
  reviewOnly: true;
  requiresPostTapConsent: true;
  disclaimer: string;
};

const UNLOCK_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function aesGcmEncrypt(
  key: Uint8Array,
  plaintext: Uint8Array,
  aad: Uint8Array,
  random: (n: number) => Uint8Array,
): Uint8Array {
  const nonce = random(12);
  const cipher = gcm(key, nonce, aad);
  const ct = cipher.encrypt(plaintext);
  const out = new Uint8Array(nonce.length + ct.length);
  out.set(nonce, 0);
  out.set(ct, nonce.length);
  return out;
}

function aesGcmDecrypt(
  key: Uint8Array,
  combined: Uint8Array,
  aad: Uint8Array,
): Uint8Array | null {
  if (combined.length < 12 + 16) return null;
  try {
    return gcm(key, combined.slice(0, 12), aad).decrypt(combined.slice(12));
  } catch {
    return null;
  }
}

export function mintEnvelopeId(
  random: (n: number) => Uint8Array = (n) => randomBytes(n),
): string {
  return b64url(random(8)).slice(0, 10);
}

/**
 * Human unlock code (10 chars) derived from media key — for split mode and
 * manual fallback. Not a password for an account; session-scoped only.
 */
export function mediaKeyToUnlockCode(mediaKey: Uint8Array): string {
  const h = sha256(mediaKey);
  let out = "";
  for (let i = 0; i < 10; i++) {
    out += UNLOCK_ALPHABET[h[i]! % UNLOCK_ALPHABET.length];
  }
  return out;
}

/**
 * Recover a candidate media-key stream from unlock code is not reversible
 * from the code alone (code is a fingerprint). Split mode stores a
 * key-check: we derive unlock from mk and compare; guest must enter code
 * while host could also re-share mk via manual link.
 *
 * For split open path: host shareMessage includes unlock code; guest enters
 * code + scans QR without mk. We need to map code → key.
 *
 * Implementation: media key is random 16 bytes. Unlock code is derived.
 * For split mode open, we include `kh` (key hint) = HKDF(mk) public check
 * and require the unlock code to be entered — but we still need mk.
 *
 * Split design that works:
 * - QR has ct + id + exp + k (no mk)
 * - Manual / verbal unlock is the base64url media key shortened OR
 * - Unlock code IS the media key encoded in Crockford base32 (16 bytes → ~26 chars) too long
 *
 * Better split design:
 * - Media key = 8 random bytes (64-bit) — OK for short-lived co-located invites
 * - Unlock code = base32 of those 8 bytes (13 chars) — reversible
 */
export function generateMediaKey(
  random: (n: number) => Uint8Array = (n) => randomBytes(n),
): Uint8Array {
  // 16 bytes for AES-128-equivalent strength in short TTL collocated context;
  // we use as IKM into HKDF for 32-byte AES-256 key.
  return random(16);
}

export function unlockCodeFromMediaKey(mediaKey: Uint8Array): string {
  // Reversible encoding of the 16-byte key using our alphabet in 2-char pairs
  // would be long. Instead: expand via HKDF display code AND store
  // reversible packing: base64url of media key is ~22 chars — use that as
  // "unlock" for split mode (shown as groups).
  return b64url(mediaKey);
}

export function mediaKeyFromUnlockCode(code: string): Uint8Array | null {
  const clean = code.trim().replace(/\s+/g, "");
  if (clean.length < 16) return null;
  try {
    const key = fromB64url(clean);
    if (key.length !== 16) return null;
    return key;
  } catch {
    return null;
  }
}

function deriveAesKey(mediaKey: Uint8Array, id: string, kind: QrPayloadKind): Uint8Array {
  const salt = sha256(new TextEncoder().encode(`qr|${id}|${kind}`));
  return hkdf(sha256, mediaKey, salt, QR_INFO, 32);
}

function aadFor(envelope: Pick<QrEnvelope, "v" | "k" | "id" | "exp">): Uint8Array {
  return new TextEncoder().encode(
    `litmo-qr|v${envelope.v}|${envelope.k}|${envelope.id}|${envelope.exp}`,
  );
}

export function isEnvelopeExpired(
  envelope: QrEnvelope,
  now: number = Date.now(),
): boolean {
  return now >= envelope.exp;
}

export function buildEncryptedQr(input: {
  kind: QrPayloadKind;
  /** JSON-serializable inner payload (already consent-flagged). */
  inner: unknown;
  mode?: QrPrivacyMode;
  ttlMs?: number;
  now?: number;
  random?: (n: number) => Uint8Array;
}): QrBuildResult {
  const random = input.random ?? ((n: number) => randomBytes(n));
  const mode = input.mode ?? "colocated";
  const now = input.now ?? Date.now();
  const exp = now + (input.ttlMs ?? QR_DEFAULT_TTL_MS);
  const id = mintEnvelopeId(random);
  const mediaKey = generateMediaKey(random);
  const aesKey = deriveAesKey(mediaKey, id, input.kind);
  const envelopeBase = {
    v: QR_INVITE_VERSION,
    k: input.kind,
    id,
    exp,
  } as const;
  const ct = aesGcmEncrypt(
    aesKey,
    new TextEncoder().encode(JSON.stringify(input.inner)),
    aadFor(envelopeBase),
    random,
  );
  const envelope: QrEnvelope = {
    ...envelopeBase,
    ct: b64url(ct),
    reqConsent: true,
    notTouch: true,
  };
  if (mode === "colocated") {
    envelope.mk = b64url(mediaKey);
  }
  const deepLink = encodeQrDeepLink(envelope);
  const unlockCode = unlockCodeFromMediaKey(mediaKey);
  const shareMessage = [
    "Litmo careful-connect invite (not consent to touch).",
    `Kind: ${input.kind}`,
    `Expires: ${new Date(exp).toISOString()}`,
    mode === "split"
      ? `Unlock (required): ${unlockCode}`
      : `Unlock (backup): ${unlockCode}`,
    deepLink,
    "Open in Litmo and Accept only if you meant to connect.",
  ].join("\n");
  return {
    envelope,
    deepLink,
    unlockCode,
    mode,
    exp,
    kind: input.kind,
    shareMessage,
  };
}

export function encodeQrDeepLink(envelope: QrEnvelope): string {
  const body = b64url(new TextEncoder().encode(JSON.stringify(envelope)));
  return `${QR_URI_PREFIX}${body}`;
}

export function parseQrDeepLink(raw: string): QrEnvelope | null {
  const trimmed = raw.trim();
  // Direct envelope JSON
  if (trimmed.startsWith("{")) {
    try {
      const env = JSON.parse(trimmed) as QrEnvelope;
      return isValidEnvelope(env) ? env : null;
    } catch {
      return null;
    }
  }
  const m = trimmed.match(
    /^(?:litmo:\/\/q\/v1\/|https:\/\/softnessasastrength\.com\/q\/v1\/)([A-Za-z0-9_-]+)$/i,
  );
  if (!m?.[1]) {
    // Also accept NFC deep links as passthrough kinds elsewhere
    return null;
  }
  try {
    const json = new TextDecoder().decode(fromB64url(m[1]));
    const env = JSON.parse(json) as QrEnvelope;
    return isValidEnvelope(env) ? env : null;
  } catch {
    return null;
  }
}

export function isValidEnvelope(value: unknown): value is QrEnvelope {
  if (!value || typeof value !== "object") return false;
  const o = value as Record<string, unknown>;
  if (o.v !== QR_INVITE_VERSION) return false;
  if (typeof o.k !== "string" || !o.k) return false;
  if (typeof o.id !== "string" || !o.id) return false;
  if (typeof o.exp !== "number") return false;
  if (typeof o.ct !== "string" || !o.ct) return false;
  if (o.reqConsent !== true || o.notTouch !== true) return false;
  if (o.mk !== undefined && typeof o.mk !== "string") return false;
  return true;
}

export type OpenQrResult =
  | { ok: true; kind: QrPayloadKind; inner: unknown; envelope: QrEnvelope }
  | {
      ok: false;
      reason:
        | "invalid"
        | "expired"
        | "need_unlock"
        | "bad_unlock"
        | "decrypt_failed";
    };

/**
 * Open an encrypted QR envelope. Consent-first: callers must still show Accept UI.
 */
export function openEncryptedQr(
  rawOrEnvelope: string | QrEnvelope,
  opts?: { unlockCode?: string; now?: number },
): OpenQrResult {
  const envelope =
    typeof rawOrEnvelope === "string"
      ? parseQrDeepLink(rawOrEnvelope)
      : isValidEnvelope(rawOrEnvelope)
        ? rawOrEnvelope
        : null;
  if (!envelope) return { ok: false, reason: "invalid" };
  if (isEnvelopeExpired(envelope, opts?.now ?? Date.now())) {
    return { ok: false, reason: "expired" };
  }

  let mediaKey: Uint8Array | null = null;
  if (envelope.mk) {
    try {
      mediaKey = fromB64url(envelope.mk);
    } catch {
      mediaKey = null;
    }
  } else if (opts?.unlockCode) {
    mediaKey = mediaKeyFromUnlockCode(opts.unlockCode);
    if (!mediaKey) return { ok: false, reason: "bad_unlock" };
  } else {
    return { ok: false, reason: "need_unlock" };
  }
  if (!mediaKey || mediaKey.length !== 16) {
    return { ok: false, reason: "bad_unlock" };
  }

  const aesKey = deriveAesKey(mediaKey, envelope.id, envelope.k);
  const plain = aesGcmDecrypt(
    aesKey,
    fromB64url(envelope.ct),
    aadFor(envelope),
  );
  if (!plain) return { ok: false, reason: "decrypt_failed" };
  try {
    const inner = JSON.parse(new TextDecoder().decode(plain)) as unknown;
    return { ok: true, kind: envelope.k, inner, envelope };
  } catch {
    return { ok: false, reason: "decrypt_failed" };
  }
}

export function buildProximityInviteInner(input: {
  token: string;
  beacon: string;
  epk?: string | null;
  label?: string | null;
}): ProximityInviteInner {
  return {
    kind: "proximity_invite",
    v: 1,
    token: input.token.slice(0, 32),
    beacon: input.beacon.slice(0, 200),
    epk: input.epk ?? null,
    label: input.label?.slice(0, 24) ?? null,
    notConsentToTouch: true,
    requiresPostTapConsent: true,
    disclaimer:
      "Proximity QR invite only. Not safety, not trust, not consent to touch. Accept carefully in Litmo.",
  };
}

export function buildSnapshotStartInner(input: {
  title?: string;
  rows: { label: string; value: string }[];
}): SnapshotStartInner {
  return {
    kind: "snapshot_start",
    v: 1,
    title: (input.title ?? "Consent Snapshot review").slice(0, 120),
    rows: input.rows
      .map((r) => ({
        label: String(r.label).slice(0, 80),
        value: String(r.value).slice(0, 400),
      }))
      .filter((r) => r.label && r.value)
      .slice(0, 40),
    notConsentToTouch: true,
    notSessionActivation: true,
    reviewOnly: true,
    requiresPostTapConsent: true,
    disclaimer:
      "Snapshot start QR is review-only. It does not activate a session or grant touch. Accept carefully.",
  };
}

export function isProximityInviteInner(
  value: unknown,
): value is ProximityInviteInner {
  if (!value || typeof value !== "object") return false;
  const o = value as Record<string, unknown>;
  return (
    o.kind === "proximity_invite" &&
    o.notConsentToTouch === true &&
    o.requiresPostTapConsent === true &&
    typeof o.token === "string" &&
    typeof o.beacon === "string"
  );
}

export function isSnapshotStartInner(
  value: unknown,
): value is SnapshotStartInner {
  if (!value || typeof value !== "object") return false;
  const o = value as Record<string, unknown>;
  return (
    o.kind === "snapshot_start" &&
    o.notConsentToTouch === true &&
    o.notSessionActivation === true &&
    o.reviewOnly === true &&
    o.requiresPostTapConsent === true &&
    Array.isArray(o.rows)
  );
}

/**
 * Degradation ladder for transport selection (product order).
 */
export type ConnectTransport = "nfc" | "qr" | "manual";

export function nextConnectTransport(
  current: ConnectTransport | null,
  available: { nfc: boolean; qr: boolean },
): ConnectTransport {
  if (!current) {
    if (available.nfc) return "nfc";
    if (available.qr) return "qr";
    return "manual";
  }
  if (current === "nfc") return available.qr ? "qr" : "manual";
  if (current === "qr") return "manual";
  return "manual";
}

export function transportLabel(t: ConnectTransport): string {
  switch (t) {
    case "nfc":
      return "NFC tag";
    case "qr":
      return "Encrypted QR";
    case "manual":
      return "Manual link / code";
  }
}

/** Remaining ms until expiry; 0 if expired. */
export function msUntilExpiry(
  exp: number,
  now: number = Date.now(),
): number {
  return Math.max(0, exp - now);
}

export function formatExpiryCountdown(
  exp: number,
  now: number = Date.now(),
): string {
  const ms = msUntilExpiry(exp, now);
  if (ms <= 0) return "Expired";
  const s = Math.ceil(ms / 1000);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return m > 0 ? `${m}m ${r}s left` : `${r}s left`;
}
