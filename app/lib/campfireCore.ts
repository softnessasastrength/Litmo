export type CircleSeat = {
  id: number;
  label: string;
  ready: boolean;
};

export function createCircleSeats(count: number): CircleSeat[] {
  const safeCount = Math.max(2, Math.min(8, Math.round(count)));
  return Array.from({ length: safeCount }, (_, index) => ({
    id: index + 1,
    label: `Person ${index + 1}`,
    ready: false,
  }));
}

export function resizeCircleSeats(
  seats: CircleSeat[],
  count: number,
): CircleSeat[] {
  return createCircleSeats(count).map((seat, index) => ({
    ...seat,
    ready: seats[index]?.ready ?? false,
  }));
}

export function toggleCircleSeat(
  seats: CircleSeat[],
  seatId: number,
): CircleSeat[] {
  return seats.map((seat) =>
    seat.id === seatId ? { ...seat, ready: !seat.ready } : seat,
  );
}

export function canStartCircle(seats: CircleSeat[]): boolean {
  return seats.length >= 2 && seats.every((seat) => seat.ready);
}

export function formatCampfireTime(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

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
