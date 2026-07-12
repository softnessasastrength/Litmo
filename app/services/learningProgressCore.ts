export type ModuleProgress = {
  stepIndex: number;
  completed: boolean;
  updatedAt: string;
};

export type LearningProgress = Record<string, ModuleProgress>;

export const emptyLearningProgress: LearningProgress = {};

export function clampStepIndex(stepIndex: number, stepCount: number) {
  if (stepCount <= 0) return 0;
  return Math.max(0, Math.min(Math.trunc(stepIndex), stepCount - 1));
}

export function recordStep(
  progress: LearningProgress,
  moduleId: string,
  stepIndex: number,
  stepCount: number,
  updatedAt: string,
): LearningProgress {
  return {
    ...progress,
    [moduleId]: {
      stepIndex: clampStepIndex(stepIndex, stepCount),
      completed: progress[moduleId]?.completed ?? false,
      updatedAt,
    },
  };
}

export function completeModule(
  progress: LearningProgress,
  moduleId: string,
  stepCount: number,
  updatedAt: string,
): LearningProgress {
  return {
    ...progress,
    [moduleId]: {
      stepIndex: clampStepIndex(stepCount - 1, stepCount),
      completed: true,
      updatedAt,
    },
  };
}

export function completionCount(progress: LearningProgress) {
  return Object.values(progress).filter((entry) => entry.completed).length;
}

export function parseLearningProgress(value: string | null): LearningProgress {
  if (!value) return emptyLearningProgress;
  try {
    const parsed = JSON.parse(value) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return emptyLearningProgress;
    return parsed as LearningProgress;
  } catch {
    return emptyLearningProgress;
  }
}
