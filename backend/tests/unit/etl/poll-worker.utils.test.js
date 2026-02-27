import { describe, expect, it, vi } from "vitest";
import {
  buildPollJobPayload,
  computeWorkerSleepMs,
  isPollCandidate,
  sortIntegrationsForPolling,
  toWorkerErrorMessage,
} from "../../../src/modules/shared/ETL/lib/pollWorker.utils.js";

describe("etl poll worker utility rules", () => {
  it.each([
    [{ enabled: true, clientid: "c1", bucket: "b1" }, true],
    [{ enabled: false, clientid: "c1", bucket: "b1" }, false],
    [{ enabled: true, clientid: "", bucket: "b1" }, false],
    [{ enabled: true, clientid: "c1", bucket: "" }, false],
  ])("checks candidate eligibility for %p", (integration, expected) => {
    expect(isPollCandidate(integration)).toBe(expected);
  });

  it("sorts integrations by lastpolledat ascending then id", () => {
    const sorted = sortIntegrationsForPolling([
      { id: "b", lastpolledat: "2026-05-01T00:00:00.000Z" },
      { id: "a", lastpolledat: null },
      { id: "c", lastpolledat: "2026-05-01T00:00:00.000Z" },
    ]);

    expect(sorted.map((item) => item.id)).toEqual(["a", "b", "c"]);
  });

  it("builds deterministic poll payload for worker tick", () => {
    const payload = buildPollJobPayload({
      clientid: "client-1",
      bucket: "billing-bucket",
      prefix: "billing/",
    });

    expect(payload).toEqual({
      clientid: "client-1",
      Bucket: "billing-bucket",
      prefix: "billing/",
      uploadedby: "00000000-0000-0000-0000-000000000001",
    });
  });

  it("computes worker sleep without waiting in real time", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-01T00:00:25.000Z"));

    const waitMs = computeWorkerSleepMs({
      intervalMs: 60_000,
      startedAtMs: new Date("2026-06-01T00:00:00.000Z").getTime(),
      nowMs: Date.now(),
      minimumMs: 10_000,
    });

    expect(waitMs).toBe(35_000);
    vi.useRealTimers();
  });

  it("clamps sleep to minimum when elapsed time exceeds interval", () => {
    const waitMs = computeWorkerSleepMs({
      intervalMs: 10_000,
      startedAtMs: 0,
      nowMs: 50_000,
      minimumMs: 10_000,
    });

    expect(waitMs).toBe(10_000);
  });

  it("normalizes worker errors into safe messages", () => {
    expect(toWorkerErrorMessage(new Error("s3 timeout"))).toBe("s3 timeout");
    expect(toWorkerErrorMessage("failure")).toBe("failure");
  });
});
