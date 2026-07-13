/**
 * Device-local partner quiz invites with E2E (X3DH + Double Ratchet).
 * Private keys and ratchet state stay in Secure Store; packages never include seal keys.
 */

import * as SecureStore from "expo-secure-store";
import type { QuizCatalogId } from "../data/quizCatalog.ts";
import {
  canCompare,
  compareInvite,
  createInvite,
  type QuizInvite,
  type ShareableQuizResult,
  withLocalCompareConsent,
  withLocalShareConsent,
  withPartnerShare,
} from "./quizShareCore.ts";
import {
  parseE2ePackage,
  quizE2eSession,
  type E2eInvitePublic,
  type E2ePeerHandshakePackage,
  type E2eResultPackage,
} from "./quizE2eSession.ts";

const STORAGE_KEY = "litmo.quizzes.invites.v2";

async function loadAll(): Promise<QuizInvite[]> {
  const raw = await SecureStore.getItemAsync(STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as QuizInvite[];
    if (!Array.isArray(parsed)) return [];
    // Drop legacy v1 invites that still carry sealKey
    return parsed.filter(
      (i) => i && i.protocol === "e2e-v3" && typeof i.id === "string",
    );
  } catch {
    return [];
  }
}

async function saveAll(invites: QuizInvite[]): Promise<void> {
  await SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(invites), {
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  } as never);
}

