/**
 * Demo-only fictional partner for single-device partner-invite walkthrough.
 *
 * Builds a real X3DH + Double Ratchet peer package against a host public invite
 * using ephemeral keys in memory (not the device identity). Host still decrypts
 * with device-local keys. Never available as a production "skip consent" path —
 * comparison still requires the human's share + compare consents on device.
 *
 * Constitution: fictional weather is educational only — never consent or safety.
 */

import type { QuizCatalogId } from "../data/quizCatalog.ts";
import {
  generateX25519KeyPair,
  initRatchetAsAlice,
  ratchetEncrypt,
  x3dhAsInitiator,
} from "./doubleRatchetCore.ts";
import {
  QUIZ_E2E_SESSION_OPEN_PLAIN,
  quizE2eAad,
  type E2eInvitePublic,
  type E2eResultPackage,
} from "./quizE2eProtocol.ts";
import type { ShareableQuizResult } from "./quizShareCore.ts";

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

/** Gentle fictional peer weather for demo comparison practice. */
export function fictionalPeerResult(
  quizId: QuizCatalogId,
  nowIso: string = new Date().toISOString(),
): ShareableQuizResult {
  return {
    quizId,
    primary: "lantern",
    secondary: "hearth",
    mixPercent: { hearth: 28, lantern: 48, tidepool: 24 },
    completedAt: nowIso,
    notes: [
      "Fictional demo partner — educational only, not a real person.",
      "Their soft notes never grant consent to touch.",
    ],
  };
}

/**
 * Pure: build an encrypted peer contribution package for a host public invite.
 * Fails closed if invite material is incomplete.
 */
export function buildDemoPeerResultPackage(
  invite: E2eInvitePublic,
  peerResult: ShareableQuizResult,
  options: { consentToCompare?: boolean } = {},
): E2eResultPackage | { error: string } {
  if (invite.v !== 3 || invite.kind !== "public-invite") {
    return { error: "Need a v3 public invite to practice with." };
  }
  if (invite.protocol !== "x3dh+double-ratchet") {
    return { error: "Unsupported invite protocol." };
  }
  if (peerResult.quizId !== invite.quizId) {
    return { error: "Fictional result quiz does not match invite." };
  }
  if (
    !invite.hostBundle?.identityPublic ||
    !invite.hostBundle?.signedPrekeyPublic
  ) {
    return { error: "Invite is missing host public keys." };
  }

  try {
    const peerIk = generateX25519KeyPair();
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
    const aad = quizE2eAad(
      invite.quizId,
      invite.invitePublicId,
      invite.hostBundle.identityPublic,
    );
    const open = ratchetEncrypt(alice, QUIZ_E2E_SESSION_OPEN_PLAIN, aad);
    alice = open.state;
    const sealed = ratchetEncrypt(alice, JSON.stringify(peerResult), aad);

    return {
      v: 3,
      kind: "result",
      protocol: "x3dh+double-ratchet",
      invitePublicId: invite.invitePublicId,
      quizId: invite.quizId,
      role: "peer",
      consentToShare: true,
      consentToCompare: options.consentToCompare !== false,
      message: sealed.message,
      handshake: {
        invitePublicId: invite.invitePublicId,
        quizId: invite.quizId,
        peerIdentityPublic: bytesToB64url(peerIk.publicKey),
        peerEphemeralPublic: bytesToB64url(peerEk.publicKey),
        sessionOpen: open.message,
      },
    };
  } catch {
    return { error: "Could not build demo peer package. Fail closed." };
  }
}
