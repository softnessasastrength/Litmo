/**
 * Emergency stop / consent-withdraw orchestration core — injectable for tests.
 *
 * “Emergency stop” here means *immediate unilateral session consent withdrawal*
 * (Soft Signal remote path), NOT civic emergency services or crisis dispatch.
 * Local protected runtime is cleared first; pending withdraw is persisted so
 * network failure cannot resurrect an active protected session on this device.
 *
 * Order matters (safety):
 * 1. clearProtectedRuntime (local lock / wipe sensitive session runtime)
 * 2. persist pending { sessionId, idempotencyKey }
 * 3. attempt stopRemote
 * 4. on success clear pending; on failure return stopped_pending_sync
 *
 * Soft Signal maps these results into SoftSignalOutcome; localEnded stays true.
 *
 * SEE:
 * - app/services/emergencyStopService.ts (production wiring)
 * - app/services/softSignalServiceCore.ts (consumer)
 * - docs/CODE_COMMENT_STANDARD.md (consent-critical)
 */

/**
 * WHAT: Result states for emergency stop / withdraw attempts on this device.
 * WHY: Callers (Soft Signal) need to distinguish synced stop, offline pending, and idle.
 * CONSENT: stopped* states mean contact/session consent is withdrawn locally;
 *      pending_sync still forbids resume. idle means no pending withdraw work.
 * EDGE CASES:
 *   - stopped_pending_sync → local already cleared; retry via reconcile
 *   - idle → no pending blob in storage
 * NEVER: Treat stopped_pending_sync as session still active.
 *        Claim crisis / 911 dispatch from these statuses.
 *        Require peer agreement for stopped.
 *
 * Variants:
 * - stopped: remote withdraw acknowledged; resultingState opaque server state string
 * - stopped_pending_sync: local stop durable; remote not yet confirmed
 * - idle: nothing pending to reconcile
 */
export type EmergencyStopState =
  | { status: "stopped"; resultingState: string }
  | { status: "stopped_pending_sync" }
  | { status: "idle" };

/**
 * WHAT: Durable pending withdraw payload for offline retry.
 * WHY: Idempotency key lets remote withdraw be safely retried without double-penalty
 *      semantics; sessionId scopes the withdraw.
 * CONSENT: Pending means withdraw intended — not a request for peer re-consent.
 * EDGE CASES: missing fields on parse → reconcile treats as invalid → pending_sync
 * NEVER: Store reasons, private notes, or peer blame in this blob.
 */
type Pending = { sessionId: string; idempotencyKey: string };

/**
 * WHAT: Injectable dependencies for emergency stop core.
 * WHY: Unit tests can fail stopRemote, inspect storage, and assert clearProtectedRuntime
 *      order without Supabase or secure storage.
 * CONSENT: clearProtectedRuntime is local fail-closed privacy on stop — runs before network.
 * EDGE CASES: storage/get failures surface via reconcile catch paths.
 * NEVER: Inject stopRemote that waits for peer accept. Skip clearProtectedRuntime.
 */
type Dependencies = {
  storage: {
    get(): Promise<string | null>;
    set(value: string): Promise<void>;
    clear(): Promise<void>;
  };
  /** Remote withdraw RPC; throws on failure → pending_sync. */
  stopRemote(sessionId: string, idempotencyKey: string): Promise<string>;
  /** Lock/wipe protected session runtime locally — must run before relying on network. */
  clearProtectedRuntime(): void;
  newId(): string;
};

/**
 * WHAT: Factory for stop + reconcile emergency-stop service methods.
 * WHY: Shared algorithm for Soft Signal remote path and app restart reconciliation
 *      of unfinished withdraws.
 * CONSENT: Unilateral withdraw. Local clear happens even if remote fails.
 *          Soft Signal is never emergency services — this is session consent stop.
 * EDGE CASES:
 *   - stopRemote throw → stopped_pending_sync (pending remains in storage)
 *   - reconcile no raw → idle
 *   - reconcile invalid JSON / missing fields → stopped_pending_sync (fail closed
 *     toward “still need sync,” not “session live”)
 * NEVER: Resume session because remote failed. Ask for stop reason. Call 911 APIs.
 * SEE: emergencyStopService production; softSignalServiceCore stopRemote mapping
 */
