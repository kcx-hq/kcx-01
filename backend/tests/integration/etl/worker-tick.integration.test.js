import { beforeEach, describe, expect, it, vi } from "vitest";
import { ClientS3Integrations } from "../../../src/models/index.js";
import { runPollWorkerTick } from "../../../src/modules/shared/ETL/pollOnce.js";
import {
  createClientS3IntegrationFixture,
  createClientFixture,
  resetFactoryState,
} from "../../helpers/factories.js";

describe("etl worker tick integration", () => {
  beforeEach(() => {
    resetFactoryState();
  });

  it("processes integrations once and updates poll metadata per outcome", async () => {
    const clientA = await createClientFixture({
      id: "00000000-0000-4000-8000-00000000a001",
      email: "worker-a@example.test",
    });
    const clientB = await createClientFixture({
      id: "00000000-0000-4000-8000-00000000b001",
      email: "worker-b@example.test",
    });

    const integrationA = await createClientS3IntegrationFixture({
      id: "00000000-0000-4000-8000-00000000aa01",
      clientid: clientA.id,
      bucket: "bucket-a",
      lastpolledat: null,
      enabled: true,
    });
    const integrationB = await createClientS3IntegrationFixture({
      id: "00000000-0000-4000-8000-00000000bb01",
      clientid: clientB.id,
      bucket: "bucket-b",
      lastpolledat: new Date("2026-01-01T00:00:00.000Z"),
      enabled: true,
    });

    const pollClientFn = vi
      .fn()
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error("s3 unreachable"));
    const now = new Date("2026-08-10T12:00:00.000Z");

    const result = await runPollWorkerTick({
      now,
      pollClientFn,
      loggerInstance: {
        info: () => {},
        warn: () => {},
        error: () => {},
      },
    });

    expect(result.processed).toBe(2);
    expect(result.succeeded).toBe(1);
    expect(result.failed).toBe(1);
    expect(pollClientFn).toHaveBeenCalledTimes(2);

    const reloadedA = await ClientS3Integrations.findByPk(integrationA.id);
    const reloadedB = await ClientS3Integrations.findByPk(integrationB.id);

    expect(new Date(reloadedA.lastpolledat).toISOString()).toBe(now.toISOString());
    expect(reloadedA.lasterror).toBeNull();

    expect(reloadedB.lasterror).toContain("s3 unreachable");
    expect(new Date(reloadedB.lastpolledat).toISOString()).toBe(
      new Date("2026-01-01T00:00:00.000Z").toISOString(),
    );
  });
});
