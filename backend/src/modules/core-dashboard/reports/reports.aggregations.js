/**
 * Reports Aggregations
 * Database-level aggregations for FinOps reports
 *
 * ALIGNED WITH REPORTS CONTROLLER (cost-analysis style):
 * - Uses uploadIds ONLY (body first, query fallback happens in controller)
 * - Early returns when uploadIds missing (prevents global queries)
 * - Prevents GROUP BY violations by grouping only by selected non-aggregates
 */

import { BillingUsageFact, CloudAccount, Service, Region } from "../../../models/index.js";
import Sequelize from "../../../config/db.config.js";
import { Op } from "sequelize";
import {
  costSharePercentage,
  roundTo,
} from "../../../common/utils/cost.calculations.js";

/**
 * Resolve filter names to IDs for WHERE clause filtering
 * (avoids JOINs in aggregate queries)
 */
async function resolveFiltersToIds(filters = {}) {
  const where = {};
  const { provider, service, region } = filters;

  // Provider -> cloudaccountid
  if (provider && provider !== "All") {
    const accounts = await CloudAccount.findAll({
      where: { providername: provider },
      attributes: ["id"],
      raw: true,
    });

    // ❗ Instead of returning null, force empty result
    if (!accounts.length) {
      where.cloudaccountid = { [Op.in]: [] };
      return where;
    }

    where.cloudaccountid = { [Op.in]: accounts.map(a => a.id) };
  }

  // Service -> serviceid
  if (service && service !== "All") {
    const services = await Service.findAll({
      where: { servicename: service },
      attributes: ["serviceid"],
      raw: true,
    });

    if (!services.length) {
      where.serviceid = { [Op.in]: [] };
      return where;
    }

    where.serviceid = { [Op.in]: services.map(s => s.serviceid) };
  }

  // Region -> regionid
  if (region && region !== "All") {
    const regions = await Region.findAll({
      where: { regionname: region },
      attributes: ["id"],
      raw: true,
    });

    if (!regions.length) {
      where.regionid = { [Op.in]: [] };
      return where;
    }

    where.regionid = { [Op.in]: regions.map(r => r.id) };
  }

  return where;
}


/**
 * Apply upload isolation into WHERE clause.
 * Must have uploadIds to query.
 */
function applyUploadWhere(whereClause, uploadIds = []) {
  const ids = Array.isArray(uploadIds) ? uploadIds.filter(Boolean) : [];
  if (!ids.length) return false;

  whereClause.uploadid = { [Op.in]: ids };
  return true;
}

/**
 * Apply date range into WHERE clause
 */
function applyDateRange(whereClause, startDate = null, endDate = null) {
  if (!startDate && !endDate) return;

  // Preserve existing condition if present
  if (!whereClause.chargeperiodstart) {
    whereClause.chargeperiodstart = {};
  }

  if (startDate) {
    whereClause.chargeperiodstart[Op.gte] = startDate;
  }

  if (endDate) {
    whereClause.chargeperiodstart[Op.lte] = endDate;
  }
}


/**
 * Get total spend aggregation
 */
export async function getTotalSpend(options = {}) {
  const { filters = {}, startDate = null, endDate = null, uploadIds = [] } = options;

  const whereClause = await resolveFiltersToIds(filters);
  if (whereClause === null) return 0;

  if (!applyUploadWhere(whereClause, uploadIds)) return 0;

  applyDateRange(whereClause, startDate, endDate);
  whereClause.billedcost = { [Op.gt]: 0 };


  const result = await BillingUsageFact.findOne({
    where: whereClause,
    attributes: [[Sequelize.fn("SUM", Sequelize.col("billedcost")), "total"]],
    raw: true,
  });


  return parseFloat(result?.total || 0);
}

/**
 * Get daily cost trend (aggregated by date)
 */
export async function getDailyTrend(options = {}) {
  const { filters = {}, startDate = null, endDate = null, uploadIds = [] } = options;

  const whereClause = await resolveFiltersToIds(filters);
  if (whereClause === null) return [];

  if (!applyUploadWhere(whereClause, uploadIds)) return [];

  applyDateRange(whereClause, startDate, endDate);
  whereClause.billedcost = { [Op.gt]: 0 };

  const results = await BillingUsageFact.findAll({
    where: whereClause,
    attributes: [
      [Sequelize.fn("DATE", Sequelize.col("chargeperiodstart")), "date"],
      [Sequelize.fn("SUM", Sequelize.col("billedcost")), "cost"],
    ],
    group: [Sequelize.fn("DATE", Sequelize.col("chargeperiodstart"))],
    order: [[Sequelize.fn("DATE", Sequelize.col("chargeperiodstart")), "ASC"]],
    raw: true,
  });

  return results.map((r) => ({
    date: r.date,
    cost: parseFloat(r.cost || 0),
  }));
}

