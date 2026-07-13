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
    this.set({
      phase: "offer_ready",
      intent: input.intent,
      offer,
      fallback,
      pendingOffer: null,
      peerAccept: null,
      sealed: null,
      opened: null,
      statusNote: `Offer ready for ${intentLabel(input.intent)}. Write to an NFC tag, share QR/link, or show the code. A tap is never consent.`,
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
   */
  ingestExternalPayload(
    raw: string,
    transport: NfcTransport = "manual",
  ): void {
    this.postTapAccepted = false;
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
    this.set({
      phase: "key_ready",
      peerAccept: accept,
      intent: offer.intent,
      statusNote:
        "You accepted carefully. Ephemeral keys are ready. Share your accept code/link with them if they need it, or wait for sealed content.",
      fallback: {
        shortCode: offer.code,
        deepLink: encodeAcceptDeepLink(accept),
        json: JSON.stringify(accept),
        shareMessage: [
          "Litmo accept (still not consent to touch).",
          encodeAcceptDeepLink(accept),
        ].join("\n"),
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
    this.set({
      phase: "content_ready",
      peerAccept: accept,
      sealed,
      opened: plain,
      statusNote:
        "Sealed content ready. Share the sealed link, write it to a tag, or keep keys-only for key_exchange. Still not consent to touch.",
      fallback: {
        shortCode: this.state.offer.code,
        deepLink: encodeSealedDeepLink(sealed),
        json: JSON.stringify(sealed),
        shareMessage: [
          "Litmo sealed package (open only in Litmo after careful accept).",
          encodeSealedDeepLink(sealed),
        ].join("\n"),
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
