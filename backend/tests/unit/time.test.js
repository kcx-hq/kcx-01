import { describe, expect, it } from "vitest";
import { advanceTimeBy, freezeTime } from "../helpers/time.js";

describe("time helper", () => {
  it("freezes and advances the system clock deterministically", () => {
    const frozenAt = freezeTime("2026-01-01T00:00:00.000Z");

    expect(frozenAt.toISOString()).toBe("2026-01-01T00:00:00.000Z");

    advanceTimeBy(1500);
    expect(Date.now()).toBe(new Date("2026-01-01T00:00:01.500Z").getTime());
  });
});
