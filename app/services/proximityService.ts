/**
 * Proximity social layer orchestration.
 *
 * Multipeer transport + ephemeral E2E + strict disclosure gates.
 * Soft Signal always tears down radio and keys immediately.
 */

import { litmoLocalShare, litmoLocalShareAvailable } from "litmo-local-share";
import { hapticService } from "./hapticService.ts";
import { safeLog } from "./logger.ts";
import {
  b64url,
  bandLabel,
  buildBeacon,
  buildIdentityReveal,
  buildRadarMatch,
  decodeBeaconFromDiscovery,
  demoRadarPeers,
  deriveLocalShareSessionKey,
  discoveryInfoFromBeacon,
  encodeBeaconForDiscovery,
  encodeProximityWire,
  fromB64url,
  generateX25519KeyPair,
  mayRevealIdentity,
  mintAnonymousPeerLabel,
  openIdentityReveal,
  openProximityJson,
  parseProximityWire,
  PROXIMITY_DEFAULT_TIMEOUT_MS,
  sealIdentityReveal,
  sealProximityJson,
  type DisclosurePhase,
  type IdentityRevealPayload,
  type ProximityBeacon,
  type RadarMatch,
  type X25519KeyPair,
} from "./proximityCore.ts";
import {
  getProximityPrefs,
  type ProximityPrefs,
} from "./proximityPreference.ts";

export type ProximityUiState = {
  phase: DisclosurePhase;
  available: boolean;
  prefs: ProximityPrefs | null;
  matches: RadarMatch[];
  demoMode: boolean;
  invitation: { peerId: string; label: string } | null;
  activePeerId: string | null;
  activePeerLabel: string | null;
  localInterest: boolean;
  peerInterest: boolean;
  localRevealOffer: boolean;
  peerRevealOffer: boolean;
  peerIdentity: IdentityRevealPayload | null;
  statusNote: string | null;
  errorMessage: string | null;
  startedAtMs: number | null;
};

type Listener = (state: ProximityUiState) => void;

type CryptoState = {
  pair: X25519KeyPair;
  sessionKey: Uint8Array | null;
  sentHello: boolean;
  myToken: string;
};

const initial = (): ProximityUiState => ({
  phase: "radio_off",
  available: litmoLocalShareAvailable,
  prefs: null,
  matches: [],
  demoMode: false,
  invitation: null,
  activePeerId: null,
  activePeerLabel: null,
  localInterest: false,
  peerInterest: false,
  localRevealOffer: false,
  peerRevealOffer: false,
  peerIdentity: null,
  statusNote: null,
  errorMessage: null,
  startedAtMs: null,
});

