/**
 * NFC tap-to-connect orchestration.
 *
 * Transport: Core NFC NDEF tags when available; always QR/manual/share fallback.
 * A successful NFC read never opens content until explicit post-tap Accept.
 */

import { litmoNfc, litmoNfcAvailable } from "litmo-nfc";
import { hapticService } from "./hapticService.ts";
import { safeLog } from "./logger.ts";
import {
  buildAccept,
  buildFallbackBundle,
  buildKeyExchangePlaintext,
  buildOffer,
  buildProfilePlaintext,
  buildSnapshotInitiatePlaintext,
  deriveNfcSessionKey,
  encodeAcceptDeepLink,
  encodeOfferDeepLink,
  encodeSealedDeepLink,
  fromB64url,
  generateX25519KeyPair,
  intentLabel,
  isOfferExpired,
  isValidOffer,
  mayOpenNfcContent,
  openNfcPayload,
  parseAcceptDeepLink,
  parseOfferDeepLink,
  parseOfferJson,
  parseSealedDeepLink,
  sealNfcPayload,
  type NfcAccept,
  type NfcIntent,
  type NfcOffer,
  type NfcPlaintext,
  type NfcSealedPayload,
  type NfcTransport,
  type X25519KeyPair,
} from "./nfcCore.ts";
import {
  buildEncryptedQr,
  openEncryptedQr,
  type QrBuildResult,
  type QrPrivacyMode,
} from "./qrInviteCore.ts";

export type NfcPhase =
  | "idle"
  | "offer_ready"
  | "writing"
  | "reading"
  | "awaiting_post_tap_consent"
  | "accepted"
  | "key_ready"
  | "content_ready"
  | "canceled"
  | "error";

export type NfcUiState = {
  phase: NfcPhase;
  nfcHardware: boolean;
  nfcWrite: boolean;
  intent: NfcIntent | null;
  offer: NfcOffer | null;
  fallback: ReturnType<typeof buildFallbackBundle> | null;
  /** Time-limited encrypted QR for the current host package. */
  qr: QrBuildResult | null;
  qrPrivacyMode: QrPrivacyMode;
  pendingOffer: NfcOffer | null;
  transport: NfcTransport | null;
  peerAccept: NfcAccept | null;
  sealed: NfcSealedPayload | null;
  opened: NfcPlaintext | null;
  statusNote: string | null;
  errorMessage: string | null;
};

type Listener = (state: NfcUiState) => void;

const initial = (): NfcUiState => ({
  phase: "idle",
  nfcHardware: litmoNfcAvailable,
  nfcWrite: false,
  intent: null,
  offer: null,
  fallback: null,
  qr: null,
  qrPrivacyMode: "colocated",
  pendingOffer: null,
  transport: null,
  peerAccept: null,
  sealed: null,
  opened: null,
  statusNote: null,
  errorMessage: null,
});

