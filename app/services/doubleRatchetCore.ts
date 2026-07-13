/**
 * Signal-inspired X3DH + Double Ratchet for Litmo partner quiz packages.
 *
 * Pure TypeScript (testable offline). Uses X25519 (ECDH), HKDF-SHA-256, AES-256-GCM.
 * Not a full multi-device Signal client — a focused 1:1 ratchet for sealed quiz results.
 *
 * Safety product rules live outside this module: mutual consent before compare,
 * never treat plaintext weather as consent to touch.
 */

import { x25519 } from "@noble/curves/ed25519.js";
import { gcm } from "@noble/ciphers/aes.js";
import { hkdf } from "@noble/hashes/hkdf.js";
import { sha256 } from "@noble/hashes/sha2.js";
import { randomBytes } from "@noble/hashes/utils.js";

const INFO_ROOT = new TextEncoder().encode("LitmoQuizDR-Root-v1");
const INFO_CHAIN = new TextEncoder().encode("LitmoQuizDR-Chain-v1");
const INFO_MSG = new TextEncoder().encode("LitmoQuizDR-Msg-v1");
const INFO_X3DH = new TextEncoder().encode("LitmoQuiz-X3DH-v1");

export type X25519KeyPair = {
  publicKey: Uint8Array; // 32
  privateKey: Uint8Array; // 32
};

export type RatchetHeader = {
  /** Sender current DH public key (base64url) */
  dh: string;
  /** Previous chain length */
  pn: number;
  /** Message number in current sending chain */
  n: number;
};

export type RatchetMessage = {
  v: 2;
  header: RatchetHeader;
  /** AES-GCM ciphertext (base64url) = nonce||ciphertext||tag combined */
  ciphertext: string;
};

export type DoubleRatchetState = {
  /** Our current sending DH key pair */
  dhsPublic: string;
  dhsPrivate: string;
  /** Their current DH public (or empty) */
  dhr: string | null;
  rootKey: string;
  chainKeySend: string | null;
  chainKeyRecv: string | null;
  ns: number;
  nr: number;
  pn: number;
};

