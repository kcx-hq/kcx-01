import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  getTotalSpendMock,
  getDailyTrendMock,
  getTopServicesMock,
  getTopRegionsMock,
  getTagComplianceMock,
  getEnvironmentBreakdownMock,
  getMonthlySpendMock,
  getDateRangeMock,
  getBillingPeriodFromDataMock,
  calculatePeriodChangeMock,
} = vi.hoisted(() => ({
  getTotalSpendMock: vi.fn(),
  getDailyTrendMock: vi.fn(),
  getTopServicesMock: vi.fn(),
  getTopRegionsMock: vi.fn(),
  getTagComplianceMock: vi.fn(),
  getEnvironmentBreakdownMock: vi.fn(),
  getMonthlySpendMock: vi.fn(),
  getDateRangeMock: vi.fn(() => ({
    startDate: new Date("2026-06-01T00:00:00.000Z"),
    endDate: new Date("2026-06-30T23:59:59.999Z"),
  })),
  getBillingPeriodFromDataMock: vi.fn(() => "Jun 2026"),
  calculatePeriodChangeMock: vi.fn(() => 25),
}));

vi.mock("../../../src/modules/core-dashboard/reports/reports.aggregations.js", () => ({
  getTotalSpend: getTotalSpendMock,
  getDailyTrend: getDailyTrendMock,
  getTopServices: getTopServicesMock,
  getTopRegions: getTopRegionsMock,
  getTagCompliance: getTagComplianceMock,
  getEnvironmentBreakdown: getEnvironmentBreakdownMock,
  getMonthlySpend: getMonthlySpendMock,
}));

vi.mock("../../../src/common/utils/date.helpers.js", () => ({
  getDateRange: getDateRangeMock,
  getBillingPeriodFromData: getBillingPeriodFromDataMock,
  calculatePeriodChange: calculatePeriodChangeMock,
}));

import { reportsService } from "../../../src/modules/core-dashboard/reports/reports.service.js";

describe("core-dashboard component - reports service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns empty dashboard summary when uploadIds are missing", async () => {
    const result = await reportsService.getDashboardSummary({
      filters: { provider: "aws" },
      period: "month",
      uploadIds: [],
    });

    expect(result).toEqual({
      totalSpend: 0,
      forecast: 0,
      spendChangePercent: 0,
      avgDailySpend: 0,
      dailyData: [],
      billingPeriod: null,
      topService: { name: "N/A", value: 0, percentage: 0 },
      topRegion: { name: "N/A", value: 0, percentage: 0 },
      topServices: [],
      topRegions: [],
      taggedCost: 0,
      untaggedCost: 0,
      taggedPercent: 0,
      untaggedPercent: 0,
      prodCost: 0,
      nonProdCost: 0,
      unknownCost: 0,
      prodPercent: 0,
      nonProdPercent: 0,
      unknownPercent: 0,
    });

    expect(getTotalSpendMock).not.toHaveBeenCalled();
    expect(getDailyTrendMock).not.toHaveBeenCalled();
  });

  it("aggregates report data and passes safe filters to aggregation adapters", async () => {
    getTotalSpendMock.mockResolvedValueOnce(1000).mockResolvedValueOnce(800);
    getDailyTrendMock.mockResolvedValueOnce([
      { date: "2026-06-01", cost: 100 },
      { date: "2026-06-02", cost: 200 },
    ]);
    getTopServicesMock.mockResolvedValueOnce([
      { name: "EC2", value: 400 },
      { name: "S3", value: 300 },
    ]);
    getTopRegionsMock.mockResolvedValueOnce([
      { name: "us-east-1", value: 500 },
      { name: "eu-west-1", value: 200 },
    ]);
    getTagComplianceMock.mockResolvedValueOnce({
      taggedCost: 700,
      untaggedCost: 300,
      taggedPercent: 70,
      untaggedPercent: 30,
    });
    getEnvironmentBreakdownMock.mockResolvedValueOnce({
      prodCost: 600,
      nonProdCost: 350,
      unknownCost: 50,
      prodPercent: 60,
      nonProdPercent: 35,
      unknownPercent: 5,
    });

    const result = await reportsService.getDashboardSummary({
      filters: { provider: "aws" },
      period: "month",
      uploadIds: ["upload-1"],
    });

    expect(getDateRangeMock).toHaveBeenCalledWith("month");
    expect(getTotalSpendMock).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        filters: {
          provider: "aws",
          service: "All",
          region: "All",
        },
        uploadIds: ["upload-1"],
      }),
    );

    expect(result.totalSpend).toBe(1000);
    expect(result.forecast).toBe(1150);
    expect(result.spendChangePercent).toBe(25);
    expect(result.billingPeriod).toBe("Jun 2026");
    expect(result.topService).toEqual({
      name: "EC2",
      value: 400,
      percentage: 40,
    });
    expect(result.topRegion).toEqual({
      name: "us-east-1",
      value: 500,
      percentage: 50,
    });
    expect(result.topServices).toEqual([
      { name: "EC2", value: 400, percentage: 40 },
      { name: "S3", value: 300, percentage: 30 },
    ]);
    expect(result.taggedPercent).toBe(70);
    expect(result.unknownPercent).toBe(5);
  });

  it("returns top services distribution with percentages from aggregation adapters", async () => {
    getTopServicesMock.mockResolvedValueOnce([
      { name: "Lambda", value: 25 },
      { name: "RDS", value: 75 },
    ]);
    getTotalSpendMock.mockResolvedValueOnce(100);

    const result = await reportsService.getTopServices({
      filters: {},
      period: "month",
      limit: 5,
      uploadIds: ["upload-2"],
    });

    expect(result).toEqual([
      { name: "Lambda", value: 25, percentage: 25 },
      { name: "RDS", value: 75, percentage: 75 },
    ]);

    expect(getTopServicesMock).toHaveBeenCalledWith(
      expect.objectContaining({
        filters: {
          provider: "All",
          service: "All",
          region: "All",
        },
        limit: 5,
        uploadIds: ["upload-2"],
      }),
    );
  });
});