/**
 * Get top services by spend
 */
export async function getTopServices(options = {}) {
  const { filters = {}, startDate = null, endDate = null, limit = 10, uploadIds = [] } = options;

  // remove service from resolution so we can group by service
  const filterForWhere = { ...filters };
  const serviceFilter = filterForWhere.service;
  delete filterForWhere.service;

  const whereClause = await resolveFiltersToIds(filterForWhere);
  if (whereClause === null && (filterForWhere.provider || filterForWhere.region)) return [];

  const safeWhere = whereClause || {};
  if (!applyUploadWhere(safeWhere, uploadIds)) return [];

  applyDateRange(safeWhere, startDate, endDate);
  safeWhere.billedcost = { [Op.gt]: 0 };

  // apply explicit service filter by ID if needed
  if (serviceFilter && serviceFilter !== "All") {
    const services = await Service.findAll({
      where: { servicename: serviceFilter },
      attributes: ["serviceid"],
      raw: true,
    });
    if (!services.length) return [];
    safeWhere.serviceid = { [Op.in]: services.map((s) => s.serviceid) };
  }

  const results = await BillingUsageFact.findAll({
    where: safeWhere,
    attributes: [
      [Sequelize.col("service.servicename"), "name"],
      [Sequelize.fn("SUM", Sequelize.col("BillingUsageFact.billedcost")), "value"],
    ],
    include: [
      {
        model: Service,
        as: "service",
        attributes: [], // prevent GROUP BY explosion
        required: true,
      },
    ],
    group: [Sequelize.col("service.servicename")],
    order: [[Sequelize.literal("value"), "DESC"]],
    limit: parseInt(limit, 10),
    raw: true,
  });

  return results.map((r) => ({
    name: r.name || "Unknown",
    value: parseFloat(r.value || 0),
  }));
}

/**
 * Get top regions by spend
 */
export async function getTopRegions(options = {}) {
  const { filters = {}, startDate = null, endDate = null, limit = 10, uploadIds = [] } = options;

  // remove region from resolution so we can group by region
  const filterForWhere = { ...filters };
  const regionFilter = filterForWhere.region;
  delete filterForWhere.region;

  const whereClause = await resolveFiltersToIds(filterForWhere);
  // if (whereClause === null && (filterForWhere.provider || filterForWhere.service)) return [];

  const safeWhere = whereClause || {};
  if (!applyUploadWhere(safeWhere, uploadIds)) return [];

  applyDateRange(safeWhere, startDate, endDate);
  safeWhere.billedcost = { [Op.gt]: 0 };

  // apply explicit region filter by ID if needed
  if (regionFilter && regionFilter !== "All") {
    const regions = await Region.findAll({
      where: { regionname: regionFilter },
      attributes: ["id"],
      raw: true,
    });
    if (!regions.length) return [];
    safeWhere.regionid = { [Op.in]: regions.map((r) => r.id) };
  }

  const results = await BillingUsageFact.findAll({
    where: safeWhere,
    attributes: [
      [Sequelize.col("region.regionname"), "name"],
      [Sequelize.fn("SUM", Sequelize.col("BillingUsageFact.billedcost")), "value"],
    ],
    include: [
      {
        model: Region,
        as: "region",
        attributes: [], // prevent GROUP BY explosion
        required: true,
      },
    ],
    group: [Sequelize.col("region.regionname")],
    order: [[Sequelize.literal("value"), "DESC"]],
    limit: parseInt(limit, 10),
    raw: true,
  });

  return results.map((r) => ({
    name: r.name || "Unknown",
    value: parseFloat(r.value || 0),
  }));
}

/**
 * Tagged vs untagged cost breakdown
 */
