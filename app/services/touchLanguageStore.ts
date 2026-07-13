import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import {
  createDefaultTouchLanguage,
  parseTouchLanguageDocument,
  type TouchLanguageDocument,
} from "../lib/touchLanguageCore.ts";

const STORAGE_KEY = "litmo.touch_language.doc.v1";
const SECURE_KEY = "litmo.touch_language.doc.secure.v1";

async function readRaw(): Promise<string | null> {
  try {
    const secure = await SecureStore.getItemAsync(SECURE_KEY);
    if (secure != null) return secure;
  } catch {
    // Secure Store may be unavailable (web/tests).
  }
  return AsyncStorage.getItem(STORAGE_KEY);
}

async function writeRaw(value: string): Promise<void> {
  let secured = false;
  try {
    await SecureStore.setItemAsync(SECURE_KEY, value);
    secured = true;
  } catch {
    secured = false;
  }
  if (secured) {
    await AsyncStorage.removeItem(STORAGE_KEY);
    return;
  }
  await AsyncStorage.setItem(STORAGE_KEY, value);
}

async function clearRaw(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(SECURE_KEY);
  } catch {
    // ignore
  }
  await AsyncStorage.removeItem(STORAGE_KEY);
}

/** Device-local Touch Language persistence (Secure Store preferred). */
export const touchLanguageStore = {
  async load(): Promise<TouchLanguageDocument | null> {
    const raw = await readRaw();
    if (!raw) return null;
    try {
      return parseTouchLanguageDocument(JSON.parse(raw));
    } catch {
      return null;
    }
  },

  async save(doc: TouchLanguageDocument): Promise<TouchLanguageDocument> {
    const parsed = parseTouchLanguageDocument({
      ...doc,
      updatedAt: new Date().toISOString(),
      notConsentToTouch: true,
      shareIsReviewOnly: true,
      version: 1,
    });
    if (!parsed) {
      throw new Error("Touch Language document failed validation.");
    }
    await writeRaw(JSON.stringify(parsed));
    return parsed;
  },

  async loadOrDefault(): Promise<TouchLanguageDocument> {
    return (await this.load()) ?? createDefaultTouchLanguage();
  },

  async clear(): Promise<void> {
    await clearRaw();
  },
};
