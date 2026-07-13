/**
 * Partner quiz-share core: mutual consent before comparison.
 *
 * Safety:
 * - Quiz comparison is never consent to touch.
 * - Both parties must explicitly consent before any comparison is allowed.
 * - Ciphertext is produced by X3DH + Double Ratchet (`quizE2eSession`);
 *   this module holds consent gates and comparison copy only.
 * - Plaintext weather stays device-local after decrypt; never re-exported in clear.
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
  protocol: "e2e-v3";
  /** Local role on this device. */
  role: "host" | "peer";
  createdAt: string;
  /** Local participant consented to share their sealed result into this invite. */
  hostConsentToShare: boolean;
  /** Local participant consented to compare once both sides are present. */
  hostConsentToCompare: boolean;
  /** Partner mirrored consents when package imported / decrypted. */
  peerConsentToShare: boolean;
  peerConsentToCompare: boolean;
  /** Device-local plaintext after local share or successful decrypt. Never upload. */
  hostResult: ShareableQuizResult | null;
  peerResult: ShareableQuizResult | null;
  /**
   * Opaque outbound ciphertext packages (JSON of E2eResultPackage) for re-export
   * or optional Supabase relay. Contains no private keys.
   */
  hostCipherPackage: string | null;
  peerCipherPackage: string | null;
  /** Host public invite JSON (public keys only) for peer join. */
  publicInvitePackage: string | null;
  /** Peer handshake stored until first result package is exported. */
  peerHandshakePackage: string | null;
  /** True after local ratchet session is established. */
  sessionReady: boolean;
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

export function createInvite(
  quizId: QuizCatalogId,
  inviteId: string,
  role: "host" | "peer",
  nowIso: string,
  publicInvitePackage: string | null = null,
): QuizInvite {
  return {
    id: inviteId,
    quizId,
    protocol: "e2e-v3",
    role,
    createdAt: nowIso,
    hostConsentToShare: false,
    hostConsentToCompare: false,
    peerConsentToShare: false,
    peerConsentToCompare: false,
    hostResult: null,
    peerResult: null,
    hostCipherPackage: null,
    peerCipherPackage: null,
    publicInvitePackage,
    peerHandshakePackage: null,
    sessionReady: role === "host" ? false : false,
  };
}

/**
 * Local share consent for the person on this device.
 * Host role writes hostResult; peer role writes peerResult.
 * Fail closed: consent cannot stick without a plaintext result present.
 */
export function withLocalShareConsent(
  invite: QuizInvite,
  consent: boolean,
  result: ShareableQuizResult | null,
  cipherPackage: string | null,
): QuizInvite {
  const effective = consent && result !== null && cipherPackage !== null;
  if (invite.role === "host") {
    return {
      ...invite,
      hostConsentToShare: effective,
      hostResult: effective ? result : null,
      hostCipherPackage: effective ? cipherPackage : null,
    };
  }
  return {
    ...invite,
    // On peer device, "hostConsent*" fields mean *this local user's* consents
    // for UI consistency: local share/compare always use hostConsent* as "mine".
    hostConsentToShare: effective,
    hostResult: effective ? result : null,
    hostCipherPackage: effective ? cipherPackage : null,
  };
}

/**
 * Record partner share after successful decrypt.
 * Partner lands in peer* fields on this device.
 */
export function withPartnerShare(
  invite: QuizInvite,
  partner: {
    result: ShareableQuizResult;
    consentToShare: boolean;
    consentToCompare: boolean;
    cipherPackage: string | null;
  },
): QuizInvite | { error: string } {
  if (!partner.consentToShare) {
    return {
      error: "Partner has not consented to share a result for this invite.",
    };
  }
  if (partner.result.quizId !== invite.quizId) {
    return { error: "Partner result is for a different quiz." };
  }
  return {
    ...invite,
    peerConsentToShare: true,
    peerConsentToCompare: partner.consentToCompare,
    peerResult: partner.result,
    peerCipherPackage: partner.cipherPackage,
  };
}

export function withLocalCompareConsent(
  invite: QuizInvite,
  consent: boolean,
): QuizInvite {
  return { ...invite, hostConsentToCompare: consent };
}

export function canCompare(invite: QuizInvite): boolean {
  return (
    invite.hostConsentToShare &&
    invite.hostConsentToCompare &&
    invite.peerConsentToShare &&
    invite.peerConsentToCompare &&
    invite.hostResult !== null &&
    invite.peerResult !== null
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
  if (!invite.hostResult || !invite.peerResult) {
    return { error: "Results could not be opened. Fail closed." };
  }
  // On peer device, hostResult is local weather and peerResult is partner —
  // comparison is symmetric for notes.
  return buildComparison(invite.hostResult, invite.peerResult);
}

function friendlyArchetype(id: ArchetypeId): string {
  switch (id) {
    case "hearth":
      return "Gentle Hearth";
    case "lantern":
      return "Wandering Lantern";
    case "tidepool":
      return "Quiet Tidepool";
  }
}

export function buildComparison(
  host: ShareableQuizResult,
  peer: ShareableQuizResult,
): QuizComparison {
  const notes: ComparisonNote[] = [];
  if (host.primary === peer.primary) {
    notes.push({
      kind: "same-primary",
      text: `You both landed near “${friendlyArchetype(host.primary)}” weather. That can start a conversation — never a rule about closeness or touch.`,
    });
  } else {
    notes.push({
      kind: "different-primary",
      text: `Different primary weather (${friendlyArchetype(host.primary)} · ${friendlyArchetype(peer.primary)}). Difference is ordinary and never blocks care or requires closeness.`,
    });
  }
  notes.push({
    kind: "mix",
    text: `Soft mix only — you: Hearth ${host.mixPercent.hearth}% · Lantern ${host.mixPercent.lantern}% · Tidepool ${host.mixPercent.tidepool}%. Them: Hearth ${peer.mixPercent.hearth}% · Lantern ${peer.mixPercent.lantern}% · Tidepool ${peer.mixPercent.tidepool}%. Percentages are playful weights, not ranks.`,
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

/** @deprecated Legacy XOR seal — retained only for historical test vectors. Prefer E2E. */
export type SealedQuizResult = {
  v: 1;
  quizId: QuizCatalogId;
  ciphertext: string;
  mac: string;
};

/** @deprecated Prefer Double Ratchet packages. */
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

/** @deprecated Prefer quizE2eSession.encryptResult. */
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

/** @deprecated Prefer quizE2eSession.decryptResult. */
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
