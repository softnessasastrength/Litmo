import type { SupabaseClient } from "@supabase/supabase-js";
import { mapExternalError, PublicAppError } from "./errors.ts";

type NativePasskeys = {
  register(options: Record<string, unknown>): Promise<Record<string, unknown>>;
  authenticate(
    options: Record<string, unknown>,
  ): Promise<Record<string, unknown>>;
  isAvailable?(): Promise<boolean>;
};

/**
 * Passkey-first auth against Supabase Auth WebAuthn (experimental passkey API).
 *
 * Product rules (ADR 0010):
 * - Passkeys are the only routine sign-in for real accounts.
 * - Email OTP is ownership bootstrap only — never a password or recovery login.
 * - Development seed passwords are gated outside this module by callers.
 * - Ceremonies are exclusive (no racing native sheets).
 */
export function createAuthService(
  client: Pick<SupabaseClient, "auth">,
  nativePasskeys: NativePasskeys,
) {
  let ceremony: Promise<unknown> | null = null;
  const exclusive = async <T>(work: () => Promise<T>): Promise<T> => {
    if (ceremony)
      throw new PublicAppError(
        "auth_request_in_progress",
        "An authentication request is already in progress. Finish or cancel Face ID first.",
      );
    const current = work();
    ceremony = current;
    try {
      return await current;
    } finally {
      if (ceremony === current) ceremony = null;
    }
  };

  const ensureNative = async () => {
    if (typeof nativePasskeys.isAvailable === "function") {
      const ok = await nativePasskeys.isAvailable();
      if (!ok) {
        throw new PublicAppError(
          "auth_passkey_unavailable",
          "Passkeys need an iOS development build with Face ID or Touch ID available. Demo mode works without an account.",
        );
      }
    }
  };

  return {
    /**
     * Whether the native WebAuthn bridge is present (not Expo Go).
     * Does not prove Associated Domains / AASA are configured.
     */
    async isPasskeyPlatformReady(): Promise<boolean> {
      try {
        if (typeof nativePasskeys.isAvailable === "function") {
          return await nativePasskeys.isAvailable();
        }
        // Assume ready if methods exist (tests inject stubs without isAvailable).
        return typeof nativePasskeys.register === "function";
      } catch {
        return false;
      }
    },

    async requestAccountCode(email: string, displayName: string) {
      const { error } = await client.auth.signInWithOtp({
        email: email.trim(),
        options: {
          shouldCreateUser: true,
          data: { display_name: displayName.trim() },
        },
      });
      if (error) throw mapExternalError(error);
    },

    async confirmAccountCode(email: string, token: string) {
      const { data, error } = await client.auth.verifyOtp({
        email: email.trim(),
        token: token.trim(),
        type: "email",
      });
      if (error || !data.session) throw mapExternalError(error);
      return data.session;
    },

    /**
     * Register a platform passkey (Face ID / Touch ID / device passcode UV).
     * Used after OTP bootstrap and when adding another passkey while signed in.
     */
    registerPasskey() {
      return exclusive(async () => {
        await ensureNative();
        const started = await client.auth.passkey.startRegistration();
        if (started.error || !started.data)
          throw mapExternalError(started.error);
        const { options } = started.data;
        let credential: Record<string, unknown>;
        try {
          credential = await nativePasskeys.register({
            relyingPartyId: options.rp.id,
            challenge: options.challenge,
            userId: options.user.id,
            userName: options.user.name,
            userDisplayName: options.user.displayName,
            excludeCredentialIds: options.excludeCredentials?.map(
              (item) => item.id,
            ),
          });
        } catch (error) {
          throw mapExternalError(error);
        }
        const verified = await client.auth.passkey.verifyRegistration({
          challengeId: started.data.challenge_id,
          credential: credential as never,
        });
        if (verified.error || !verified.data)
          throw mapExternalError(verified.error);
        return verified.data;
      });
    },

    /** Alias for registerPasskey — product language for Settings. */
    addPasskey() {
      return this.registerPasskey();
    },

    /**
     * Discoverable passkey sign-in. Apple prompts Face ID / Touch ID / passcode.
     * No email field for the happy path.
     */
    signInWithPasskey() {
      return exclusive(async () => {
        await ensureNative();
        const started = await client.auth.passkey.startAuthentication();
        if (started.error || !started.data)
          throw mapExternalError(started.error);
        const { options } = started.data;
        let credential: Record<string, unknown>;
        try {
          credential = await nativePasskeys.authenticate({
            relyingPartyId: options.rpId,
            challenge: options.challenge,
            allowedCredentialIds: options.allowCredentials?.map(
              (item) => item.id,
            ),
          });
        } catch (error) {
          throw mapExternalError(error);
        }
        const verified = await client.auth.passkey.verifyAuthentication({
          challengeId: started.data.challenge_id,
          credential: credential as never,
        });
        if (verified.error || !verified.data.session)
          throw mapExternalError(verified.error);
        return verified.data.session;
      });
    },

    /**
     * Development / Track B only: email + password for local seed accounts.
     * Production and staging must not call this — passkeys remain the product
     * path (ADR 0010 / 0041).
     */
    async signInWithPassword(email: string, password: string) {
      const { data, error } = await client.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error || !data.session) throw mapExternalError(error);
      return data.session;
    },

    async listPasskeys() {
      const { data, error } = await client.auth.passkey.list();
      if (error) throw mapExternalError(error);
      return data ?? [];
    },

    async removePasskey(passkeyId: string) {
      const existing = await this.listPasskeys();
      if (existing.length <= 1)
        throw new PublicAppError(
          "auth_recovery_required",
          "Add another passkey before removing your only way back into Litmo.",
        );
      const { error } = await client.auth.passkey.delete({ passkeyId });
      if (error) throw mapExternalError(error);
    },

    async signOut() {
      const { error } = await client.auth.signOut();
      if (error) throw mapExternalError(error);
    },
  };
}

export type AuthService = ReturnType<typeof createAuthService>;
