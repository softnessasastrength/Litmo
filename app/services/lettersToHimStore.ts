import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  parseLetterHistory,
  type LetterEntry,
} from "../lib/lettersToHimCore.ts";

export const LETTERS_TO_HIM_KEY = "litmo.letters_to_him.v1";

const MAX_ENTRIES = 200;

export const lettersToHimStore = {
  async load(): Promise<LetterEntry[]> {
    try {
      const raw = await AsyncStorage.getItem(LETTERS_TO_HIM_KEY);
      if (!raw) return [];
      return parseLetterHistory(JSON.parse(raw));
    } catch {
      return [];
    }
  },

  async save(entries: LetterEntry[]): Promise<void> {
    try {
      await AsyncStorage.setItem(LETTERS_TO_HIM_KEY, JSON.stringify(entries));
    } catch {
      // ignore — local-only, never blocks the ritual
    }
  },

  async add(entry: LetterEntry): Promise<LetterEntry[]> {
    const prev = await this.load();
    const next = [entry, ...prev].slice(0, MAX_ENTRIES);
    await this.save(next);
    return next;
  },

  async updateEntry(
    id: string,
    updater: (e: LetterEntry) => LetterEntry,
  ): Promise<LetterEntry[]> {
    const prev = await this.load();
    const next = prev.map((e) => (e.id === id ? updater(e) : e));
    await this.save(next);
    return next;
  },

  async clear(): Promise<void> {
    try {
      await AsyncStorage.removeItem(LETTERS_TO_HIM_KEY);
    } catch {
      // ignore
    }
  },
};
