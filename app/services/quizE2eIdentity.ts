/**
 * Device-local identity + signed prekey material for quiz E2E (Signal-style X25519).
 *
 * Architecture:
 * - X25519 private keys (Signal/X3DH) cannot live *inside* Apple Secure Enclave
 *   (SE supports P-256, not Curve25519). Industry pattern: encrypt private key
 *   bytes with AES-GCM under a device-bound vault key (ADR 0011 / LitmoPasskeys
 *   CryptoKit), then store the envelope in Secure Store.
 * - Vault keys use Keychain with passcode + biometry ACL (Secure Enclave evaluates
 *   biometry on capable devices). Private key bytes never go to Supabase.
 * - Demo / Expo Go without the native module falls back to Secure Store only and
 *   is documented as weaker (KNOWN_LIMITATIONS).
 */

import * as SecureStore from "expo-secure-store";
import { x25519 } from "@noble/curves/ed25519.js";
import { litmoPasskeys } from "../modules/litmo-passkeys";
import {
  generateX25519KeyPair,
  type X25519KeyPair,
} from "./doubleRatchetCore.ts";

const IDENTITY_KEY = "litmo.quiz.e2e.identity.v3";
const SPK_KEY = "litmo.quiz.e2e.spk.v3";

import type { PublicBundle } from "./quizE2eProtocol.ts";
export type { PublicBundle };

export type IdentityStorageMode = "vault-wrapped" | "secure-store-fallback";

type StoredKeyPair = {
  publicKey: string;
  /** vault envelope JSON when vaultWrapped; else base64url private (fallback only) */
  privateKey: string;
  vaultWrapped: boolean;
};

const SECURE_STORE_OPTS = {
  keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
} as never;

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

async function tryVaultEncrypt(
  plaintextB64: string,
  purpose: string,
): Promise<{ envelopeJson: string } | null> {
  try {
    const envelope = await litmoPasskeys.encryptSensitive(plaintextB64, purpose);
    if (
      typeof envelope?.ciphertext !== "string" ||
      envelope.ciphertext.length < 8
    ) {
      return null;
    }
    return { envelopeJson: JSON.stringify(envelope) };
  } catch {
    return null;
  }
}

async function tryVaultDecrypt(
  envelopeJson: string,
  purpose: string,
): Promise<string | null> {
  try {
    const envelope = JSON.parse(envelopeJson) as {
      format: number;
      keyVersion: number;
      ciphertext: string;
    };
    if (envelope.format !== 1 || !envelope.ciphertext) return null;
    return await litmoPasskeys.decryptSensitive(envelope, purpose);
  } catch {
    return null;
  }
}

async function wrapPrivate(privateKey: Uint8Array): Promise<StoredKeyPair> {
  const publicKey = b64url(x25519.getPublicKey(privateKey));
  const plainB64 = b64url(privateKey);
  const vault = await tryVaultEncrypt(plainB64, "quiz-e2e-identity");
  if (vault) {
    return {
      publicKey,
      privateKey: vault.envelopeJson,
      vaultWrapped: true,
    };
  }
  // Fallback: Secure Store only (demo / Expo Go without native vault).
  return {
    publicKey,
    privateKey: plainB64,
    vaultWrapped: false,
  };
}

async function unwrapPrivate(stored: StoredKeyPair): Promise<Uint8Array> {
  if (!stored.vaultWrapped) return fromB64url(stored.privateKey);
  const plain = await tryVaultDecrypt(stored.privateKey, "quiz-e2e-identity");
  if (!plain) throw new Error("identity_key_locked");
  return fromB64url(plain);
}

async function loadOrCreatePair(account: string): Promise<{
  pair: X25519KeyPair;
  publicB64: string;
  vaultWrapped: boolean;
}> {
  const raw = await SecureStore.getItemAsync(account);
  if (raw) {
    try {
      const stored = JSON.parse(raw) as StoredKeyPair;
      const privateKey = await unwrapPrivate(stored);
      return {
        pair: { privateKey, publicKey: fromB64url(stored.publicKey) },
        publicB64: stored.publicKey,
        vaultWrapped: stored.vaultWrapped,
      };
    } catch {
      // regenerate if unreadable / biometry cancelled mid-load
    }
  }
  const generated = generateX25519KeyPair();
  const stored = await wrapPrivate(generated.privateKey);
  stored.publicKey = b64url(generated.publicKey);
  await SecureStore.setItemAsync(
    account,
    JSON.stringify(stored),
    SECURE_STORE_OPTS,
  );
  return {
    pair: generated,
    publicB64: stored.publicKey,
    vaultWrapped: stored.vaultWrapped,
  };
}

/**
 * Wrap arbitrary secret strings (e.g. serialized ratchet state) with the vault
 * when available. Returns envelope JSON or plaintext for fallback.
 */
export async function wrapSecretBlob(
  plaintext: string,
  purpose: string,
): Promise<{ blob: string; vaultWrapped: boolean }> {
  const vault = await tryVaultEncrypt(plaintext, purpose);
  if (vault) return { blob: vault.envelopeJson, vaultWrapped: true };
  return { blob: plaintext, vaultWrapped: false };
}

export async function unwrapSecretBlob(
  blob: string,
  vaultWrapped: boolean,
  purpose: string,
): Promise<string | null> {
  if (!vaultWrapped) return blob;
  return tryVaultDecrypt(blob, purpose);
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

  /** How private keys are stored on this device (for honest UX / diagnostics). */
  async getStorageMode(): Promise<IdentityStorageMode> {
    const ik = await loadOrCreatePair(IDENTITY_KEY);
    return ik.vaultWrapped ? "vault-wrapped" : "secure-store-fallback";
  },
};
