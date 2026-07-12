import * as SecureStore from "expo-secure-store";

const options: SecureStore.SecureStoreOptions = {
  keychainService: "com.litmo.app.authentication",
  keychainAccessible: SecureStore.WHEN_PASSCODE_SET_THIS_DEVICE_ONLY,
};

/** Supabase-compatible storage backed only by this device's protected Keychain. */
export const secureSessionStorage = {
  getItem(key: string) {
    return SecureStore.getItemAsync(key, options);
  },
  setItem(key: string, value: string) {
    return SecureStore.setItemAsync(key, value, options);
  },
  removeItem(key: string) {
    return SecureStore.deleteItemAsync(key, options);
  },
};

export const deviceSecretStorage = {
  get: () => SecureStore.getItemAsync("device-secret-v1", options),
  set: (secret: string) =>
    SecureStore.setItemAsync("device-secret-v1", secret, options),
  clear: () => SecureStore.deleteItemAsync("device-secret-v1", options),
};

const emergencyOptions: SecureStore.SecureStoreOptions = {
  keychainService: "com.litmo.app.pending-safety-actions",
  keychainAccessible: SecureStore.WHEN_PASSCODE_SET_THIS_DEVICE_ONLY,
};
export const pendingSafetyActionStorage = {
  get: () =>
    SecureStore.getItemAsync("pending-withdrawal-v1", emergencyOptions),
  set: (value: string) =>
    SecureStore.setItemAsync("pending-withdrawal-v1", value, emergencyOptions),
  clear: () =>
    SecureStore.deleteItemAsync("pending-withdrawal-v1", emergencyOptions),
};

const pendingWrapupOptions: SecureStore.SecureStoreOptions = {
  keychainService: "com.litmo.app.pending-wrapups",
  keychainAccessible: SecureStore.WHEN_PASSCODE_SET_THIS_DEVICE_ONLY,
};
export const pendingWrapupStorage = {
  get: () =>
    SecureStore.getItemAsync("pending-wrapup-v1", pendingWrapupOptions),
  set: (value: string) =>
    SecureStore.setItemAsync("pending-wrapup-v1", value, pendingWrapupOptions),
  clear: () =>
    SecureStore.deleteItemAsync("pending-wrapup-v1", pendingWrapupOptions),
};
