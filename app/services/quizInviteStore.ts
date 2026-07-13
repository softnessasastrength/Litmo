import * as Crypto from "expo-crypto";
import * as SecureStore from "expo-secure-store";
import type { QuizCatalogId } from "../data/quizCatalog.ts";
import {
  createInvite,
  type QuizInvite,
  type SealedQuizResult,
  withHostCompareConsent,
  withHostShareConsent,
  importPeerPackage,
} from "./quizShareCore.ts";

const STORAGE_KEY = "litmo.quizzes.invites.v1";

async function loadAll(): Promise<QuizInvite[]> {
  const raw = await SecureStore.getItemAsync(STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as QuizInvite[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function saveAll(invites: QuizInvite[]): Promise<void> {
  await SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(invites));
}

function randomId(): string {
  // Fallback sync id for environments where getRandomBytes is async-only at call sites.
  return `inv_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

export const quizInviteStore = {
  async list(): Promise<QuizInvite[]> {
    return loadAll();
  },

  async get(id: string): Promise<QuizInvite | null> {
    const all = await loadAll();
    return all.find((i) => i.id === id) ?? null;
  },

  async create(quizId: QuizCatalogId): Promise<QuizInvite> {
    const bytes = await Crypto.getRandomBytesAsync(24);
    const sealKey = Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    const invite = createInvite(
      quizId,
      randomId(),
      sealKey,
      new Date().toISOString(),
    );
    const all = await loadAll();
    all.unshift(invite);
    await saveAll(all);
    return invite;
  },

  async update(invite: QuizInvite): Promise<QuizInvite> {
    const all = await loadAll();
    const next = all.map((i) => (i.id === invite.id ? invite : i));
    await saveAll(next);
    return invite;
  },

  async setHostShare(
    inviteId: string,
    consent: boolean,
    sealed: SealedQuizResult | null,
  ): Promise<QuizInvite | null> {
    const invite = await this.get(inviteId);
    if (!invite) return null;
    return this.update(withHostShareConsent(invite, consent, sealed));
  },

  async setHostCompare(
    inviteId: string,
    consent: boolean,
  ): Promise<QuizInvite | null> {
    const invite = await this.get(inviteId);
    if (!invite) return null;
    return this.update(withHostCompareConsent(invite, consent));
  },

  async importPeer(
    inviteId: string,
    peer: {
      sealed: SealedQuizResult;
      consentToShare: boolean;
      consentToCompare: boolean;
    },
  ): Promise<QuizInvite | { error: string }> {
    const invite = await this.get(inviteId);
    if (!invite) return { error: "Invite not found on this device." };
    const next = importPeerPackage(invite, peer);
    if ("error" in next) return next;
    return this.update(next);
  },
};
