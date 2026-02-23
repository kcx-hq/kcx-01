import * as aggregations from "./reports.aggregations.js";
import {
  getDateRange,
  getBillingPeriodFromData,
} from "../../../common/utils/date.helpers.js";
import {
  formatCurrency,
  calculateForecast,
} from "../../../common/utils/cost.helpers.js";
import { FINOPS_CONSTANTS } from "../../../common/constants/finops.constants.js";
import {
  costSharePercentage,
  dailyAverageSpend,
  periodOverPeriodPercentage,
  roundTo,
} from "../../../common/utils/cost.calculations.js";

const toNumber = (v, fallback = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

const formatNumber = (v, decimals = 2) => roundTo(toNumber(v, 0), decimals);

const emptySummary = () => ({
  totalSpend: formatCurrency(0),
  forecast: formatCurrency(0),
  spendChangePercent: 0,
  avgDailySpend: formatCurrency(0),

  dailyData: [],
  billingPeriod: null,

  topService: { name: "N/A", value: formatCurrency(0), percentage: 0 },
  topRegion: { name: "N/A", value: formatCurrency(0), percentage: 0 },

  topServices: [],
  topRegions: [],

  taggedCost: formatCurrency(0),
  untaggedCost: formatCurrency(0),
  taggedPercent: 0,
  untaggedPercent: 0,

  prodCost: formatCurrency(0),
  nonProdCost: formatCurrency(0),
  unknownCost: formatCurrency(0),

  prodPercent: 0,
  nonProdPercent: 0,
  unknownPercent: 0,
});

export const reportsService = {
  async getDashboardSummary(params = {}) {
    const { filters = {}, period = null, uploadIds = [] } = params;
    // 🔒 same pattern as cost-analysis: no upload -> no aggregation
    if (!Array.isArray(uploadIds) || uploadIds.length === 0) {
      return emptySummary();
    }
    

    const { startDate, endDate } = getDateRange(period);

    const safeFilters = {
      provider: filters.provider ?? "All",
      service: filters.service ?? "All",
      region: filters.region ?? "All",
    };

    const [
      totalSpend,
      dailyTrend,
      topServices,
      topRegions,
      tagCompliance,
      environmentBreakdown,
    ] = await Promise.all([
      aggregations.getTotalSpend({ filters: safeFilters, startDate, endDate, uploadIds }),
      aggregations.getDailyTrend({ filters: safeFilters, startDate, endDate, uploadIds }),
      aggregations.getTopServices({
        filters: safeFilters,
        startDate,
        endDate,
        limit: FINOPS_CONSTANTS.TOP_SERVICES_LIMIT,
        uploadIds,
      }),
      aggregations.getTopRegions({
        filters: safeFilters,
        startDate,
        endDate,
        limit: FINOPS_CONSTANTS.TOP_REGIONS_LIMIT,
        uploadIds,
      }),
      aggregations.getTagCompliance({ filters: safeFilters, startDate, endDate, uploadIds }),
      aggregations.getEnvironmentBreakdown({
        filters: safeFilters,
        startDate,
        endDate,
        prodEnvs: FINOPS_CONSTANTS.PROD_ENVIRONMENTS,
        nonProdEnvs: FINOPS_CONSTANTS.NON_PROD_ENVIRONMENTS,
        uploadIds,
      }),
    ]);


    // Previous period spend (period-over-period)
    const previousPeriodStart = new Date(startDate);
    previousPeriodStart.setMonth(previousPeriodStart.getMonth() - 1);

    const previousPeriodEnd = new Date(startDate);
    previousPeriodEnd.setDate(previousPeriodEnd.getDate() - 1);

    const previousPeriodSpend = await aggregations.getTotalSpend({
      filters: safeFilters,
      startDate: previousPeriodStart,
      endDate: previousPeriodEnd,
      uploadIds,
    });

    const spendChangePercent = periodOverPeriodPercentage(totalSpend, previousPeriodSpend);

    const topService = topServices?.length ? topServices[0] : { name: "N/A", value: 0 };
    const topRegion = topRegions?.length ? topRegions[0] : { name: "N/A", value: 0 };

    const topServicePercent = costSharePercentage(topService.value, totalSpend);
    const topRegionPercent = costSharePercentage(topRegion.value, totalSpend);

    const avgDailySpend = dailyAverageSpend(totalSpend, dailyTrend.length || 1);
    const forecast = calculateForecast(totalSpend, FINOPS_CONSTANTS.FORECAST_MULTIPLIER);

    const billingPeriod = getBillingPeriodFromData(dailyTrend);

    const servicesWithPercent = topServices.map((item) => ({
      ...item,
      percentage: costSharePercentage(item.value, totalSpend),
    }));
    const regionsWithPercent = topRegions.map((item) => ({
      ...item,
      percentage: costSharePercentage(item.value, totalSpend),
    }));

    return {
      totalSpend: formatCurrency(totalSpend),
      forecast: formatCurrency(forecast),
      spendChangePercent: formatNumber(spendChangePercent, 2),
      avgDailySpend: formatCurrency(avgDailySpend),

      dailyData: dailyTrend,
      billingPeriod,

      topService: {
        name: topService.name,
        value: formatCurrency(topService.value),
        percentage: formatNumber(topServicePercent, 2),
      },
      topRegion: {
        name: topRegion.name,
        value: formatCurrency(topRegion.value),
        percentage: formatNumber(topRegionPercent, 2),
      },

      topServices: servicesWithPercent,
      topRegions: regionsWithPercent,

      taggedCost: formatCurrency(tagCompliance.taggedCost),
      untaggedCost: formatCurrency(tagCompliance.untaggedCost),
      taggedPercent: formatNumber(tagCompliance.taggedPercent, 2),
      untaggedPercent: formatNumber(tagCompliance.untaggedPercent, 2),

      prodCost: formatCurrency(environmentBreakdown.prodCost),
      nonProdCost: formatCurrency(environmentBreakdown.nonProdCost),
      unknownCost: formatCurrency(environmentBreakdown.unknownCost ?? 0),

      prodPercent: formatNumber(environmentBreakdown.prodPercent, 2),
      nonProdPercent: formatNumber(environmentBreakdown.nonProdPercent, 2),
      unknownPercent: formatNumber(environmentBreakdown.unknownPercent ?? 0, 2),
    };
  },

  async getTopServices(params = {}) {
    const { filters = {}, period = "month", limit = 10, uploadIds = [] } = params;

    if (!Array.isArray(uploadIds) || uploadIds.length === 0) return [];

    const { startDate, endDate } = getDateRange(period);

    const safeFilters = {
      provider: filters.provider ?? "All",
      service: filters.service ?? "All",
      region: filters.region ?? "All",
    };

    const [topServices, totalSpend] = await Promise.all([
      aggregations.getTopServices({ filters: safeFilters, startDate, endDate, limit, uploadIds }),
      aggregations.getTotalSpend({ filters: safeFilters, startDate, endDate, uploadIds }),
    ]);

    return topServices.map((item) => ({
      ...item,
      percentage: costSharePercentage(item.value, totalSpend),
    }));
  },

  async getTopRegions(params = {}) {
    const { filters = {}, period = null, limit = 10, uploadIds = [] } = params;

    if (!Array.isArray(uploadIds) || uploadIds.length === 0) return [];

    const { startDate, endDate } = getDateRange(period);

    const safeFilters = {
      provider: filters.provider ?? "All",
      service: filters.service ?? "All",
      region: filters.region ?? "All",
    };

    const [topRegions, totalSpend] = await Promise.all([
      aggregations.getTopRegions({ filters: safeFilters, startDate, endDate, limit, uploadIds }),
      aggregations.getTotalSpend({ filters: safeFilters, startDate, endDate, uploadIds }),
    ]);

    return topRegions.map((item) => ({
      ...item,
      percentage: costSharePercentage(item.value, totalSpend),
    }));
  },

  async getMonthlySpend(params = {}) {
    const { filters = {}, startDate = null, endDate = null, uploadIds = [] } = params;

    if (!Array.isArray(uploadIds) || uploadIds.length === 0) return [];

    const dateRange = startDate && endDate ? { startDate, endDate } : getDateRange(null);

    const safeFilters = {
      provider: filters.provider ?? "All",
      service: filters.service ?? "All",
      region: filters.region ?? "All",
    };

    return aggregations.getMonthlySpend({
      filters: safeFilters,
      ...dateRange,
      uploadIds,
    });
  },

  async getTagCompliance(params = {}) {
    const { filters = {}, period = null, uploadIds = [] } = params;

    if (!Array.isArray(uploadIds) || uploadIds.length === 0) {
      return { taggedCost: 0, untaggedCost: 0, taggedPercent: 0, untaggedPercent: 0 };
    }

    const { startDate, endDate } = getDateRange(period);

    const safeFilters = {
      provider: filters.provider ?? "All",
      service: filters.service ?? "All",
      region: filters.region ?? "All",
    };

    return aggregations.getTagCompliance({ filters: safeFilters, startDate, endDate, uploadIds });
  },

  async getEnvironmentBreakdown(params = {}) {
    const { filters = {}, period = null, uploadIds = [] } = params;

    if (!Array.isArray(uploadIds) || uploadIds.length === 0) {
      return {
        prodCost: 0,
        nonProdCost: 0,
        unknownCost: 0,
        prodPercent: 0,
        nonProdPercent: 0,
        unknownPercent: 0,
      };
    }

    const { startDate, endDate } = getDateRange(period);

    const safeFilters = {
      provider: filters.provider ?? "All",
      service: filters.service ?? "All",
      region: filters.region ?? "All",
    };

    return aggregations.getEnvironmentBreakdown({
      filters: safeFilters,
      startDate,
      endDate,
      prodEnvs: FINOPS_CONSTANTS.PROD_ENVIRONMENTS,
      nonProdEnvs: FINOPS_CONSTANTS.NON_PROD_ENVIRONMENTS,
      uploadIds,
    });
  },
};
