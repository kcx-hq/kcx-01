import { describe, expect, it } from "vitest";
import { resolveDimensionIdsFromMaps } from "../../../src/modules/shared/ETL/dimensions/resolveFromMaps.js";

function createMaps() {
  return {
    cloudAccounts: new Map([["aws:123456789012", "cloud-1"]]),
    services: new Map([["aws:EC2", "service-1"]]),
    regions: new Map([["aws:us-east-1", "region-1"]]),
    skus: new Map([["sku-a", "sku-1"]]),
    resources: new Map([["res-a", "resource-1"]]),
    subAccounts: new Map([["sub-a", "sub-1"]]),
    commitmentDiscounts: new Map([["commit-a", "commit-1"]]),
  };
}

describe("ETL resolveDimensionIdsFromMaps", () => {
  it("resolves all known dimensions from maps", () => {
    const row = {
      providername: "AWS",
      billingaccountid: "123456789012",
      servicename: "EC2",
      regioncode: "us-east-1",
      skuid: "sku-a",
      resourceid: "res-a",
      subaccountid: "sub-a",
      commitmentdiscountid: "commit-a",
    };

    expect(resolveDimensionIdsFromMaps(row, createMaps())).toEqual({
      cloudaccountid: "cloud-1",
      serviceid: "service-1",
      regionid: "region-1",
      skuid: "sku-1",
      resourceid: "resource-1",
      subaccountid: "sub-1",
      commitmentdiscountid: "commit-1",
    });
  });

  it("returns null ids when provider-scoped keys are missing", () => {
    const row = {
      providername: null,
      billingaccountid: "123456789012",
      servicename: "EC2",
      regioncode: "us-east-1",
    };

    expect(resolveDimensionIdsFromMaps(row, createMaps())).toEqual({
      cloudaccountid: null,
      serviceid: null,
      regionid: null,
      skuid: null,
      resourceid: null,
      subaccountid: null,
      commitmentdiscountid: null,
    });
  });

  it("returns null when map lookup does not find a match", () => {
    const row = {
      providername: "AWS",
      billingaccountid: "missing",
      servicename: "missing-service",
      regioncode: "missing-region",
      skuid: "missing-sku",
      resourceid: "missing-resource",
      subaccountid: "missing-sub",
      commitmentdiscountid: "missing-commit",
    };

    expect(resolveDimensionIdsFromMaps(row, createMaps())).toEqual({
      cloudaccountid: null,
      serviceid: null,
      regionid: null,
      skuid: null,
      resourceid: null,
      subaccountid: null,
      commitmentdiscountid: null,
    });
  });
});
