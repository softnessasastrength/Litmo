/**
 * Durable "End together" (active → completed) with offline retry.
 * Mirrors emergencyStopServiceCore / sessionWrapupServiceCore: persist a
 * minimal pending record before network I/O, reuse the same idempotency key
 * on reconcile, never invent consent from stale local state.
 */

export type SessionCompleteState =
  | { status: "completed"; resultingState: string }
  | { status: "pending_sync" }
  | { status: "failed_closed" }
  | { status: "idle" };

type Pending = { sessionId: string; idempotencyKey: string };

type Dependencies = {
  storage: {
    get(): Promise<string | null>;
    set(value: string): Promise<void>;
    clear(): Promise<void>;
  };
  completeRemote(sessionId: string, idempotencyKey: string): Promise<string>;
  /** True only for transient failures worth retrying (e.g. network). */
  isRetryable(error: unknown): boolean;
  newId(): string;
};

export function createSessionCompleteService(dependencies: Dependencies) {
  const synchronize = async (
    pending: Pending,
  ): Promise<SessionCompleteState> => {
    try {
      const resultingState = await dependencies.completeRemote(
        pending.sessionId,
        pending.idempotencyKey,
      );
      await dependencies.storage.clear();
      return { status: "completed", resultingState };
    } catch (error) {
      if (!dependencies.isRetryable(error)) {
        await dependencies.storage.clear();
        return { status: "failed_closed" };
      }
      return { status: "pending_sync" };
    }
  };

  return {
    async complete(sessionId: string): Promise<SessionCompleteState> {
      const pending: Pending = {
        sessionId,
        idempotencyKey: `complete-${dependencies.newId()}`,
      };
      await dependencies.storage.set(JSON.stringify(pending));
      return synchronize(pending);
    },
    /**
     * Retries a completion left pending after a network failure (app restart).
     * No-op when nothing is queued. Permanent server rejections clear the
     * queue so a never-active session does not retry forever.
     */
    async reconcile(): Promise<SessionCompleteState> {
      const raw = await dependencies.storage.get();
      if (!raw) return { status: "idle" };
      try {
        const pending = JSON.parse(raw) as Pending;
        if (!pending.sessionId || !pending.idempotencyKey)
          throw new Error("invalid");
        return synchronize(pending);
      } catch {
        await dependencies.storage.clear();
        return { status: "idle" };
      }
    },
  };
}
