export const wrapupOutcomes = [
  "completed_comfortably",
  "ended_normally",
  "soft_signal_used",
  "felt_uncomfortable",
  "safety_concern",
] as const;
export type WrapupOutcome = (typeof wrapupOutcomes)[number];

export type WrapupSubmitState =
  | { status: "saved"; id: string }
  | { status: "pending_sync" }
  | { status: "idle" };

type PendingWrapup = {
  sessionId: string;
  outcome: WrapupOutcome;
  encryptedNote: string | null;
  idempotencyKey: string;
};

type Dependencies = {
  encryptNote(sessionId: string, note: string): Promise<string>;
  submitRemote(input: PendingWrapup): Promise<string>;
  newId(): string;
  storage: {
    get(): Promise<string | null>;
    set(value: string): Promise<void>;
    clear(): Promise<void>;
  };
};

export function createSessionWrapupService(dependencies: Dependencies) {
  const synchronize = async (
    pending: PendingWrapup,
  ): Promise<WrapupSubmitState> => {
    try {
      const id = await dependencies.submitRemote(pending);
      await dependencies.storage.clear();
      return { status: "saved", id };
    } catch {
      await dependencies.storage.set(JSON.stringify(pending));
      return { status: "pending_sync" };
    }
  };
  return {
    async submit(
      sessionId: string,
      outcome: WrapupOutcome,
      note: string | null,
    ): Promise<WrapupSubmitState> {
      const trimmed = note?.trim() || null;
      const encryptedNote = trimmed
        ? await dependencies.encryptNote(sessionId, trimmed)
        : null;
      return synchronize({
        sessionId,
        outcome,
        encryptedNote,
        idempotencyKey: `wrapup-${dependencies.newId()}`,
      });
    },
    /**
     * Retries a wrap-up submission left pending by a prior network failure
     * (e.g. on app restart, mirroring emergencyStopService's reconcile
     * pattern). A no-op returning "idle" if nothing is pending.
     */
    async reconcile(): Promise<WrapupSubmitState> {
      const raw = await dependencies.storage.get();
      if (!raw) return { status: "idle" };
      try {
        const pending = JSON.parse(raw) as PendingWrapup;
        if (!pending.sessionId || !pending.outcome || !pending.idempotencyKey)
          throw new Error("invalid");
        return synchronize(pending);
      } catch {
        await dependencies.storage.clear();
        return { status: "idle" };
      }
    },
  };
}
