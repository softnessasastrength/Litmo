/**
 * Orchestrates Multipeer transport + application-layer encrypted share.
 *
 * Safety invariants:
 * - Master opt-in must be on (Settings).
 * - Radio only runs while the share screen is active.
 * - Payload is encrypted with ephemeral ECDH before send.
 * - Stop / timeout tears down radio and clears session keys from memory.
 * - Never activates a session or records consent.
 */

import { litmoLocalShare, litmoLocalShareAvailable } from "litmo-local-share";
import {
  b64url,
  buildConsentSnapshotReviewPayload,
  buildDiscoveryProfilePayload,
  decryptSharePayload,
  deriveLocalShareSessionKey,
  discoveryDisplayLabel,
  encodeWireMessage,
  encryptSharePayload,
  fromB64url,
  generateX25519KeyPair,
  isShareSessionExpired,
  LOCAL_SHARE_DEFAULT_TIMEOUT_MS,
  parseWireMessage,
  type LocalSharePayload,
  type ShareKind,
  type SnapshotRowShare,
  type X25519KeyPair,
} from "./localShareCore.ts";
import { getNearbyShareEnabled } from "./localSharePreference.ts";
import { safeLog } from "./logger.ts";

export type NearbyPeer = {
  peerId: string;
  displayName: string;
  discoveryLabel?: string;
  shareKind?: string;
};

export type LocalSharePhase =
  | "idle"
  | "starting"
  | "advertising"
  | "browsing"
  | "awaiting_accept"
  | "connected"
  | "exchanging"
  | "received"
  | "sent"
  | "error"
  | "stopped";

export type LocalShareUiState = {
  phase: LocalSharePhase;
  available: boolean;
  masterEnabled: boolean;
  peers: NearbyPeer[];
  invitation: NearbyPeer | null;
  connectedPeer: NearbyPeer | null;
  received: LocalSharePayload | null;
  errorMessage: string | null;
  statusNote: string | null;
  startedAtMs: number | null;
  shareKind: ShareKind | null;
};

type Listener = (state: LocalShareUiState) => void;

type SessionKeys = {
  pair: X25519KeyPair;
  theirPublic: Uint8Array | null;
  sessionKey: Uint8Array | null;
  expectedKind: ShareKind;
  role: "host" | "guest";
  payloadToSend: LocalSharePayload | null;
  sentHello: boolean;
  payloadSent: boolean;
};

const initialState = (): LocalShareUiState => ({
  phase: "idle",
  available: litmoLocalShareAvailable,
  masterEnabled: false,
  peers: [],
  invitation: null,
  connectedPeer: null,
  received: null,
  errorMessage: null,
  statusNote: null,
  startedAtMs: null,
  shareKind: null,
});

