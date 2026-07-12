export const wrapupOutcomes = [
  "completed_comfortably",
  "ended_normally",
  "soft_signal_used",
  "felt_uncomfortable",
  "safety_concern",
] as const;
export type WrapupOutcome = (typeof wrapupOutcomes)[number];

type Dependencies = {
  encryptNote(sessionId: string, note: string): Promise<string>;
  submitRemote(input: {
    sessionId: string;
    outcome: WrapupOutcome;
    encryptedNote: string | null;
    idempotencyKey: string;
  }): Promise<string>;
  newId(): string;
};

export function createSessionWrapupService(dependencies: Dependencies) {
  return {
    async submit(
      sessionId: string,
      outcome: WrapupOutcome,
      note: string | null,
    ): Promise<string> {
      const trimmed = note?.trim() || null;
      const encryptedNote = trimmed
        ? await dependencies.encryptNote(sessionId, trimmed)
        : null;
      return dependencies.submitRemote({
        sessionId,
        outcome,
        encryptedNote,
        idempotencyKey: `wrapup-${dependencies.newId()}`,
      });
    },
  };
}
