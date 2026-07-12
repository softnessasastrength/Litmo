import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  completeModule,
  emptyLearningProgress,
  LearningProgress,
  parseLearningProgress,
  recordStep,
} from "./learningProgressCore";

const STORAGE_KEY = "litmo.learning.progress.v1";

async function load(): Promise<LearningProgress> {
  return parseLearningProgress(await AsyncStorage.getItem(STORAGE_KEY));
}

async function save(progress: LearningProgress) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  return progress;
}

export const learningProgressService = {
  load,
  async reset() {
    await AsyncStorage.removeItem(STORAGE_KEY);
    return emptyLearningProgress;
  },
  async recordStep(moduleId: string, stepIndex: number, stepCount: number) {
    const current = await load();
    return save(recordStep(current, moduleId, stepIndex, stepCount, new Date().toISOString()));
  },
  async complete(moduleId: string, stepCount: number) {
    const current = await load();
    return save(completeModule(current, moduleId, stepCount, new Date().toISOString()));
  },
};
