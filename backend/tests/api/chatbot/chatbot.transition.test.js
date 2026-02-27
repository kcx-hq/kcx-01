import { beforeEach, describe, it } from "vitest";
import { assertErrorContract } from "../../helpers/apiAssertions.js";
import { createApiClient } from "../../helpers/apiApp.js";
import {
  createChatSessionFixture,
  resetFactoryState,
} from "../../helpers/factories.js";
import { createTwoTenantScenario } from "../../helpers/tenancy.js";

describe("chatbot state transition api", () => {
  beforeEach(() => {
    resetFactoryState();
  });

  it("returns conflict contract for invalid abandoned -> completed confirm transition", async () => {
    const client = await createApiClient();
    const { tenantA } = await createTwoTenantScenario();

    const session = await createChatSessionFixture({
      client_id: tenantA.client.id,
      status: "abandoned",
      step_index: 11,
      requirements: { meeting: { want: "yes" } },
    });

    const response = await client.post("/api/chatbot/message", {
      headers: tenantA.authHeaders,
      body: {
        sessionId: session.id,
        message: "confirm",
      },
    });

    assertErrorContract(response, {
      status: 409,
      code: "CONFLICT",
      message: "Conflict",
    });
  });
});