class NfcController {
  private state: NfcUiState = initial();
  private listeners = new Set<Listener>();
  private subs: { remove: () => void }[] = [];
  private hostPair: X25519KeyPair | null = null;
  private guestPair: X25519KeyPair | null = null;
  private sessionKey: Uint8Array | null = null;
  private postTapAccepted = false;
  private qrPrivacyMode: QrPrivacyMode = "colocated";

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    listener(this.state);
    return () => this.listeners.delete(listener);
  }

  getState(): NfcUiState {
    return this.state;
  }

  private set(partial: Partial<NfcUiState>) {
    this.state = { ...this.state, ...partial };
    for (const l of this.listeners) l(this.state);
  }

  async refresh(): Promise<void> {
    const nfcHardware = await litmoNfc.isAvailable();
    const nfcWrite = await litmoNfc.isWritingAvailable();
    this.set({ nfcHardware, nfcWrite });
  }

  /**
   * Host: create ephemeral offer for an intent. Does not auto-write NFC.
   */
  setQrPrivacyMode(mode: QrPrivacyMode): void {
    this.qrPrivacyMode = mode;
    this.set({ qrPrivacyMode: mode });
    // Rebuild QR for current offer if present.
    if (this.state.offer) {
      const qr = buildEncryptedQr({
        kind: "nfc_offer",
        inner: this.state.offer,
        mode,
      });
      this.set({ qr });
    } else if (this.state.sealed) {
      const qr = buildEncryptedQr({
        kind: "nfc_sealed",
        inner: this.state.sealed,
        mode,
      });
      this.set({ qr });
    }
  }

  async createOffer(input: {
    intent: NfcIntent;
    label?: string | null;
  }): Promise<void> {
    this.resetCrypto();
    this.bindEvents();
    this.hostPair = generateX25519KeyPair();
    const offer = buildOffer({
      intent: input.intent,
      pair: this.hostPair,
      label: input.label,
    });
    const fallback = buildFallbackBundle(offer);
    const qr = buildEncryptedQr({
      kind: "nfc_offer",
      inner: offer,
      mode: this.qrPrivacyMode,
    });
    this.set({
      phase: "offer_ready",
      intent: input.intent,
      offer,
      fallback,
      qr,
      qrPrivacyMode: this.qrPrivacyMode,
      pendingOffer: null,
      peerAccept: null,
      sealed: null,
      opened: null,
      statusNote: `Offer ready for ${intentLabel(input.intent)}. Prefer NFC → encrypted QR → manual link. A tap is never consent.`,
      errorMessage: null,
      transport: null,
    });
    this.postTapAccepted = false;
  }

  async writeOfferToTag(): Promise<void> {
    if (!this.state.offer || !this.state.fallback) {
      throw new Error("Create an offer first.");
    }
    try {
      this.set({
        phase: "writing",
        statusNote: "Hold near a writable NFC tag…",
      });
      await litmoNfc.beginWrite(
        this.state.fallback.deepLink,
        "Hold near a writable NFC tag. You can cancel anytime. A tap is never consent.",
      );
    } catch (error) {
      this.fail(error);
    }
  }

  async beginScan(): Promise<void> {
    this.bindEvents();
    this.postTapAccepted = false;
    this.guestPair = generateX25519KeyPair();
    try {
      this.set({
        phase: "reading",
        statusNote: "Hold near a Litmo NFC tag…",
        pendingOffer: null,
        opened: null,
        errorMessage: null,
      });
      await litmoNfc.beginRead(
        "Hold near the Litmo NFC tag. After the scan you must Accept carefully — a tap is never consent.",
      );
    } catch (error) {
      this.fail(error);
    }
  }

  /**
   * Ingest offer from QR scan result, deep link, paste, or manual JSON.
   * Supports encrypted litmo://q/v1 envelopes and legacy litmo://nfc links.
   */
  ingestExternalPayload(
    raw: string,
    transport: NfcTransport = "manual",
    unlockCode?: string,
  ): void {
    this.postTapAccepted = false;

    // Encrypted QR envelope (preferred robust fallback).
    const qrOpened = openEncryptedQr(raw, { unlockCode });
    if (qrOpened.ok) {
      if (qrOpened.kind === "nfc_offer" && isValidOffer(qrOpened.inner)) {
        this.ingestOfferObject(qrOpened.inner, "qr");
        return;
      }
      if (qrOpened.kind === "nfc_accept") {
        void this.ingestPeerAccept(qrOpened.inner as NfcAccept, "qr");
        return;
      }
      if (qrOpened.kind === "nfc_sealed") {
        this.set({
          sealed: qrOpened.inner as NfcSealedPayload,
          phase: "awaiting_post_tap_consent",
          transport: "qr",
          statusNote:
            "Received a sealed encrypted QR package. Accept only if you intended this exchange.",
        });
        return;
      }
      if (qrOpened.kind === "snapshot_start") {
        // Surface as snapshot initiate offer path via pending sealed-like open after accept.
        this.set({
          phase: "awaiting_post_tap_consent",
          transport: "qr",
          statusNote:
            "Encrypted Consent Snapshot start QR received. Accept carefully — review only, never session activation.",
          opened: null,
          pendingOffer: null,
          sealed: null,
          errorMessage: null,
        });
        // Stash snapshot inner on opened only after accept — store temporarily via sealed bypass:
        this._pendingSnapshotInner = qrOpened.inner;
        return;
      }
      // Other kinds handled by proximity UI.
      this.set({
        phase: "error",
        errorMessage:
          "This QR is a proximity invite. Open Proximity radar to use it, or paste an NFC offer QR.",
      });
      return;
    }
    if (!qrOpened.ok && qrOpened.reason === "need_unlock") {
      this.set({
        phase: "error",
        errorMessage:
          "This encrypted QR needs the unlock code (split mode). Enter the code from the other person’s screen.",
      });
      return;
    }
    if (!qrOpened.ok && qrOpened.reason === "expired") {
      this.set({
        phase: "error",
        errorMessage: "This encrypted QR has expired. Ask for a fresh invite.",
      });
      return;
    }

    const sealed = parseSealedDeepLink(raw);
    if (sealed) {
      this.set({
        sealed,
        phase: "awaiting_post_tap_consent",
        transport,
        statusNote:
          "Received a sealed package. Accept only if you intended this exchange.",
      });
      return;
    }
    const accept = parseAcceptDeepLink(raw);
    if (accept) {
      void this.ingestPeerAccept(accept, transport);
      return;
    }
    const offer =
      parseOfferDeepLink(raw) ?? parseOfferJson(raw.trim());
    if (!offer || !isValidOffer(offer)) {
      this.set({
        phase: "error",
        errorMessage:
          "That did not look like a Litmo NFC/QR invite. Check the code and try again.",
      });
      return;
    }
    this.ingestOfferObject(offer, transport);
  }

  private _pendingSnapshotInner: unknown = null;

  private ingestOfferObject(offer: NfcOffer, transport: NfcTransport): void {
    if (isOfferExpired(offer)) {
      this.set({
        phase: "error",
        errorMessage: "This invite has expired. Ask them to create a new one.",
      });
      return;
    }
    this.guestPair = this.guestPair ?? generateX25519KeyPair();
    this.set({
      pendingOffer: offer,
      transport,
      phase: "awaiting_post_tap_consent",
      statusNote: `Scanned ${intentLabel(offer.intent)}. A tap or scan is never consent — Accept only if you mean to continue.`,
      errorMessage: null,
      opened: null,
    });
  }

  /**
   * Explicit post-tap consent (receiver). Required before keys or content.
   */
  async acceptPostTap(): Promise<void> {
    // Snapshot-start QR path: no ECDH offer, just explicit accept then show review rows.
    if (!this.state.pendingOffer && this._pendingSnapshotInner) {
      this.postTapAccepted = true;
      const inner = this._pendingSnapshotInner as {
        title?: string;
        rows?: { label: string; value: string }[];
        kind?: string;
      };
      this._pendingSnapshotInner = null;
      this.set({
        phase: "content_ready",
        opened: {
          kind: "snapshot_initiate",
          title: inner.title ?? "Consent Snapshot review",
          rows: Array.isArray(inner.rows) ? inner.rows : [],
          notSessionActivation: true,
          notConsentToTouch: true,
          reviewOnly: true,
        },
        statusNote:
          "Snapshot review opened after your explicit accept. Never session activation. Soft clear anytime.",
      });
      void hapticService.play("confirmation");
      return;
    }

    const offer = this.state.pendingOffer;
    if (!offer) {
      this.set({ errorMessage: "Nothing to accept." });
      return;
    }
    if (isOfferExpired(offer)) {
      this.set({
        phase: "error",
        errorMessage: "Invite expired before you accepted.",
      });
      return;
    }
    if (
      !mayOpenNfcContent({
        offerValid: true,
        offerExpired: false,
        localAcceptedPostTap: true,
        softCanceled: false,
      })
    ) {
      return;
    }
    this.postTapAccepted = true;
    this.guestPair = this.guestPair ?? generateX25519KeyPair();
    const accept = buildAccept({ offer, pair: this.guestPair });
    const theirPub = fromB64url(offer.epk);
    this.sessionKey = deriveNfcSessionKey({
      myPrivate: this.guestPair.privateKey,
      theirPublic: theirPub,
      myPublic: this.guestPair.publicKey,
      sid: offer.sid,
    });
    void hapticService.play("confirmation");
    const acceptLink = encodeAcceptDeepLink(accept);
    const qr = buildEncryptedQr({
      kind: "nfc_accept",
      inner: accept,
      mode: this.qrPrivacyMode,
    });
    this.set({
      phase: "key_ready",
      peerAccept: accept,
      intent: offer.intent,
      statusNote:
        "You accepted carefully. Ephemeral keys are ready. Share your Accept QR/link with them if they need it, or wait for sealed content.",
      qr,
      fallback: {
        shortCode: offer.code,
        deepLink: acceptLink,
        json: JSON.stringify(accept),
        shareMessage: qr.shareMessage,
      },
    });
  }

  declinePostTap(): void {
    this.postTapAccepted = false;
    this.sessionKey = null;
    this.guestPair = null;
    void hapticService.play("softSignal");
    this.set({
      phase: "canceled",
      pendingOffer: null,
      opened: null,
      statusNote:
        "Declined. No problem. No explanation needed. Nothing was shared from you.",
    });
    safeLog("nfc_post_tap_declined", {});
  }

  /**
   * Host: after peer accepts, seal intent payload under shared key.
   */
  async sealForPeer(input: {
    displayName?: string;
    pronouns?: string | null;
    bio?: string | null;
    snapshotTitle?: string;
    snapshotRows?: { label: string; value: string }[];
    peerAcceptRaw?: string;
  }): Promise<void> {
    if (!this.state.offer || !this.hostPair) {
      throw new Error("Create an offer first.");
    }
    let accept = this.state.peerAccept;
    if (input.peerAcceptRaw) {
      const fromLink = parseAcceptDeepLink(input.peerAcceptRaw);
      if (fromLink) {
        accept = fromLink;
      } else {
        try {
          const parsed = JSON.parse(input.peerAcceptRaw) as NfcAccept;
          if (parsed?.t === "accept") accept = parsed;
        } catch {
          // keep prior accept
        }
      }
    }
    if (!accept || accept.sid !== this.state.offer.sid) {
      throw new Error(
        "Paste or scan their Accept link first so keys can complete.",
      );
    }
    const theirPub = fromB64url(accept.epk);
    this.sessionKey = deriveNfcSessionKey({
      myPrivate: this.hostPair.privateKey,
      theirPublic: theirPub,
      myPublic: this.hostPair.publicKey,
      sid: this.state.offer.sid,
    });
    const intent = this.state.offer.intent;
    let plain: NfcPlaintext;
    if (intent === "profile_share") {
      plain = buildProfilePlaintext({
        displayName: input.displayName ?? "Litmo neighbor",
        pronouns: input.pronouns,
        bio: input.bio,
      });
    } else if (intent === "snapshot_initiate") {
      plain = buildSnapshotInitiatePlaintext({
        title: input.snapshotTitle,
        rows: input.snapshotRows ?? [],
      });
    } else {
      plain = buildKeyExchangePlaintext();
    }
    const sealed = sealNfcPayload(
      this.sessionKey,
      this.state.offer.sid,
      intent,
      plain,
    );
    const qr = buildEncryptedQr({
      kind: "nfc_sealed",
      inner: sealed,
      mode: this.qrPrivacyMode,
    });
    this.set({
      phase: "content_ready",
      peerAccept: accept,
      sealed,
      opened: plain,
      qr,
      statusNote:
        "Sealed content ready. Prefer encrypted QR → NFC tag → manual link. Still not consent to touch.",
      fallback: {
        shortCode: this.state.offer.code,
        deepLink: encodeSealedDeepLink(sealed),
        json: JSON.stringify(sealed),
        shareMessage: qr.shareMessage,
      },
    });
  }

  /**
   * Receiver: open sealed package after post-tap accept + key ready.
   */
  openSealed(raw?: string): void {
    if (!this.postTapAccepted && !this.sessionKey) {
      this.set({
        errorMessage: "Accept the invite carefully before opening content.",
      });
      return;
    }
    const sealed =
      (raw ? parseSealedDeepLink(raw) : null) ?? this.state.sealed;
    if (!sealed || !this.sessionKey) {
      // If we only have sealed + pending offer accepted, sessionKey must exist
      this.set({
        errorMessage: "Keys are not ready. Accept the offer first.",
      });
      return;
    }
    const opened = openNfcPayload(this.sessionKey, sealed);
    if (!opened) {
      this.set({
        phase: "error",
        errorMessage:
          "Could not open the package. Keys may not match or the payload was altered.",
      });
      return;
    }
    this.set({
      phase: "content_ready",
      sealed,
      opened,
      statusNote:
        "Content opened after your explicit accept. Still never consent to touch. Soft cancel anytime.",
    });
  }

  async cancel(): Promise<void> {
    await litmoNfc.invalidate();
    this.resetCrypto();
    for (const s of this.subs) s.remove();
    this.subs = [];
    void hapticService.play("softSignal");
    this.set({
      ...initial(),
      nfcHardware: this.state.nfcHardware,
      nfcWrite: this.state.nfcWrite,
      phase: "canceled",
      statusNote: "NFC connect canceled. Radio/session cleared.",
    });
  }

  private async ingestPeerAccept(
    accept: NfcAccept,
    transport: NfcTransport,
  ): Promise<void> {
    if (!this.state.offer || accept.sid !== this.state.offer.sid) {
      this.set({
        phase: "error",
        errorMessage: "Accept does not match the current offer session.",
      });
      return;
    }
    this.set({
      peerAccept: accept,
      transport,
      phase: "accepted",
      statusNote:
        "Peer accepted carefully. You can seal and send content when you are ready.",
    });
  }

  private bindEvents() {
    for (const s of this.subs) s.remove();
    this.subs = [];
    this.subs.push(
      litmoNfc.addListener("onNdefRead", (event) => {
        const payload = String(event.payload ?? "");
        if (!payload) return;
        this.ingestExternalPayload(payload, "nfc_tag");
        void hapticService.play("attention");
      }),
    );
    this.subs.push(
      litmoNfc.addListener("onNdefWrite", () => {
        this.set({
          phase: "offer_ready",
          transport: "nfc_tag",
          statusNote:
            "Invite written to tag. The other person can scan when ready. They must still Accept in Litmo.",
        });
        void hapticService.play("confirmation");
      }),
    );
    this.subs.push(
      litmoNfc.addListener("onError", (event) => {
        this.set({
          errorMessage:
            typeof event.message === "string"
              ? event.message
              : "NFC error",
        });
      }),
    );
    this.subs.push(
      litmoNfc.addListener("onSessionInvalidated", () => {
        if (this.state.phase === "reading" || this.state.phase === "writing") {
          // Stay in current logical phase if we already got a payload.
          if (!this.state.pendingOffer && this.state.phase === "reading") {
            this.set({
              phase: "idle",
              statusNote: "NFC session ended.",
            });
          } else if (this.state.phase === "writing" && !this.state.transport) {
            this.set({ phase: "offer_ready" });
          }
        }
      }),
    );
  }

  private resetCrypto() {
    this.hostPair = null;
    this.guestPair = null;
    this.sessionKey = null;
    this.postTapAccepted = false;
  }

  private fail(error: unknown) {
    const message =
      error instanceof Error ? error.message : "NFC connect failed.";
    this.set({ phase: "error", errorMessage: message });
    safeLog("nfc_error", {
      errorName: error instanceof Error ? error.name : "unknown",
    });
  }
}

export const nfcService = new NfcController();

export { intentLabel, encodeOfferDeepLink };
