export type EventSubscription = { remove: () => void };

export type LocalSharePeerEvent = {
  peerId: string;
  displayName: string;
  discoveryLabel?: string;
  shareKind?: string;
  role?: string;
};

export type LocalShareDataEvent = {
  peerId: string;
  displayName: string;
  payload: string;
};

export type LocalShareErrorEvent = {
  message: string;
  code?: string;
};

export type LocalShareStoppedEvent = {
  reason: string;
};

type NativeLocalShare = {
  isAvailableAsync(): Promise<boolean>;
  startAdvertisingAsync(options: {
    displayName: string;
    discoveryLabel?: string;
    shareKind?: string;
  }): Promise<boolean>;
  startBrowsingAsync(options: { displayName: string }): Promise<boolean>;
  startProximityAsync(options: {
    displayName: string;
    beacon?: string;
    discoveryInfo?: Record<string, string>;
  }): Promise<boolean>;
  invitePeerAsync(peerId: string): Promise<boolean>;
  respondToInvitationAsync(peerId: string, accept: boolean): Promise<boolean>;
  sendDataAsync(peerId: string, utf8Payload: string): Promise<boolean>;
  stopAsync(): Promise<boolean>;
  addListener(
    eventName: string,
    listener: (event: Record<string, unknown>) => void,
  ): EventSubscription;
};

function loadNative(): NativeLocalShare | null {
  try {
    // Lazy require so Expo Go / web fail soft without crashing the bundle.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { requireNativeModule } = require("expo-modules-core") as {
      requireNativeModule: <T>(name: string) => T;
    };
    return requireNativeModule<NativeLocalShare>("LitmoLocalShare");
  } catch {
    return null;
  }
}

const native = loadNative();

export const litmoLocalShareAvailable = Boolean(native);

export const litmoLocalShare = {
  async isAvailable(): Promise<boolean> {
    if (!native) return false;
    try {
      return await native.isAvailableAsync();
    } catch {
      return false;
    }
  },

  async startAdvertising(options: {
    displayName: string;
    discoveryLabel?: string;
    shareKind?: string;
  }): Promise<void> {
    if (!native) {
      throw new Error(
        "Nearby share needs an iOS development build with Multipeer Connectivity (not Expo Go).",
      );
    }
    await native.startAdvertisingAsync(options);
  },

  async startBrowsing(options: { displayName: string }): Promise<void> {
    if (!native) {
      throw new Error(
        "Nearby share needs an iOS development build with Multipeer Connectivity (not Expo Go).",
      );
    }
    await native.startBrowsingAsync(options);
  },

  /** Anonymous advertise + browse for proximity radar. */
  async startProximity(options: {
    displayName: string;
    beacon?: string;
    discoveryInfo?: Record<string, string>;
  }): Promise<void> {
    if (!native) {
      throw new Error(
        "Proximity radar needs an iOS development build with Multipeer Connectivity (not Expo Go).",
      );
    }
    if (typeof native.startProximityAsync !== "function") {
      throw new Error(
        "This development build is missing proximity Multipeer support. Rebuild with the latest litmo-local-share module.",
      );
    }
    await native.startProximityAsync(options);
  },

  async invitePeer(peerId: string): Promise<void> {
    if (!native) throw new Error("Nearby share is unavailable.");
    await native.invitePeerAsync(peerId);
  },

  async respondToInvitation(peerId: string, accept: boolean): Promise<void> {
    if (!native) throw new Error("Nearby share is unavailable.");
    await native.respondToInvitationAsync(peerId, accept);
  },

  async sendData(peerId: string, utf8Payload: string): Promise<void> {
    if (!native) throw new Error("Nearby share is unavailable.");
    await native.sendDataAsync(peerId, utf8Payload);
  },

  async stop(): Promise<void> {
    if (!native) return;
    try {
      await native.stopAsync();
    } catch {
      // Best-effort stop.
    }
  },

  addListener(
    eventName:
      | "onPeerFound"
      | "onPeerLost"
      | "onInvitation"
      | "onPeerConnected"
      | "onPeerDisconnected"
      | "onData"
      | "onError"
      | "onStopped",
    listener: (event: Record<string, unknown>) => void,
  ): EventSubscription {
    if (!native) {
      return { remove: () => undefined };
    }
    return native.addListener(eventName, listener);
  },
};
