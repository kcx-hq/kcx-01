import { beforeEach, describe, expect, it } from "vitest";
import { User } from "../../../src/models/index.js";
import {
  verifyUserOtp,
} from "../../../src/modules/shared/auth/auth.service.js";
import {
  createUserFixture,
  resetFactoryState,
} from "../../helpers/factories.js";

describe("auth verification transition integration", () => {
  beforeEach(() => {
    resetFactoryState();
  });

  it("rejects verify transition when user is already verified and leaves row unchanged", async () => {
    const user = await createUserFixture({
      email: "verified@example.test",
      is_verified: true,
      verification_otp: "101010",
      verification_otp_expires: new Date("2036-01-01T00:00:00.000Z"),
    });

    await expect(
      verifyUserOtp({
        email: user.email,
        otp: "101010",
        now: new Date("2030-01-01T00:00:00.000Z"),
      }),
    ).rejects.toMatchObject({
      status: 400,
      code: "VALIDATION_ERROR",
    });

    const reloaded = await User.findByPk(user.id);
    expect(reloaded.is_verified).toBe(true);
    expect(reloaded.verification_otp).toBe("101010");
  });
});
