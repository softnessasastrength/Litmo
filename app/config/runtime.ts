export type AppEnvironment = "development" | "staging" | "production";
const value = process.env.EXPO_PUBLIC_APP_ENV ?? "development";
if (!(["development", "staging", "production"] as string[]).includes(value))
  throw new Error("invalid_app_environment");
export const runtimeConfig = {
  environment: value as AppEnvironment,
  allowDemo: value === "development",
  allowDiagnostics: value !== "production",
  isProduction: value === "production",
};
