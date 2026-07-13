/**
 * Client-side encryption for optional cloud backup of personal vault domains.
 * Server stores only opaque ciphertext. Master key never leaves the device
 * unless the user exports a recovery code.
 */

import { gcm } from "@noble/ciphers/aes.js";
import { hkdf } from "@noble/hashes/hkdf.js";
import { sha256 } from "@noble/hashes/sha2.js";
import { randomBytes } from "@noble/hashes/utils.js";
import type { BackupEligibleDomain } from "../lib/localFirstCore.ts";
import { b64url, fromB64url } from "./localShareCore.ts";

export const BACKUP_ENVELOPE_VERSION = 1 as const;
export const BACKUP_AAD_PREFIX = "litmo-personal-backup-v1";
export const BACKUP_INFO = new TextEncoder().encode("LitmoPersonalBackup-v1");

export type PersonalBackupEnvelope = {
  v: typeof BACKUP_ENVELOPE_VERSION;
  domain: BackupEligibleDomain;
  /** HKDF salt (base64url). */
  salt: string;
  /** nonce||ciphertext||tag (base64url). */
  ct: string;
  sealedAt: string;
  alg: "aes-256-gcm-hkdf-sha256";
  /** Always true — server must not interpret payload. */
  opaque: true;
};

export function createBackupMasterKey(): Uint8Array {
  return randomBytes(32);
}

/** Human-exportable recovery code (base64url of 32-byte key). */
export function exportRecoveryCode(masterKey: Uint8Array): string {
  if (masterKey.length !== 32) {
    throw new Error("backup_key_invalid");
  }
  return b64url(masterKey);
}

export function importRecoveryCode(code: string): Uint8Array | null {
  try {
    const key = fromB64url(code.trim());
    if (key.length !== 32) return null;
    return key;
  } catch {
    return null;
  }
}

function deriveDomainKey(
  masterKey: Uint8Array,
  salt: Uint8Array,
  domain: BackupEligibleDomain,
): Uint8Array {
  const domainInfo = new Uint8Array(BACKUP_INFO.length + 1 + domain.length);
  domainInfo.set(BACKUP_INFO, 0);
  domainInfo[BACKUP_INFO.length] = 0x7c;
  domainInfo.set(new TextEncoder().encode(domain), BACKUP_INFO.length + 1);
  return hkdf(sha256, masterKey, salt, domainInfo, 32);
}

export function sealPersonalBackup(
  domain: BackupEligibleDomain,
  plaintextJson: string,
  masterKey: Uint8Array,
  now: Date = new Date(),
): PersonalBackupEnvelope {
  if (masterKey.length !== 32) throw new Error("backup_key_invalid");
  const salt = randomBytes(16);
  const key = deriveDomainKey(masterKey, salt, domain);
  const nonce = randomBytes(12);
  const aad = new TextEncoder().encode(`${BACKUP_AAD_PREFIX}:${domain}`);
  const cipher = gcm(key, nonce, aad);
  const sealed = cipher.encrypt(new TextEncoder().encode(plaintextJson));
  const combined = new Uint8Array(nonce.length + sealed.length);
  combined.set(nonce, 0);
  combined.set(sealed, nonce.length);
  return {
    v: 1,
    domain,
    salt: b64url(salt),
    ct: b64url(combined),
    sealedAt: now.toISOString(),
    alg: "aes-256-gcm-hkdf-sha256",
    opaque: true,
  };
}

export function openPersonalBackup(
  envelope: PersonalBackupEnvelope,
  masterKey: Uint8Array,
): string | null {
  if (envelope.v !== 1 || !envelope.opaque) return null;
  if (masterKey.length !== 32) return null;
  try {
    const salt = fromB64url(envelope.salt);
    const combined = fromB64url(envelope.ct);
    if (combined.length < 12 + 16) return null;
    const nonce = combined.slice(0, 12);
    const body = combined.slice(12);
    const key = deriveDomainKey(masterKey, salt, envelope.domain);
    const aad = new TextEncoder().encode(
      `${BACKUP_AAD_PREFIX}:${envelope.domain}`,
    );
    const cipher = gcm(key, nonce, aad);
    const plain = cipher.decrypt(body);
    return new TextDecoder().decode(plain);
  } catch {
    return null;
  }
}

export function parseBackupEnvelope(raw: unknown): PersonalBackupEnvelope | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const o = raw as Record<string, unknown>;
  if (o.v !== 1) return null;
  if (o.opaque !== true) return null;
  if (o.alg !== "aes-256-gcm-hkdf-sha256") return null;
  if (typeof o.domain !== "string") return null;
  if (typeof o.salt !== "string" || typeof o.ct !== "string") return null;
  if (typeof o.sealedAt !== "string") return null;
  const domain = o.domain as BackupEligibleDomain;
  return {
    v: 1,
    domain,
    salt: o.salt,
    ct: o.ct,
    sealedAt: o.sealedAt,
    alg: "aes-256-gcm-hkdf-sha256",
    opaque: true,
  };
}

export function serializeBackupEnvelope(env: PersonalBackupEnvelope): string {
  return JSON.stringify(env);
}