class ProximityController {
  private state: ProximityUiState = initial();
  private listeners = new Set<Listener>();
  private subs: { remove: () => void }[] = [];
  private selfBeacon: ProximityBeacon | null = null;
  private anonymousLabel = mintAnonymousPeerLabel();
  private crypto: CryptoState | null = null;
  private timeoutTimer: ReturnType<typeof setTimeout> | null = null;
  private matchMap = new Map<string, RadarMatch>();

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    listener(this.state);
    return () => this.listeners.delete(listener);
  }

  getState(): ProximityUiState {
    return this.state;
  }

  private set(partial: Partial<ProximityUiState>) {
    this.state = { ...this.state, ...partial };
    for (const l of this.listeners) l(this.state);
  }

  async refresh(): Promise<void> {
    const available = await litmoLocalShare.isAvailable();
    const prefs = await getProximityPrefs();
    this.set({ available, prefs });
  }

  async startRadar(options?: { forceDemo?: boolean }): Promise<void> {
    await this.softTeardown("restart");
    const prefs = await getProximityPrefs();
    if (!prefs.enabled) {
      throw new Error(
        "Proximity is off. Turn it on in Settings when you want it — it stays off by default.",
      );
    }
    const available = await litmoLocalShare.isAvailable();
    this.selfBeacon = buildBeacon({
      axes: prefs.axes,
      weather: prefs.includeWeather ? prefs.weather : "none",
      quiet: prefs.quietPreferred,
    });
    this.anonymousLabel = mintAnonymousPeerLabel();
    this.matchMap.clear();
    this.crypto = {
      pair: generateX25519KeyPair(),
      sessionKey: null,
      sentHello: false,
      myToken: this.selfBeacon.token,
    };

    const useDemo = options?.forceDemo || !available;
    if (useDemo) {
      const matches = demoRadarPeers(this.selfBeacon);
      for (const m of matches) this.matchMap.set(m.peerKey, m);
      this.set({
        available,
        prefs,
        demoMode: true,
        matches,
        phase: "radar",
        startedAtMs: Date.now(),
        statusNote:
          "Practice radar (demo). No real radio. Soft Signal still ends this practice immediately. Real devices need a development build.",
        errorMessage: null,
        invitation: null,
        activePeerId: null,
        peerIdentity: null,
        localInterest: false,
        peerInterest: false,
        localRevealOffer: false,
        peerRevealOffer: false,
      });
      this.armTimeout();
      return;
    }

    this.bindEvents();
    try {
      await litmoLocalShare.startProximity({
        displayName: this.anonymousLabel,
        beacon: encodeBeaconForDiscovery(this.selfBeacon),
        discoveryInfo: discoveryInfoFromBeacon(this.selfBeacon),
      });
      this.set({
        available,
        prefs,
        demoMode: false,
        matches: [],
        phase: "radar",
        startedAtMs: Date.now(),
        statusNote:
          "Anonymous nearby radar is on. Others see only weather axes — not your name. Soft Signal stops everything immediately.",
        errorMessage: null,
        invitation: null,
        activePeerId: null,
        peerIdentity: null,
        localInterest: false,
        peerInterest: false,
        localRevealOffer: false,
        peerRevealOffer: false,
      });
      this.armTimeout();
    } catch (error) {
      this.fail(error);
    }
  }

  /** Demo-only: pretend a soft handshake against a synthetic peer. */
  async practiceHandshake(peerKey: string): Promise<void> {
    if (!this.state.demoMode) return;
    const match = this.matchMap.get(peerKey);
    if (!match) return;
    this.set({
      activePeerId: peerKey,
      activePeerLabel: match.ephemeralLabel,
      phase: "encrypted",
      localInterest: false,
      peerInterest: false,
      statusNote:
        "Practice encrypted channel (demo). Offer interest only if you feel ready. Soft Signal ends practice.",
    });
  }

  async inviteHandshake(peerKey: string): Promise<void> {
    if (this.state.demoMode) {
      await this.practiceHandshake(peerKey);
      return;
    }
    const match = this.matchMap.get(peerKey);
    try {
      this.set({
        activePeerId: peerKey,
        activePeerLabel: match?.ephemeralLabel ?? peerKey,
        phase: "handshake_pending",
        statusNote:
          "Waiting for them to accept a private handshake. No identity is shared yet.",
      });
      await litmoLocalShare.invitePeer(peerKey);
    } catch (error) {
      this.fail(error);
    }
  }

  async respondToInvitation(accept: boolean): Promise<void> {
    const inv = this.state.invitation;
    if (!inv) return;
    if (this.state.demoMode) {
      this.set({ invitation: null });
      return;
    }
    try {
      await litmoLocalShare.respondToInvitation(inv.peerId, accept);
      if (!accept) {
        this.set({
          invitation: null,
          statusNote: "Invitation declined. Radar continues. No penalty.",
          phase: "radar",
        });
        return;
      }
      this.set({
        invitation: null,
        activePeerId: inv.peerId,
        activePeerLabel: inv.label,
        phase: "handshake_pending",
        statusNote: "Connected. Establishing encrypted channel…",
      });
    } catch (error) {
      this.fail(error);
    }
  }

  async offerInterest(): Promise<void> {
    this.set({ localInterest: true });
    if (this.state.demoMode) {
      // In practice mode, peer interest arrives after a calm beat.
      this.set({
        peerInterest: true,
        phase: "mutual_interest",
        statusNote:
          "Mutual interest (demo). Identity is still hidden until both of you choose reveal.",
      });
      return;
    }
    const peerId = this.state.activePeerId;
    const key = this.crypto?.sessionKey;
    if (!peerId || !key) {
      this.set({
        errorMessage: "Encrypted channel is not ready yet.",
      });
      return;
    }
    try {
      const ct = sealProximityJson(key, "discovery_profile", {
        wantContinue: true,
      });
      await litmoLocalShare.sendData(
        peerId,
        encodeProximityWire({ t: "px_interest", v: 1, ciphertext: ct }),
      );
      if (this.state.peerInterest) {
        this.set({
          phase: "mutual_interest",
          statusNote:
            "You both want to continue carefully. Identity still requires a separate mutual yes.",
        });
      } else {
        this.set({
          statusNote: "Interest sent. Waiting for theirs. Soft Signal remains available.",
        });
      }
    } catch (error) {
      this.fail(error);
    }
  }

  async offerIdentityReveal(profile: {
    displayName: string;
    pronouns?: string | null;
    shortIntro?: string | null;
  }): Promise<void> {
    if (!(this.state.localInterest && this.state.peerInterest) && !this.state.demoMode) {
      this.set({
        errorMessage: "Mutual interest is required before identity reveal.",
      });
      return;
    }
    const identity = buildIdentityReveal(profile);
    this.set({ localRevealOffer: true, phase: "identity_pending" });

    if (this.state.demoMode) {
      // Demo peer reveals a fictional identity only after local offer.
      this.set({
        peerRevealOffer: true,
        peerIdentity: buildIdentityReveal({
          displayName: "Demo neighbor",
          pronouns: null,
          shortIntro: "Fictional practice identity — never a real person.",
        }),
        phase: "identity_revealed",
        statusNote:
          "Practice identity reveal (demo). Real life still requires mutual consent. Not consent to touch.",
      });
      return;
    }

    const peerId = this.state.activePeerId;
    const key = this.crypto?.sessionKey;
    if (!peerId || !key) {
      this.set({ errorMessage: "Encrypted channel is not ready." });
      return;
    }
    try {
      const ct = sealIdentityReveal(key, identity);
      await litmoLocalShare.sendData(
        peerId,
        encodeProximityWire({ t: "px_identity_offer", v: 1, ciphertext: ct }),
      );
      await litmoLocalShare.sendData(
        peerId,
        encodeProximityWire({
          t: "px_identity_accept",
          v: 1,
          ciphertext: sealProximityJson(key, "discovery_profile", {
            accept: true,
          }),
        }),
      );
      // If peer already offered, surface only after our consent.
      if (this._pendingPeerIdentity) {
        this.set({
          peerIdentity: this._pendingPeerIdentity,
          peerRevealOffer: true,
        });
      }
      this.set({
        statusNote:
          "Your identity offer is sealed. Their name appears only with mutual consent.",
      });
      this.tryFinalizeReveal();
    } catch (error) {
      this.fail(error);
    }
  }

  /** Soft Signal — immediate, reason-free exit. */
  async softSignal(): Promise<void> {
    void hapticService.play("softSignal");
    const peerId = this.state.activePeerId;
    if (peerId && !this.state.demoMode && this.crypto) {
      try {
        await litmoLocalShare.sendData(
          peerId,
          encodeProximityWire({
            t: "px_soft_signal",
            v: 1,
            reason: "soft_signal",
          }),
        );
      } catch {
        // Best-effort notify.
      }
    }
    await this.softTeardown("soft_signal");
    this.set({
      phase: "soft_signaled",
      matches: [],
      invitation: null,
      activePeerId: null,
      activePeerLabel: null,
      peerIdentity: null,
      localInterest: false,
      peerInterest: false,
      localRevealOffer: false,
      peerRevealOffer: false,
      statusNote:
        "Soft Signal. Nearby radio is off. No explanation needed. No penalty. Litmo is not emergency response.",
      startedAtMs: null,
    });
    safeLog("proximity_soft_signal", {});
  }

  async stop(reason: string = "user"): Promise<void> {
    await this.softTeardown(reason);
    this.set({
      phase: "stopped",
      matches: [],
      invitation: null,
      activePeerId: null,
      peerIdentity: null,
      statusNote: "Proximity stopped. Radio is off.",
      startedAtMs: null,
    });
  }

  private tryFinalizeReveal() {
    const ready = mayRevealIdentity({
      localAcceptedReveal: this.state.localRevealOffer,
      peerAcceptedReveal: this.state.peerRevealOffer,
      encryptedChannelReady: Boolean(this.crypto?.sessionKey),
      softSignaled: this.state.phase === "soft_signaled",
    });
    if (ready && this.state.peerIdentity) {
      this.set({
        phase: "identity_revealed",
        statusNote:
          "Identity revealed with mutual consent. Still not consent to touch. Soft Signal remains available.",
      });
    }
  }

  private async softTeardown(reason: string) {
    if (this.timeoutTimer) {
      clearTimeout(this.timeoutTimer);
      this.timeoutTimer = null;
    }
    for (const s of this.subs) s.remove();
    this.subs = [];
    this.crypto = null;
    this.selfBeacon = null;
    this.matchMap.clear();
    try {
      await litmoLocalShare.stop();
    } catch {
      // ignore
    }
    safeLog("proximity_teardown", { reason });
  }

  private armTimeout() {
    if (this.timeoutTimer) clearTimeout(this.timeoutTimer);
    this.timeoutTimer = setTimeout(() => {
      void this.softSignal().then(() => {
        this.set({
          statusNote:
            "Proximity timed out and Soft-Signaled for you. Start again only if you still want it.",
        });
      });
    }, PROXIMITY_DEFAULT_TIMEOUT_MS);
  }

  private bindEvents() {
    for (const s of this.subs) s.remove();
    this.subs = [];

    this.subs.push(
      litmoLocalShare.addListener("onPeerFound", (event) => {
        if (!this.selfBeacon) return;
        const peerId = String(event.peerId ?? "");
        if (!peerId || peerId === this.anonymousLabel) return;
        const label = String(event.displayName ?? peerId);
        let beacon: ProximityBeacon | null = null;
        if (typeof event.beacon === "string") {
          beacon = decodeBeaconFromDiscovery(event.beacon);
        }
        if (!beacon && event.discoveryInfo && typeof event.discoveryInfo === "object") {
          const info = event.discoveryInfo as Record<string, unknown>;
          if (typeof info.b === "string") {
            beacon = decodeBeaconFromDiscovery(info.b);
          }
        }
        // Peers without proximity beacons (e.g. share-only hosts) are ignored
        // on the radar — fail closed to anonymity.
        if (!beacon) return;
        const match = buildRadarMatch({
          peerKey: peerId,
          ephemeralLabel: label,
          selfBeacon: this.selfBeacon,
          peerBeacon: beacon,
        });
        this.matchMap.set(peerId, match);
        this.set({
          matches: [...this.matchMap.values()].sort(
            (a, b) => b.resonance - a.resonance,
          ),
        });
      }),
    );

    this.subs.push(
      litmoLocalShare.addListener("onPeerLost", (event) => {
        const peerId = String(event.peerId ?? "");
        this.matchMap.delete(peerId);
        this.set({
          matches: [...this.matchMap.values()].sort(
            (a, b) => b.resonance - a.resonance,
          ),
        });
      }),
    );

    this.subs.push(
      litmoLocalShare.addListener("onInvitation", (event) => {
        const peerId = String(event.peerId ?? "");
        if (!peerId) return;
        this.set({
          invitation: {
            peerId,
            label: String(event.displayName ?? "Nearby person"),
          },
          statusNote:
            "Someone nearby asks for a private handshake. Accept only if you recognize the situation and feel ready. Identity is still hidden.",
        });
      }),
    );

    this.subs.push(
      litmoLocalShare.addListener("onPeerConnected", (event) => {
        const peerId = String(event.peerId ?? "");
        this.set({
          activePeerId: peerId,
          activePeerLabel: String(event.displayName ?? peerId),
          phase: "handshake_pending",
          statusNote: "Connected. Exchanging ephemeral keys…",
        });
        void this.beginKeyExchange(peerId);
      }),
    );

    this.subs.push(
      litmoLocalShare.addListener("onPeerDisconnected", () => {
        if (this.state.phase === "soft_signaled" || this.state.phase === "stopped") {
          return;
        }
        this.crypto = this.crypto
          ? { ...this.crypto, sessionKey: null, sentHello: false }
          : null;
        this.set({
          activePeerId: null,
          localInterest: false,
          peerInterest: false,
          localRevealOffer: false,
          peerRevealOffer: false,
          peerIdentity: null,
          phase: "radar",
          statusNote: "Handshake ended. Radar continues if radio is on.",
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
          errorMessage:
            typeof event.message === "string"
              ? event.message
              : "Proximity radio error.",
        });
      }),
    );
  }

  private async beginKeyExchange(peerId: string) {
    if (!this.crypto || this.crypto.sentHello) return;
    try {
      await litmoLocalShare.sendData(
        peerId,
        encodeProximityWire({
          t: "px_hello",
          v: 1,
          ephemeralPublic: b64url(this.crypto.pair.publicKey),
          token: this.crypto.myToken,
        }),
      );
      this.crypto.sentHello = true;
    } catch (error) {
      this.fail(error);
    }
  }

  private async handleWire(peerId: string, raw: string) {
    const msg = parseProximityWire(raw);
    if (!msg || !this.crypto) return;

    if (msg.t === "px_soft_signal" || msg.t === "px_cancel") {
      await this.softTeardown("peer_exit");
      this.set({
        phase: "soft_signaled",
        statusNote:
          "They Soft-Signaled or left. Radio is off. No explanation required either way.",
        matches: [],
        activePeerId: null,
        peerIdentity: null,
      });
      void hapticService.play("softSignal");
      return;
    }

    if (msg.t === "px_hello" || msg.t === "px_hello_ack") {
      try {
        const their = fromB64url(msg.ephemeralPublic);
        this.crypto.sessionKey = deriveLocalShareSessionKey({
          myPrivate: this.crypto.pair.privateKey,
          theirPublic: their,
          myPublic: this.crypto.pair.publicKey,
        });
        if (!this.crypto.sentHello) {
          await this.beginKeyExchange(peerId);
        }
        if (msg.t === "px_hello") {
          await litmoLocalShare.sendData(
            peerId,
            encodeProximityWire({
              t: "px_hello_ack",
              v: 1,
              ephemeralPublic: b64url(this.crypto.pair.publicKey),
              token: this.crypto.myToken,
            }),
          );
        }
        this.set({
          phase: "encrypted",
          statusNote:
            "Encrypted channel ready. Offer interest only if you want to continue. Soft Signal is always available.",
        });
      } catch (error) {
        this.fail(error);
      }
      return;
    }

    if (msg.t === "px_interest") {
      if (!this.crypto.sessionKey) return;
      const opened = openProximityJson(this.crypto.sessionKey, msg.ciphertext);
      const ok =
        opened &&
        typeof opened === "object" &&
        (opened as { wantContinue?: boolean }).wantContinue === true;
      if (!ok) return;
      this.set({ peerInterest: true });
      if (this.state.localInterest) {
        this.set({
          phase: "mutual_interest",
          statusNote:
            "Mutual interest. Identity still needs a separate mutual yes from both of you.",
        });
      } else {
        this.set({
          statusNote:
            "They expressed interest. You can offer interest too — or Soft Signal / decline.",
        });
      }
      return;
    }

    if (msg.t === "px_identity_offer") {
      if (!this.crypto.sessionKey) return;
      const identity = openIdentityReveal(this.crypto.sessionKey, msg.ciphertext);
      if (!identity) {
        this.set({ errorMessage: "Could not open identity offer." });
        return;
      }
      // Hold sealed identity until local consent — never surface name early.
      this._pendingPeerIdentity = identity;
      this.set({
        peerRevealOffer: true,
        phase: "identity_pending",
        statusNote: this.state.localRevealOffer
          ? "Mutual identity consent forming…"
          : "They offered a sealed identity. It stays hidden until you also choose to reveal.",
      });
      if (this.state.localRevealOffer) {
        this.set({ peerIdentity: identity });
        this.tryFinalizeReveal();
      }
      return;
    }

    if (msg.t === "px_identity_accept") {
      if (!this.crypto.sessionKey) return;
      const opened = openProximityJson(this.crypto.sessionKey, msg.ciphertext);
      if (
        opened &&
        typeof opened === "object" &&
        (opened as { accept?: boolean }).accept === true
      ) {
        this.set({ peerRevealOffer: true });
        if (this._pendingPeerIdentity && this.state.localRevealOffer) {
          this.set({ peerIdentity: this._pendingPeerIdentity });
          this.tryFinalizeReveal();
        }
      }
    }
  }

  private _pendingPeerIdentity: IdentityRevealPayload | null = null;

  private fail(error: unknown) {
    const message =
      error instanceof Error ? error.message : "Proximity failed.";
    this.set({ errorMessage: message });
    safeLog("proximity_error", {
      errorName: error instanceof Error ? error.name : "unknown",
    });
  }
}

export const proximityService = new ProximityController();

export { bandLabel };
