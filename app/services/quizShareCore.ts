/**
 * Partner quiz-share core: mutual consent before comparison, sealed payloads.
 *
 * Safety:
 * - Quiz comparison is never consent to touch.
 * - Both parties must explicitly consent before any comparison is allowed.
 * - Seal key stays with the invite; results are not readable without it.
 */

import type { ArchetypeId } from "../data/quiz.ts";
import type { QuizCatalogId } from "../data/quizCatalog.ts";

export type ShareableQuizResult = {
  quizId: QuizCatalogId;
  primary: ArchetypeId;
  secondary: ArchetypeId | null;
  mixPercent: { hearth: number; lantern: number; tidepool: number };
  completedAt: string;
  /** Short notes only — never private free text. */
  notes: string[];
};

export type QuizInvite = {
  id: string;
  quizId: QuizCatalogId;
  /** High-entropy seal material; required to open sealed results. */
  sealKey: string;
  createdAt: string;
  /** Local participant consented to share their sealed result into this invite. */
  hostConsentToShare: boolean;
  /** Local participant consented to compare once both sides are present. */
  hostConsentToCompare: boolean;
  /** Peer mirrored consents when package imported. */
  peerConsentToShare: boolean;
  peerConsentToCompare: boolean;
  hostSealed: SealedQuizResult | null;
  peerSealed: SealedQuizResult | null;
};

export type SealedQuizResult = {
  v: 1;
  quizId: QuizCatalogId;
  /** Base64 ciphertext */
  ciphertext: string;
  /** Base64 HMAC */
  mac: string;
};

export type ComparisonNote = {
  kind: "same-primary" | "different-primary" | "mix" | "safety";
  text: string;
};

export type QuizComparison = {
  quizId: QuizCatalogId;
  host: ShareableQuizResult;
  peer: ShareableQuizResult;
  notes: ComparisonNote[];
  /** Hard-coded product safety line. */
  consentReminder: string;
};

const CONSENT_REMINDER =
  "Shared quiz weather is for conversation only. It is never consent to touch, proof of safety, or a substitute for a current Consent Snapshot.";

function bytesToB64(bytes: Uint8Array): string {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s);
}

function b64ToBytes(b64: string): Uint8Array {
  const s = atob(b64);
  const out = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i);
  return out;
}

/** Deterministic stream from seal key + nonce label (pure, testable). */
export function deriveStream(sealKey: string, length: number): Uint8Array {
  const out = new Uint8Array(length);
  let state = 0;
  for (let i = 0; i < sealKey.length; i++) {
    state = (state * 33 + sealKey.charCodeAt(i)) >>> 0;
  }
  for (let i = 0; i < length; i++) {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    out[i] = state & 0xff;
  }
  return out;
}

export function sealResult(
  result: ShareableQuizResult,
  sealKey: string,
): SealedQuizResult {
  const plain = new TextEncoder().encode(JSON.stringify(result));
  const stream = deriveStream(sealKey + ":seal", plain.length);
  const cipher = new Uint8Array(plain.length);
  for (let i = 0; i < plain.length; i++) cipher[i] = plain[i]! ^ stream[i]!;
  const macStream = deriveStream(sealKey + ":mac", 32);
  const mac = new Uint8Array(32);
  for (let i = 0; i < 32; i++) {
    mac[i] = macStream[i]! ^ cipher[i % cipher.length]!;
  }
  return {
    v: 1,
    quizId: result.quizId,
    ciphertext: bytesToB64(cipher),
    mac: bytesToB64(mac),
  };
}

