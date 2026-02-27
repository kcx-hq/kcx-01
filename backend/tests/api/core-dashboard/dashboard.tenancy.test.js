import { beforeEach, describe, it } from "vitest";
import { assertErrorContract } from "../../helpers/apiAssertions.js";
import { createApiClient } from "../../helpers/apiApp.js";
import {
  createBillingUploadFixture,
  resetFactoryState,
} from "../../helpers/factories.js";
import { createTwoTenantScenario } from "../../helpers/tenancy.js";

describe("core-dashboard tenant isolation api", () => {
  beforeEach(() => {
    resetFactoryState();
  });

  it("rejects cross-tenant upload ids on analytics endpoints", async () => {
    const client = await createApiClient();
    const { tenantA, tenantB } = await createTwoTenantScenario();

    const upload = await createBillingUploadFixture({
      clientid: tenantA.client.id,
      uploadedby: tenantA.user.id,
    });

    const response = await client.get("/api/dashboard/analytics/cost-analysis/analysis", {
      headers: tenantB.authHeaders,
      query: {
        uploadIds: upload.uploadid,
        provider: "All",
        service: "All",
        region: "All",
      },
    });

    assertErrorContract(response, {
      status: 403,
      code: "UNAUTHORIZED",
      message: "You do not have permission to perform this action",
    });
  });
});
