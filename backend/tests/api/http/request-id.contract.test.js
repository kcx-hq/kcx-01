import { describe, expect, it } from "vitest";
import { assertErrorContract } from "../../helpers/apiAssertions.js";
import { createApiClient } from "../../helpers/apiApp.js";

describe("request id contract", () => {
  it("echoes x-request-id header on successful responses", async () => {
    const client = await createApiClient();
    const response = await client.get("/healthz", {
      headers: { "x-request-id": "req-health-123" },
    });

    expect(response.status).toBe(200);
    expect(response.headers["x-request-id"]).toBe("req-health-123");
    expect(response.body).toEqual({
      success: true,
      data: { status: "ok" },
    });
  }, 15000);

  it("propagates x-request-id into standardized error envelope", async () => {
    const client = await createApiClient();
    const response = await client.get("/api/v1/auth/me", {
      headers: { "x-request-id": "req-auth-401" },
    });

    assertErrorContract(response, {
      status: 401,
      code: "UNAUTHENTICATED",
      message: "Authentication required",
    });
    expect(response.body.requestId).toBe("req-auth-401");
    expect(response.headers["x-request-id"]).toBe("req-auth-401");
  }, 15000);
});
