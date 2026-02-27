import { beforeEach, describe, expect, it } from "vitest";
import { assertErrorContract } from "../../helpers/apiAssertions.js";
import { createApiClient } from "../../helpers/apiApp.js";
import { createAuthIdentity } from "../../helpers/authFixtures.js";
import { resetFactoryState } from "../../helpers/factories.js";

describe("core-dashboard smoke api", () => {
  beforeEach(() => {
    resetFactoryState();
  });

  it("denies analytics endpoint access without authentication", async () => {
    const client = await createApiClient();
    const response = await client.get("/api/dashboard/analytics/cost-analysis/analysis");

    assertErrorContract(response, {
      status: 401,
      code: "UNAUTHENTICATED",
      message: "Authentication required",
    });
  });

  it("returns validation contract when upload ids are missing for cost analysis", async () => {
    const client = await createApiClient();
    const identity = await createAuthIdentity({
      user: { email: "dashboard.cost.analysis@example.test" },
    });

    const response = await client.get("/api/dashboard/analytics/cost-analysis/analysis", {
      headers: identity.authHeaders,
      query: {
        provider: "All",
        service: "All",
        region: "All",
      },
    });

    assertErrorContract(response, {
      status: 400,
      code: "VALIDATION_ERROR",
      message: "Invalid request",
    });
  });

  it("returns cost-drivers smoke response contract", async () => {
    const client = await createApiClient();
    const identity = await createAuthIdentity({
      user: { email: "dashboard.drivers@example.test" },
    });

    const response = await client.get("/api/dashboard/analytics/cost-drivers/analysis", {
      headers: identity.authHeaders,
    });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toEqual(
      expect.objectContaining({
        increases: expect.any(Array),
        decreases: expect.any(Array),
        overallStats: expect.any(Object),
      }),
    );
  });

  it("returns resources smoke response contract", async () => {
    const client = await createApiClient();
    const identity = await createAuthIdentity({
      user: { email: "dashboard.resources@example.test" },
    });

    const response = await client.get("/api/dashboard/analytics/resources/inventory", {
      headers: identity.authHeaders,
    });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toEqual(
      expect.objectContaining({
        inventory: expect.any(Array),
        stats: expect.any(Object),
      }),
    );
  });

  it("returns data-quality smoke response contract", async () => {
    const client = await createApiClient();
    const identity = await createAuthIdentity({
      user: { email: "dashboard.quality@example.test" },
    });

    const response = await client.get("/api/dashboard/analytics/data-quality/analysis", {
      headers: identity.authHeaders,
    });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toEqual(
      expect.objectContaining({
        score: expect.any(Number),
        totalRows: expect.any(Number),
      }),
    );
  });
});
