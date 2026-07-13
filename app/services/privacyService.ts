/**
 * Privacy notice acceptance + erasure requests + local wipe helpers.
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import { PRIVACY_NOTICE_VERSION } from "../data/privacyContent.ts";
import { environmentError, supabase } from "./supabase.ts";
import { wipeLocalLitmoData, type LocalWipeReport } from "./localDataWipe.ts";

const LOCAL_ACCEPT_KEY = "litmo.privacy.notice.accepted.v1";

async function withTimeout<T>(operation: PromiseLike<T>, ms = 12_000): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;
  try {
    return await Promise.race([
      Promise.resolve(operation),
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error("request_timeout")), ms);
      }),
    ]);
  } finally {
    clearTimeout(timer!);
  }
}

export const privacyService = {
  noticeVersion: PRIVACY_NOTICE_VERSION,

  async getLocalAcceptance(): Promise<{
    version: string;
    acceptedAt: string;
  } | null> {
    try {
      const raw = await AsyncStorage.getItem(LOCAL_ACCEPT_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as { version?: string; acceptedAt?: string };
      if (!parsed.version || !parsed.acceptedAt) return null;
      return { version: parsed.version, acceptedAt: parsed.acceptedAt };
    } catch {
      return null;
    }
  },

  async acceptNoticeLocally(): Promise<void> {
    await AsyncStorage.setItem(
      LOCAL_ACCEPT_KEY,
      JSON.stringify({
        version: PRIVACY_NOTICE_VERSION,
        acceptedAt: new Date().toISOString(),
      }),
    );
  },

  async acceptNoticeRemote(): Promise<{ ok: true } | { error: string }> {
    if (environmentError) {
      return { error: "Server not configured. Local acknowledgment still saved." };
    }
    try {
      const { error } = await withTimeout(
        supabase.rpc("accept_privacy_notice", {
          p_notice_version: PRIVACY_NOTICE_VERSION,
        }),
      );
      if (error) throw error;
      return { ok: true };
    } catch (e) {
      return {
        error:
          e instanceof Error
            ? e.message
            : "Could not record server acknowledgment.",
      };
    }
  },

  async acceptNotice(
    authenticated: boolean,
  ): Promise<{ local: true; remote?: "ok" | "skipped" | "failed"; detail?: string }> {
    await this.acceptNoticeLocally();
    if (!authenticated) return { local: true, remote: "skipped" };
    const remote = await this.acceptNoticeRemote();
    if ("error" in remote) return { local: true, remote: "failed", detail: remote.error };
    return { local: true, remote: "ok" };
  },

  async requestErasure(
    note?: string,
  ): Promise<{ id: string } | { error: string }> {
    if (environmentError) {
      return {
        error:
          "Server not configured. You can still wipe data on this device.",
      };
    }
    try {
      const { data, error } = await withTimeout(
        supabase.rpc("request_account_erasure", {
          p_subject_note: note?.trim() || null,
        }),
      );
      if (error) throw error;
      if (typeof data !== "string") {
        return { error: "Unexpected server response." };
      }
      return { id: data };
    } catch (e) {
      const msg = e instanceof Error ? e.message : "request_failed";
      if (msg.includes("erasure_already_pending")) {
        return { error: "You already have an open erasure request." };
      }
      return { error: msg };
    }
  },

  async wipeLocal(): Promise<LocalWipeReport> {
    return wipeLocalLitmoData();
  },
};
