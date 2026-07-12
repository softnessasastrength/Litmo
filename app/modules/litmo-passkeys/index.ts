import { requireNativeModule } from "expo-modules-core";

export type RegistrationOptions = {
  relyingPartyId: string;
  challenge: string;
  userId: string;
  userName: string;
  userDisplayName: string;
  excludeCredentialIds?: string[];
};

export type AuthenticationOptions = {
  relyingPartyId: string;
  challenge: string;
  allowedCredentialIds?: string[];
};

export type PasskeyCredential = Record<string, unknown>;
export type SensitiveEnvelope = {
  format: number;
  keyVersion: number;
  ciphertext: string;
};

type NativePasskeys = {
  registerAsync(options: RegistrationOptions): Promise<PasskeyCredential>;
  authenticateAsync(options: AuthenticationOptions): Promise<PasskeyCredential>;
  encryptSensitiveAsync(
    plaintext: string,
    purpose: string,
  ): Promise<SensitiveEnvelope>;
  decryptSensitiveAsync(
    envelope: SensitiveEnvelope,
    purpose: string,
  ): Promise<string>;
  rotateSensitiveKeyAsync(): Promise<number>;
  retireSensitiveKeyAsync(version: number): Promise<void>;
  clearSensitiveKeysAsync(): Promise<void>;
};

const native = requireNativeModule<NativePasskeys>("LitmoPasskeys");

export const litmoPasskeys = {
  register: native.registerAsync,
  authenticate: native.authenticateAsync,
  encryptSensitive: native.encryptSensitiveAsync,
  decryptSensitive: native.decryptSensitiveAsync,
  rotateSensitiveKey: native.rotateSensitiveKeyAsync,
  retireSensitiveKey: native.retireSensitiveKeyAsync,
  clearSensitiveKeys: native.clearSensitiveKeysAsync,
};
