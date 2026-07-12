const { withEntitlementsPlist } = require("@expo/config-plugins");

/**
 * expo-notifications' iOS config plugin unconditionally adds the
 * `aps-environment` (Push Notifications) entitlement whenever the package is
 * installed, with no option to opt out (see
 * node_modules/expo-notifications/plugin/build/withNotificationsIOS.js).
 * This app only ever schedules local, on-device notifications -- no remote
 * push, no APNs -- and a free Apple "Personal Team" cannot even build an app
 * that requests this entitlement at all ("Personal development teams... do
 * not support the Push Notifications capability"). Strip it back out.
 *
 * Must be listed after expo-notifications' auto-applied plugin in
 * app.json's `plugins` array (or, since it isn't listed there at all --
 * autolinking applies it implicitly -- this just needs to run as part of
 * this app's own explicit plugins, which apply after autolinked ones).
 */
module.exports = function withoutPushEntitlement(config) {
  return withEntitlementsPlist(config, (config) => {
    delete config.modResults["aps-environment"];
    return config;
  });
};
