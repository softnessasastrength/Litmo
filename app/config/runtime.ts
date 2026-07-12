export type AppEnvironment = "development" | "staging" | "production";
const value = process.env.EXPO_PUBLIC_APP_ENV ?? "development";
if (!(["development", "staging", "production"] as string[]).includes(value))
  throw new Error("invalid_app_environment");
export const runtimeConfig = {
  environment: value as AppEnvironment,
  allowDemo: value === "development",
  allowDiagnostics: value !== "production",
  isProduction: value === "production",
  /**
   * Base URL of the Express backend (backend/server.js) that hosts the
   * privileged session-snapshot endpoint. Null when unset: on a physical
   * device this must be the development computer's LAN address, since
   * "127.0.0.1" would point at the phone itself. See
   * docs/LOCAL_DEVELOPMENT.md.
   */
  backendUrl: process.env.EXPO_PUBLIC_BACKEND_URL ?? null,
};
