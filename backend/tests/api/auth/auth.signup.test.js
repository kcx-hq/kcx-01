import { beforeEach, describe, expect, it } from "vitest";
import { createApiClient } from "../../helpers/apiApp.js";
import { resetFactoryState } from "../../helpers/factories.js";

describe("auth signup api", () => {
  beforeEach(() => {
    resetFactoryState();
  });

  it("allows public signup and returns success envelope", async () => {
    const client = await createApiClient({
      mocks: [
        {
          path: "../../src/utils/sendEmail.js",
          factory: () => ({
            sendVerificationEmail: async () => ({ success: true }),
            sendEmail: async () => ({ success: true }),
          }),
        },
      ],
    });

    const unique = Date.now();
    const response = await client.post("/api/v1/auth/signup", {
      body: {
        email: `signup.${unique}@example.test`,
        password: "SignupPassword#1",
        full_name: "Signup Test User",
        role: "USER",
      },
    });

    expect(response.status).toBe(201);
    expect(response.body).toEqual(
      expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          message: "User registered successfully. Please verify your email.",
          user: expect.objectContaining({
            email: expect.stringContaining(`signup.${unique}`),
            role: "USER",
          }),
        }),
      }),
    );
  });
});
