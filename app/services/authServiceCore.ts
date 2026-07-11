import type { SupabaseClient } from "@supabase/supabase-js";
import { mapExternalError } from "./errors.ts";
export function createAuthService(client: Pick<SupabaseClient, "auth">) {
  return {
    async signUp(email: string, password: string, displayName: string) {
      const { data, error } = await client.auth.signUp({
        email: email.trim(),
        password,
        options: { data: { display_name: displayName.trim() } },
      });
      if (error) throw mapExternalError(error);
      return data.session;
    },
    async signIn(email: string, password: string) {
      const { data, error } = await client.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) throw mapExternalError(error);
      return data.session;
    },
    async signOut() {
      const { error } = await client.auth.signOut();
      if (error) throw mapExternalError(error);
    },
  };
}
