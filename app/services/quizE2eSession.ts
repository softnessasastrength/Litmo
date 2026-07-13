/**
 * E2E session orchestration for partner quiz packages (X3DH + Double Ratchet).
 *
 * Flow (Signal-style initiator-first):
 * 1. Host publishes public identity + signed prekey (no secrets).
 * 2. Peer runs X3DH as initiator, opens Alice ratchet, sends session-open + optional result.
 * 3. Host accepts hello, decrypts session-open (establishes Bob send chain), then can reply.
 *
 * Plaintext quiz weather never leaves the device unsealed. Supabase (if used) only relays
 * opaque ciphertext packages.
 */

import type { QuizCatalogId } from "../data/quizCatalog.ts";
import type { ShareableQuizResult } from "./quizShareCore.ts";
import {
  generateX25519KeyPair,
  initRatchetAsAlice,
  initRatchetAsBob,
  ratchetDecrypt,
  ratchetEncrypt,
  serializeState,
  parseState,
  x3dhAsInitiator,
  x3dhAsResponder,
  type DoubleRatchetState,
  type RatchetMessage,
} from "./doubleRatchetCore.ts";
import {
  quizE2eIdentity,
  unwrapSecretBlob,
  wrapSecretBlob,
} from "./quizE2eIdentity.ts";
import {
  QUIZ_E2E_SESSION_OPEN_PLAIN,
  quizE2eAad,
  type E2eInvitePublic,
  type E2ePeerHandshakePackage,
  type E2eResultPackage,
} from "./quizE2eProtocol.ts";
import * as SecureStore from "expo-secure-store";

export {
  QUIZ_E2E_SESSION_OPEN_PLAIN,
  quizE2eAad,
  type E2eInvitePublic,
  type E2ePeerHandshakePackage,
  type E2eResultPackage,
  type PublicBundle,
} from "./quizE2eProtocol.ts";

const RATCHET_PREFIX = "litmo.quiz.e2e.ratchet.";
const RATCHET_META_PREFIX = "litmo.quiz.e2e.ratchet.meta.";
const SESSION_OPEN_PLAIN = QUIZ_E2E_SESSION_OPEN_PLAIN;

type RatchetStored = {
  vaultWrapped: boolean;
  blob: string;
};

type RatchetMeta = {
  /** Host identity public — binds AAD so only this invite session decrypts. */
  hostIdentityPublic: string;
  hostSignedPrekeyPublic: string;
};

