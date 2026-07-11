import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import { AppState, Platform } from "react-native";

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
export const environmentError =
  !url || !anonKey
    ? "Litmo is missing its local Supabase URL or public anon key. See docs/LOCAL_DEVELOPMENT.md."
    : null;

export const supabase = createClient(
  url ?? "http://127.0.0.1:54321",
  anonKey ?? "missing-public-anon-key",
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  },
);

if (Platform.OS !== "web")
  AppState.addEventListener("change", (state) =>
    state === "active"
      ? supabase.auth.startAutoRefresh()
      : supabase.auth.stopAutoRefresh(),
  );
