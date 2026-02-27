import { vi } from "vitest";

let timeIsFrozen = false;

export function freezeTime(value) {
  const date = value instanceof Date ? new Date(value.getTime()) : new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid date value provided to freezeTime: ${String(value)}`);
  }

  vi.useFakeTimers();
  vi.setSystemTime(date);
  timeIsFrozen = true;

  return date;
}

export function advanceTimeBy(milliseconds) {
  if (!Number.isFinite(milliseconds) || milliseconds < 0) {
    throw new Error("advanceTimeBy requires a non-negative number of milliseconds.");
  }

  if (!timeIsFrozen) {
    throw new Error("advanceTimeBy can only be called after freezeTime.");
  }

  vi.advanceTimersByTime(milliseconds);
}

export function restoreTime() {
  if (!timeIsFrozen) {
    return;
  }

  vi.useRealTimers();
  timeIsFrozen = false;
}
