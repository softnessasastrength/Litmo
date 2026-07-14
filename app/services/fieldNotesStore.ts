import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  parseFieldNotes,
  type FieldNote,
} from "../lib/fieldNotesCore.ts";

export const FIELD_NOTES_KEY = "litmo.field_notes.v1";

export const fieldNotesStore = {
  async load(): Promise<FieldNote[]> {
    try {
      const raw = await AsyncStorage.getItem(FIELD_NOTES_KEY);
      if (!raw) return [];
      return parseFieldNotes(JSON.parse(raw));
    } catch {
      return [];
    }
  },
  async append(note: FieldNote): Promise<void> {
    try {
      const prev = await this.load();
      await AsyncStorage.setItem(
        FIELD_NOTES_KEY,
        JSON.stringify([note, ...prev].slice(0, 200)),
      );
    } catch {
      // ignore
    }
  },
  async remove(id: string): Promise<void> {
    try {
      const prev = await this.load();
      await AsyncStorage.setItem(
        FIELD_NOTES_KEY,
        JSON.stringify(prev.filter((n) => n.id !== id)),
      );
    } catch {
      // ignore
    }
  },
};
