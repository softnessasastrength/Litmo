import assert from "node:assert/strict";
import test from "node:test";
import {
  campfireProgress,
  canStartCircle,
  createCircleSeats,
  formatCampfireTime,
  resizeCircleSeats,
  toggleCircleSeat,
} from "./campfireCore.ts";

test("circle requires every participant to opt in", () => {
  let seats = createCircleSeats(3);
  assert.equal(canStartCircle(seats), false);
  seats = toggleCircleSeat(seats, 1);
  seats = toggleCircleSeat(seats, 2);
  assert.equal(canStartCircle(seats), false);
  seats = toggleCircleSeat(seats, 3);
  assert.equal(canStartCircle(seats), true);
});

test("circle size is bounded and preserved seats keep their choice", () => {
  let seats = createCircleSeats(1);
  assert.equal(seats.length, 2);
  seats = toggleCircleSeat(seats, 1);
  seats = resizeCircleSeats(seats, 10);
  assert.equal(seats.length, 8);
  assert.equal(seats[0]?.ready, true);
  assert.equal(seats[2]?.ready, false);
});

test("timer formatting and progress fail conservatively", () => {
  assert.equal(formatCampfireTime(65), "1:05");
  assert.equal(formatCampfireTime(-2), "0:00");
  assert.equal(campfireProgress(300, 600), 0.5);
  assert.equal(campfireProgress(-1, 600), 1);
  assert.equal(campfireProgress(700, 600), 0);
  assert.equal(campfireProgress(10, 0), 0);
});
