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

type NativePasskeys = {
  registerAsync(options: RegistrationOptions): Promise<PasskeyCredential>;
  authenticateAsync(options: AuthenticationOptions): Promise<PasskeyCredential>;
};

const native = requireNativeModule<NativePasskeys>("LitmoPasskeys");

export const litmoPasskeys = {
  register: native.registerAsync,
  authenticate: native.authenticateAsync,
};
