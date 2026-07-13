/**
 * NFC tap-to-connect protocol (pure TypeScript).
 *
 * Product rules:
 * - A physical tap is never consent. Explicit Accept is required after every read.
 * - Offers expire quickly and carry only discovery-safe or public ECDH material.
 * - Consent Snapshot initiation never activates a session.
 * - Same package encodes for NFC NDEF, QR deep link, and manual short codes.
 */

import { x25519 } from "@noble/curves/ed25519.js";
import { gcm } from "@noble/ciphers/aes.js";
import { hkdf } from "@noble/hashes/hkdf.js";
import { sha256 } from "@noble/hashes/sha2.js";
import { randomBytes } from "@noble/hashes/utils.js";
import {
  b64url,
  fromB64url,
  generateX25519KeyPair,
  type X25519KeyPair,
} from "./localShareCore.ts";

export const NFC_PROTOCOL_VERSION = 1 as const;
export const NFC_URI_SCHEME = "litmo";
export const NFC_URI_HOST = "nfc";
/** Offers live 3 minutes — short enough to reduce shoulder-surfing window. */
export const NFC_OFFER_TTL_MS = 3 * 60 * 1000;
export const NFC_INFO = new TextEncoder().encode("LitmoNfc-v1");

export type NfcIntent =
  | "profile_share"
  | "snapshot_initiate"
  | "key_exchange";

export type NfcTransport = "nfc_tag" | "qr" | "manual" | "deep_link" | "demo";

export type NfcOffer = {
  v: typeof NFC_PROTOCOL_VERSION;
  intent: NfcIntent;
  /** Ephemeral session id (not an account id). */
  sid: string;
  /** X25519 public key (base64url). */
  epk: string;
  /** Short human code for manual entry (derived, not secret). */
  code: string;
  /** Optional anonymous display label — never treated as verified identity. */
  label: string | null;
  exp: number;
  requiresPostTapConsent: true;
  notConsentToTouch: true;
  notSessionActivation: true;
  disclaimer: string;
};

export type NfcAccept = {
  v: typeof NFC_PROTOCOL_VERSION;
  t: "accept";
  sid: string;
  epk: string;
  acceptedIntent: NfcIntent;
  acceptedAt: number;
  notConsentToTouch: true;
};

export type NfcSealedPayload = {
  v: typeof NFC_PROTOCOL_VERSION;
  t: "sealed";
  sid: string;
  intent: NfcIntent;
  /** AES-GCM ciphertext (base64url). */
  ct: string;
};

export type ProfileSharePlaintext = {
  kind: "profile_share";
  displayName: string;
  pronouns: string | null;
  bio: string | null;
  notConsentToTouch: true;
};

export type SnapshotInitiatePlaintext = {
  kind: "snapshot_initiate";
  title: string;
  rows: { label: string; value: string }[];
  notSessionActivation: true;
  notConsentToTouch: true;
  /** Navigation hint only — never auto-starts a live session. */
  reviewOnly: true;
};

export type KeyExchangePlaintext = {
  kind: "key_exchange";
  note: string;
  notConsentToTouch: true;
};

export type NfcPlaintext =
  | ProfileSharePlaintext
  | SnapshotInitiatePlaintext
  | KeyExchangePlaintext;

const OFFER_DISCLAIMER =
  "NFC or QR only starts a careful review. A tap is never consent to touch, never a session, and never identity proof.";

export function mintSessionId(
  random: (n: number) => Uint8Array = (n) => randomBytes(n),
): string {
  return b64url(random(9)).slice(0, 12);
}

/** Short, typeable code for manual fallback (non-cryptographic convenience). */
export function deriveShortCode(sid: string, epk: string): string {
  const h = sha256(new TextEncoder().encode(`litmo-nfc-code|${sid}|${epk}`));
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < 8; i++) {
    out += alphabet[h[i]! % alphabet.length];
  }
  return out;
}

export function intentLabel(intent: NfcIntent): string {
  switch (intent) {
    case "profile_share":
      return "Discovery profile share";
    case "snapshot_initiate":
      return "Consent Snapshot review invite";
    case "key_exchange":
      return "Secure key exchange";
  }
}

export function buildOffer(input: {
  intent: NfcIntent;
  pair: X25519KeyPair;
  label?: string | null;
  now?: number;
  ttlMs?: number;
  random?: (n: number) => Uint8Array;
}): NfcOffer {
  const random = input.random ?? ((n: number) => randomBytes(n));
  const sid = mintSessionId(random);
  const epk = b64url(input.pair.publicKey);
  const now = input.now ?? Date.now();
  return {
    v: NFC_PROTOCOL_VERSION,
    intent: input.intent,
    sid,
    epk,
    code: deriveShortCode(sid, epk),
    label: input.label?.trim() ? input.label.trim().slice(0, 24) : null,
    exp: now + (input.ttlMs ?? NFC_OFFER_TTL_MS),
    requiresPostTapConsent: true,
    notConsentToTouch: true,
    notSessionActivation: true,
    disclaimer: OFFER_DISCLAIMER,
  };
}

