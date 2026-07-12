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