function randomId(): string {
  return `inv_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

function toShareable(
  result: {
    quizId: QuizCatalogId;
    primary: ShareableQuizResult["primary"];
    secondary: ShareableQuizResult["secondary"];
    mixPercent: ShareableQuizResult["mixPercent"];
    completedAt: string;
    notes: string[];
  },
): ShareableQuizResult {
  return {
    quizId: result.quizId,
    primary: result.primary,
    secondary: result.secondary,
    mixPercent: result.mixPercent,
    completedAt: result.completedAt,
    notes: result.notes.slice(0, 5),
  };
}

export const quizInviteStore = {
  async list(): Promise<QuizInvite[]> {
    return loadAll();
  },

  async get(id: string): Promise<QuizInvite | null> {
    const all = await loadAll();
    return all.find((i) => i.id === id) ?? null;
  },

  async update(invite: QuizInvite): Promise<QuizInvite> {
    const all = await loadAll();
    const next = all.map((i) => (i.id === invite.id ? invite : i));
    if (!next.some((i) => i.id === invite.id)) next.unshift(invite);
    await saveAll(next);
    return invite;
  },

  /** Host: create invite with public E2E bundle (no private keys in package). */
  async create(quizId: QuizCatalogId): Promise<QuizInvite | { error: string }> {
    const id = randomId();
    try {
      const publicInvite = await quizE2eSession.createHostInvite(quizId, id);
      const invite = createInvite(
        quizId,
        id,
        "host",
        new Date().toISOString(),
        JSON.stringify(publicInvite),
      );
      const all = await loadAll();
      all.unshift(invite);
      await saveAll(all);
      return invite;
    } catch {
      return {
        error:
          "Could not create encrypted invite on this device. Unlock the device and try again.",
      };
    }
  },

  async setLocalCompare(
    inviteId: string,
    consent: boolean,
  ): Promise<QuizInvite | null> {
    const invite = await this.get(inviteId);
    if (!invite) return null;
    return this.update(withLocalCompareConsent(invite, consent));
  },

  /**
   * Local share: encrypt result with Double Ratchet, store plaintext only on device.
   * Host must have accepted peer handshake first (session send chain ready).
   * Peer must have joined first.
   */
  async setLocalShare(
    inviteId: string,
    consent: boolean,
    result: ShareableQuizResult | null,
  ): Promise<QuizInvite | { error: string }> {
    const invite = await this.get(inviteId);
    if (!invite) return { error: "Invite not found on this device." };
    if (!consent) {
      return this.update(withLocalShareConsent(invite, false, null, null));
    }
    if (!result) {
      return {
        error:
          "Take this quiz first, then consent to share an encrypted result.",
      };
    }
    if (result.quizId !== invite.quizId) {
      return { error: "Result is for a different quiz." };
    }
    if (invite.role === "host" && !invite.sessionReady) {
      return {
        error:
          "Wait for your partner to join and send their package first — encryption opens after their handshake.",
      };
    }
    if (invite.role === "peer" && !invite.sessionReady) {
      return {
        error: "Join the invite again so encryption can open on this device.",
      };
    }

    let embedHandshake: E2ePeerHandshakePackage | undefined;
    if (invite.role === "peer" && invite.peerHandshakePackage) {
      try {
        embedHandshake = JSON.parse(
          invite.peerHandshakePackage,
        ) as E2ePeerHandshakePackage;
      } catch {
        embedHandshake = undefined;
      }
    }

    const encrypted = await quizE2eSession.encryptResult({
      invitePublicId: invite.id,
      quizId: invite.quizId,
      role: invite.role,
      result: toShareable(result),
      consentToShare: true,
      consentToCompare: invite.hostConsentToCompare,
      embedHandshake,
    });
    if ("error" in encrypted) return encrypted;

    return this.update(
      withLocalShareConsent(
        invite,
        true,
        toShareable(result),
        JSON.stringify(encrypted),
      ),
    );
  },

  /**
   * Export package for the other person:
   * - Host before session: public invite (keys only)
   * - After local share: encrypted result package
   * - Peer after join before share: handshake only
   */
  async exportPackage(
    inviteId: string,
  ): Promise<{ packageJson: string } | { error: string }> {
    const invite = await this.get(inviteId);
    if (!invite) return { error: "Invite not found." };

    if (invite.hostConsentToShare && invite.hostCipherPackage) {
      // Re-export with current compare consent flag
      try {
        const pack = JSON.parse(invite.hostCipherPackage) as E2eResultPackage;
        pack.consentToCompare = invite.hostConsentToCompare;
        pack.consentToShare = true;
        return { packageJson: JSON.stringify(pack) };
      } catch {
        return { error: "Stored cipher package is unreadable. Fail closed." };
      }
    }

    if (invite.role === "peer" && invite.peerHandshakePackage) {
      return { packageJson: invite.peerHandshakePackage };
    }

    if (invite.role === "host" && invite.publicInvitePackage) {
      return { packageJson: invite.publicInvitePackage };
    }

    return {
      error: "Nothing to export yet. Create or join an invite first.",
    };
  },

  /**
   * Import a partner package (public invite, handshake, or encrypted result).
   */
  async importPackage(
    raw: string,
  ): Promise<QuizInvite | { error: string }> {
    const parsed = parseE2ePackage(raw.trim());
    if ("error" in parsed) return parsed;

    if (parsed.kind === "public-invite") {
      return this.joinPublicInvite(parsed);
    }

    if (parsed.kind === "peer-handshake") {
      return this.acceptHandshake(parsed);
    }

    if (parsed.kind === "result") {
      return this.importResultPackage(parsed, raw.trim());
    }

    return { error: "Unknown package kind." };
  },

  async joinPublicInvite(
    invitePublic: E2eInvitePublic,
  ): Promise<QuizInvite | { error: string }> {
    const joined = await quizE2eSession.joinAsPeer(invitePublic);
    if ("error" in joined) return joined;

    const invite = createInvite(
      invitePublic.quizId,
      invitePublic.invitePublicId,
      "peer",
      new Date().toISOString(),
      JSON.stringify(invitePublic),
    );
    invite.sessionReady = true;
    invite.peerHandshakePackage = JSON.stringify(joined.handshake);

    const all = await loadAll();
    const without = all.filter((i) => i.id !== invite.id);
    without.unshift(invite);
    await saveAll(without);
    return invite;
  },

  async acceptHandshake(
    handshake: E2ePeerHandshakePackage,
  ): Promise<QuizInvite | { error: string }> {
    const invite = await this.get(handshake.invitePublicId);
    if (!invite) {
      return {
        error:
          "This handshake is for an invite not on this device. Create the invite here first.",
      };
    }
    if (invite.role !== "host") {
      return { error: "Only the invite host can accept a peer handshake." };
    }
    // Re-accepting would re-init Bob and desync the ratchet. Fail closed.
    if (invite.sessionReady) {
      return invite;
    }
    if (!invite.publicInvitePackage) {
      return { error: "Host public invite material missing. Fail closed." };
    }
    let publicInvite: E2eInvitePublic;
    try {
      publicInvite = JSON.parse(invite.publicInvitePackage) as E2eInvitePublic;
    } catch {
      return { error: "Host public invite is corrupt." };
    }
    const accepted = await quizE2eSession.hostAcceptHandshake(
      publicInvite,
      handshake,
    );
    if ("error" in accepted) return accepted;
    return this.update({
      ...invite,
      sessionReady: true,
      peerHandshakePackage: JSON.stringify(handshake),
    });
  },

  async importResultPackage(
    pack: E2eResultPackage,
    raw: string,
  ): Promise<QuizInvite | { error: string }> {
    let invite = await this.get(pack.invitePublicId);

    // Host may receive peer result with embedded handshake before any prior accept
    if (
      pack.role === "peer" &&
      pack.handshake &&
      invite &&
      invite.role === "host" &&
      !invite.sessionReady
    ) {
      const hs: E2ePeerHandshakePackage = {
        v: 3,
        kind: "peer-handshake",
        protocol: "x3dh+double-ratchet",
        ...pack.handshake,
      };
      const accepted = await this.acceptHandshake(hs);
      if ("error" in accepted) return accepted;
      invite = accepted;
    }

    if (!invite) {
      return {
        error:
          "No matching invite on this device. Join their public invite or create the host invite first.",
      };
    }

    if (pack.quizId !== invite.quizId) {
      return { error: "Package quiz does not match this invite." };
    }

    const decrypted = await quizE2eSession.decryptResult({
      invitePublicId: invite.id,
      quizId: invite.quizId,
      envelope: pack,
    });
    if ("error" in decrypted) return decrypted;

    const next = withPartnerShare(invite, {
      result: decrypted.result,
      consentToShare: pack.consentToShare,
      consentToCompare: decrypted.consentToCompare,
      cipherPackage: raw,
    });
    if ("error" in next) return next;

    // Host send chain may now be ready even without separate handshake if peer result was first Alice msg
    // (session-open is separate; peer result is second message after open embedded in same package)
    const ready = await quizE2eSession.hasSendChain(invite.id);
    return this.update({ ...next, sessionReady: ready || invite.sessionReady });
  },

  canCompare,
  compareInvite,
};
