import {
  completeModule,
  emptyLearningProgress,
  LearningProgress,
  parseLearningProgress,
  recordStep,
} from "./learningProgressCore";
import { localVault } from "./localVault";
import { localFirstCoordinator } from "./localFirstCoordinator";

async function load(): Promise<LearningProgress> {
  const raw = await localVault.getRaw("learning_progress");
  return parseLearningProgress(raw);
}

async function save(progress: LearningProgress) {
  await localVault.setJson("learning_progress", progress);
  void localFirstCoordinator.afterLocalWrite("learning_progress");
  return progress;
}

export const learningProgressService = {
  load,
  async reset() {
    await localVault.remove("learning_progress");
    return emptyLearningProgress;
  },
  async recordStep(moduleId: string, stepIndex: number, stepCount: number) {
    const current = await load();
    return save(
      recordStep(
        current,
        moduleId,
        stepIndex,
        stepCount,
        new Date().toISOString(),
      ),
    );
  },
  async complete(moduleId: string, stepCount: number) {
    const current = await load();
    return save(
      completeModule(current, moduleId, stepCount, new Date().toISOString()),
    );
  },
};
