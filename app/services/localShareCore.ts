/**
 * AirDrop-style local share protocol (pure TypeScript).
 *
 * Transport is Multipeer Connectivity (or a test loopback). Crypto is
 * ephemeral X25519 ECDH + HKDF-SHA-256 + AES-256-GCM. Nothing here grants
 * session consent, activates a session, or uploads plaintext to a server.
 *
 * Product rules encoded in payload shapes:
 * - discovery profiles never include private nervous-system notes
 * - consent snapshot share is co-located review only, never activation
 */

import { x25519 } from "@noble/curves/ed25519.js";
import { gcm } from "@noble/ciphers/aes.js";
import { hkdf } from "@noble/hashes/hkdf.js";
import { sha256 } from "@noble/hashes/sha2.js";
import { randomBytes } from "@noble/hashes/utils.js";

export const LOCAL_SHARE_PROTOCOL_VERSION = 1 as const;
export const LOCAL_SHARE_SERVICE_TYPE = "litmo-share";
/** Default session lifetime: 2 minutes of radio time. */
export const LOCAL_SHARE_DEFAULT_TIMEOUT_MS = 2 * 60 * 1000;
export const LOCAL_SHARE_INFO = new TextEncoder().encode("LitmoLocalShare-v1");

export type ShareKind = "discovery_profile" | "consent_snapshot_review";

export type SnapshotRowShare = { label: string; value: string };

export type DiscoveryProfilePayload = {
  kind: "discovery_profile";
  v: typeof LOCAL_SHARE_PROTOCOL_VERSION;
  displayName: string;
  pronouns: string | null;
  bio: string | null;
  sharedAt: string;
  notConsentToTouch: true;
  disclaimer: string;
};

export type ConsentSnapshotReviewPayload = {
  kind: "consent_snapshot_review";
  v: typeof LOCAL_SHARE_PROTOCOL_VERSION;
  title: string;
  rows: SnapshotRowShare[];
  sharedAt: string;
  /** Never use a nearby share to start or activate a session. */
  notSessionActivation: true;
  notConsentToTouch: true;
  disclaimer: string;
};

export type LocalSharePayload =
  | DiscoveryProfilePayload
  | ConsentSnapshotReviewPayload;

export type WireMessage =
  | {
      t: "hello";
      v: typeof LOCAL_SHARE_PROTOCOL_VERSION;
      ephemeralPublic: string;
      shareKind: ShareKind;
      displayLabel: string;
    }
  | {
      t: "hello_ack";
      v: typeof LOCAL_SHARE_PROTOCOL_VERSION;
      ephemeralPublic: string;
      displayLabel: string;
    }
  | {
      t: "payload";
      v: typeof LOCAL_SHARE_PROTOCOL_VERSION;
      ciphertext: string;
    }
  | { t: "done"; v: typeof LOCAL_SHARE_PROTOCOL_VERSION }
  | { t: "cancel"; v: typeof LOCAL_SHARE_PROTOCOL_VERSION };

export type X25519KeyPair = {
  publicKey: Uint8Array;
  privateKey: Uint8Array;
};

const PROFILE_DISCLAIMER =
  "This is a discovery-safe profile share only. It is never consent to touch, never a match, and never a Consent Snapshot.";

const SNAPSHOT_DISCLAIMER =
  "This is a co-located Consent Snapshot review only. It does not activate a session, grant touch, or replace each person's live confirmation in Litmo.";

