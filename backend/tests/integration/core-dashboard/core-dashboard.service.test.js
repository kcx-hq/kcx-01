import { beforeEach, describe, expect, it } from "vitest";
import { buildResourceInventory } from "../../../src/modules/core-dashboard/analytics/resources/resources.service.js";
import {
  generateCostAnalysis,
  getCostDataWithResources,
  getFilterDropdowns,
} from "../../../src/modules/core-dashboard/analytics/cost-analysis/cost-analysis.service.js";
import { costDriversService } from "../../../src/modules/core-dashboard/analytics/cost-drivers/cost-drivers.service.js";
import { unitEconomicsService } from "../../../src/modules/core-dashboard/unit-economics/unit-economics.service.js";
import {
  createBillingUploadFixture,
  createBillingUsageFactFixture,
  createCloudAccountFixture,
  createRegionFixture,
  createResourceFixture,
  createServiceFixture,
  resetFactoryState,
} from "../../helpers/factories.js";

async function seedCostFacts({
  uploadid,
  providername,
  serviceName,
  regionCode,
  regionName,
  resourceId,
  costs,
  startDate,
}) {
  const cloud = await createCloudAccountFixture({
    providername,
    billingaccountid: `${providername}-${serviceName}-acct`,
    billingaccountname: `${providername}-acct`,
  });
  const service = await createServiceFixture({
    providername,
    servicename: serviceName,
    servicecategory: "Compute",
  });
  const region = await createRegionFixture({
    providername,
    regioncode: regionCode,
    regionname: regionName,
  });
  await createResourceFixture({
    resourceid: resourceId,
    resourcename: `${resourceId}-name`,
    resourcetype: "compute",
  });

  for (let i = 0; i < costs.length; i += 1) {
    const day = new Date(startDate);
    day.setUTCDate(day.getUTCDate() + i);
    await createBillingUsageFactFixture({
      uploadid,
      cloudaccountid: cloud.id,
      serviceid: service.serviceid,
      regionid: region.id,
      resourceid: resourceId,
      billedcost: costs[i],
      effectivecost: costs[i],
      consumedquantity: 10 + i,
      chargeperiodstart: new Date(day),
      chargeperiodend: new Date(day.getTime() + 3600000),
      tags: { env: "test" },
    });
  }
}

