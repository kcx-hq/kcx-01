import { beforeEach, describe, expect, it } from "vitest";
import { assertErrorContract, assertNoSensitiveLeak } from "../../helpers/apiAssertions.js";
import { createApiClient } from "../../helpers/apiApp.js";
import { createAuthIdentity } from "../../helpers/authFixtures.js";
import { resetFactoryState } from "../../helpers/factories.js";

describe("auth protected and permission routes", () => {
  beforeEach(() => {
    resetFactoryState();
  });

  it("denies access to protected profile endpoint without auth", async () => {
    const client = await createApiClient();
    const response = await client.get("/api/auth/me");

    assertErrorContract(response, {
      status: 401,
      code: "UNAUTHENTICATED",
      message: "Authentication required",
    });
  });

  it("allows access to protected profile endpoint with bearer token", async () => {
    const client = await createApiClient();
    const identity = await createAuthIdentity({
      user: { email: "auth.me@example.test", full_name: "Profile User" },
    });

    const response = await client.get("/api/auth/me", {
      headers: identity.authHeaders,
    });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toEqual(
      expect.objectContaining({
        id: identity.user.id,
        email: identity.user.email,
        full_name: "Profile User",
        role: identity.user.role,
      }),
    );
  });

  it("denies internal credential endpoint for insufficient role", async () => {
    const client = await createApiClient();
    const identity = await createAuthIdentity({
      role: "USER",
      user: { email: "auth.user@example.test" },
    });

    const response = await client.post("/internal/cloud-account-credentials", {
      headers: identity.authHeaders,
      body: {
        clientId: identity.client.id,
        accountId: "123456789012",
        accessKey: "AKIAUSERACCESSKEY",
        secretAccessKey: "user-secret-access-key",
        region: "us-east-1",
      },
    });

    assertErrorContract(response, {
      status: 403,
      code: "UNAUTHORIZED",
      message: "You do not have permission to perform this action",
    });
  });

  it("allows admin role past permission gate and enforces controller validation contract", async () => {
    const client = await createApiClient();
    const identity = await createAuthIdentity({
      role: "ADMIN",
      user: { email: "auth.admin@example.test" },
    });

    const response = await client.post("/internal/cloud-account-credentials", {
      headers: identity.authHeaders,
      body: {
        clientId: identity.client.id,
        accountId: "invalid-account",
        accessKey: "AKIAADMINACCESSKEY",
        secretAccessKey: "admin-secret-access-key",
        region: "us-east-1",
      },
    });

    assertErrorContract(response, {
      status: 400,
      code: "VALIDATION_ERROR",
      message: "Invalid request",
    });
    assertNoSensitiveLeak(response);
  });
});
