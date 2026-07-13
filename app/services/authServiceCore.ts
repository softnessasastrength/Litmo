import type { SupabaseClient } from "@supabase/supabase-js";
import { mapExternalError, PublicAppError } from "./errors.ts";

type NativePasskeys = {
  register(options: Record<string, unknown>): Promise<Record<string, unknown>>;
  authenticate(
    options: Record<string, unknown>,
  ): Promise<Record<string, unknown>>;
  isAvailable?(): Promise<boolean>;
};

export type CeremonyGate = (input: {
  phase: "start" | "complete";
  ceremony: "register" | "authenticate" | "otp_request" | "device_register";
  outcome?: "succeeded" | "failed" | "cancelled" | "started" | "rate_limited";
  deviceId?: string | null;
  errorCode?: string | null;
}) => Promise<unknown>;

/**
 * Passkey-first auth against Supabase Auth WebAuthn + optional Edge ceremony gate.
 *
 * Product rules (ADR 0010 / AUTH-003):
 * - Passkeys are the only routine sign-in for real accounts.
 * - Email OTP is ownership bootstrap only — never a password or recovery login.
 * - Edge Function rate-limits and audits ceremony events (no secrets).
 * - Device registration after passkey binds the installation for consent.
 * - Ceremonies are exclusive (no racing native sheets).
 */
export function createAuthService(
  client: Pick<SupabaseClient, "auth">,
  nativePasskeys: NativePasskeys,
  ceremonyGate: CeremonyGate | null = null,
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

  const gate = async (
    input: Parameters<CeremonyGate>[0],
  ): Promise<void> => {
    if (!ceremonyGate) return;
    await ceremonyGate(input);
  };

  return {
    async isPasskeyPlatformReady(): Promise<boolean> {
      try {
        if (typeof nativePasskeys.isAvailable === "function") {
          return await nativePasskeys.isAvailable();
        }
        return typeof nativePasskeys.register === "function";
      } catch {
        return false;
      }
    },

    async requestAccountCode(email: string, displayName: string) {
      await gate({ phase: "start", ceremony: "otp_request" });
      try {
        const { error } = await client.auth.signInWithOtp({
          email: email.trim(),
          options: {
            shouldCreateUser: true,
            data: { display_name: displayName.trim() },
          },
        });
        if (error) throw mapExternalError(error);
        await gate({
          phase: "complete",
          ceremony: "otp_request",
          outcome: "succeeded",
        });
      } catch (error) {
        const mapped = mapExternalError(error);
        await gate({
          phase: "complete",
          ceremony: "otp_request",
          outcome: "failed",
          errorCode: mapped.code,
        });
        throw mapped;
      }
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

    registerPasskey() {
      return exclusive(async () => {
        await ensureNative();
        await gate({ phase: "start", ceremony: "register" });
        try {
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
            const mapped = mapExternalError(error);
            await gate({
              phase: "complete",
              ceremony: "register",
              outcome:
                mapped.code === "auth_cancelled" ? "cancelled" : "failed",
              errorCode: mapped.code,
            });
            throw mapped;
          }
          const verified = await client.auth.passkey.verifyRegistration({
            challengeId: started.data.challenge_id,
            credential: credential as never,
          });
          if (verified.error || !verified.data)
            throw mapExternalError(verified.error);
          await gate({
            phase: "complete",
            ceremony: "register",
            outcome: "succeeded",
          });
          return verified.data;
        } catch (error) {
          const mapped = mapExternalError(error);
          if (
            mapped.code !== "auth_cancelled" &&
            mapped.code !== "auth_rate_limited"
          ) {
            await gate({
              phase: "complete",
              ceremony: "register",
              outcome: "failed",
              errorCode: mapped.code,
            });
          }
          throw mapped;
        }
      });
    },

    addPasskey() {
      return this.registerPasskey();
    },

    signInWithPasskey() {
      return exclusive(async () => {
        await ensureNative();
        await gate({ phase: "start", ceremony: "authenticate" });
        try {
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
            const mapped = mapExternalError(error);
            await gate({
              phase: "complete",
              ceremony: "authenticate",
              outcome:
                mapped.code === "auth_cancelled" ? "cancelled" : "failed",
              errorCode: mapped.code,
            });
            throw mapped;
          }
          const verified = await client.auth.passkey.verifyAuthentication({
            challengeId: started.data.challenge_id,
            credential: credential as never,
          });
          if (verified.error || !verified.data.session)
            throw mapExternalError(verified.error);
          await gate({
            phase: "complete",
            ceremony: "authenticate",
            outcome: "succeeded",
          });
          return verified.data.session;
        } catch (error) {
          const mapped = mapExternalError(error);
          if (
            mapped.code !== "auth_cancelled" &&
            mapped.code !== "auth_rate_limited"
          ) {
            await gate({
              phase: "complete",
              ceremony: "authenticate",
              outcome: "failed",
              errorCode: mapped.code,
            });
          }
          throw mapped;
        }
      });
    },

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
