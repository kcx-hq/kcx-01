import { beforeEach, describe, it } from "vitest";
import { assertErrorContract } from "../../helpers/apiAssertions.js";
import { createApiClient } from "../../helpers/apiApp.js";
import { resetFactoryState } from "../../helpers/factories.js";
import { createTwoTenantScenario } from "../../helpers/tenancy.js";

describe("chatbot tenant isolation api", () => {
  beforeEach(() => {
    resetFactoryState();
  });

  it("blocks cross-tenant session access", async () => {
    const client = await createApiClient();
    const { tenantA, tenantB } = await createTwoTenantScenario();

    const createResponse = await client.post("/api/chatbot/session", {
      headers: tenantA.authHeaders,
    });
    const sessionId = createResponse.body.data.sessionId;

    const response = await client.post("/api/chatbot/message", {
      headers: tenantB.authHeaders,
      body: {
        sessionId,
        message: "help",
      },
    });

    assertErrorContract(response, {
      status: 403,
      code: "UNAUTHORIZED",
      message: "You do not have permission to perform this action",
    });
  });
});
