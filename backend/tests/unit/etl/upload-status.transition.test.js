import { describe, expect, it } from "vitest";
import {
  assertBillingUploadTransition,
  getBillingUploadTransitionResult,
} from "../../../src/modules/shared/ETL/lib/uploadStatus.utils.js";

describe("etl upload status transition rules", () => {
  it.each([
    ["PENDING", "PROCESSING", true, "UPLOAD_STATUS_ALLOWED"],
    ["PROCESSING", "COMPLETED", true, "UPLOAD_STATUS_ALLOWED"],
    ["PROCESSING", "FAILED", true, "UPLOAD_STATUS_ALLOWED"],
    ["COMPLETED", "PROCESSING", false, "UPLOAD_STATUS_INVALID"],
    ["FAILED", "COMPLETED", false, "UPLOAD_STATUS_INVALID"],
    ["UNKNOWN", "PENDING", false, "UPLOAD_STATUS_UNKNOWN_TRANSITION"],
  ])(
    "evaluates transition %s -> %s",
    (fromStatus, toStatus, allowed, code) => {
      const result = getBillingUploadTransitionResult(fromStatus, toStatus);
      expect(result.allowed).toBe(allowed);
      expect(result.code).toBe(code);
    },
  );

  it("throws conflict on disallowed transition", () => {
    try {
      assertBillingUploadTransition("COMPLETED", "PROCESSING");
      throw new Error("expected transition to throw");
    } catch (error) {
      expect(error.status).toBe(409);
      expect(error.code).toBe("CONFLICT");
      expect(error.safeMessage).toBe("Conflict");
    }
  });
});
