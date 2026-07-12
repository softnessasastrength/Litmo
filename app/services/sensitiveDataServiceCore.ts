import { PublicAppError } from "./errors.ts";

export type SensitiveEnvelope = {
  format: number;
  keyVersion: number;
  ciphertext: string;
};

type PlatformVault = {
  encryptSensitive(
    plaintext: string,
    purpose: string,
  ): Promise<SensitiveEnvelope>;
  decryptSensitive(
    envelope: SensitiveEnvelope,
    purpose: string,
  ): Promise<string>;
  rotateSensitiveKey(): Promise<number>;
  retireSensitiveKey(version: number): Promise<void>;
  clearSensitiveKeys(): Promise<void>;
};

const prefix = "litmo:encrypted:v1:";
const unavailable = () =>
  new PublicAppError(
    "permission_denied",
    "Private data remains locked. Unlock Litmo and try again.",
  );

export function createSensitiveDataService(vault: PlatformVault) {
  let unlocked = false;
  const requireUnlocked = () => {
    if (!unlocked) throw unavailable();
  };
  return {
    unlock() {
      unlocked = true;
    },
    lock() {
      unlocked = false;
    },
    isUnlocked() {
      return unlocked;
    },
    async encryptText(value: string | null, purpose: string) {
      if (value === null) return null;
      requireUnlocked();
      const envelope = await vault.encryptSensitive(value, purpose);
      return `${prefix}${JSON.stringify(envelope)}`;
    },
    async decryptText(value: string | null, purpose: string) {
      if (value === null) return null;
      requireUnlocked();
      if (!value.startsWith(prefix)) throw unavailable();
      try {
        const envelope = JSON.parse(
          value.slice(prefix.length),
        ) as SensitiveEnvelope;
        if (
          envelope.format !== 1 ||
          !Number.isInteger(envelope.keyVersion) ||
          envelope.keyVersion < 1 ||
          typeof envelope.ciphertext !== "string" ||
          envelope.ciphertext.length < 1
        )
          throw new Error("invalid_envelope");
        return await vault.decryptSensitive(envelope, purpose);
      } catch {
        throw unavailable();
      }
    },
    async rotateText(value: string, purpose: string) {
      requireUnlocked();
      const plaintext = await this.decryptText(value, purpose);
      const prior = JSON.parse(value.slice(prefix.length)) as SensitiveEnvelope;
      await vault.rotateSensitiveKey();
      const rotated = await this.encryptText(plaintext, purpose);
      return {
        rotated,
        priorKeyVersion: prior.keyVersion,
        retirePrior: () => vault.retireSensitiveKey(prior.keyVersion),
      };
    },
    clearPersistentKeys() {
      unlocked = false;
      return vault.clearSensitiveKeys();
    },
  };
}

export const encryptedValuePrefix = prefix;
