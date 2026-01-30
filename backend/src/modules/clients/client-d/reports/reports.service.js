/**
 * Client-D Reports Service
 * Reduced vs Core:
 * - Keep: summary, top services, top regions
 * - Remove: monthly trends
 * - Remove: pdf export
 */

import { reportsService as coreReportsService } from "../../../core-dashboard/reports/reports.service.js"; 
// 👆 adjust import path to your project structure

const emptySummary = () => ({
  totalSpend: "$0.00",
  forecast: "$0.00",
  spendChangePercent: 0,
  avgDailySpend: "$0.00",

  dailyData: [],
  billingPeriod: null,

  topService: { name: "N/A", value: "$0.00", percentage: 0 },
  topRegion: { name: "N/A", value: "$0.00", percentage: 0 },

  topServices: [],
  topRegions: [],

  taggedCost: "$0.00",
  untaggedCost: "$0.00",
  taggedPercent: 0,
  untaggedPercent: 0,

  prodCost: "$0.00",
  nonProdCost: "$0.00",
  unknownCost: "$0.00",

  prodPercent: 0,
  nonProdPercent: 0,
  unknownPercent: 0,
});

export const clientDReportsService = {
  emptySummary,

  async getDashboardSummary(params = {}) {
    // Use core logic directly
    return await coreReportsService.getDashboardSummary(params);
  },

  async getTopServices(params = {}) {
    return await coreReportsService.getTopServices(params);
  },

  async getTopRegions(params = {}) {
    return await coreReportsService.getTopRegions(params);
  },

  /**
   * Explicitly NOT exposing:
   * - getMonthlySpend
   * - downloadPDF
   * - tag-compliance + env breakdown endpoints (unless Client-D wants them)
   */
};