function b64urlToBytes(s: string): Uint8Array {
  const pad = s.length % 4 === 0 ? "" : "=".repeat(4 - (s.length % 4));
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/") + pad;
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function bytesToB64url(bytes: Uint8Array): string {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

const SECURE_OPTS = {
  keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
} as never;

async function saveRatchetMeta(
  invitePublicId: string,
  meta: RatchetMeta,
): Promise<void> {
  await SecureStore.setItemAsync(
    RATCHET_META_PREFIX + invitePublicId,
    JSON.stringify(meta),
    SECURE_OPTS,
  );
}

async function loadRatchetMeta(
  invitePublicId: string,
): Promise<RatchetMeta | null> {
  const raw = await SecureStore.getItemAsync(
    RATCHET_META_PREFIX + invitePublicId,
  );
  if (!raw) return null;
  try {
    return JSON.parse(raw) as RatchetMeta;
  } catch {
    return null;
  }
}

async function saveRatchet(
  invitePublicId: string,
  state: DoubleRatchetState,
): Promise<void> {
  const plain = serializeState(state);
  const wrapped = await wrapSecretBlob(plain, "quiz-e2e-ratchet");
  const stored: RatchetStored = {
    vaultWrapped: wrapped.vaultWrapped,
    blob: wrapped.blob,
  };
  await SecureStore.setItemAsync(
    RATCHET_PREFIX + invitePublicId,
    JSON.stringify(stored),
    SECURE_OPTS,
  );
}

async function loadRatchet(
  invitePublicId: string,
): Promise<DoubleRatchetState | null> {
  const raw = await SecureStore.getItemAsync(RATCHET_PREFIX + invitePublicId);
  if (!raw) return null;
  try {
    // v3 envelope (vault-wrapped or plain blob)
    const stored = JSON.parse(raw) as RatchetStored | DoubleRatchetState;
    if ("blob" in stored && typeof stored.blob === "string") {
      const plain = await unwrapSecretBlob(
        stored.blob,
        Boolean(stored.vaultWrapped),
        "quiz-e2e-ratchet",
      );
      if (!plain) return null;
      return parseState(plain);
    }
    // Legacy unwrapped DoubleRatchetState JSON
    return parseState(raw);
  } catch {
    return parseState(raw);
  }
}

async function aadForInvite(
  quizId: string,
  invitePublicId: string,
): Promise<string | null> {
  const meta = await loadRatchetMeta(invitePublicId);
  if (!meta?.hostIdentityPublic) return null;
  return quizE2eAad(quizId, invitePublicId, meta.hostIdentityPublic);
}

export const quizE2eSession = {
  /**
   * Host: create public invite material (identity + signed prekey only).
   */
  async createHostInvite(
    quizId: QuizCatalogId,
    invitePublicId: string,
  ): Promise<E2eInvitePublic> {
    const hostBundle = await quizE2eIdentity.getPublicBundle();
    // Bind this invite id to the host's current public keys for later accept.
    await saveRatchetMeta(invitePublicId, {
      hostIdentityPublic: hostBundle.identityPublic,
      hostSignedPrekeyPublic: hostBundle.signedPrekeyPublic,
    });
    return {
      v: 3,
      kind: "public-invite",
      protocol: "x3dh+double-ratchet",
      invitePublicId,
      quizId,
      hostBundle,
      createdAt: new Date().toISOString(),
    };
  },

  /**
   * Peer: join host invite, run X3DH as initiator, open Alice ratchet, emit session-open.
   * Only this peer device holds Alice's ratchet — outsiders cannot decrypt later results.
   */
  async joinAsPeer(
    invite: E2eInvitePublic,
  ): Promise<{ handshake: E2ePeerHandshakePackage } | { error: string }> {
    if (invite.v !== 3 || invite.kind !== "public-invite") {
      return { error: "Unsupported invite package." };
    }
    if (invite.protocol !== "x3dh+double-ratchet") {
      return { error: "Unsupported invite protocol." };
    }
    if (
      !invite.hostBundle.identityPublic ||
      !invite.hostBundle.signedPrekeyPublic
    ) {
      return { error: "Invite is missing host public keys. Fail closed." };
    }
    try {
      const peerIk = await quizE2eIdentity.getIdentityPair();
      const peerEk = generateX25519KeyPair();
      const shared = x3dhAsInitiator({
        identityPrivateA: peerIk.privateKey,
        ephemeralPrivateA: peerEk.privateKey,
        identityPublicB: b64urlToBytes(invite.hostBundle.identityPublic),
        signedPrekeyPublicB: b64urlToBytes(
          invite.hostBundle.signedPrekeyPublic,
        ),
      });
      let alice = initRatchetAsAlice(
        shared,
        b64urlToBytes(invite.hostBundle.signedPrekeyPublic),
      );
      await saveRatchetMeta(invite.invitePublicId, {
        hostIdentityPublic: invite.hostBundle.identityPublic,
        hostSignedPrekeyPublic: invite.hostBundle.signedPrekeyPublic,
      });
      const aad = quizE2eAad(
        invite.quizId,
        invite.invitePublicId,
        invite.hostBundle.identityPublic,
      );
      const open = ratchetEncrypt(alice, SESSION_OPEN_PLAIN, aad);
      alice = open.state;
      await saveRatchet(invite.invitePublicId, alice);
      return {
        handshake: {
          v: 3,
          kind: "peer-handshake",
          protocol: "x3dh+double-ratchet",
          invitePublicId: invite.invitePublicId,
          quizId: invite.quizId,
          peerIdentityPublic: bytesToB64url(peerIk.publicKey),
          peerEphemeralPublic: bytesToB64url(peerEk.publicKey),
          sessionOpen: open.message,
        },
      };
    } catch {
      return { error: "Could not open encryption session. Fail closed." };
    }
  },

  /**
   * Host: accept peer handshake (X3DH responder + decrypt session-open → send chain ready).
   * Requires this device to hold the host private keys matching the invite public bundle.
   */
  async hostAcceptHandshake(
    invite: E2eInvitePublic,
    handshake: {
      invitePublicId: string;
      quizId: QuizCatalogId;
      peerIdentityPublic: string;
      peerEphemeralPublic: string;
      sessionOpen: RatchetMessage;
    },
  ): Promise<{ ok: true } | { error: string }> {
    if (handshake.invitePublicId !== invite.invitePublicId) {
      return { error: "Invite id mismatch." };
    }
    if (handshake.quizId !== invite.quizId) {
      return { error: "Quiz id mismatch." };
    }
    try {
      const hostIk = await quizE2eIdentity.getIdentityPair();
      const hostSpk = await quizE2eIdentity.getSignedPrekeyPair();
      // Fail closed if this device is not the invite host (wrong private keys).
      const localIkPub = bytesToB64url(hostIk.publicKey);
      const localSpkPub = bytesToB64url(hostSpk.publicKey);
      if (
        localIkPub !== invite.hostBundle.identityPublic ||
        localSpkPub !== invite.hostBundle.signedPrekeyPublic
      ) {
        return {
          error:
            "This device is not the invite host. Only the device that created the invite can open partner packages.",
        };
      }
      const shared = x3dhAsResponder({
        identityPrivateB: hostIk.privateKey,
        signedPrekeyPrivateB: hostSpk.privateKey,
        identityPublicA: b64urlToBytes(handshake.peerIdentityPublic),
        ephemeralPublicA: b64urlToBytes(handshake.peerEphemeralPublic),
      });
      let bob = initRatchetAsBob(shared, hostSpk);
      const openMsg = handshake.sessionOpen;
      if (!openMsg) {
        return {
          error:
            "Peer handshake missing session-open. Ask them to re-join and resend.",
        };
      }
      await saveRatchetMeta(invite.invitePublicId, {
        hostIdentityPublic: invite.hostBundle.identityPublic,
        hostSignedPrekeyPublic: invite.hostBundle.signedPrekeyPublic,
      });
      const aad = quizE2eAad(
        invite.quizId,
        invite.invitePublicId,
        invite.hostBundle.identityPublic,
      );
      const dec = ratchetDecrypt(bob, openMsg, aad);
      if (!dec || dec.plaintext !== SESSION_OPEN_PLAIN) {
        return {
          error: "Session-open decrypt failed. Wrong keys or tampered package.",
        };
      }
      bob = dec.state;
      if (!bob.chainKeySend) {
        return { error: "Send chain not established. Fail closed." };
      }
      await saveRatchet(invite.invitePublicId, bob);
      return { ok: true };
    } catch {
      return { error: "Could not accept peer handshake. Fail closed." };
    }
  },

  /**
   * Encrypt a shareable result. Peer (Alice) can encrypt after join.
   * Host (Bob) can encrypt after accepting peer handshake (session-open).
   */
  async encryptResult(params: {
    invitePublicId: string;
    quizId: QuizCatalogId;
    role: "host" | "peer";
    result: ShareableQuizResult;
    consentToShare: boolean;
    consentToCompare: boolean;
    /** When peer exports first package, embed handshake for one-paste host import. */
    embedHandshake?: E2ePeerHandshakePackage;
  }): Promise<E2eResultPackage | { error: string }> {
    if (!params.consentToShare) {
      return { error: "Share consent required before sealing a result." };
    }
    if (params.result.quizId !== params.quizId) {
      return { error: "Result quiz id mismatch." };
    }
    const state = await loadRatchet(params.invitePublicId);
    if (!state) {
      return {
        error:
          "Encryption session not ready. Join or accept the invite first. Fail closed.",
      };
    }
    if (!state.chainKeySend) {
      return {
        error:
          "Sending chain not ready. Hosts need the partner handshake first; peers need to re-join the invite.",
      };
    }
    const aad = await aadForInvite(params.quizId, params.invitePublicId);
    if (!aad) {
      return {
        error: "Missing invite binding. Re-join or recreate the invite.",
      };
    }
    try {
      const { state: next, message } = ratchetEncrypt(
        state,
        JSON.stringify(params.result),
        aad,
      );
      await saveRatchet(params.invitePublicId, next);
      const pack: E2eResultPackage = {
        v: 3,
        kind: "result",
        protocol: "x3dh+double-ratchet",
        invitePublicId: params.invitePublicId,
        quizId: params.quizId,
        role: params.role,
        consentToShare: true,
        consentToCompare: params.consentToCompare,
        message,
      };
      if (params.embedHandshake && params.role === "peer") {
        pack.handshake = {
          invitePublicId: params.embedHandshake.invitePublicId,
          quizId: params.embedHandshake.quizId,
          peerIdentityPublic: params.embedHandshake.peerIdentityPublic,
          peerEphemeralPublic: params.embedHandshake.peerEphemeralPublic,
          sessionOpen: params.embedHandshake.sessionOpen,
        };
      }
      return pack;
    } catch {
      return { error: "Could not encrypt result. Fail closed." };
    }
  },

  async decryptResult(params: {
    invitePublicId: string;
    quizId: QuizCatalogId;
    envelope: E2eResultPackage;
  }): Promise<
    | { result: ShareableQuizResult; consentToCompare: boolean }
    | { error: string }
  > {
    if (params.envelope.v !== 3 || params.envelope.kind !== "result") {
      return { error: "Unsupported package version." };
    }
    if (params.envelope.protocol !== "x3dh+double-ratchet") {
      return { error: "Unsupported package protocol." };
    }
    if (!params.envelope.consentToShare) {
      return { error: "Sender did not consent to share." };
    }
    if (params.envelope.quizId !== params.quizId) {
      return { error: "Quiz mismatch." };
    }
    if (params.envelope.invitePublicId !== params.invitePublicId) {
      return { error: "Invite id mismatch." };
    }
    const state = await loadRatchet(params.invitePublicId);
    if (!state) {
      return {
        error:
          "No local ratchet session. Only the invited partner device that joined this invite can decrypt.",
      };
    }
    const aad = await aadForInvite(params.quizId, params.invitePublicId);
    if (!aad) {
      return { error: "Missing invite binding. Fail closed." };
    }
    const dec = ratchetDecrypt(state, params.envelope.message, aad);
    if (!dec) {
      return {
        error:
          "Decrypt failed. Wrong partner, wrong invite, or tampered package.",
      };
    }
    // Reject control messages used as results
    if (dec.plaintext === SESSION_OPEN_PLAIN) {
      return { error: "Package is a session handshake, not a quiz result." };
    }
    await saveRatchet(params.invitePublicId, dec.state);
    try {
      const result = JSON.parse(dec.plaintext) as ShareableQuizResult;
      if (result.quizId !== params.quizId) {
        return { error: "Plaintext quiz id mismatch." };
      }
      return {
        result,
        consentToCompare: params.envelope.consentToCompare,
      };
    } catch {
      return { error: "Plaintext was not valid result JSON." };
    }
  },

  async hasSendChain(invitePublicId: string): Promise<boolean> {
    const state = await loadRatchet(invitePublicId);
    return Boolean(state?.chainKeySend);
  },

  async clearSession(invitePublicId: string): Promise<void> {
    await SecureStore.deleteItemAsync(RATCHET_PREFIX + invitePublicId);
    await SecureStore.deleteItemAsync(RATCHET_META_PREFIX + invitePublicId);
  },
};

/** Pure helpers for package JSON (no SecureStore). */
export function parseE2ePackage(
  raw: string,
):
  | E2eInvitePublic
  | E2ePeerHandshakePackage
  | E2eResultPackage
  | { error: string } {
  try {
    const parsed = JSON.parse(raw) as { v?: number; kind?: string };
    if (parsed.v !== 3 || !parsed.kind) {
      return {
        error:
          "This package is not a v3 encrypted invite. Ask your partner for a fresh E2E package.",
      };
    }
    if (parsed.kind === "public-invite") {
      const inv = parsed as E2eInvitePublic;
      if (
        !inv.invitePublicId ||
        !inv.quizId ||
        !inv.hostBundle?.identityPublic ||
        !inv.hostBundle?.signedPrekeyPublic
      ) {
        return { error: "Public invite package is incomplete." };
      }
      return inv;
    }
    if (parsed.kind === "peer-handshake") {
      const hs = parsed as E2ePeerHandshakePackage;
      if (
        !hs.invitePublicId ||
        !hs.sessionOpen ||
        !hs.peerIdentityPublic ||
        !hs.peerEphemeralPublic
      ) {
        return { error: "Peer handshake package is incomplete." };
      }
      return hs;
    }
    if (parsed.kind === "result") {
      const res = parsed as E2eResultPackage;
      if (!res.invitePublicId || !res.message || !res.quizId) {
        return { error: "Result package is incomplete." };
      }
      return res;
    }
    return { error: "Unknown E2E package kind." };
  } catch {
    return { error: "Package is not valid JSON." };
  }
}
