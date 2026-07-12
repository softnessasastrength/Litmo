import { createAuthService } from "./authServiceCore";
import { supabase } from "./supabase.ts";
import { litmoPasskeys } from "../modules/litmo-passkeys";
export const authService = createAuthService(supabase, litmoPasskeys);
