import { describe, expect, it } from "vitest";
import {
  buildPendingInquiryKey,
} from "../../../src/modules/shared/inquiry/lib/inquiryIdempotency.utils.js";
import {
  assertInquiryTransition,
  getInquiryTransitionResult,
} from "../../../src/modules/shared/inquiry/lib/inquiryTransition.utils.js";

describe("inquiry transition rules", () => {
  it.each([
    ["PENDING", "ACCEPTED", true, "INQUIRY_TRANSITION_ALLOWED"],
    ["PENDING", "REJECTED", true, "INQUIRY_TRANSITION_ALLOWED"],
    ["ACCEPTED", "REJECTED", false, "INQUIRY_TRANSITION_CONFLICT"],
    ["REJECTED", "ACCEPTED", false, "INQUIRY_TRANSITION_CONFLICT"],
    ["UNKNOWN", "ACCEPTED", false, "INQUIRY_TRANSITION_INVALID"],
  ])(
    "evaluates transition %s -> %s",
    (fromStatus, toStatus, allowed, code) => {
      const result = getInquiryTransitionResult(fromStatus, toStatus);
      expect(result.allowed).toBe(allowed);
      expect(result.code).toBe(code);
    },
  );

  it("throws conflict on disallowed transition", () => {
    try {
      assertInquiryTransition("ACCEPTED", "REJECTED");
      throw new Error("expected transition to throw");
    } catch (error) {
      expect(error.status).toBe(409);
      expect(error.code).toBe("CONFLICT");
      expect(error.safeMessage).toBe("Conflict");
    }
  });
});

describe("inquiry idempotency key", () => {
  it("returns same key for equivalent values", () => {
    const first = buildPendingInquiryKey({
      email: "User@Example.com ",
      preferred_datetime: "2026-05-10T10:00:00.000Z",
      timezone: "UTC",
    });
    const second = buildPendingInquiryKey({
      email: " user@example.com",
      preferred_datetime: new Date("2026-05-10T10:00:00.000Z"),
      timezone: "UTC ",
    });

    expect(first).toBe("user@example.com::2026-05-10T10:00:00.000Z::UTC");
    expect(second).toBe(first);
  });

  it("returns different key when preferred datetime changes", () => {
    const first = buildPendingInquiryKey({
      email: "user@example.com",
      preferred_datetime: "2026-05-10T10:00:00.000Z",
      timezone: "UTC",
    });
    const second = buildPendingInquiryKey({
      email: "user@example.com",
      preferred_datetime: "2026-05-10T11:00:00.000Z",
      timezone: "UTC",
    });

    expect(first).not.toBe(second);
  });
});