export function isOfferExpired(
  offer: NfcOffer,
  now: number = Date.now(),
): boolean {
  return now >= offer.exp;
}

export function isValidOffer(value: unknown): value is NfcOffer {
  if (!value || typeof value !== "object") return false;
  const o = value as Record<string, unknown>;
  if (o.v !== NFC_PROTOCOL_VERSION) return false;
  if (
    o.intent !== "profile_share" &&
    o.intent !== "snapshot_initiate" &&
    o.intent !== "key_exchange"
  ) {
    return false;
  }
  if (typeof o.sid !== "string" || o.sid.length < 6) return false;
  if (typeof o.epk !== "string" || o.epk.length < 20) return false;
  if (typeof o.code !== "string" || o.code.length < 6) return false;
  if (typeof o.exp !== "number") return false;
  if (o.requiresPostTapConsent !== true) return false;
  if (o.notConsentToTouch !== true) return false;
  if (o.notSessionActivation !== true) return false;
  return true;
}

export function parseOfferJson(raw: string): NfcOffer | null {
  try {
    const parsed = JSON.parse(raw) as unknown;
    return isValidOffer(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

/**
 * Compact deep-link form for NDEF URI / QR.
 * litmo://nfc/v1/<base64url(json)>
 */
export function encodeOfferDeepLink(offer: NfcOffer): string {
  const body = b64url(new TextEncoder().encode(JSON.stringify(offer)));
  return `${NFC_URI_SCHEME}://${NFC_URI_HOST}/v1/${body}`;
}

export function parseOfferDeepLink(url: string): NfcOffer | null {
  const trimmed = url.trim();
  // Accept litmo://nfc/v1/... and https fallback paths if ever added.
  const m = trimmed.match(
    /^(?:litmo:\/\/nfc\/v1\/|https:\/\/softnessasastrength\.com\/nfc\/v1\/)([A-Za-z0-9_-]+)$/i,
  );
  if (!m?.[1]) {
    // Also accept raw JSON (manual paste).
    return parseOfferJson(trimmed);
  }
  try {
    const json = new TextDecoder().decode(fromB64url(m[1]));
    return parseOfferJson(json);
  } catch {
    return null;
  }
}

/** NDEF text/plain body (short). Prefer deep link for URI records. */
export function encodeOfferNdefText(offer: NfcOffer): string {
  return encodeOfferDeepLink(offer);
}

export function buildAccept(input: {
  offer: NfcOffer;
  pair: X25519KeyPair;
  now?: number;
}): NfcAccept {
  return {
    v: NFC_PROTOCOL_VERSION,
    t: "accept",
    sid: input.offer.sid,
    epk: b64url(input.pair.publicKey),
    acceptedIntent: input.offer.intent,
    acceptedAt: input.now ?? Date.now(),
    notConsentToTouch: true,
  };
}

export function encodeAcceptDeepLink(accept: NfcAccept): string {
  const body = b64url(new TextEncoder().encode(JSON.stringify(accept)));
  return `${NFC_URI_SCHEME}://${NFC_URI_HOST}/accept/v1/${body}`;
}

export function parseAcceptDeepLink(url: string): NfcAccept | null {
  const m = url.trim().match(
    /^(?:litmo:\/\/nfc\/accept\/v1\/)([A-Za-z0-9_-]+)$/i,
  );
  if (!m?.[1]) {
    try {
      const p = JSON.parse(url) as NfcAccept;
      if (p?.t === "accept" && p.v === NFC_PROTOCOL_VERSION) return p;
    } catch {
      return null;
    }
    return null;
  }
  try {
    const json = new TextDecoder().decode(fromB64url(m[1]));
    const p = JSON.parse(json) as NfcAccept;
    if (p?.t !== "accept" || p.v !== NFC_PROTOCOL_VERSION) return null;
    return p;
  } catch {
    return null;
  }
}

export function deriveNfcSessionKey(params: {
  myPrivate: Uint8Array;
  theirPublic: Uint8Array;
  myPublic: Uint8Array;
  sid: string;
}): Uint8Array {
  const shared = x25519.getSharedSecret(params.myPrivate, params.theirPublic);
  const a = b64url(params.myPublic);
  const b = b64url(params.theirPublic);
  const saltMaterial =
    a < b ? `${params.sid}|${a}|${b}` : `${params.sid}|${b}|${a}`;
  const salt = sha256(new TextEncoder().encode(saltMaterial));
  return hkdf(sha256, shared, salt, NFC_INFO, 32);
}

function aadForIntent(intent: NfcIntent, sid: string): Uint8Array {
  return new TextEncoder().encode(
    `litmo-nfc|v${NFC_PROTOCOL_VERSION}|${intent}|${sid}`,
  );
}

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
  const nonce = combined.slice(0, 12);
  const ct = combined.slice(12);
  try {
    return gcm(key, nonce, aad).decrypt(ct);
  } catch {
    return null;
  }
}

export function sealNfcPayload(
  sessionKey: Uint8Array,
  sid: string,
  intent: NfcIntent,
  plaintext: NfcPlaintext,
  random: (n: number) => Uint8Array = (n) => randomBytes(n),
): NfcSealedPayload {
  const ct = aesGcmEncrypt(
    sessionKey,
    new TextEncoder().encode(JSON.stringify(plaintext)),
    aadForIntent(intent, sid),
    random,
  );
  return {
    v: NFC_PROTOCOL_VERSION,
    t: "sealed",
    sid,
    intent,
    ct: b64url(ct),
  };
}

export function openNfcPayload(
  sessionKey: Uint8Array,
  sealed: NfcSealedPayload,
): NfcPlaintext | null {
  const plain = aesGcmDecrypt(
    sessionKey,
    fromB64url(sealed.ct),
    aadForIntent(sealed.intent, sealed.sid),
  );
  if (!plain) return null;
  try {
    const parsed = JSON.parse(new TextDecoder().decode(plain)) as NfcPlaintext;
    if (!parsed || typeof parsed !== "object") return null;
    if (parsed.notConsentToTouch !== true) return null;
    if (parsed.kind === "snapshot_initiate") {
      if (
        parsed.notSessionActivation !== true ||
        parsed.reviewOnly !== true
      ) {
        return null;
      }
    }
    return parsed;
  } catch {
    return null;
  }
}

export function buildProfilePlaintext(input: {
  displayName: string;
  pronouns?: string | null;
  bio?: string | null;
}): ProfileSharePlaintext {
  const name = input.displayName.trim().slice(0, 80);
  if (!name) throw new Error("Display name required for profile share.");
  return {
    kind: "profile_share",
    displayName: name,
    pronouns: input.pronouns?.trim() ? input.pronouns.trim().slice(0, 40) : null,
    bio: input.bio?.trim() ? input.bio.trim().slice(0, 280) : null,
    notConsentToTouch: true,
  };
}

export function buildSnapshotInitiatePlaintext(input: {
  title?: string;
  rows: { label: string; value: string }[];
}): SnapshotInitiatePlaintext {
  return {
    kind: "snapshot_initiate",
    title: (input.title ?? "Consent Snapshot review").slice(0, 120),
    rows: input.rows
      .map((r) => ({
        label: String(r.label).slice(0, 80),
        value: String(r.value).slice(0, 400),
      }))
      .filter((r) => r.label && r.value)
      .slice(0, 40),
    notSessionActivation: true,
    notConsentToTouch: true,
    reviewOnly: true,
  };
}

export function buildKeyExchangePlaintext(): KeyExchangePlaintext {
  return {
    kind: "key_exchange",
    note: "Ephemeral key exchange complete. Continue only with explicit consent for any further share.",
    notConsentToTouch: true,
  };
}

/**
 * Post-tap consent gate: physical read alone is insufficient.
 */
export function mayOpenNfcContent(state: {
  offerValid: boolean;
  offerExpired: boolean;
  localAcceptedPostTap: boolean;
  softCanceled: boolean;
}): boolean {
  if (state.softCanceled) return false;
  if (!state.offerValid || state.offerExpired) return false;
  return state.localAcceptedPostTap;
}

export function encodeSealedDeepLink(sealed: NfcSealedPayload): string {
  const body = b64url(new TextEncoder().encode(JSON.stringify(sealed)));
  return `${NFC_URI_SCHEME}://${NFC_URI_HOST}/sealed/v1/${body}`;
}

export function parseSealedDeepLink(url: string): NfcSealedPayload | null {
  const m = url.trim().match(/litmo:\/\/nfc\/sealed\/v1\/([A-Za-z0-9_-]+)/i);
  if (!m?.[1]) return null;
  try {
    const p = JSON.parse(
      new TextDecoder().decode(fromB64url(m[1])),
    ) as NfcSealedPayload;
    if (p?.t !== "sealed" || p.v !== NFC_PROTOCOL_VERSION) return null;
    return p;
  } catch {
    return null;
  }
}

/**
 * Manual fallback bundle: short code + deep link + JSON for paste.
 */
export function buildFallbackBundle(offer: NfcOffer): {
  shortCode: string;
  deepLink: string;
  json: string;
  shareMessage: string;
} {
  const deepLink = encodeOfferDeepLink(offer);
  return {
    shortCode: offer.code,
    deepLink,
    json: JSON.stringify(offer),
    shareMessage: [
      "Litmo careful connect invite (not consent to touch).",
      `Code: ${offer.code}`,
      `Intent: ${intentLabel(offer.intent)}`,
      deepLink,
      "Open in Litmo and Accept only if you meant to connect.",
    ].join("\n"),
  };
}

/** Demo offer for Expo Go practice without NFC hardware. */
export function buildDemoOffer(intent: NfcIntent = "profile_share"): {
  offer: NfcOffer;
  pair: X25519KeyPair;
} {
  const pair = generateX25519KeyPair();
  const offer = buildOffer({
    intent,
    pair,
    label: "Demo tap",
  });
  return { offer, pair };
}

export { generateX25519KeyPair, b64url, fromB64url, type X25519KeyPair };
