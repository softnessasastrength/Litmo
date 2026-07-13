import { createAuthService } from "./authServiceCore";
import { supabase } from "./supabase.ts";
import { litmoPasskeys } from "../modules/litmo-passkeys";

/** Passkey-first auth service (Supabase WebAuthn + native AuthenticationServices). */
export const authService = createAuthService(supabase, {
  register: (options) => litmoPasskeys.register(options as never),
  authenticate: (options) => litmoPasskeys.authenticate(options as never),
  isAvailable: () => litmoPasskeys.isAvailable(),
});
