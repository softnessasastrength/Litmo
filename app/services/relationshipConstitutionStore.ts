import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createConstitution,
  parseConstitution,
  type ConstitutionDoc,
} from "../lib/relationshipConstitutionCore.ts";

export const REL_CONSTITUTION_KEY = "litmo.relationship_constitution.v1";

export const relationshipConstitutionStore = {
  async load(): Promise<ConstitutionDoc> {
    try {
      const raw = await AsyncStorage.getItem(REL_CONSTITUTION_KEY);
      if (!raw) return createConstitution();
      return parseConstitution(JSON.parse(raw)) ?? createConstitution();
    } catch {
      return createConstitution();
    }
  },
  async save(doc: ConstitutionDoc): Promise<void> {
    try {
      await AsyncStorage.setItem(REL_CONSTITUTION_KEY, JSON.stringify(doc));
    } catch {
      // ignore
    }
  },
};
