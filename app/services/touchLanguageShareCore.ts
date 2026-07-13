/**
 * Encrypted Touch Language share packages for careful partner review.
 * AES-256-GCM; private notes stripped; accepting share ≠ consent to touch.
 */

import { gcm } from "@noble/ciphers/aes.js";
import { hkdf } from "@noble/hashes/hkdf.js";
import { sha256 } from "@noble/hashes/sha2.js";
import { randomBytes } from "@noble/hashes/utils.js";
import {
  buildSharePayload,
  parseSharePayload,
  type TouchLanguageDocument,
  type TouchLanguageSharePayload,
} from "../lib/touchLanguageCore.ts";
import { b64url, fromB64url } from "./localShareCore.ts";

export const TL_SHARE_VERSION = 1 as const;
export const TL_SHARE_TTL_MS = 15 * 60 * 1000;
export const TL_SHARE_URI_PREFIX = "litmo://tl/v1/";
export const TL_SHARE_INFO = new TextEncoder().encode("LitmoTouchLanguageShare-v1");

export type TouchLanguageShareEnvelope = {
  v: typeof TL_SHARE_VERSION;
  id: string;
  exp: number;
  ct: string;
  /** Media key for colocated QR (base64url). */
  mk: string;
  reqConsent: true;
  notTouch: true;
  kind: "touch_language_share";
};

export type TouchLanguageShareBuild = {
  envelope: TouchLanguageShareEnvelope;
  deepLink: string;
  unlockCode: string;
  exp: number;
  shareMessage: string;
  payload: TouchLanguageSharePayload;
};

function deriveKey(mediaKey: Uint8Array, unlockCode: string): Uint8Array {
  const salt = new TextEncoder().encode(`tl-share:${unlockCode}`);
  return hkdf(sha256, mediaKey, salt, TL_SHARE_INFO, 32);
}

function randomUnlockCode(): string {
  // 6 digit, easy to speak in person.
  const n = randomBytes(3);
  const num = ((n[0]! << 16) | (n[1]! << 8) | n[2]!) % 1_000_000;
  return String(num).padStart(6, "0");
}

export function sealTouchLanguageShare(
  doc: TouchLanguageDocument,
  ttlMs: number = TL_SHARE_TTL_MS,
): TouchLanguageShareBuild {
  const payload = buildSharePayload(doc);
  const mediaKey = randomBytes(32);
  const unlockCode = randomUnlockCode();
  const key = deriveKey(mediaKey, unlockCode);
  const nonce = randomBytes(12);
  const plaintext = new TextEncoder().encode(JSON.stringify(payload));
  const aad = new TextEncoder().encode("litmo-tl-share-v1");
  const cipher = gcm(key, nonce, aad);
  const sealed = cipher.encrypt(plaintext);
  const combined = new Uint8Array(nonce.length + sealed.length);
  combined.set(nonce, 0);
  combined.set(sealed, nonce.length);

  const id = b64url(randomBytes(8));
  const exp = Date.now() + ttlMs;
  const envelope: TouchLanguageShareEnvelope = {
    v: 1,
    id,
    exp,
    ct: b64url(combined),
    mk: b64url(mediaKey),
    reqConsent: true,
    notTouch: true,
    kind: "touch_language_share",
  };

  const deepLink = `${TL_SHARE_URI_PREFIX}${b64url(
    new TextEncoder().encode(JSON.stringify(envelope)),
  )}`;

  return {
    envelope,
    deepLink,
    unlockCode,
    exp,
    payload,
    shareMessage:
      "Litmo Touch Language share (review only). Open in Litmo, enter the unlock code if asked. This is not consent to touch.",
  };
}

export type OpenShareResult =
  | { ok: true; payload: TouchLanguageSharePayload }
  | { ok: false; reason: string };

export function openTouchLanguageShare(
  envelope: TouchLanguageShareEnvelope | string,
  unlockCode: string,
): OpenShareResult {
  let env: TouchLanguageShareEnvelope;
  try {
    if (typeof envelope === "string") {
      const raw = envelope.startsWith(TL_SHARE_URI_PREFIX)
        ? envelope.slice(TL_SHARE_URI_PREFIX.length)
        : envelope;
      env = JSON.parse(
        new TextDecoder().decode(fromB64url(raw)),
      ) as TouchLanguageShareEnvelope;
    } else {
      env = envelope;
    }
  } catch {
    return { ok: false, reason: "That share link could not be read." };
  }

  if (env.v !== 1 || env.kind !== "touch_language_share") {
    return { ok: false, reason: "Unsupported share format." };
  }
  if (env.notTouch !== true || env.reqConsent !== true) {
    return { ok: false, reason: "Share missing safety flags." };
  }
  if (Date.now() > env.exp) {
    return { ok: false, reason: "This share has expired." };
  }

  try {
    const mediaKey = fromB64url(env.mk);
    const key = deriveKey(mediaKey, unlockCode.trim());
    const combined = fromB64url(env.ct);
    const nonce = combined.slice(0, 12);
    const ciphertext = combined.slice(12);
    const aad = new TextEncoder().encode("litmo-tl-share-v1");
    const cipher = gcm(key, nonce, aad);
    const plain = cipher.decrypt(ciphertext);
    const json = JSON.parse(new TextDecoder().decode(plain));
    const payload = parseSharePayload(json);
    if (!payload) {
      return { ok: false, reason: "Share contents failed validation." };
    }
    return { ok: true, payload };
  } catch {
    return {
      ok: false,
      reason: "Could not unlock. Check the code and try again.",
    };
  }
}
