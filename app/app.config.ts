import base from "./app.json";
const environment = process.env.EXPO_PUBLIC_APP_ENV ?? "development";
const settings = {
  development: {
    bundleIdentifier: "com.litmo.app.dev",
    domain: "dev.softnessasastrength.com",
  },
  staging: {
    bundleIdentifier: "com.litmo.app.staging",
    domain: "staging.softnessasastrength.com",
  },
  production: {
    bundleIdentifier: "com.litmo.app",
    domain: "softnessasastrength.com",
  },
} as const;
if (!(environment in settings))
  throw new Error(`Unsupported APP_ENV: ${environment}`);
const selected = settings[environment as keyof typeof settings];
export default {
  ...base.expo,
  name: environment === "production" ? "Litmo" : `Litmo ${environment}`,
  ios: {
    ...base.expo.ios,
    bundleIdentifier: selected.bundleIdentifier,
    associatedDomains: [`webcredentials:${selected.domain}`],
  },
  extra: { ...base.expo.extra, appEnvironment: environment },
};
