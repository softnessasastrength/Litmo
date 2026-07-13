const {
  withInfoPlist,
  AndroidConfig,
  withAndroidManifest,
} = require("@expo/config-plugins");

/**
 * Multipeer Connectivity requires Local Network usage copy and Bonjour
 * service declarations on iOS 14+. Service type must match the native module
 * (`litmo-share` → `_litmo-share._tcp` / `_litmo-share._udp`).
 */
function withLocalShareBonjour(config) {
  config = withInfoPlist(config, (config) => {
    config.modResults.NSLocalNetworkUsageDescription =
      config.modResults.NSLocalNetworkUsageDescription ??
      "Litmo uses the local network only when you intentionally start Nearby Share to exchange a discovery profile or Consent Snapshot review with someone next to you. Sharing is off by default and never grants consent to touch.";

    const services = new Set(config.modResults.NSBonjourServices ?? []);
    services.add("_litmo-share._tcp");
    services.add("_litmo-share._udp");
    config.modResults.NSBonjourServices = Array.from(services);
    return config;
  });

  // Android nearby share is not implemented in this module; no-op keep shape.
  if (AndroidConfig?.Manifest && withAndroidManifest) {
    // intentionally empty — iOS Multipeer first.
  }

  return config;
}

module.exports = withLocalShareBonjour;
