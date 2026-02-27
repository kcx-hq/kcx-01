import { describe, expect, it } from "vitest";
import {
  buildS3IngestFingerprint,
  normalizeS3ObjectKey,
  parseAndValidateS3IngestPayload,
  toSafeString,
  validateAwsRegion,
  validateS3BucketName,
} from "../../../src/modules/shared/ETL/lib/s3Ingest.utils.js";

function buildValidPayload() {
  return {
    account: "123456789012",
    region: "us-east-1",
    detail: {
      bucket: { name: "billing-ingest-bucket" },
      object: {
        key: "reports%2Fbilling.csv",
        size: 1234,
        etag: "\"abc123\"",
        sequencer: "0001",
      },
    },
  };
}

describe("ETL s3Ingest utils", () => {
  it("trims safe strings", () => {
    expect(toSafeString("  abc  ")).toBe("abc");
    expect(toSafeString(null)).toBe("");
  });

  it.each([
    ["billing-bucket", true],
    ["a.b-c.1", true],
    ["INVALID_BUCKET", false],
    ["-bad", false],
  ])("validates S3 bucket %p", (bucket, expected) => {
    expect(validateS3BucketName(bucket)).toBe(expected);
  });

  it.each([
    ["us-east-1", true],
    ["ap-south-1", true],
    ["invalid-region", false],
    ["us_east_1", false],
  ])("validates AWS region %p", (region, expected) => {
    expect(validateAwsRegion(region)).toBe(expected);
  });

  it("normalizes URL-encoded S3 object key and accepts csv extensions", () => {
    expect(normalizeS3ObjectKey("folder%2Fbill.csv")).toBe("folder/bill.csv");
    expect(normalizeS3ObjectKey("folder%2Fbill.csv.gz")).toBe("folder/bill.csv.gz");
  });

  it("rejects non-csv object keys", () => {
    expect(() => normalizeS3ObjectKey("folder%2Fbill.txt")).toThrow(
      "Only CSV or CSV.GZ objects are accepted",
    );
  });

  it("parses and validates a correct S3 ingest payload", () => {
    const parsed = parseAndValidateS3IngestPayload(buildValidPayload());

    expect(parsed).toEqual({
      account: "123456789012",
      region: "us-east-1",
      bucket: "billing-ingest-bucket",
      s3Key: "reports/billing.csv",
      size: 1234,
      etag: "abc123",
      sequencer: "0001",
    });
  });

  it.each([
    ["bad-account", "Invalid account value"],
    ["bad-region", "Invalid region value"],
    ["bad-bucket", "Invalid bucket value"],
    ["bad-size", "Invalid object size"],
  ])("throws for %p payload", (variant, expectedMessage) => {
    const payload = buildValidPayload();

    if (variant === "bad-account") payload.account = "123";
    if (variant === "bad-region") payload.region = "useast1";
    if (variant === "bad-bucket") payload.detail.bucket.name = "UPPER_CASE";
    if (variant === "bad-size") payload.detail.object.size = -1;

    expect(() => parseAndValidateS3IngestPayload(payload)).toThrow(expectedMessage);
  });

  it("builds deterministic S3 ingest fingerprint", () => {
    expect(buildS3IngestFingerprint("etag-value", "seq-1")).toBe("etag-value:seq-1");
    expect(buildS3IngestFingerprint("", "")).toBe(":");
  });
});
