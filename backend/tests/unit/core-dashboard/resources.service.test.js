import { describe, expect, it } from "vitest";
import { buildResourceInventory } from "../../../src/modules/core-dashboard/analytics/resources/resources.service.js";

function row(overrides = {}) {
  return {
    resourceid: "res-1",
    billedcost: 10,
    chargeperiodstart: "2026-03-10T00:00:00.000Z",
    tags: { owner: "team-a" },
    resource: { resourcename: "Resource One" },
    service: { servicename: "EC2" },
    region: { regionname: "us-east-1" },
    cloudAccount: { subaccountname: "acct-a" },
    ...overrides,
  };
}

describe("core-dashboard resources.service", () => {
  it("aggregates rows by resource id and sums total cost", () => {
    const result = buildResourceInventory([
      row({ billedcost: 10 }),
      row({ billedcost: 20 }),
    ]);

    expect(result.inventory).toHaveLength(1);
    expect(result.inventory[0].id).toBe("res-1");
    expect(result.inventory[0].totalCost).toBe(30);
    expect(result.stats.totalCost).toBe(30);
  });

  it("marks resource as Zombie when latest day has zero cost", () => {
    const result = buildResourceInventory([
      row({ chargeperiodstart: "2026-03-10T00:00:00.000Z", billedcost: 50 }),
      row({ chargeperiodstart: "2026-03-11T00:00:00.000Z", billedcost: 0 }),
    ]);

    expect(result.inventory[0].status).toBe("Zombie");
    expect(result.stats.zombieCount).toBe(1);
    expect(result.stats.zombieCost).toBe(50);
  });

  it("marks resource as New when first day is zero and latest day is positive", () => {
    const result = buildResourceInventory([
      row({ chargeperiodstart: "2026-03-10T00:00:00.000Z", billedcost: 0 }),
      row({ chargeperiodstart: "2026-03-11T00:00:00.000Z", billedcost: 12 }),
    ]);

    expect(result.inventory[0].status).toBe("New");
  });

  it("marks resource as Spiking when latest cost is >2x start and start >0.5", () => {
    const result = buildResourceInventory([
      row({ chargeperiodstart: "2026-03-10T00:00:00.000Z", billedcost: 5 }),
      row({ chargeperiodstart: "2026-03-11T00:00:00.000Z", billedcost: 15 }),
    ]);

    expect(result.inventory[0].status).toBe("Spiking");
    expect(result.stats.spikingCount).toBe(1);
  });

  it("marks hasTags false for empty tags and includes untagged stats", () => {
    const result = buildResourceInventory([
      row({ resourceid: "tagged", billedcost: 10, tags: { env: "prod" } }),
      row({ resourceid: "untagged", billedcost: 5, tags: {} }),
    ]);

    const untagged = result.inventory.find((item) => item.id === "untagged");
    expect(untagged.hasTags).toBe(false);
    expect(result.stats.untaggedCount).toBe(1);
    expect(result.stats.untaggedCost).toBe(5);
  });

  it("supports totalCost fallback fields when billedcost is absent", () => {
    const fromTotalCost = buildResourceInventory([
      row({
        resourceid: "r-total",
        totalCost: 25,
        billedcost: undefined,
      }),
    ]);

    const fromBilledCostPascal = buildResourceInventory([
      row({
        resourceid: "r-pascal",
        billedcost: undefined,
        BilledCost: 30,
      }),
    ]);

    expect(fromTotalCost.inventory[0].totalCost).toBe(25);
    expect(fromBilledCostPascal.inventory[0].totalCost).toBe(30);
  });

  it("sorts inventory by totalCost descending", () => {
    const result = buildResourceInventory([
      row({ resourceid: "low", billedcost: 10 }),
      row({ resourceid: "high", billedcost: 100 }),
      row({ resourceid: "mid", billedcost: 50 }),
    ]);

    expect(result.inventory.map((item) => item.id)).toEqual(["high", "mid", "low"]);
  });

  it("returns zeroed stats for empty input", () => {
    const result = buildResourceInventory([]);

    expect(result.inventory).toEqual([]);
    expect(result.stats).toEqual({
      total: 0,
      totalCost: 0,
      zombieCount: 0,
      zombieCost: 0,
      untaggedCount: 0,
      untaggedCost: 0,
      spikingCount: 0,
      spikingCost: 0,
    });
  });
});
