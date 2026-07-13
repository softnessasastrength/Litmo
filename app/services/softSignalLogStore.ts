import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import {
  parseLog,
  parseLogEntry,
  type SoftSignalLogEntry,
} from "../lib/softSignalCore.ts";

const SECURE_KEY = "litmo.soft_signal.log.secure.v1";
const ASYNC_KEY = "litmo.soft_signal.log.v1";
const MAX_ENTRIES = 200;

async function readRaw(): Promise<string | null> {
  try {
    const s = await SecureStore.getItemAsync(SECURE_KEY);
    if (s != null) return s;
  } catch {
    // fallback
  }
  return AsyncStorage.getItem(ASYNC_KEY);
}

async function writeRaw(value: string): Promise<void> {
  let ok = false;
  try {
    await SecureStore.setItemAsync(SECURE_KEY, value);
    ok = true;
  } catch {
    ok = false;
  }
  if (ok) {
    await AsyncStorage.removeItem(ASYNC_KEY);
    return;
  }
  await AsyncStorage.setItem(ASYNC_KEY, value);
}

/** Private personal Soft Signal history — device only, never a score. */
export const softSignalLogStore = {
  async load(): Promise<SoftSignalLogEntry[]> {
    const raw = await readRaw();
    if (!raw) return [];
    try {
      return parseLog(JSON.parse(raw));
    } catch {
      return [];
    }
  },

  async append(entry: SoftSignalLogEntry): Promise<SoftSignalLogEntry[]> {
    const parsed = parseLogEntry(entry);
    if (!parsed) return this.load();
    const current = await this.load();
    const next = [parsed, ...current.filter((e) => e.id !== parsed.id)].slice(
      0,
      MAX_ENTRIES,
    );
    await writeRaw(JSON.stringify(next));
    return next;
  },

  async updateNote(
    id: string,
    privateJournalNote: string | null,
  ): Promise<SoftSignalLogEntry[]> {
    const current = await this.load();
    const next = current.map((e) =>
      e.id === id
        ? {
            ...e,
            privateJournalNote: privateJournalNote?.trim().slice(0, 500) || null,
          }
        : e,
    );
    await writeRaw(JSON.stringify(next));
    return next;
  },

  async clear(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(SECURE_KEY);
    } catch {
      // ignore
    }
    await AsyncStorage.removeItem(ASYNC_KEY);
  },
};
