import type { SupabaseClient } from "@supabase/supabase-js";
import { mapExternalError, PublicAppError } from "./errors.ts";

type NativePasskeys = {
  register(options: Record<string, unknown>): Promise<Record<string, unknown>>;
  authenticate(
    options: Record<string, unknown>,
  ): Promise<Record<string, unknown>>;
};

export function createAuthService(
  client: Pick<SupabaseClient, "auth">,
  nativePasskeys: NativePasskeys,
) {
  let ceremony: Promise<unknown> | null = null;
  const exclusive = async <T>(work: () => Promise<T>): Promise<T> => {
    if (ceremony)
      throw new PublicAppError(
        "auth_request_in_progress",
        "An authentication request is already in progress.",
      );
    const current = work();
    ceremony = current;
    try {
      return await current;
    } finally {
      if (ceremony === current) ceremony = null;
    }
  };

  return {
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

    registerPasskey() {
      return exclusive(async () => {
        const started = await client.auth.passkey.startRegistration();
        if (started.error || !started.data)
          throw mapExternalError(started.error);
        const { options } = started.data;
        const credential = await nativePasskeys.register({
          relyingPartyId: options.rp.id,
          challenge: options.challenge,
          userId: options.user.id,
          userName: options.user.name,
          userDisplayName: options.user.displayName,
          excludeCredentialIds: options.excludeCredentials?.map(
            (item) => item.id,
          ),
        });
        const verified = await client.auth.passkey.verifyRegistration({
          challengeId: started.data.challenge_id,
          credential: credential as never,
        });
        if (verified.error || !verified.data)
          throw mapExternalError(verified.error);
        return verified.data;
      });
    },

    signInWithPasskey() {
      return exclusive(async () => {
        const started = await client.auth.passkey.startAuthentication();
        if (started.error || !started.data)
          throw mapExternalError(started.error);
        const { options } = started.data;
        const credential = await nativePasskeys.authenticate({
          relyingPartyId: options.rpId,
          challenge: options.challenge,
          allowedCredentialIds: options.allowCredentials?.map(
            (item) => item.id,
          ),
        });
        const verified = await client.auth.passkey.verifyAuthentication({
          challengeId: started.data.challenge_id,
          credential: credential as never,
        });
        if (verified.error || !verified.data.session)
          throw mapExternalError(verified.error);
        return verified.data.session;
      });
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
