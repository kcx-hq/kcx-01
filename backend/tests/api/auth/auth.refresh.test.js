import jwt from "jsonwebtoken";
import { beforeEach, describe, expect, it } from "vitest";
import { assertErrorContract } from "../../helpers/apiAssertions.js";
import { createApiClient } from "../../helpers/apiApp.js";
import { createAuthIdentity } from "../../helpers/authFixtures.js";
import { resetFactoryState } from "../../helpers/factories.js";

describe("auth session continuation api", () => {
  beforeEach(() => {
    resetFactoryState();
  });

  it("reuses auth cookie after login to access protected identity endpoint", async () => {
    const client = await createApiClient();
    const identity = await createAuthIdentity({
      user: { email: "auth.refresh@example.test", full_name: "Refresh User" },
      password: "RefreshPassword#1",
    });

    const loginResponse = await client.post("/api/auth/login", {
      body: {
        email: identity.user.email,
        password: identity.password,
      },
    });
    const cookie = (loginResponse.headers["set-cookie"] || [])[0];

    const meResponse = await client.get("/api/auth/me", {
      headers: { Cookie: cookie },
    });

    expect(meResponse.status).toBe(200);
    expect(meResponse.body.success).toBe(true);
    expect(meResponse.body.data).toEqual(
      expect.objectContaining({
        id: identity.user.id,
        email: identity.user.email,
        full_name: "Refresh User",
      }),
    );
  });

  it("returns unauthenticated error for expired bearer token", async () => {
    const client = await createApiClient();
    const identity = await createAuthIdentity({
      user: { email: "auth.expired@example.test" },
    });

    const expiredToken = jwt.sign(
      {
        id: identity.user.id,
        role: identity.user.role,
        client_id: identity.user.client_id,
      },
      process.env.JWT_SECRET,
      { expiresIn: -10 },
    );

    const response = await client.get("/api/auth/me", {
      headers: { Authorization: `Bearer ${expiredToken}` },
    });

    assertErrorContract(response, {
      status: 401,
      code: "UNAUTHENTICATED",
      message: "Authentication required",
    });
  });
});
