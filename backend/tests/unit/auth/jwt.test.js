import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { signMock, verifyMock } = vi.hoisted(() => {
  return {
    signMock: vi.fn(),
    verifyMock: vi.fn(),
  };
});

vi.mock("jsonwebtoken", () => {
  return {
    default: {
      sign: signMock,
      verify: verifyMock,
    },
  };
});

import { generateJWT, verifyJWT } from "../../../src/utils/jwt.js";

describe("jwt wrappers", () => {
  const originalSecret = process.env.JWT_SECRET;
  const originalExpires = process.env.JWT_EXPIRES_IN;

  beforeEach(() => {
    signMock.mockReset();
    verifyMock.mockReset();
    process.env.JWT_SECRET = "unit-secret";
    process.env.JWT_EXPIRES_IN = "2h";
  });

  afterEach(() => {
    process.env.JWT_SECRET = originalSecret;
    process.env.JWT_EXPIRES_IN = originalExpires;
  });

  it("generateJWT forwards payload, secret, and expires option", () => {
    signMock.mockReturnValue("signed-token");
    const payload = { id: "user-1", role: "admin", client_id: "client-1" };

    const token = generateJWT(payload);

    expect(token).toBe("signed-token");
    expect(signMock).toHaveBeenCalledTimes(1);
    expect(signMock).toHaveBeenCalledWith(payload, "unit-secret", {
      expiresIn: "2h",
    });
  });

  it("generateJWT falls back to 1h when JWT_EXPIRES_IN is not set", () => {
    delete process.env.JWT_EXPIRES_IN;
    signMock.mockReturnValue("fallback-token");

    const token = generateJWT({ id: "u1" });

    expect(token).toBe("fallback-token");
    expect(signMock).toHaveBeenCalledWith(
      { id: "u1" },
      "unit-secret",
      { expiresIn: "1h" },
    );
  });

  it("verifyJWT forwards token and secret", () => {
    verifyMock.mockReturnValue({ id: "user-1", role: "admin" });

    const decoded = verifyJWT("token-value");

    expect(decoded).toEqual({ id: "user-1", role: "admin" });
    expect(verifyMock).toHaveBeenCalledTimes(1);
    expect(verifyMock).toHaveBeenCalledWith("token-value", "unit-secret");
  });
});