export async function getTagCompliance(options = {}) {
  const { filters = {}, startDate = null, endDate = null, uploadIds = [] } = options;

  const whereClause = await resolveFiltersToIds(filters);
  if (whereClause === null) {
    return { taggedCost: 0, untaggedCost: 0, taggedPercent: 0, untaggedPercent: 0 };
  }

  if (!applyUploadWhere(whereClause, uploadIds)) {
    return { taggedCost: 0, untaggedCost: 0, taggedPercent: 0, untaggedPercent: 0 };
  }

  applyDateRange(whereClause, startDate, endDate);

  const facts = await BillingUsageFact.findAll({
    where: whereClause,
    attributes: ["billedcost", "tags"],
    raw: false,
  });

  let taggedCost = 0;
  let untaggedCost = 0;

  facts.forEach((f) => {
    const cost = parseFloat(f.billedcost || 0);
    if (cost <= 0) return;

    const tags = f.tags || {};
    const hasTags = tags && typeof tags === "object" && Object.keys(tags).length > 0;

    if (hasTags) taggedCost += cost;
    else untaggedCost += cost;
  });

  const totalCost = taggedCost + untaggedCost;
  const taggedPercent = costSharePercentage(taggedCost, totalCost);
  const untaggedPercent = costSharePercentage(untaggedCost, totalCost);

  return {
    taggedCost: roundTo(taggedCost, 2),
    untaggedCost: roundTo(untaggedCost, 2),
    taggedPercent: roundTo(taggedPercent, 2),
    untaggedPercent: roundTo(untaggedPercent, 2),
  };
}

/**
 * Production vs non-production breakdown
 */
export async function getEnvironmentBreakdown(options = {}) {
  const {
    filters = {},
    startDate = null,
    endDate = null,
    prodEnvs = ["prod", "production", "live"],
    nonProdEnvs = ["dev", "development", "staging", "test", "qa"],
    uploadIds = [],
  } = options;

  const whereClause = await resolveFiltersToIds(filters);
  if (whereClause === null) {
    return {
      prodCost: 0,
      nonProdCost: 0,
      unknownCost: 0,
      prodPercent: 0,
      nonProdPercent: 0,
      unknownPercent: 0,
    };
  }

  if (!applyUploadWhere(whereClause, uploadIds)) {
    return {
      prodCost: 0,
      nonProdCost: 0,
      unknownCost: 0,
      prodPercent: 0,
      nonProdPercent: 0,
      unknownPercent: 0,
    };
  }

  applyDateRange(whereClause, startDate, endDate);

  const facts = await BillingUsageFact.findAll({
    where: whereClause,
    attributes: ["billedcost", "tags"],
    raw: false,
  });

  let prodCost = 0;
  let nonProdCost = 0;
  let unknownCost = 0;

  facts.forEach((f) => {
    const cost = parseFloat(f.billedcost || 0);
    if (cost <= 0) return;

    const tags = f.tags || {};
    const envTag = tags.Environment || tags.environment || tags.ENV || tags.env || "";
    const envLower = String(envTag).toLowerCase();

    if (prodEnvs.some((env) => envLower.includes(env))) prodCost += cost;
    else if (nonProdEnvs.some((env) => envLower.includes(env))) nonProdCost += cost;
    else unknownCost += cost;
  });

  const totalCost = prodCost + nonProdCost + unknownCost;
  const prodPercent = costSharePercentage(prodCost, totalCost);
  const nonProdPercent = costSharePercentage(nonProdCost, totalCost);
  const unknownPercent = costSharePercentage(unknownCost, totalCost);

  return {
    prodCost: roundTo(prodCost, 2),
    nonProdCost: roundTo(nonProdCost, 2),
    unknownCost: roundTo(unknownCost, 2),
    prodPercent: roundTo(prodPercent, 2),
    nonProdPercent: roundTo(nonProdPercent, 2),
    unknownPercent: roundTo(unknownPercent, 2),
  };
}

/**
 * Monthly spend (daily -> monthly in app code)
 */
export async function getMonthlySpend(options = {}) {
  const { filters = {}, startDate = null, endDate = null, uploadIds = [] } = options;

  const whereClause = await resolveFiltersToIds(filters);
  if (whereClause === null) return [];

  if (!applyUploadWhere(whereClause, uploadIds)) return [];

  applyDateRange(whereClause, startDate, endDate);
  whereClause.billedcost = { [Op.gt]: 0 };

  const dailyData = await BillingUsageFact.findAll({
    where: whereClause,
    attributes: [
      [Sequelize.fn("DATE", Sequelize.col("chargeperiodstart")), "date"],
      [Sequelize.fn("SUM", Sequelize.col("billedcost")), "cost"],
    ],
    group: [Sequelize.fn("DATE", Sequelize.col("chargeperiodstart"))],
    order: [[Sequelize.fn("DATE", Sequelize.col("chargeperiodstart")), "ASC"]],
    raw: true,
  });

  const monthlyMap = {};
  dailyData.forEach((day) => {
    if (!day.date) return;
    const d = new Date(day.date);
    const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    monthlyMap[monthKey] = (monthlyMap[monthKey] || 0) + parseFloat(day.cost || 0);
  });

  return Object.entries(monthlyMap)
    .map(([month, cost]) => ({ month, cost: roundTo(cost, 2) }))
    .sort((a, b) => a.month.localeCompare(b.month));
}