function b64url(bytes: Uint8Array): string {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function fromB64url(s: string): Uint8Array {
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
  // clamp is handled by noble
  const publicKey = x25519.getPublicKey(privateKey);
  return { publicKey, privateKey };
}

function kdfRk(rootKey: Uint8Array, dhOut: Uint8Array): {
  rootKey: Uint8Array;
  chainKey: Uint8Array;
} {
  const okm = hkdf(sha256, dhOut, rootKey, INFO_ROOT, 64);
  return { rootKey: okm.slice(0, 32), chainKey: okm.slice(32, 64) };
}

function kdfCk(chainKey: Uint8Array): {
  chainKey: Uint8Array;
  messageKey: Uint8Array;
} {
  const okm = hkdf(sha256, chainKey, undefined, INFO_CHAIN, 64);
  return { chainKey: okm.slice(0, 32), messageKey: okm.slice(32, 64) };
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

function concat3(a: Uint8Array, b: Uint8Array, c: Uint8Array): Uint8Array {
  const ikm = new Uint8Array(a.length + b.length + c.length);
  ikm.set(a, 0);
  ikm.set(b, a.length);
  ikm.set(c, a.length + b.length);
  return hkdf(sha256, ikm, undefined, INFO_X3DH, 32);
}

/**
 * X3DH-style shared secret as initiator A (peer joining host B).
 * DH1=DH(IKa,SPKb), DH2=DH(EKa,IKb), DH3=DH(EKa,SPKb).
 */
export function x3dhAsInitiator(params: {
  identityPrivateA: Uint8Array;
  ephemeralPrivateA: Uint8Array;
  identityPublicB: Uint8Array;
  signedPrekeyPublicB: Uint8Array;
}): Uint8Array {
  const dh1 = x25519.getSharedSecret(
    params.identityPrivateA,
    params.signedPrekeyPublicB,
  );
  const dh2 = x25519.getSharedSecret(
    params.ephemeralPrivateA,
    params.identityPublicB,
  );
  const dh3 = x25519.getSharedSecret(
    params.ephemeralPrivateA,
    params.signedPrekeyPublicB,
  );
  return concat3(dh1, dh2, dh3);
}

/**
 * X3DH-style shared secret as responder B (host).
 * Same three DHs with B's private keys.
 */
export function x3dhAsResponder(params: {
  identityPrivateB: Uint8Array;
  signedPrekeyPrivateB: Uint8Array;
  identityPublicA: Uint8Array;
  ephemeralPublicA: Uint8Array;
}): Uint8Array {
  const dh1 = x25519.getSharedSecret(
    params.signedPrekeyPrivateB,
    params.identityPublicA,
  );
  const dh2 = x25519.getSharedSecret(
    params.identityPrivateB,
    params.ephemeralPublicA,
  );
  const dh3 = x25519.getSharedSecret(
    params.signedPrekeyPrivateB,
    params.ephemeralPublicA,
  );
  return concat3(dh1, dh2, dh3);
}

/** @deprecated use x3dhAsInitiator */
export function x3dhSharedSecret(params: {
  identityPrivateA: Uint8Array;
  ephemeralPrivateA: Uint8Array;
  identityPublicB: Uint8Array;
  signedPrekeyPublicB: Uint8Array;
}): Uint8Array {
  return x3dhAsInitiator(params);
}

export function initRatchetAsAlice(
  sharedSecret: Uint8Array,
  bobSignedPrekeyPublic: Uint8Array,
  random: (n: number) => Uint8Array = (n) => randomBytes(n),
): DoubleRatchetState {
  const dhs = generateX25519KeyPair(random);
  const dhOut = x25519.getSharedSecret(dhs.privateKey, bobSignedPrekeyPublic);
  const { rootKey, chainKey } = kdfRk(sharedSecret, dhOut);
  return {
    dhsPublic: b64url(dhs.publicKey),
    dhsPrivate: b64url(dhs.privateKey),
    dhr: b64url(bobSignedPrekeyPublic),
    rootKey: b64url(rootKey),
    chainKeySend: b64url(chainKey),
    chainKeyRecv: null,
    ns: 0,
    nr: 0,
    pn: 0,
  };
}

export function initRatchetAsBob(
  sharedSecret: Uint8Array,
  bobSignedPrekeyPair: X25519KeyPair,
): DoubleRatchetState {
  return {
    dhsPublic: b64url(bobSignedPrekeyPair.publicKey),
    dhsPrivate: b64url(bobSignedPrekeyPair.privateKey),
    dhr: null,
    rootKey: b64url(sharedSecret),
    chainKeySend: null,
    chainKeyRecv: null,
    ns: 0,
    nr: 0,
    pn: 0,
  };
}

function dhRatchet(
  state: DoubleRatchetState,
  theirPublic: Uint8Array,
  random: (n: number) => Uint8Array,
): DoubleRatchetState {
  const pn = state.ns;
  // Receiving chain
  const dhOut1 = x25519.getSharedSecret(
    fromB64url(state.dhsPrivate),
    theirPublic,
  );
  const step1 = kdfRk(fromB64url(state.rootKey), dhOut1);
  // New sending keys
  const newDhs = generateX25519KeyPair(random);
  const dhOut2 = x25519.getSharedSecret(newDhs.privateKey, theirPublic);
  const step2 = kdfRk(step1.rootKey, dhOut2);
  return {
    dhsPublic: b64url(newDhs.publicKey),
    dhsPrivate: b64url(newDhs.privateKey),
    dhr: b64url(theirPublic),
    rootKey: b64url(step2.rootKey),
    chainKeySend: b64url(step2.chainKey),
    chainKeyRecv: b64url(step1.chainKey),
    ns: 0,
    nr: 0,
    pn,
  };
}

export function ratchetEncrypt(
  state: DoubleRatchetState,
  plaintext: string,
  aadExtra: string,
  random: (n: number) => Uint8Array = (n) => randomBytes(n),
): { state: DoubleRatchetState; message: RatchetMessage } {
  if (!state.chainKeySend) {
    throw new Error("sending_chain_missing");
  }
  const { chainKey, messageKey } = kdfCk(fromB64url(state.chainKeySend));
  const header: RatchetHeader = {
    dh: state.dhsPublic,
    pn: state.pn,
    n: state.ns,
  };
  const aad = new TextEncoder().encode(
    `litmo-dr-v2|${header.dh}|${header.pn}|${header.n}|${aadExtra}`,
  );
  const mk = hkdf(sha256, messageKey, undefined, INFO_MSG, 32);
  const combined = aesGcmEncrypt(
    mk,
    new TextEncoder().encode(plaintext),
    aad,
    random,
  );
  return {
    state: {
      ...state,
      chainKeySend: b64url(chainKey),
      ns: state.ns + 1,
    },
    message: {
      v: 2,
      header,
      ciphertext: b64url(combined),
    },
  };
}

export function ratchetDecrypt(
  state: DoubleRatchetState,
  message: RatchetMessage,
  aadExtra: string,
  random: (n: number) => Uint8Array = (n) => randomBytes(n),
): { state: DoubleRatchetState; plaintext: string } | null {
  if (message.v !== 2) return null;
  let next = state;
  const theirDh = fromB64url(message.header.dh);

  // If new DH public, perform DH ratchet
  if (!next.dhr || next.dhr !== message.header.dh) {
    next = dhRatchet(next, theirDh, random);
  }
  if (!next.chainKeyRecv) return null;

  // Skip skipped message keys not stored (quiz only needs sequential messages)
  let ck = fromB64url(next.chainKeyRecv);
  let nr = next.nr;
  if (message.header.n < nr) return null;
  let messageKey = new Uint8Array(32);
  while (nr <= message.header.n) {
    const step = kdfCk(ck);
    ck = new Uint8Array(step.chainKey);
    messageKey = new Uint8Array(step.messageKey);
    nr += 1;
  }

  const aad = new TextEncoder().encode(
    `litmo-dr-v2|${message.header.dh}|${message.header.pn}|${message.header.n}|${aadExtra}`,
  );
  const mk = hkdf(sha256, messageKey, undefined, INFO_MSG, 32);
  const plain = aesGcmDecrypt(mk, fromB64url(message.ciphertext), aad);
  if (!plain) return null;
  const text = new TextDecoder().decode(plain);
  return {
    state: {
      ...next,
      chainKeyRecv: b64url(ck),
      nr,
    },
    plaintext: text,
  };
}

export function serializeState(state: DoubleRatchetState): string {
  return JSON.stringify(state);
}

export function parseState(raw: string): DoubleRatchetState | null {
  try {
    const s = JSON.parse(raw) as DoubleRatchetState;
    if (!s.rootKey || !s.dhsPublic || !s.dhsPrivate) return null;
    return s;
  } catch {
    return null;
  }
}

export const __test = { b64url, fromB64url, kdfRk, kdfCk };