export function b64url(bytes: Uint8Array): string {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

export function fromB64url(s: string): Uint8Array {
  const pad = s.length % 4 === 0 ? "" : "=".repeat(4 - (s.length % 4));
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/") + pad;
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export function generateX25519KeyPair(
  random: (n: number) => Uint8Array = (n) => randomBytes(n),
): X25519KeyPair {
  const privateKey = random(32);
  const publicKey = x25519.getPublicKey(privateKey);
  return { publicKey, privateKey };
}

/**
 * Derive a one-shot session key from both ephemeral public keys (sorted so
 * either side can recompute the same salt) and the ECDH shared secret.
 */
export function deriveLocalShareSessionKey(params: {
  myPrivate: Uint8Array;
  theirPublic: Uint8Array;
  myPublic: Uint8Array;
}): Uint8Array {
  const shared = x25519.getSharedSecret(params.myPrivate, params.theirPublic);
  const a = b64url(params.myPublic);
  const b = b64url(params.theirPublic);
  const saltMaterial = a < b ? `${a}|${b}` : `${b}|${a}`;
  const salt = sha256(new TextEncoder().encode(saltMaterial));
  return hkdf(sha256, shared, salt, LOCAL_SHARE_INFO, 32);
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
    const cipher = gcm(key, nonce, aad);
    return cipher.decrypt(ct);
  } catch {
    return null;
  }
}

export function aadForKind(kind: ShareKind): Uint8Array {
  return new TextEncoder().encode(
    `litmo-local-share|v${LOCAL_SHARE_PROTOCOL_VERSION}|${kind}`,
  );
}

export function encryptSharePayload(
  sessionKey: Uint8Array,
  payload: LocalSharePayload,
  random: (n: number) => Uint8Array = (n) => randomBytes(n),
): string {
  const plaintext = new TextEncoder().encode(JSON.stringify(payload));
  const sealed = aesGcmEncrypt(
    sessionKey,
    plaintext,
    aadForKind(payload.kind),
    random,
  );
  return b64url(sealed);
}

export function decryptSharePayload(
  sessionKey: Uint8Array,
  ciphertextB64: string,
  expectedKind: ShareKind,
): LocalSharePayload | null {
  const combined = fromB64url(ciphertextB64);
  const plain = aesGcmDecrypt(
    sessionKey,
    combined,
    aadForKind(expectedKind),
  );
  if (!plain) return null;
  try {
    const text = new TextDecoder().decode(plain);
    const parsed = JSON.parse(text) as LocalSharePayload;
    if (!isValidSharePayload(parsed) || parsed.kind !== expectedKind) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function buildDiscoveryProfilePayload(input: {
  displayName: string;
  pronouns?: string | null;
  bio?: string | null;
  now?: string;
}): DiscoveryProfilePayload {
  const name = input.displayName.trim().slice(0, 80);
  if (!name) {
    throw new Error("A display name is required to share a discovery profile.");
  }
  return {
    kind: "discovery_profile",
    v: LOCAL_SHARE_PROTOCOL_VERSION,
    displayName: name,
    pronouns: input.pronouns?.trim() ? input.pronouns.trim().slice(0, 40) : null,
    bio: input.bio?.trim() ? input.bio.trim().slice(0, 280) : null,
    sharedAt: input.now ?? new Date().toISOString(),
    notConsentToTouch: true,
    disclaimer: PROFILE_DISCLAIMER,
  };
}

export function buildConsentSnapshotReviewPayload(input: {
  title?: string;
  rows: SnapshotRowShare[];
  now?: string;
}): ConsentSnapshotReviewPayload {
  const rows = input.rows
    .map((row) => ({
      label: String(row.label).slice(0, 80),
      value: String(row.value).slice(0, 400),
    }))
    .filter((row) => row.label.length > 0 && row.value.length > 0)
    .slice(0, 40);
  return {
    kind: "consent_snapshot_review",
    v: LOCAL_SHARE_PROTOCOL_VERSION,
    title: (input.title ?? "Consent Snapshot review").slice(0, 120),
    rows,
    sharedAt: input.now ?? new Date().toISOString(),
    notSessionActivation: true,
    notConsentToTouch: true,
    disclaimer: SNAPSHOT_DISCLAIMER,
  };
}

export function isValidSharePayload(
  value: unknown,
): value is LocalSharePayload {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  if (v.v !== LOCAL_SHARE_PROTOCOL_VERSION) return false;
  if (v.notConsentToTouch !== true) return false;
  if (v.kind === "discovery_profile") {
    return (
      typeof v.displayName === "string" &&
      v.displayName.length > 0 &&
      typeof v.disclaimer === "string"
    );
  }
  if (v.kind === "consent_snapshot_review") {
    return (
      v.notSessionActivation === true &&
      Array.isArray(v.rows) &&
      typeof v.disclaimer === "string"
    );
  }
  return false;
}

export function parseWireMessage(raw: string): WireMessage | null {
  try {
    const msg = JSON.parse(raw) as WireMessage;
    if (!msg || typeof msg !== "object") return null;
    if (msg.v !== LOCAL_SHARE_PROTOCOL_VERSION) return null;
    if (
      msg.t === "hello" ||
      msg.t === "hello_ack" ||
      msg.t === "payload" ||
      msg.t === "done" ||
      msg.t === "cancel"
    ) {
      return msg;
    }
    return null;
  } catch {
    return null;
  }
}

export function encodeWireMessage(msg: WireMessage): string {
  return JSON.stringify(msg);
}

export function shareKindLabel(kind: ShareKind): string {
  return kind === "discovery_profile"
    ? "Discovery profile"
    : "Consent Snapshot review";
}

/**
 * Short, non-sensitive label for Multipeer discovery info (visible nearby).
 * Never put private notes, body zones, or full bios here.
 */
export function discoveryDisplayLabel(displayName: string): string {
  const clean = displayName.trim().replace(/\s+/g, " ").slice(0, 24);
  return clean.length > 0 ? clean : "Litmo neighbor";
}

/**
 * Whether remaining radio time should be treated as expired.
 */
export function isShareSessionExpired(
  startedAtMs: number,
  nowMs: number,
  timeoutMs: number = LOCAL_SHARE_DEFAULT_TIMEOUT_MS,
): boolean {
  return nowMs - startedAtMs >= timeoutMs;
}
