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
  isAvailableAsync?(): Promise<boolean>;
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

function loadNative(): NativePasskeys | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { requireNativeModule } = require("expo-modules-core") as {
      requireNativeModule: <T>(name: string) => T;
    };
    return requireNativeModule<NativePasskeys>("LitmoPasskeys");
  } catch {
    return null;
  }
}

const native = loadNative();

export const litmoPasskeysNativeAvailable = Boolean(native);

function unavailable(action: string): never {
  const err = new Error(
    `Passkeys require an iOS development build with LitmoPasskeys (${action}). Expo Go cannot complete WebAuthn.`,
  ) as Error & { code: string };
  err.code = "ERR_PASSKEY_UNAVAILABLE";
  throw err;
}

export const litmoPasskeys = {
  async isAvailable(): Promise<boolean> {
    if (!native) return false;
    if (typeof native.isAvailableAsync === "function") {
      try {
        return await native.isAvailableAsync();
      } catch {
        return true; // Module present; biometry may still prompt later.
      }
    }
    return true;
  },

  async register(options: RegistrationOptions): Promise<PasskeyCredential> {
    if (!native) unavailable("register");
    return native!.registerAsync(options);
  },

  async authenticate(
    options: AuthenticationOptions,
  ): Promise<PasskeyCredential> {
    if (!native) unavailable("authenticate");
    return native!.authenticateAsync(options);
  },

  async encryptSensitive(
    plaintext: string,
    purpose: string,
  ): Promise<SensitiveEnvelope> {
    if (!native) unavailable("encryptSensitive");
    return native!.encryptSensitiveAsync(plaintext, purpose);
  },

  async decryptSensitive(
    envelope: SensitiveEnvelope,
    purpose: string,
  ): Promise<string> {
    if (!native) unavailable("decryptSensitive");
    return native!.decryptSensitiveAsync(envelope, purpose);
  },

  async rotateSensitiveKey(): Promise<number> {
    if (!native) unavailable("rotateSensitiveKey");
    return native!.rotateSensitiveKeyAsync();
  },

  async retireSensitiveKey(version: number): Promise<void> {
    if (!native) unavailable("retireSensitiveKey");
    return native!.retireSensitiveKeyAsync(version);
  },

  async clearSensitiveKeys(): Promise<void> {
    if (!native) return;
    await native.clearSensitiveKeysAsync();
  },
};
