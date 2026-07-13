const { withInfoPlist, withEntitlementsPlist } = require("@expo/config-plugins");

/**
 * Core NFC reader entitlements + usage string for Litmo tap-to-connect.
 * Writing NDEF tags uses the same reader session entitlement on iOS.
 */
function withLitmoNfc(config) {
  config = withInfoPlist(config, (config) => {
    config.modResults.NFCReaderUsageDescription =
      config.modResults.NFCReaderUsageDescription ??
      "Litmo uses NFC only when you intentionally write or scan a careful-connect invite. A tap is never consent to touch. You always confirm or decline after a scan.";

    // Declare NDEF format for reader session.
    const formats = new Set(
      config.modResults["com.apple.developer.nfc.readersession.formats"] ?? [],
    );
    formats.add("NDEF");
    config.modResults["com.apple.developer.nfc.readersession.formats"] =
      Array.from(formats);

    return config;
  });

  config = withEntitlementsPlist(config, (config) => {
    config.modResults["com.apple.developer.nfc.readersession.formats"] = [
      "NDEF",
    ];
    return config;
  });

  return config;
}

module.exports = withLitmoNfc;
