import { beforeEach, describe, expect, it } from "vitest";
import { createApiClient } from "../../helpers/apiApp.js";
import {
  createBillingUploadFixture,
  resetFactoryState,
} from "../../helpers/factories.js";
import { createTwoTenantScenario } from "../../helpers/tenancy.js";

describe("etl tenant isolation api", () => {
  beforeEach(() => {
    resetFactoryState();
  });

  it("returns only uploads for authenticated tenant", async () => {
    const client = await createApiClient();
    const { tenantA, tenantB } = await createTwoTenantScenario();

    await createBillingUploadFixture({
      clientid: tenantA.client.id,
      uploadedby: tenantA.user.id,
    });

    const response = await client.get("/api/etl/get-billing-uploads", {
      headers: tenantB.authHeaders,
    });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toEqual([]);
  });
});
