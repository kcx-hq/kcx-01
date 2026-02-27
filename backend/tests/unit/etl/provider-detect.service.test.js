import { describe, expect, it } from "vitest";
import { detectProvider } from "../../../src/modules/shared/ETL/provider-detect.service.js";

describe("ETL provider detection", () => {
  it("detects AWS when lineitem namespace appears", () => {
    expect(detectProvider(["lineItem/UsageAmount", "lineItem/UnblendedCost"])).toBe("aws");
  });

  it("detects Azure when subscriptionid exists", () => {
    expect(detectProvider(["SubscriptionId", "MeterName"])).toBe("azure");
  });

  it("detects GCP when projectid exists", () => {
    expect(detectProvider(["projectId", "service.description"])).toBe("gcp");
  });

  it("falls back to generic for unknown headers", () => {
    expect(detectProvider(["random_col_1", "random_col_2"])).toBe("generic");
  });
});
