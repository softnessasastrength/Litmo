/**
 * Campfire / circle pure helpers — multi-person readiness seats and timer math.
 *
 * WHAT: Create/resize/toggle circle seats; gate start; format and progress timers.
 * WHY: Keep circle UI free of duplicated clamp logic; testable without React Native.
 * CONSENT: Seat "ready" is circle choreography readiness only — never Consent Snapshot yes.
 * EDGE CASES: Seat count clamped 2–8; timer floors at zero.
 * NEVER: Treat all-seats-ready as dual-confirm or session activate.
 * SEE: campfire / circle screens if present · docs/CODE_COMMENT_STANDARD.md
 */

/**
 * WHAT: One seat in a campfire circle (label + ready flag).
 * WHY: UI maps people positions without inventing identity or consent state.
 * CONSENT: ready is not session consent or Soft Signal.
 * EDGE CASES: Labels are generic “Person N” unless UI overrides.
 * NEVER: Store legal identity or trust scores on seats.
 */
export type CircleSeat = {
  id: number;
  label: string;
  /** Local ready toggle for circle start gate — not Consent Snapshot affirm. */
  ready: boolean;
};

/**
 * WHAT: Build a fresh seat array of clamped size with ready=false.
 * WHY: New circles start unset so nobody is pre-marked ready.
 * CONSENT: All ready false by default — fail closed for start.
 * EDGE CASES: count rounded then clamped to [2, 8].
 * NEVER: Default ready true; expand past 8 without product decision.
 */
export function createCircleSeats(count: number): CircleSeat[] {
  const safeCount = Math.max(2, Math.min(8, Math.round(count)));
  return Array.from({ length: safeCount }, (_, index) => ({
    id: index + 1,
    label: `Person ${index + 1}`,
    ready: false,
  }));
}

/**
 * WHAT: Resize seat list while preserving ready flags for overlapping indices.
 * WHY: Adjusting circle size should not wipe explicit ready toggles for remaining seats.
 * CONSENT: New seats start ready false (createCircleSeats default).
 * EDGE CASES: Shrinking drops higher indices; growing adds unset seats.
 * NEVER: Copy ready from non-adjacent seats by id mismatch.
 */
export function resizeCircleSeats(
  seats: CircleSeat[],
  count: number,
): CircleSeat[] {
  return createCircleSeats(count).map((seat, index) => ({
    ...seat,
    ready: seats[index]?.ready ?? false,
  }));
}

/**
 * WHAT: Flip ready for a single seat id (immutable map).
 * WHY: Explicit per-person toggle; no auto-ready from presence detection.
 * CONSENT: Toggle is circle readiness only — not snapshot confirm.
 * EDGE CASES: Unknown seatId → no change (map identity).
 * NEVER: Toggle all seats ready from NFC scan or timer alone.
 */
export function toggleCircleSeat(
  seats: CircleSeat[],
  seatId: number,
): CircleSeat[] {
  return seats.map((seat) =>
    seat.id === seatId ? { ...seat, ready: !seat.ready } : seat,
  );
}

/**
 * WHAT: Whether the circle may start (min 2 seats and every seat ready).
 * WHY: Prevent starting a multi-person flow with missing readiness.
 * CONSENT: canStart true is still not Consent Snapshot dual-confirm.
 * EDGE CASES: empty or single seat → false; any unready → false.
 * NEVER: Bypass for “host only” auto-start of contact.
 */
export function canStartCircle(seats: CircleSeat[]): boolean {
  return seats.length >= 2 && seats.every((seat) => seat.ready);
}

/**
 * WHAT: Format remaining/total seconds as m:ss for campfire timer UI.
 * WHY: Shared display without Date objects or locale ambiguity.
 * CONSENT: Not a consent surface — pure display transform.
 * EDGE CASES: Negative inputs floor to 0; fractional seconds floor.
 * NEVER: Use formatted time as proof session consent remains valid.
 */
export function formatCampfireTime(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

/**
 * WHAT: Normalize elapsed fraction in [0, 1] from remaining vs total seconds.
 * WHY: Progress bars need a clamped ratio without NaN when total is 0.
 * CONSENT: Not a consent surface.
 * EDGE CASES: totalSeconds <= 0 → 0 (fail closed empty progress).
 * NEVER: Treat progress === 1 as auto-consent or Soft Signal fire.
 */
export function campfireProgress(
  remainingSeconds: number,
  totalSeconds: number,
): number {
  if (totalSeconds <= 0) return 0;
  return Math.max(
    0,
    Math.min(1, (totalSeconds - remainingSeconds) / totalSeconds),
  );
}
