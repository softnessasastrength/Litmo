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

// Associated Domains (required for passkey sign-in, ADR 0010) is not
// supported by a free Apple "Personal Team" -- only the paid Apple Developer
// Program. Local builds signed with a Personal Team must omit it to build
// and install at all, at the cost of passkey sign-in not working in that
// build (demo mode and everything else still does). Real dev/staging/
// production builds (EAS, a paid team) keep it by default; set
// LITMO_FREE_TIER_BUILD=1 only for local Personal Team builds.
// See docs/adr/0015-session-request-creation-and-recipient-authorization.md's
// build-verification addendum and docs/MACHINE_SETUP.md.
const freeTierBuild = process.env.LITMO_FREE_TIER_BUILD === "1";

const {
  associatedDomains: _unusedBaseAssociatedDomains,
  ...baseIosWithoutAssociatedDomains
} = base.expo.ios;

export default {
  ...base.expo,
  name: environment === "production" ? "Litmo" : `Litmo ${environment}`,
  ios: {
    ...baseIosWithoutAssociatedDomains,
    bundleIdentifier: selected.bundleIdentifier,
    ...(freeTierBuild
      ? {}
      : { associatedDomains: [`webcredentials:${selected.domain}`] }),
  },
  extra: { ...base.expo.extra, appEnvironment: environment },
};
