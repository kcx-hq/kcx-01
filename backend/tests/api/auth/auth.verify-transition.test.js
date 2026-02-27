import { beforeEach, describe, it } from "vitest";
import { assertErrorContract } from "../../helpers/apiAssertions.js";
import { createApiClient } from "../../helpers/apiApp.js";
import {
  createUserFixture,
  resetFactoryState,
} from "../../helpers/factories.js";

describe("auth verify transition api", () => {
  beforeEach(() => {
    resetFactoryState();
  });

  it("returns validation error when verify transition is invalid for already verified user", async () => {
    const client = await createApiClient();
    const user = await createUserFixture({
      email: "verified-api@example.test",
      is_verified: true,
      verification_otp: "111111",
      verification_otp_expires: new Date("2036-01-01T00:00:00.000Z"),
    });

    const response = await client.post("/api/auth/verify-email", {
      body: {
        email: user.email,
        otp: "111111",
      },
    });

    assertErrorContract(response, {
      status: 400,
      code: "VALIDATION_ERROR",
      message: "Invalid request",
    });
  });
});
