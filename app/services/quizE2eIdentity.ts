/**
 * Device-local identity + signed prekey material for quiz E2E.
 *
 * Private keys never leave the device. Prefer Secure Store (Keychain /
 * WhenPasscodeSetThisDeviceOnly). When Litmo Passkeys vault is available,
 * wrap private key material with AES-GCM via Secure Enclave-backed vault.
 */

import * as SecureStore from "expo-secure-store";
import { x25519 } from "@noble/curves/ed25519.js";
import { litmoPasskeys } from "../modules/litmo-passkeys";
import {
  generateX25519KeyPair,
  type X25519KeyPair,
} from "./doubleRatchetCore.ts";

const IDENTITY_KEY = "litmo.quiz.e2e.identity.v2";
const SPK_KEY = "litmo.quiz.e2e.spk.v2";

export type PublicBundle = {
  identityPublic: string; // base64url
  signedPrekeyPublic: string;
};

type StoredKeyPair = {
  publicKey: string;
  /** base64url private OR vault envelope JSON */
  privateKey: string;
  vaultWrapped: boolean;
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

async function wrapPrivate(privateKey: Uint8Array): Promise<StoredKeyPair> {
  const publicKey = b64url(x25519.getPublicKey(privateKey));
  try {
    const envelope = await litmoPasskeys.encryptSensitive(
      b64url(privateKey),
      "quiz-e2e-identity",
    );
    return {
      publicKey,
      privateKey: JSON.stringify(envelope),
      vaultWrapped: true,
    };
  } catch {
    return {
      publicKey,
      privateKey: b64url(privateKey),
      vaultWrapped: false,
    };
  }
}

async function unwrapPrivate(stored: StoredKeyPair): Promise<Uint8Array> {
  if (!stored.vaultWrapped) return fromB64url(stored.privateKey);
  try {
    const envelope = JSON.parse(stored.privateKey) as {
      format: number;
      keyVersion: number;
      ciphertext: string;
    };
    const plain = await litmoPasskeys.decryptSensitive(
      envelope,
      "quiz-e2e-identity",
    );
    return fromB64url(plain);
  } catch {
    throw new Error("identity_key_locked");
  }
}

async function loadOrCreatePair(account: string): Promise<{
  pair: X25519KeyPair;
  publicB64: string;
}> {
  const raw = await SecureStore.getItemAsync(account);
  if (raw) {
    try {
      const stored = JSON.parse(raw) as StoredKeyPair;
      const privateKey = await unwrapPrivate(stored);
      const publicKey = fromB64url(stored.publicKey);
      return {
        pair: { privateKey, publicKey },
        publicB64: stored.publicKey,
      };
    } catch {
      // regenerate if unreadable
    }
  }
  const generated = generateX25519KeyPair();
  const stored = await wrapPrivate(generated.privateKey);
  // ensure public matches
  stored.publicKey = b64url(generated.publicKey);
  await SecureStore.setItemAsync(account, JSON.stringify(stored), {
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  } as never);
  return {
    pair: generated,
    publicB64: stored.publicKey,
  };
}

export const quizE2eIdentity = {
  async getPublicBundle(): Promise<PublicBundle> {
    const ik = await loadOrCreatePair(IDENTITY_KEY);
    const spk = await loadOrCreatePair(SPK_KEY);
    return {
      identityPublic: ik.publicB64,
      signedPrekeyPublic: spk.publicB64,
    };
  },

  async getIdentityPair(): Promise<X25519KeyPair> {
    return (await loadOrCreatePair(IDENTITY_KEY)).pair;
  },

  async getSignedPrekeyPair(): Promise<X25519KeyPair> {
    return (await loadOrCreatePair(SPK_KEY)).pair;
  },
};