describe("core-dashboard integration services", () => {
  beforeEach(() => {
    resetFactoryState();
  });

  it("requires uploadIds for cost analysis", async () => {
    await expect(
      generateCostAnalysis({}, "ServiceName"),
    ).rejects.toThrow("uploadIds is required for cost analysis");
  });

  it("isolates total spend by uploadIds in cost analysis", async () => {
    const uploadA = await createBillingUploadFixture();
    const uploadB = await createBillingUploadFixture();

    await seedCostFacts({
      uploadid: uploadA.uploadid,
      providername: "aws",
      serviceName: "AmazonEC2",
      regionCode: "us-east-1",
      regionName: "US East",
      resourceId: "res-a",
      costs: [10, 20],
      startDate: new Date("2026-03-01T00:00:00.000Z"),
    });
    await seedCostFacts({
      uploadid: uploadB.uploadid,
      providername: "aws",
      serviceName: "AmazonS3",
      regionCode: "us-west-2",
      regionName: "US West",
      resourceId: "res-b",
      costs: [100],
      startDate: new Date("2026-03-01T00:00:00.000Z"),
    });

    const result = await generateCostAnalysis(
      { uploadIds: [uploadA.uploadid], provider: "All", service: "All", region: "All" },
      "ServiceName",
    );

    expect(result.kpis.totalSpend).toBe(30);
    expect(result.breakdown.reduce((sum, row) => sum + Number(row.value), 0)).toBe(30);
  });

  it("applies provider filter in cost analysis", async () => {
    const upload = await createBillingUploadFixture();
    await seedCostFacts({
      uploadid: upload.uploadid,
      providername: "aws",
      serviceName: "AmazonEC2",
      regionCode: "us-east-1",
      regionName: "US East",
      resourceId: "res-provider-a",
      costs: [25],
      startDate: new Date("2026-03-05T00:00:00.000Z"),
    });
    await seedCostFacts({
      uploadid: upload.uploadid,
      providername: "azure",
      serviceName: "AzureVM",
      regionCode: "eastus",
      regionName: "East US",
      resourceId: "res-provider-b",
      costs: [75],
      startDate: new Date("2026-03-05T00:00:00.000Z"),
    });

    const filtered = await generateCostAnalysis(
      {
        uploadIds: [upload.uploadid],
        provider: "aws",
        service: "All",
        region: "All",
      },
      "ProviderName",
    );

    expect(filtered.kpis.totalSpend).toBe(25);
    expect(filtered.breakdown).toHaveLength(1);
  });

  it("returns filter options scoped to selected uploadIds", async () => {
    const upload = await createBillingUploadFixture();
    await seedCostFacts({
      uploadid: upload.uploadid,
      providername: "aws",
      serviceName: "AmazonEC2",
      regionCode: "us-east-1",
      regionName: "US East",
      resourceId: "res-filter",
      costs: [12],
      startDate: new Date("2026-03-10T00:00:00.000Z"),
    });

    const options = await getFilterDropdowns([upload.uploadid]);

    expect(options.providers).toContain("aws");
    expect(options.services).toContain("AmazonEC2");
    expect(options.regions).toContain("US East");
  });

  it("returns default filter options when no upload is selected", async () => {
    const options = await getFilterDropdowns([]);
    expect(options).toEqual({
      providers: ["All"],
      services: ["All"],
      regions: ["All"],
    });
  });

  it("returns empty cost data when uploadIds are absent", async () => {
    const rows = await getCostDataWithResources({
      filters: { provider: "All", service: "All", region: "All" },
      uploadIds: [],
    });
    expect(rows).toEqual([]);
  });

  it("returns ordered resource facts with upload isolation and filters", async () => {
    const upload = await createBillingUploadFixture();
    await seedCostFacts({
      uploadid: upload.uploadid,
      providername: "aws",
      serviceName: "AmazonEC2",
      regionCode: "us-east-1",
      regionName: "US East",
      resourceId: "res-ordered",
      costs: [4, 5, 6],
      startDate: new Date("2026-03-11T00:00:00.000Z"),
    });

    const rows = await getCostDataWithResources({
      filters: { provider: "aws", service: "AmazonEC2", region: "US East" },
      uploadIds: [upload.uploadid],
    });

    expect(rows).toHaveLength(3);
    const orderedDates = rows.map((row) =>
      new Date(row.chargeperiodstart).toISOString(),
    );
    expect(orderedDates).toEqual([...orderedDates].sort());
  });

  it("builds empty inventory stats for no resource rows", () => {
    const result = buildResourceInventory([]);
    expect(result.inventory).toEqual([]);
    expect(result.stats.total).toBe(0);
    expect(result.stats.totalCost).toBe(0);
  });

  it("classifies resource lifecycle states in inventory", () => {
    const rows = [
      {
        resourceid: "r-zombie",
        billedcost: 10,
        chargeperiodstart: "2026-03-01T00:00:00.000Z",
        resource: { resourcename: "zombie" },
        service: { servicename: "AmazonEC2" },
        region: { regionname: "US East" },
        tags: {},
      },
      {
        resourceid: "r-zombie",
        billedcost: 0,
        chargeperiodstart: "2026-03-02T00:00:00.000Z",
        resource: { resourcename: "zombie" },
        service: { servicename: "AmazonEC2" },
        region: { regionname: "US East" },
        tags: {},
      },
      {
        resourceid: "r-new",
        billedcost: 0,
        chargeperiodstart: "2026-03-01T00:00:00.000Z",
        resource: { resourcename: "new" },
        service: { servicename: "AmazonEC2" },
        region: { regionname: "US East" },
        tags: {},
      },
      {
        resourceid: "r-new",
        billedcost: 5,
        chargeperiodstart: "2026-03-02T00:00:00.000Z",
        resource: { resourcename: "new" },
        service: { servicename: "AmazonEC2" },
        region: { regionname: "US East" },
        tags: {},
      },
      {
        resourceid: "r-spike",
        billedcost: 1,
        chargeperiodstart: "2026-03-01T00:00:00.000Z",
        resource: { resourcename: "spike" },
        service: { servicename: "AmazonEC2" },
        region: { regionname: "US East" },
        tags: {},
      },
      {
        resourceid: "r-spike",
        billedcost: 3,
        chargeperiodstart: "2026-03-02T00:00:00.000Z",
        resource: { resourcename: "spike" },
        service: { servicename: "AmazonEC2" },
        region: { regionname: "US East" },
        tags: {},
      },
    ];

    const result = buildResourceInventory(rows);
    const byId = Object.fromEntries(result.inventory.map((item) => [item.id, item]));

    expect(byId["r-zombie"].status).toBe("Zombie");
    expect(byId["r-new"].status).toBe("New");
    expect(byId["r-spike"].status).toBe("Spiking");
  });

  it("returns empty cost drivers shape without uploadIds", async () => {
    const data = await costDriversService.getCostDrivers({
      uploadIds: [],
      filters: {},
      period: 30,
    });

    expect(data.increases).toEqual([]);
    expect(data.decreases).toEqual([]);
    expect(data.overallStats.totalCurr).toBe(0);
  });

  it("computes cost drivers from selected upload facts only", async () => {
    const uploadA = await createBillingUploadFixture();
    const uploadB = await createBillingUploadFixture();

    await seedCostFacts({
      uploadid: uploadA.uploadid,
      providername: "aws",
      serviceName: "AmazonEC2",
      regionCode: "us-east-1",
      regionName: "US East",
      resourceId: "res-driver-a",
      costs: [5, 20],
      startDate: new Date("2026-01-01T00:00:00.000Z"),
    });
    await seedCostFacts({
      uploadid: uploadB.uploadid,
      providername: "aws",
      serviceName: "AmazonS3",
      regionCode: "us-west-2",
      regionName: "US West",
      resourceId: "res-driver-b",
      costs: [100, 120],
      startDate: new Date("2026-01-01T00:00:00.000Z"),
    });

    const data = await costDriversService.getCostDrivers({
      uploadIds: [uploadA.uploadid],
      filters: { provider: "All", service: "All", region: "All" },
      period: 1,
    });

    expect(data.increases.length + data.decreases.length).toBeGreaterThan(0);
    expect(data.overallStats.totalCurr + data.overallStats.totalPrev).toBeLessThan(80);
  });

  it("computes unit economics summary with drift metrics", async () => {
    const upload = await createBillingUploadFixture();
    await seedCostFacts({
      uploadid: upload.uploadid,
      providername: "aws",
      serviceName: "AmazonEC2",
      regionCode: "us-east-1",
      regionName: "US East",
      resourceId: "res-unit",
      costs: [10, 15, 40],
      startDate: new Date("2026-02-01T00:00:00.000Z"),
    });

    const summary = await unitEconomicsService.getSummary({
      filters: {},
      period: null,
      uploadIds: [upload.uploadid],
    });

    expect(summary.kpis.totalCost).toBe(65);
    expect(summary.kpis.totalQuantity).toBe(33);
    expect(summary.trend.length).toBe(3);
    expect(summary.drift).toMatchObject({
      thresholdPct: 15,
    });
  });
});