class LocalShareController {
  private state: LocalShareUiState = initialState();
  private listeners = new Set<Listener>();
  private subs: { remove: () => void }[] = [];
  private keys: SessionKeys | null = null;
  private timeoutTimer: ReturnType<typeof setTimeout> | null = null;

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    listener(this.state);
    return () => this.listeners.delete(listener);
  }

  getState(): LocalShareUiState {
    return this.state;
  }

  private set(partial: Partial<LocalShareUiState>) {
    this.state = { ...this.state, ...partial };
    for (const l of this.listeners) l(this.state);
  }

  async refreshAvailability(): Promise<void> {
    const available = await litmoLocalShare.isAvailable();
    const masterEnabled = await getNearbyShareEnabled();
    this.set({ available, masterEnabled });
  }

  async startAsHost(params: {
    myDisplayName: string;
    shareKind: ShareKind;
    payload: LocalSharePayload;
  }): Promise<void> {
    await this.prepareStart(params.shareKind, "host", params.payload);
    try {
      this.set({ phase: "starting", statusNote: "Turning on nearby radio…" });
      await litmoLocalShare.startAdvertising({
        displayName: discoveryDisplayLabel(params.myDisplayName),
        discoveryLabel: discoveryDisplayLabel(params.myDisplayName),
        shareKind: params.shareKind,
      });
      this.armTimeout();
      this.set({
        phase: "advertising",
        statusNote:
          "Visible nearby only while this screen is open. Waiting for someone to connect — you will confirm before anything is sent.",
      });
    } catch (error) {
      this.fail(error);
    }
  }

  async startAsGuest(params: {
    myDisplayName: string;
    shareKind: ShareKind;
  }): Promise<void> {
    await this.prepareStart(params.shareKind, "guest", null);
    try {
      this.set({ phase: "starting", statusNote: "Looking for nearby Litmo…" });
      await litmoLocalShare.startBrowsing({
        displayName: discoveryDisplayLabel(params.myDisplayName),
      });
      this.armTimeout();
      this.set({
        phase: "browsing",
        statusNote:
          "Only people who intentionally started sharing appear here. Connect only if you recognize them in person.",
      });
    } catch (error) {
      this.fail(error);
    }
  }

  private async prepareStart(
    shareKind: ShareKind,
    role: "host" | "guest",
    payload: LocalSharePayload | null,
  ) {
    await this.stopInternal("restart");
    await this.refreshAvailability();
    if (!this.state.masterEnabled) {
      throw new Error(
        "Nearby sharing is off. Turn it on in Settings when you want it — it stays off by default.",
      );
    }
    if (!this.state.available) {
      throw new Error(
        "Nearby share needs an iOS development build with Multipeer Connectivity (not Expo Go).",
      );
    }
    this.bindEvents();
    this.keys = {
      pair: generateX25519KeyPair(),
      theirPublic: null,
      sessionKey: null,
      expectedKind: shareKind,
      role,
      payloadToSend: payload,
      sentHello: false,
      payloadSent: false,
    };
    this.set({
      shareKind,
      peers: [],
      invitation: null,
      connectedPeer: null,
      received: null,
      errorMessage: null,
      startedAtMs: Date.now(),
    });
  }

  async invite(peer: NearbyPeer): Promise<void> {
    try {
      this.set({
        phase: "awaiting_accept",
        statusNote: `Inviting ${peer.displayName}… They must accept on their phone.`,
        connectedPeer: peer,
      });
      await litmoLocalShare.invitePeer(peer.peerId);
    } catch (error) {
      this.fail(error);
    }
  }

  async respondToInvitation(accept: boolean): Promise<void> {
    const inv = this.state.invitation;
    if (!inv) return;
    try {
      await litmoLocalShare.respondToInvitation(inv.peerId, accept);
      if (!accept) {
        this.set({
          invitation: null,
          statusNote: "Invitation declined. Still advertising.",
          phase: "advertising",
        });
        return;
      }
      this.set({
        invitation: null,
        connectedPeer: inv,
        phase: "connected",
        statusNote: "Connected. Establishing encrypted channel…",
      });
    } catch (error) {
      this.fail(error);
    }
  }

  async stop(reason: string = "user"): Promise<void> {
    await this.stopInternal(reason);
    this.set({
      phase: "stopped",
      statusNote:
        reason === "timeout"
          ? "Nearby sharing stopped after the time limit. Start again only if you still want it."
          : "Nearby sharing stopped. Radio is off.",
      invitation: null,
      connectedPeer: null,
      peers: [],
      shareKind: null,
      startedAtMs: null,
    });
  }

  private async stopInternal(reason: string) {
    if (this.timeoutTimer) {
      clearTimeout(this.timeoutTimer);
      this.timeoutTimer = null;
    }
    for (const s of this.subs) s.remove();
    this.subs = [];
    this.keys = null;
    try {
      await litmoLocalShare.stop();
    } catch {
      // ignore
    }
    safeLog("local_share_stopped", { reason });
  }

  private armTimeout() {
    if (this.timeoutTimer) clearTimeout(this.timeoutTimer);
    this.timeoutTimer = setTimeout(() => {
      const started = this.state.startedAtMs;
      if (
        started &&
        isShareSessionExpired(
          started,
          Date.now(),
          LOCAL_SHARE_DEFAULT_TIMEOUT_MS,
        )
      ) {
        void this.stop("timeout");
      }
    }, LOCAL_SHARE_DEFAULT_TIMEOUT_MS + 50);
  }

  private bindEvents() {
    for (const s of this.subs) s.remove();
    this.subs = [];

    this.subs.push(
      litmoLocalShare.addListener("onPeerFound", (event) => {
        const peer: NearbyPeer = {
          peerId: String(event.peerId ?? ""),
          displayName: String(event.displayName ?? "Nearby person"),
          discoveryLabel:
            typeof event.discoveryLabel === "string"
              ? event.discoveryLabel
              : undefined,
          shareKind:
            typeof event.shareKind === "string" ? event.shareKind : undefined,
        };
        if (!peer.peerId) return;
        const peers = [
          ...this.state.peers.filter((p) => p.peerId !== peer.peerId),
          peer,
        ];
        this.set({ peers });
      }),
    );

    this.subs.push(
      litmoLocalShare.addListener("onPeerLost", (event) => {
        const peerId = String(event.peerId ?? "");
        this.set({
          peers: this.state.peers.filter((p) => p.peerId !== peerId),
        });
      }),
    );

    this.subs.push(
      litmoLocalShare.addListener("onInvitation", (event) => {
        const peer: NearbyPeer = {
          peerId: String(event.peerId ?? ""),
          displayName: String(event.displayName ?? "Nearby person"),
        };
        if (!peer.peerId) return;
        this.set({
          invitation: peer,
          phase: "awaiting_accept",
          statusNote: `${peer.displayName} wants to connect. Accept only if they are next to you and you intended this share.`,
        });
      }),
    );

    this.subs.push(
      litmoLocalShare.addListener("onPeerConnected", (event) => {
        const peer: NearbyPeer = {
          peerId: String(event.peerId ?? ""),
          displayName: String(event.displayName ?? "Nearby person"),
        };
        this.set({
          connectedPeer: peer,
          phase: "connected",
          statusNote: "Connected. Establishing encrypted channel…",
        });
        void this.beginKeyExchange(peer.peerId);
      }),
    );

    this.subs.push(
      litmoLocalShare.addListener("onPeerDisconnected", () => {
        this.set({
          connectedPeer: null,
          statusNote: "Peer disconnected. You can stop or wait for another.",
          phase:
            this.keys?.role === "host"
              ? "advertising"
              : this.state.phase === "received" || this.state.phase === "sent"
                ? this.state.phase
                : "browsing",
        });
      }),
    );

    this.subs.push(
      litmoLocalShare.addListener("onData", (event) => {
        const peerId = String(event.peerId ?? "");
        const payload = String(event.payload ?? "");
        void this.handleWire(peerId, payload);
      }),
    );

    this.subs.push(
      litmoLocalShare.addListener("onError", (event) => {
        this.set({
          phase: "error",
          errorMessage:
            typeof event.message === "string"
              ? event.message
              : "Nearby share hit a radio error.",
        });
      }),
    );

    this.subs.push(litmoLocalShare.addListener("onStopped", () => undefined));
  }

  private async beginKeyExchange(peerId: string) {
    if (!this.keys || this.keys.sentHello) return;
    const msg = encodeWireMessage({
      t: "hello",
      v: 1,
      ephemeralPublic: b64url(this.keys.pair.publicKey),
      shareKind: this.keys.expectedKind,
      displayLabel: this.state.connectedPeer?.displayName ?? "Litmo",
    });
    try {
      await litmoLocalShare.sendData(peerId, msg);
      this.keys.sentHello = true;
      this.set({
        phase: "exchanging",
        statusNote: "Exchanging ephemeral keys…",
      });
    } catch (error) {
      this.fail(error);
    }
  }

  private async handleWire(peerId: string, raw: string) {
    const msg = parseWireMessage(raw);
    if (!msg || !this.keys) return;

    if (msg.t === "cancel") {
      void this.stop("peer_cancel");
      return;
    }

    if (msg.t === "hello" || msg.t === "hello_ack") {
      try {
        const their = fromB64url(msg.ephemeralPublic);
        this.keys.theirPublic = their;
        this.keys.sessionKey = deriveLocalShareSessionKey({
          myPrivate: this.keys.pair.privateKey,
          theirPublic: their,
          myPublic: this.keys.pair.publicKey,
        });

        // If we have not sent our hello yet (rare race), send it now.
        if (!this.keys.sentHello) {
          await this.beginKeyExchange(peerId);
        }

        if (
          this.keys.role === "host" &&
          this.keys.payloadToSend &&
          this.keys.sessionKey &&
          !this.keys.payloadSent
        ) {
          this.keys.payloadSent = true;
          const ct = encryptSharePayload(
            this.keys.sessionKey,
            this.keys.payloadToSend,
          );
          await litmoLocalShare.sendData(
            peerId,
            encodeWireMessage({ t: "payload", v: 1, ciphertext: ct }),
          );
          await litmoLocalShare.sendData(
            peerId,
            encodeWireMessage({ t: "done", v: 1 }),
          );
          this.set({
            phase: "sent",
            statusNote:
              "Encrypted share sent. They can review it on their phone. This is never session activation or consent to touch.",
          });
        } else if (this.keys.role === "guest") {
          this.set({
            phase: "exchanging",
            statusNote: "Encrypted channel ready. Waiting for their share…",
          });
        }
      } catch (error) {
        this.fail(error);
      }
      return;
    }

    if (msg.t === "payload") {
      if (!this.keys.sessionKey) {
        this.set({
          phase: "error",
          errorMessage: "Received a payload before keys were ready.",
        });
        return;
      }
      const opened = decryptSharePayload(
        this.keys.sessionKey,
        msg.ciphertext,
        this.keys.expectedKind,
      );
      if (!opened) {
        this.set({
          phase: "error",
          errorMessage:
            "Could not open the share. Keys may not match or the content was altered.",
        });
        return;
      }
      this.set({
        phase: "received",
        received: opened,
        statusNote:
          "Received an encrypted nearby share. Review it carefully. It is never consent to touch.",
      });
      return;
    }

    if (msg.t === "done" && this.state.phase === "sent") {
      this.set({
        statusNote: "Share complete. You can stop the radio anytime.",
      });
    }
  }

  private fail(error: unknown) {
    const message =
      error instanceof Error ? error.message : "Nearby share failed.";
    this.set({ phase: "error", errorMessage: message });
    safeLog("local_share_error", {
      errorName: error instanceof Error ? error.name : "unknown",
    });
  }
}

export const localShareService = new LocalShareController();

export function makeProfilePayload(input: {
  displayName: string;
  pronouns?: string | null;
  bio?: string | null;
}): LocalSharePayload {
  return buildDiscoveryProfilePayload(input);
}

export function makeSnapshotPayload(input: {
  title?: string;
  rows: SnapshotRowShare[];
}): LocalSharePayload {
  return buildConsentSnapshotReviewPayload(input);
}