export function openSealed(
  sealed: SealedQuizResult,
  sealKey: string,
): ShareableQuizResult | null {
  try {
    const cipher = b64ToBytes(sealed.ciphertext);
    const mac = b64ToBytes(sealed.mac);
    const macStream = deriveStream(sealKey + ":mac", 32);
    const expect = new Uint8Array(32);
    for (let i = 0; i < 32; i++) {
      expect[i] = macStream[i]! ^ cipher[i % cipher.length]!;
    }
    if (mac.length !== 32) return null;
    let ok = 0;
    for (let i = 0; i < 32; i++) ok |= mac[i]! ^ expect[i]!;
    if (ok !== 0) return null;
    const stream = deriveStream(sealKey + ":seal", cipher.length);
    const plain = new Uint8Array(cipher.length);
    for (let i = 0; i < cipher.length; i++) plain[i] = cipher[i]! ^ stream[i]!;
    const parsed = JSON.parse(
      new TextDecoder().decode(plain),
    ) as ShareableQuizResult;
    if (parsed.quizId !== sealed.quizId) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function createInvite(
  quizId: QuizCatalogId,
  inviteId: string,
  sealKey: string,
  nowIso: string,
): QuizInvite {
  return {
    id: inviteId,
    quizId,
    sealKey,
    createdAt: nowIso,
    hostConsentToShare: false,
    hostConsentToCompare: false,
    peerConsentToShare: false,
    peerConsentToCompare: false,
    hostSealed: null,
    peerSealed: null,
  };
}

export function withHostShareConsent(
  invite: QuizInvite,
  consent: boolean,
  sealed: SealedQuizResult | null,
): QuizInvite {
  return {
    ...invite,
    hostConsentToShare: consent,
    hostSealed: consent ? sealed : null,
  };
}

export function withHostCompareConsent(
  invite: QuizInvite,
  consent: boolean,
): QuizInvite {
  return { ...invite, hostConsentToCompare: consent };
}

export function importPeerPackage(
  invite: QuizInvite,
  peer: {
    sealed: SealedQuizResult;
    consentToShare: boolean;
    consentToCompare: boolean;
  },
): QuizInvite | { error: string } {
  if (!peer.consentToShare) {
    return {
      error: "Peer has not consented to share a result for this invite.",
    };
  }
  if (peer.sealed.quizId !== invite.quizId) {
    return { error: "Peer result is for a different quiz." };
  }
  if (!openSealed(peer.sealed, invite.sealKey)) {
    return {
      error: "Could not open peer result with this invite seal. Fail closed.",
    };
  }
  return {
    ...invite,
    peerConsentToShare: true,
    peerConsentToCompare: peer.consentToCompare,
    peerSealed: peer.sealed,
  };
}

export function canCompare(invite: QuizInvite): boolean {
  return (
    invite.hostConsentToShare &&
    invite.hostConsentToCompare &&
    invite.peerConsentToShare &&
    invite.peerConsentToCompare &&
    invite.hostSealed !== null &&
    invite.peerSealed !== null
  );
}

export function compareInvite(
  invite: QuizInvite,
): QuizComparison | { error: string } {
  if (!canCompare(invite)) {
    return {
      error:
        "Comparison stays closed until both people consent to share and to compare.",
    };
  }
  const host = openSealed(invite.hostSealed!, invite.sealKey);
  const peer = openSealed(invite.peerSealed!, invite.sealKey);
  if (!host || !peer) {
    return { error: "Sealed results could not be opened. Fail closed." };
  }
  return buildComparison(host, peer);
}

export function buildComparison(
  host: ShareableQuizResult,
  peer: ShareableQuizResult,
): QuizComparison {
  const notes: ComparisonNote[] = [];
  if (host.primary === peer.primary) {
    notes.push({
      kind: "same-primary",
      text: `You both landed near “${host.primary}” weather. That can be a conversation starter — never a rule.`,
    });
  } else {
    notes.push({
      kind: "different-primary",
      text: `Different primary weather (${host.primary} · ${peer.primary}). Difference is ordinary and never blocks care or requires closeness.`,
    });
  }
  notes.push({
    kind: "mix",
    text: `Mix snapshot — you: H${host.mixPercent.hearth}/L${host.mixPercent.lantern}/T${host.mixPercent.tidepool}; them: H${peer.mixPercent.hearth}/L${peer.mixPercent.lantern}/T${peer.mixPercent.tidepool}. Soft percentages only.`,
  });
  notes.push({
    kind: "safety",
    text: CONSENT_REMINDER,
  });
  return {
    quizId: host.quizId,
    host,
    peer,
    notes,
    consentReminder: CONSENT_REMINDER,
  };
}

export type PortableInvitePackage = {
  v: 1;
  inviteId: string;
  quizId: QuizCatalogId;
  sealKey: string;
  sealed: SealedQuizResult | null;
  consentToShare: boolean;
  consentToCompare: boolean;
};

export function exportHostPackage(invite: QuizInvite): PortableInvitePackage {
  return {
    v: 1,
    inviteId: invite.id,
    quizId: invite.quizId,
    sealKey: invite.sealKey,
    sealed: invite.hostConsentToShare ? invite.hostSealed : null,
    consentToShare: invite.hostConsentToShare,
    consentToCompare: invite.hostConsentToCompare,
  };
}

export function parsePortablePackage(
  raw: string,
): PortableInvitePackage | { error: string } {
  try {
    const parsed = JSON.parse(raw) as PortableInvitePackage;
    if (
      parsed.v !== 1 ||
      !parsed.inviteId ||
      !parsed.sealKey ||
      !parsed.quizId
    ) {
      return { error: "Invite package is incomplete." };
    }
    return parsed;
  } catch {
    return { error: "Invite package is not valid JSON." };
  }
}
