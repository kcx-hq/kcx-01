import { describe, expect, it } from "vitest";
import { resolveMapping } from "../../../src/modules/shared/ETL/lib/mapping.utils.js";

describe("ETL mapping utils", () => {
  it("maps internal fields to raw headers using normalized matching", () => {
    const mappingConfig = {
      providername: "Provider Name",
      billedcost: "Billed Cost",
      service: "Service Name",
    };
    const headers = ["provider-name", "Billed Cost", "service_name"];

    const resolved = resolveMapping(mappingConfig, headers);

    expect(resolved).toEqual({
      providername: "provider-name",
      billedcost: "Billed Cost",
      service: "service_name",
    });
  });

  it("supports array candidates and picks first matching raw header", () => {
    const mappingConfig = {
      accountid: ["account id", "subscription id"],
    };
    const headers = ["Subscription-ID"];

    expect(resolveMapping(mappingConfig, headers)).toEqual({
      accountid: "Subscription-ID",
    });
  });

  it("supports object candidate with source_column field", () => {
    const mappingConfig = {
      region: { source_column: "Region Name" },
    };
    const headers = ["region_name"];

    expect(resolveMapping(mappingConfig, headers)).toEqual({
      region: "region_name",
    });
  });

  it("returns null for fields with no match", () => {
    const mappingConfig = {
      providername: "Provider Name",
      billedcost: "Billed Cost",
    };
    const headers = ["Provider Name"];

    expect(resolveMapping(mappingConfig, headers)).toEqual({
      providername: "Provider Name",
      billedcost: null,
    });
  });
});
