/**
 * Pure protocol constants + package types for partner quiz E2E.
 * No native modules / SecureStore — safe for offline unit tests.
 */

import type { QuizCatalogId } from "../data/quizCatalog.ts";
import type { RatchetMessage } from "./doubleRatchetCore.ts";

/** First Alice message after X3DH — establishes Bob send chain. */
export const QUIZ_E2E_SESSION_OPEN_PLAIN = JSON.stringify({
  t: "session-open",
  v: 1,
});

/**
 * AAD binds ciphertext to this invite + host public identity.
 * Wrong invite or host binding fails closed at decrypt.
 */
export function quizE2eAad(
  quizId: string,
  invitePublicId: string,
  hostIdentityPublic: string,
): string {
  return `quiz:${quizId}|${invitePublicId}|host:${hostIdentityPublic}`;
}

export type PublicBundle = {
  identityPublic: string;
  signedPrekeyPublic: string;
};

export type E2eInvitePublic = {
  v: 3;
  kind: "public-invite";
  protocol: "x3dh+double-ratchet";
  invitePublicId: string;
  quizId: QuizCatalogId;
  hostBundle: PublicBundle;
  createdAt: string;
};

export type E2ePeerHandshakePackage = {
  v: 3;
  kind: "peer-handshake";
  protocol: "x3dh+double-ratchet";
  invitePublicId: string;
  quizId: QuizCatalogId;
  peerIdentityPublic: string;
  peerEphemeralPublic: string;
  /** First Alice ciphertext — establishes host send chain. Not a quiz result. */
  sessionOpen: RatchetMessage;
};

export type E2eResultPackage = {
  v: 3;
  kind: "result";
  protocol: "x3dh+double-ratchet";
  invitePublicId: string;
  quizId: QuizCatalogId;
  role: "host" | "peer";
  consentToShare: boolean;
  consentToCompare: boolean;
  message: RatchetMessage;
  handshake?: Omit<E2ePeerHandshakePackage, "v" | "kind" | "protocol">;
};
