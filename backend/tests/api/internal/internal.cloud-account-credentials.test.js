import { beforeEach, describe, expect, it } from "vitest";
import { assertErrorContract } from "../../helpers/apiAssertions.js";
import { createApiClient } from "../../helpers/apiApp.js";
import { resetFactoryState } from "../../helpers/factories.js";
import { createTwoTenantScenario } from "../../helpers/tenancy.js";

describe("internal cloud-account-credentials api", () => {
  beforeEach(() => {
    resetFactoryState();
  });

  it("uses authenticated client context instead of request body clientId", async () => {
    const client = await createApiClient();
    const { tenantA, tenantB } = await createTwoTenantScenario({
      tenantARole: "ADMIN",
    });

    const response = await client.post("/api/v1/internal/cloud-account-credentials", {
      headers: tenantA.authHeaders,
      body: {
        clientId: tenantB.client.id,
        accountId: "123456789012",
        accessKey: "AKIAEXAMPLEACCESS",
        secretAccessKey: "example-secret-access-key",
        region: "us-east-1",
      },
    });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data?.data?.clientId).toBe(tenantA.client.id);
    expect(response.body.data?.data?.accountId).toBe("123456789012");
    expect(response.body.data?.data?.region).toBe("us-east-1");
  });

  it("supports legacy and versioned internal paths", async () => {
    const client = await createApiClient();
    const { tenantA } = await createTwoTenantScenario({
      tenantARole: "ADMIN",
    });

    const legacy = await client.post("/internal/cloud-account-credentials", {
      headers: tenantA.authHeaders,
      body: {
        accountId: "210987654321",
        accessKey: "AKIALEGACYACCESS",
        secretAccessKey: "legacy-secret-access-key",
        region: "us-east-1",
      },
    });

    const versioned = await client.post("/api/internal/cloud-account-credentials", {
      headers: tenantA.authHeaders,
      body: {
        accountId: "999999999999",
        accessKey: "AKIAVERSIONEDACCESS",
        secretAccessKey: "versioned-secret-access-key",
        region: "us-east-1",
      },
    });

    expect(legacy.status).toBe(201);
    expect(legacy.body.success).toBe(true);
    expect(versioned.status).toBe(201);
    expect(versioned.body.success).toBe(true);
  });

  it("rejects non-admin access with standardized error contract", async () => {
    const client = await createApiClient();
    const { tenantB } = await createTwoTenantScenario({
      tenantBRole: "USER",
    });

    const response = await client.post("/api/v1/internal/cloud-account-credentials", {
      headers: tenantB.authHeaders,
      body: {
        accountId: "555555555555",
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
});
