export type EmergencyStopState =
  | { status: "stopped"; resultingState: string }
  | { status: "stopped_pending_sync" }
  | { status: "idle" };

type Pending = { sessionId: string; idempotencyKey: string };
type Dependencies = {
  storage: {
    get(): Promise<string | null>;
    set(value: string): Promise<void>;
    clear(): Promise<void>;
  };
  stopRemote(sessionId: string, idempotencyKey: string): Promise<string>;
  clearProtectedRuntime(): void;
  newId(): string;
};

export function createEmergencyStopService(dependencies: Dependencies) {
  const synchronize = async (pending: Pending): Promise<EmergencyStopState> => {
    try {
      const resultingState = await dependencies.stopRemote(
        pending.sessionId,
        pending.idempotencyKey,
      );
      await dependencies.storage.clear();
      return { status: "stopped", resultingState };
    } catch {
      return { status: "stopped_pending_sync" };
    }
  };
  return {
    async stop(sessionId: string): Promise<EmergencyStopState> {
      dependencies.clearProtectedRuntime();
      const pending = {
        sessionId,
        idempotencyKey: `withdraw-${dependencies.newId()}`,
      };
      await dependencies.storage.set(JSON.stringify(pending));
      return synchronize(pending);
    },
    async reconcile(): Promise<EmergencyStopState> {
      const raw = await dependencies.storage.get();
      if (!raw) return { status: "idle" };
      dependencies.clearProtectedRuntime();
      try {
        const pending = JSON.parse(raw) as Pending;
        if (!pending.sessionId || !pending.idempotencyKey)
          throw new Error("invalid");
        return synchronize(pending);
      } catch {
        return { status: "stopped_pending_sync" };
      }
    },
  };
}