export function createEmergencyStopService(dependencies: Dependencies) {
  /**
   * WHAT: Attempt remote withdraw for a pending payload; clear storage on success.
   * WHY: Shared by stop() and reconcile() so retry uses the same idempotency key.
   * CONSENT: Success or pending_sync both mean stop in product language for Soft Signal.
   * EDGE CASES:
   *   - stopRemote resolves → clear pending, status stopped
   *   - stopRemote throws → keep pending, status stopped_pending_sync
   * NEVER: Clear pending on failure (would lose offline retry). Undo clearProtectedRuntime.
   * SEE: Pending; EmergencyStopState
   */
  const synchronize = async (pending: Pending): Promise<EmergencyStopState> => {
    try {
      const resultingState = await dependencies.stopRemote(
        pending.sessionId,
        pending.idempotencyKey,
      );
      // Remote ack: drop durable pending so restart does not re-withdraw forever.
      await dependencies.storage.clear();
      return { status: "stopped", resultingState };
    } catch {
      // Fail closed: local already cleared; keep pending for reconcile; no resume.
      return { status: "stopped_pending_sync" };
    }
  };

  return {
    /**
     * WHAT: Perform immediate local protected clear + durable pending + remote attempt.
     * WHY: Soft Signal / withdraw must free the person on this device even offline.
     * CONSENT: Unilateral session consent withdrawal — no peer, no reason, no dwell.
     * EDGE CASES:
     *   - network down → stopped_pending_sync after local clear + storage set
     *   - idempotencyKey stable for this stop attempt (newId once per stop call)
     * NEVER: Skip clearProtectedRuntime to “optimize.” Require explanation.
     *        Treat as civic emergency dispatch.
     * SEE: softSignalServiceCore fire → stopRemote
     */
    async stop(sessionId: string): Promise<EmergencyStopState> {
      // Order matters: local privacy/runtime lock BEFORE any network I/O.
      dependencies.clearProtectedRuntime();
      const pending = {
        sessionId,
        // withdraw- prefix + new id: stable retry key for this stop decision.
        idempotencyKey: `withdraw-${dependencies.newId()}`,
      };
      // Persist before remote so crash mid-flight still leaves a reconcile trail.
      await dependencies.storage.set(JSON.stringify(pending));
      return synchronize(pending);
    },

    /**
     * WHAT: Retry any durable pending withdraw from storage (app resume / restart).
     * WHY: Offline Soft Signal must eventually sync without user re-explaining.
     * CONSENT: Reconcile continues withdraw — never re-opens session or re-grants touch.
     * EDGE CASES:
     *   - no raw → idle (nothing to do)
     *   - invalid JSON or missing fields → stopped_pending_sync after local clear
     *     (fail closed: do not claim clean idle if blob is corrupt)
     *   - valid pending → clearProtectedRuntime again + synchronize
     * NEVER: Delete corrupt pending and pretend session is active. Demand a reason on retry.
     * SEE: pendingSafetyActionStorage in production wiring
     */
    async reconcile(): Promise<EmergencyStopState> {
      const raw = await dependencies.storage.get();
      // No pending withdraw blob — nothing to sync; not a Soft Signal fire.
      if (!raw) return { status: "idle" };
      // Order matters: re-assert local lock before retrying remote.
      dependencies.clearProtectedRuntime();
      try {
        const pending = JSON.parse(raw) as Pending;
        // Fail closed: incomplete pending is not “idle success.”
        if (!pending.sessionId || !pending.idempotencyKey)
          throw new Error("invalid");
        return synchronize(pending);
      } catch {
        // Corrupt storage: still report pending_sync so product does not resume lightly.
        return { status: "stopped_pending_sync" };
      }
    },
  };
}
