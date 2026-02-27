import { beforeEach, describe, expect, it } from "vitest";
import { assertErrorContract, assertNoSensitiveLeak } from "../../helpers/apiAssertions.js";
import { createApiClient } from "../../helpers/apiApp.js";
import { createAuthIdentity } from "../../helpers/authFixtures.js";
import { resetFactoryState } from "../../helpers/factories.js";

describe("auth login api", () => {
  beforeEach(() => {
    resetFactoryState();
  });

  it("logs in successfully and returns identity contract with auth cookie", async () => {
    const client = await createApiClient();
    const identity = await createAuthIdentity({
      user: { email: "auth.login@example.test", full_name: "Login User" },
      password: "LoginPassword#1",
    });

    const response = await client.post("/api/auth/login", {
      body: {
        email: identity.user.email,
        password: identity.password,
      },
    });

    expect(response.status).toBe(200);
    expect(response.body).toEqual(
      expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          message: "Login successful",
          user: expect.objectContaining({
            id: identity.user.id,
            email: identity.user.email,
            role: identity.user.role,
          }),
          hasUploaded: false,
        }),
      }),
    );
    expect(response.headers["set-cookie"]).toEqual(
      expect.arrayContaining([expect.stringContaining("kandco_token=")]),
    );
    assertNoSensitiveLeak(response);
  });

  it("returns standardized error for invalid credentials", async () => {
    const client = await createApiClient();
    const identity = await createAuthIdentity({
      user: { email: "auth.invalid@example.test" },
      password: "ValidPassword#1",
    });

    const response = await client.post("/api/auth/signin", {
      body: {
        email: identity.user.email,
        password: "WrongPassword#1",
      },
    });

    assertErrorContract(response, {
      status: 401,
      code: "UNAUTHENTICATED",
      message: "Authentication required",
    });
  });
});
