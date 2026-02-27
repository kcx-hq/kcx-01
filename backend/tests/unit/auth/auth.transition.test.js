import { describe, expect, it } from "vitest";
import {
  buildAuthIdentityKey,
} from "../../../src/modules/shared/auth/auth.utils.js";
import {
  assertAuthVerificationTransition,
  getAuthVerificationTransition,
} from "../../../src/modules/shared/auth/lib/authTransition.utils.js";

describe("auth verification transition rules", () => {
  it.each([
    ["UNVERIFIED", "VERIFIED", true, "AUTH_VERIFICATION_ALLOWED"],
    ["VERIFIED", "VERIFIED", true, "AUTH_VERIFICATION_IDEMPOTENT"],
    ["VERIFIED", "UNVERIFIED", false, "AUTH_VERIFICATION_INVALID"],
    ["UNKNOWN", "VERIFIED", false, "AUTH_VERIFICATION_INVALID"],
  ])(
    "evaluates transition %s -> %s",
    (fromState, toState, allowed, code) => {
      const result = getAuthVerificationTransition(fromState, toState);
      expect(result.allowed).toBe(allowed);
      expect(result.code).toBe(code);
    },
  );

  it("throws AppError on disallowed transition", () => {
    try {
      assertAuthVerificationTransition("VERIFIED", "UNVERIFIED");
      throw new Error("expected transition to throw");
    } catch (error) {
      expect(error.status).toBe(400);
      expect(error.code).toBe("VALIDATION_ERROR");
      expect(error.safeMessage).toBe("Invalid request");
    }
  });
});

describe("auth idempotency key", () => {
  it("returns same identity key for equivalent normalized input", () => {
    const keyA = buildAuthIdentityKey({
      email: "User@One.Example",
      clientEmail: "CLIENT@One.Example",
    });
    const keyB = buildAuthIdentityKey({
      email: " user@one.example ",
      clientEmail: "client@one.example",
    });

    expect(keyA).toBe("user@one.example::client@one.example");
    expect(keyB).toBe(keyA);
  });

  it("returns different identity key for different tenant identity", () => {
    const keyA = buildAuthIdentityKey({
      email: "user@one.example",
      clientEmail: "one@example.test",
    });
    const keyB = buildAuthIdentityKey({
      email: "user@one.example",
      clientEmail: "two@example.test",
    });

    expect(keyA).not.toBe(keyB);
  });
});
