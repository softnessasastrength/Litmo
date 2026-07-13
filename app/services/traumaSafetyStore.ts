/**
 * Local persistence for trauma-informed safety prefs, verification, reflections.
 */

import {
  createEmptyReflection,
  parseSessionReflection,
  parseTraumaSafetyPrefs,
  parseVerificationRecord,
  defaultTraumaSafetyPrefs,
  type PartnerVerificationRecord,
  type SessionReflectionDocument,
  type TraumaSafetyPrefs,
} from "../lib/traumaSafetyCore.ts";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { privateHistoryStore } from "./privateHistoryStore.ts";

const PREFS_SECURE = "litmo.trauma_safety.prefs.secure.v1";
const PREFS_ASYNC = "litmo.trauma_safety.prefs.v1";
const VERIFY_SECURE = "litmo.trauma_safety.verify.secure.v1";
const VERIFY_ASYNC = "litmo.trauma_safety.verify.v1";
const REFLECT_SECURE = "litmo.trauma_safety.reflection.secure.v1";
const REFLECT_ASYNC = "litmo.trauma_safety.reflection.v1";
const REFLECT_LIST_SECURE = "litmo.trauma_safety.reflections.secure.v1";
const REFLECT_LIST_ASYNC = "litmo.trauma_safety.reflections.v1";

const MAX_REFLECTIONS = 50;

async function read(secureKey: string, asyncKey: string): Promise<string | null> {
  try {
    const s = await SecureStore.getItemAsync(secureKey);
    if (s != null) return s;
  } catch {
    // fallback
  }
  return AsyncStorage.getItem(asyncKey);
}

async function write(
  secureKey: string,
  asyncKey: string,
  value: string,
): Promise<void> {
  let ok = false;
  try {
    await SecureStore.setItemAsync(secureKey, value);
    ok = true;
  } catch {
    ok = false;
  }
  if (ok) {
    await AsyncStorage.removeItem(asyncKey);
    return;
  }
  await AsyncStorage.setItem(asyncKey, value);
}

export const traumaSafetyStore = {
  async loadPrefs(): Promise<TraumaSafetyPrefs> {
    const raw = await read(PREFS_SECURE, PREFS_ASYNC);
    if (!raw) return defaultTraumaSafetyPrefs();
    try {
      return parseTraumaSafetyPrefs(JSON.parse(raw)) ?? defaultTraumaSafetyPrefs();
    } catch {
      return defaultTraumaSafetyPrefs();
    }
  },

  async savePrefs(prefs: TraumaSafetyPrefs): Promise<TraumaSafetyPrefs> {
    const next: TraumaSafetyPrefs = {
      ...prefs,
      version: 1,
      updatedAt: new Date().toISOString(),
      panic: { ...prefs.panic, version: 1, updatedAt: new Date().toISOString() },
      timeout: {
        ...prefs.timeout,
        version: 1,
        updatedAt: new Date().toISOString(),
      },
    };
    await write(PREFS_SECURE, PREFS_ASYNC, JSON.stringify(next));
    return next;
  },

  async loadLatestVerification(): Promise<PartnerVerificationRecord | null> {
    const raw = await read(VERIFY_SECURE, VERIFY_ASYNC);
    if (!raw) return null;
    try {
      return parseVerificationRecord(JSON.parse(raw));
    } catch {
      return null;
    }
  },

  async saveVerification(
    record: PartnerVerificationRecord,
  ): Promise<PartnerVerificationRecord> {
    const parsed = parseVerificationRecord(record);
    if (!parsed) throw new Error("verification_invalid");
    await write(VERIFY_SECURE, VERIFY_ASYNC, JSON.stringify(parsed));
    void privateHistoryStore.append({
      id: `verify-${parsed.id}`,
      kind: "note",
      occurredAt: parsed.completedAt,
      summary: "Present-moment partner checks saved (not a safety certificate)",
      privateNote: null,
      sessionId: null,
    });
    return parsed;
  },

  async loadCurrentReflection(): Promise<SessionReflectionDocument | null> {
    const raw = await read(REFLECT_SECURE, REFLECT_ASYNC);
    if (!raw) return null;
    try {
      return parseSessionReflection(JSON.parse(raw));
    } catch {
      return null;
    }
  },

  async saveCurrentReflection(
    doc: SessionReflectionDocument,
  ): Promise<SessionReflectionDocument> {
    const parsed = parseSessionReflection(doc) ?? createEmptyReflection();
    const next = {
      ...parsed,
      updatedAt: new Date().toISOString(),
      notTherapy: true as const,
      notRequired: true as const,
      notScore: true as const,
    };
    await write(REFLECT_SECURE, REFLECT_ASYNC, JSON.stringify(next));
    return next;
  },

  async archiveReflection(
    doc: SessionReflectionDocument,
  ): Promise<SessionReflectionDocument[]> {
    const completed = {
      ...doc,
      completed: true,
      updatedAt: new Date().toISOString(),
      notTherapy: true as const,
      notRequired: true as const,
      notScore: true as const,
    };
    await write(REFLECT_SECURE, REFLECT_ASYNC, JSON.stringify(completed));

    let list: SessionReflectionDocument[] = [];
    try {
      const raw = await read(REFLECT_LIST_SECURE, REFLECT_LIST_ASYNC);
      if (raw) {
        const arr = JSON.parse(raw) as unknown[];
        list = arr
          .map((item) => parseSessionReflection(item))
          .filter((x): x is SessionReflectionDocument => x != null);
      }
    } catch {
      list = [];
    }
    list = [completed, ...list.filter((r) => r.id !== completed.id)].slice(
      0,
      MAX_REFLECTIONS,
    );
    await write(REFLECT_LIST_SECURE, REFLECT_LIST_ASYNC, JSON.stringify(list));

    void privateHistoryStore.append({
      id: `refl-${completed.id}`,
      kind: "wrap_up",
      occurredAt: completed.updatedAt,
      summary: completed.completed
        ? "Private session reflection saved"
        : "Private reflection started",
      privateNote: null,
      sessionId: completed.sessionId,
    });
    return list;
  },

  async listReflections(): Promise<SessionReflectionDocument[]> {
    const raw = await read(REFLECT_LIST_SECURE, REFLECT_LIST_ASYNC);
    if (!raw) return [];
    try {
      const arr = JSON.parse(raw) as unknown[];
      return arr
        .map((item) => parseSessionReflection(item))
        .filter((x): x is SessionReflectionDocument => x != null);
    } catch {
      return [];
    }
  },

  async clearCurrentReflection(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(REFLECT_SECURE);
    } catch {
      // ignore
    }
    await AsyncStorage.removeItem(REFLECT_ASYNC);
  },
};
