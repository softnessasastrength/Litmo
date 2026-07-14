import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  parseBundle,
  type RelationshipEvent,
  type RelationshipModel,
  type RelationshipModelBundle,
} from "../lib/relationshipModelCore.ts";

export const RELATIONSHIP_MODEL_KEY = "litmo.relationship_model.v1";

export const relationshipModelStore = {
  async load(): Promise<RelationshipModelBundle | null> {
    try {
      const raw = await AsyncStorage.getItem(RELATIONSHIP_MODEL_KEY);
      if (!raw) return null;
      return parseBundle(JSON.parse(raw));
    } catch {
      return null;
    }
  },

  async save(bundle: RelationshipModelBundle): Promise<void> {
    try {
      await AsyncStorage.setItem(
        RELATIONSHIP_MODEL_KEY,
        JSON.stringify({
          model: bundle.model,
          events: bundle.events.slice(0, 100),
        }),
      );
    } catch {
      // ignore
    }
  },

  async saveModel(
    model: RelationshipModel,
    events: RelationshipEvent[],
  ): Promise<void> {
    await this.save({ model, events });
  },

  async clear(): Promise<void> {
    try {
      await AsyncStorage.removeItem(RELATIONSHIP_MODEL_KEY);
    } catch {
      // ignore
    }
  },
};
