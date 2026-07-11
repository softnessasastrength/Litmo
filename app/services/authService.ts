import { createAuthService } from "./authServiceCore";
import { supabase } from "./supabase.ts";
export const authService = createAuthService(supabase);
