import { beforeEach, describe, expect, it } from "vitest";
import { assertErrorContract } from "../../helpers/apiAssertions.js";
import { createApiClient } from "../../helpers/apiApp.js";
import { createAuthIdentity } from "../../helpers/authFixtures.js";
import { resetFactoryState } from "../../helpers/factories.js";

describe("core-dashboard pagination and validation api", () => {
  beforeEach(() => {
    resetFactoryState();
  });

  it("returns deterministic pagination shape for data explorer", async () => {
    const client = await createApiClient();
    const identity = await createAuthIdentity({
      user: { email: "dashboard.pagination@example.test" },
    });

    const response = await client.get("/api/dashboard/overview/data-explorer", {
      headers: identity.authHeaders,
      query: {
        page: "2",
        limit: "15",
      },
    });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toEqual(
      expect.objectContaining({
        rows: expect.any(Array),
        total: expect.any(Number),
        page: 2,
        limit: 15,
      }),
    );
  });

  it("returns validation error contract for invalid governance owner payload", async () => {
    const client = await createApiClient();
    const identity = await createAuthIdentity({
      user: { email: "dashboard.validation@example.test" },
    });

    const response = await client.put(
      "/api/dashboard/governance/accounts/account-1/owner",
      {
        headers: identity.authHeaders,
        body: {
          owner: "",
          uploadIds: [],
        },
      },
    );

    assertErrorContract(response, {
      status: 400,
      code: "VALIDATION_ERROR",
      message: "Invalid request",
    });
  });
});
