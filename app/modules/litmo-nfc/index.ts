export type EventSubscription = { remove: () => void };

type NativeNfc = {
  isAvailableAsync(): Promise<boolean>;
  isWritingAvailableAsync(): Promise<boolean>;
  beginReadAsync(alertMessage?: string): Promise<boolean>;
  beginWriteAsync(payload: string, alertMessage?: string): Promise<boolean>;
  invalidateAsync(): Promise<boolean>;
  addListener(
    eventName: string,
    listener: (event: Record<string, unknown>) => void,
  ): EventSubscription;
};

function loadNative(): NativeNfc | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { requireNativeModule } = require("expo-modules-core") as {
      requireNativeModule: <T>(name: string) => T;
    };
    return requireNativeModule<NativeNfc>("LitmoNfc");
  } catch {
    return null;
  }
}

const native = loadNative();

export const litmoNfcAvailable = Boolean(native);

export const litmoNfc = {
  async isAvailable(): Promise<boolean> {
    if (!native) return false;
    try {
      return await native.isAvailableAsync();
    } catch {
      return false;
    }
  },

  async isWritingAvailable(): Promise<boolean> {
    if (!native) return false;
    try {
      return await native.isWritingAvailableAsync();
    } catch {
      return false;
    }
  },

  async beginRead(alertMessage?: string): Promise<void> {
    if (!native) {
      throw new Error(
        "NFC needs an iOS development build with Core NFC (not Expo Go). Use QR or manual code instead.",
      );
    }
    await native.beginReadAsync(alertMessage);
  },

  async beginWrite(payload: string, alertMessage?: string): Promise<void> {
    if (!native) {
      throw new Error(
        "NFC write needs an iOS development build with Core NFC. Use Share / QR / manual code instead.",
      );
    }
    await native.beginWriteAsync(payload, alertMessage);
  },

  async invalidate(): Promise<void> {
    if (!native) return;
    try {
      await native.invalidateAsync();
    } catch {
      // best effort
    }
  },

  addListener(
    eventName:
      | "onNdefRead"
      | "onNdefWrite"
      | "onError"
      | "onSessionInvalidated",
    listener: (event: Record<string, unknown>) => void,
  ): EventSubscription {
    if (!native) return { remove: () => undefined };
    return native.addListener(eventName, listener);
  },
};
