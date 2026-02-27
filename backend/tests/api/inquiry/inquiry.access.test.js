import { beforeEach, describe, it } from "vitest";
import { assertErrorContract } from "../../helpers/apiAssertions.js";
import { createApiClient } from "../../helpers/apiApp.js";
import { createAuthIdentity } from "../../helpers/authFixtures.js";
import {
  createInquiryFixture,
  resetFactoryState,
} from "../../helpers/factories.js";

describe("inquiry access and transition api", () => {
  beforeEach(() => {
    resetFactoryState();
  });

  it("returns not-found contract for missing inquiry", async () => {
    const client = await createApiClient();
    const identity = await createAuthIdentity({
      user: { email: "inquiry.notfound@example.test" },
    });

    const response = await client.get(
      "/api/inquiry/accept/00000000-0000-4000-8000-999999999999",
      {
        headers: identity.authHeaders,
        query: { token: "missing-token" },
      },
    );

    assertErrorContract(response, {
      status: 404,
      code: "NOT_FOUND",
      message: "Not found",
    });
  });

  it("forbids action token mismatch across inquiry records", async () => {
    const client = await createApiClient();
    const identityA = await createAuthIdentity({
      user: { email: "inquiry.a@example.test" },
    });
    await createAuthIdentity({
      user: { email: "inquiry.b@example.test" },
    });

    const inquiryA = await createInquiryFixture({
      status: "PENDING",
      action_token: "token-a",
    });
    await createInquiryFixture({
      status: "PENDING",
      action_token: "token-b",
    });

    const response = await client.get(`/api/inquiry/reject/${inquiryA.id}`, {
      headers: identityA.authHeaders,
      query: { token: "token-b" },
    });

    assertErrorContract(response, {
      status: 403,
      code: "UNAUTHORIZED",
      message: "You do not have permission to perform this action",
    });
  });

  it("returns conflict on invalid status transition", async () => {
    const client = await createApiClient();
    const identity = await createAuthIdentity({
      user: { email: "inquiry.transition@example.test" },
    });
    const inquiry = await createInquiryFixture({
      status: "ACCEPTED",
      action_token: "token-transition",
    });

    const response = await client.get(`/api/inquiry/reject/${inquiry.id}`, {
      headers: identity.authHeaders,
      query: { token: "token-transition" },
    });

    assertErrorContract(response, {
      status: 409,
      code: "CONFLICT",
      message: "Conflict",
    });
  });
});
