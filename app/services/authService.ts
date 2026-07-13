import { createAuthService } from "./authServiceCore";
import { gateAuthCeremony } from "./authCeremonyClient.ts";
import { supabase } from "./supabase.ts";
import { litmoPasskeys } from "../modules/litmo-passkeys";

/**
 * Passkey-first auth: Supabase WebAuthn + native AuthenticationServices +
 * Edge Function rate-limit/audit (auth-ceremony).
 */
export const authService = createAuthService(
  supabase,
  {
    register: (options) => litmoPasskeys.register(options as never),
    authenticate: (options) => litmoPasskeys.authenticate(options as never),
    isAvailable: () => litmoPasskeys.isAvailable(),
  },
  gateAuthCeremony,
);
