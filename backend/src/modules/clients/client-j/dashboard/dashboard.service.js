import {
  Op,
  fn,
  col,
  cast,
  where as sqlWhere,
} from "sequelize";
import {
  BillingUpload,
  BillingUsageFact,
  CloudAccount,
  CommitmentDiscount,
  Region,
  Resource,
  Service,
  SubAccount,
} from "../../../../models/index.js";
import {
  anomalyThreshold,
  budgetUtilizationPercentage,
  budgetVariance,
  dailyAverageSpend,
  forecastedMonthlySpend,
  monthOverMonthPercentage,
  potentialSavings,
  roundTo,
} from "../../../../common/utils/cost.calculations.js";

const ANALYSIS_ROW_LIMIT = 50000;
const DATA_EXPLORER_SCAN_LIMIT = 20000;
const CSV_EXPORT_LIMIT = 50000;

const ALLOCATION_REQUIRED_TAGS = ["owner", "cost_center", "project", "environment"];
const GOVERNANCE_REQUIRED_TAGS = ["owner", "environment", "application", "cost_center"];

const NOW = () => new Date();

const toNumber = (value, fallback = 0) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
};

const unique = (values = []) => Array.from(new Set(values.filter(Boolean)));

const ratioPercent = (part, total) => {
  const p = toNumber(part, 0);
  const t = toNumber(total, 0);
  if (!t || t <= 0) return 0;
  return (p / t) * 100;
};

const safeDivide = (numerator, denominator) => {
  const n = toNumber(numerator, 0);
  const d = toNumber(denominator, 0);
  if (!d || d <= 0) return 0;
  return n / d;
};

const average = (values = []) => {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + toNumber(value, 0), 0) / values.length;
};

const standardDeviation = (values = []) => {
  if (values.length <= 1) return 0;
  const mean = average(values);
  const variance =
    values.reduce((sum, value) => {
      const delta = toNumber(value, 0) - mean;
      return sum + delta * delta;
    }, 0) / values.length;

  return Math.sqrt(variance);
};

const toUtcDateKey = (value) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const toMonthKey = (value) => {
  const dateKey = toUtcDateKey(value);
  return dateKey ? dateKey.slice(0, 7) : null;
};

const parseTagNumeric = (value) => {
  if (value == null || value === "") return null;
  const normalized = String(value).replace(/,/g, "").trim();
  const numeric = Number(normalized);
  return Number.isFinite(numeric) ? numeric : null;
};

const canonicalTagKey = (value) => String(value || "").toLowerCase().replace(/[^a-z0-9]/g, "");

function getTagValue(tags, candidates = []) {
  if (!tags || typeof tags !== "object") return null;

  const index = new Map();
  Object.entries(tags).forEach(([key, value]) => {
    index.set(canonicalTagKey(key), value);
  });

  for (const candidate of candidates) {
    const value = index.get(canonicalTagKey(candidate));
    if (value == null) continue;
    if (typeof value === "string" && value.trim() === "") continue;
    return value;
  }

  return null;
}

function hasTagValue(tags, candidates = []) {
  const value = getTagValue(tags, candidates);
  if (value == null) return false;
  if (typeof value !== "string") return true;
  return value.trim() !== "";
}

function startOfUtcMonth(date = NOW()) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1, 0, 0, 0, 0));
}

function endOfUtcDay(date = NOW()) {
  return new Date(
    Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate(),
      23,
      59,
      59,
      999
    )
  );
}

function endOfUtcMonth(date = NOW()) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0, 23, 59, 59, 999));
}

function addUtcDays(date, days) {
  const next = new Date(date.getTime());
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function addUtcMonths(date, months) {
  const next = new Date(date.getTime());
  next.setUTCMonth(next.getUTCMonth() + months);
  return next;
}

function numberOrZero(value) {
  return roundTo(toNumber(value, 0), 2);
}

function normalizeSortOrder(sortOrder = "desc") {
  return String(sortOrder).toLowerCase() === "asc" ? "ASC" : "DESC";
}

const FACT_ATTRIBUTES = [
  "id",
  "uploadid",
  "cloudaccountid",
  "serviceid",
  "regionid",
  "resourceid",
  "subaccountid",
  "commitmentdiscountid",
  "chargecategory",
  "chargeclass",
  "chargedescription",
  "consumedquantity",
  "consumedunit",
  "pricingquantity",
  "pricingunit",
  "listunitprice",
  "contractedunitprice",
  "listcost",
  "contractedcost",
  "effectivecost",
  "billedcost",
  "billingperiodstart",
  "billingperiodend",
  "chargeperiodstart",
  "chargeperiodend",
  "tags",
];

function getInclude({ withResource = true, withSubAccount = true, withCommitment = true } = {}) {
  const include = [
    {
      model: CloudAccount,
      as: "cloudAccount",
      required: false,
      attributes: ["providername", "billingaccountid", "billingaccountname"],
    },
    {
      model: Service,
      as: "service",
      required: false,
      attributes: ["servicename", "servicecategory"],
    },
    {
      model: Region,
      as: "region",
      required: false,
      attributes: ["regionname", "availabilityzone"],
    },
  ];

  if (withResource) {
    include.push({
      model: Resource,
      as: "resource",
      required: false,
      attributes: ["resourcename", "resourcetype"],
    });
  }

  if (withSubAccount) {
    include.push({
      model: SubAccount,
      as: "subAccount",
      required: false,
      attributes: ["subaccountname"],
    });
  }

  if (withCommitment) {
    include.push({
      model: CommitmentDiscount,
      as: "commitmentDiscount",
      required: false,
      attributes: [
        "commitmentdiscountname",
        "commitmentdiscountcategory",
        "commitmentdiscountstatus",
        "commitmentdiscounttype",
      ],
    });
  }

  return include;
}

function mapFactRow(record) {
  const row = record?.get ? record.get({ plain: true }) : record;
  return {
    id: row.id,
    uploadId: row.uploadid,
    billedCost: toNumber(row.billedcost, 0),
    effectiveCost: toNumber(row.effectivecost, 0),
    listCost: toNumber(row.listcost, 0),
    contractedCost: toNumber(row.contractedcost, 0),
    listUnitPrice: toNumber(row.listunitprice, 0),
    contractedUnitPrice: toNumber(row.contractedunitprice, 0),
    consumedQuantity: toNumber(row.consumedquantity, 0),
    pricingQuantity: toNumber(row.pricingquantity, 0),
    consumedUnit: row.consumedunit || null,
    pricingUnit: row.pricingunit || null,
    chargeCategory: row.chargecategory || null,
    chargeClass: row.chargeclass || null,
    chargeDescription: row.chargedescription || null,
    chargePeriodStart: row.chargeperiodstart || null,
    chargePeriodEnd: row.chargeperiodend || null,
    billingPeriodStart: row.billingperiodstart || null,
    billingPeriodEnd: row.billingperiodend || null,
    resourceId: row.resourceid || null,
    subAccountId: row.subaccountid || null,
    commitmentDiscountId: row.commitmentdiscountid || null,
    tags: row.tags && typeof row.tags === "object" ? row.tags : {},
    providerName: row.cloudAccount?.providername || null,
    billingAccountId: row.cloudAccount?.billingaccountid || null,
    billingAccountName: row.cloudAccount?.billingaccountname || null,
    serviceName: row.service?.servicename || "Unknown",
    serviceCategory: row.service?.servicecategory || "Unknown",
    regionName: row.region?.regionname || "Unknown",
    availabilityZone: row.region?.availabilityzone || null,
    resourceName: row.resource?.resourcename || null,
    resourceType: row.resource?.resourcetype || null,
    subAccountName: row.subAccount?.subaccountname || null,
    commitmentName: row.commitmentDiscount?.commitmentdiscountname || null,
    commitmentCategory: row.commitmentDiscount?.commitmentdiscountcategory || null,
    commitmentStatus: row.commitmentDiscount?.commitmentdiscountstatus || null,
    commitmentType: row.commitmentDiscount?.commitmentdiscounttype || null,
  };
}

async function resolveUploadIds(clientId, requestedUploadIds = []) {
  const normalizedRequested = unique(requestedUploadIds.map((entry) => String(entry).trim()));
  if (normalizedRequested.length > 0) return normalizedRequested;
  if (!clientId) return [];

  const completedUploads = await BillingUpload.findAll({
    where: { clientid: clientId, status: "COMPLETED" },
    attributes: ["uploadid"],
    order: [["uploadedat", "DESC"]],
    raw: true,
  });

  if (completedUploads.length > 0) {
    return unique(completedUploads.map((upload) => upload.uploadid));
  }

  const allUploads = await BillingUpload.findAll({
    where: { clientid: clientId },
    attributes: ["uploadid"],
    order: [["uploadedat", "DESC"]],
    raw: true,
  });

  return unique(allUploads.map((upload) => upload.uploadid));
}

async function resolveFiltersToIds(filters = {}) {
  const where = {};

  if (filters.provider && filters.provider !== "All") {
    const accounts = await CloudAccount.findAll({
      where: {
        providername: { [Op.iLike]: String(filters.provider).trim() },
      },
      attributes: ["id"],
      raw: true,
    });

    if (!accounts.length) return null;
    where.cloudaccountid = { [Op.in]: accounts.map((entry) => entry.id) };
  }

  if (filters.service && filters.service !== "All") {
    const services = await Service.findAll({
      where: {
        servicename: { [Op.iLike]: String(filters.service).trim() },
      },
      attributes: ["serviceid"],
      raw: true,
    });

    if (!services.length) return null;
    where.serviceid = { [Op.in]: services.map((entry) => entry.serviceid) };
  }

  if (filters.region && filters.region !== "All") {
    const regions = await Region.findAll({
      where: {
        regionname: { [Op.iLike]: String(filters.region).trim() },
      },
      attributes: ["id"],
      raw: true,
    });

    if (!regions.length) return null;
    where.regionid = { [Op.in]: regions.map((entry) => entry.id) };
  }

  return where;
}

async function buildScopedWhereClause({
  uploadIds = [],
  filters = {},
  startDate = null,
  endDate = null,
}) {
  if (!uploadIds.length) return null;

  const resolved = await resolveFiltersToIds(filters);
  if (resolved === null) return null;

  const whereClause = {
    ...resolved,
    uploadid: { [Op.in]: uploadIds },
  };

  if (startDate && endDate) {
    whereClause.chargeperiodstart = { [Op.between]: [startDate, endDate] };
  } else if (startDate) {
    whereClause.chargeperiodstart = { [Op.gte]: startDate };
  } else if (endDate) {
    whereClause.chargeperiodstart = { [Op.lte]: endDate };
  }

  return whereClause;
}

async function sumField(whereClause, field) {
  if (!whereClause) return 0;
  const result = await BillingUsageFact.sum(field, { where: whereClause });
  return toNumber(result, 0);
}

async function getDateBounds(whereClause) {
  if (!whereClause) return { minChargeDate: null, maxChargeDate: null };

  const row = await BillingUsageFact.findOne({
    where: whereClause,
    attributes: [
      [fn("MIN", col("chargeperiodstart")), "minChargeDate"],
      [fn("MAX", col("chargeperiodstart")), "maxChargeDate"],
    ],
    raw: true,
  });

  return {
    minChargeDate: row?.minChargeDate || null,
    maxChargeDate: row?.maxChargeDate || null,
  };
}

async function fetchFactRows({
  whereClause,
  limit = ANALYSIS_ROW_LIMIT,
  offset = 0,
  order = [["chargeperiodstart", "DESC"]],
  include = getInclude(),
}) {
  if (!whereClause) return [];

  const rows = await BillingUsageFact.findAll({
    where: whereClause,
    include,
    attributes: FACT_ATTRIBUTES,
    limit,
    offset,
    order,
  });

  return rows.map(mapFactRow);
}

function groupRowsBy(rows, keySelector) {
  const groups = new Map();
  for (const row of rows) {
    const key = keySelector(row);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(row);
  }
  return groups;
}

function buildDailyTotals(rows = []) {
  const dailyMap = new Map();

  rows.forEach((row) => {
    const dateKey = toUtcDateKey(row.chargePeriodStart);
    if (!dateKey) return;
    dailyMap.set(dateKey, (dailyMap.get(dateKey) || 0) + row.billedCost);
  });

  return Array.from(dailyMap.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, value]) => ({ date, total: roundTo(value, 2) }));
}

function buildServiceTotals(rows = []) {
  const totals = new Map();
  rows.forEach((row) => {
    const service = row.serviceName || "Unknown";
    totals.set(service, (totals.get(service) || 0) + row.billedCost);
  });

  return Array.from(totals.entries())
    .map(([name, value]) => ({ name, value: roundTo(value, 2) }))
    .sort((a, b) => b.value - a.value);
}

function normalizeText(value) {
  if (value == null) return "";
  return String(value).trim().toLowerCase();
}

function applyDataExplorerFilters(rows = [], { search = "", columnFilters = {} } = {}) {
  const normalizedSearch = normalizeText(search);
  const filterEntries = Object.entries(columnFilters || {}).filter(([, value]) => value != null && value !== "");

  return rows.filter((row) => {
    if (normalizedSearch) {
      const haystack = [
        row.id,
        row.providerName,
        row.billingAccountId,
        row.billingAccountName,
        row.serviceName,
        row.regionName,
        row.resourceId,
        row.chargeCategory,
        row.chargeClass,
        row.chargeDescription,
      ]
        .map((value) => normalizeText(value))
        .join(" ");

      if (!haystack.includes(normalizedSearch)) return false;
    }

    for (const [column, filterValue] of filterEntries) {
      const filter = normalizeText(filterValue);
      if (!filter) continue;

      const candidate = (() => {
        switch (column) {
          case "provider":
          case "ProviderName":
            return row.providerName;
          case "service":
          case "ServiceName":
            return row.serviceName;
          case "region":
          case "RegionName":
            return row.regionName;
          case "resourceId":
          case "ResourceId":
            return row.resourceId;
          case "chargeCategory":
          case "ChargeCategory":
            return row.chargeCategory;
          case "owner":
            return getTagValue(row.tags, ["owner"]);
          case "environment":
            return getTagValue(row.tags, ["environment", "env"]);
          default:
            return row[column];
        }
      })();

      if (!normalizeText(candidate).includes(filter)) return false;
    }

    return true;
  });
}

function sortRows(rows = [], sortBy = "chargePeriodStart", sortOrder = "desc") {
  const orderMultiplier = normalizeSortOrder(sortOrder) === "ASC" ? 1 : -1;
  const normalizedSortBy = String(sortBy || "chargePeriodStart");

  const sortable = [...rows];
  sortable.sort((a, b) => {
    const read = (row) => {
      switch (normalizedSortBy) {
        case "billedCost":
        case "BilledCost":
          return row.billedCost;
        case "consumedQuantity":
        case "ConsumedQuantity":
          return row.consumedQuantity;
        case "provider":
        case "ProviderName":
          return row.providerName || "";
        case "service":
        case "ServiceName":
          return row.serviceName || "";
        case "region":
        case "RegionName":
          return row.regionName || "";
        case "resourceId":
        case "ResourceId":
          return row.resourceId || "";
        case "chargePeriodStart":
        case "ChargePeriodStart":
        default:
          return row.chargePeriodStart ? new Date(row.chargePeriodStart).getTime() : 0;
      }
    };

    const left = read(a);
    const right = read(b);

    if (typeof left === "string" || typeof right === "string") {
      return String(left).localeCompare(String(right)) * orderMultiplier;
    }

    return (toNumber(left, 0) - toNumber(right, 0)) * orderMultiplier;
  });

  return sortable;
}

function paginateRows(rows = [], page = 1, limit = 50) {
  const offset = (page - 1) * limit;
  const data = rows.slice(offset, offset + limit);
  return {
    data,
    pagination: {
      page,
      limit,
      total: rows.length,
      totalPages: Math.ceil(rows.length / limit) || 1,
    },
  };
}

function mapExplorerRow(row) {
  return {
    Id: row.id,
    UploadId: row.uploadId,
    BilledCost: numberOrZero(row.billedCost),
    EffectiveCost: numberOrZero(row.effectiveCost),
    ListCost: numberOrZero(row.listCost),
    ContractedCost: numberOrZero(row.contractedCost),
    ConsumedQuantity: numberOrZero(row.consumedQuantity),
    ConsumedUnit: row.consumedUnit,
    PricingQuantity: numberOrZero(row.pricingQuantity),
    PricingUnit: row.pricingUnit,
    ChargeCategory: row.chargeCategory,
    ChargeClass: row.chargeClass,
    ChargeDescription: row.chargeDescription,
    ChargePeriodStart: row.chargePeriodStart,
    ChargePeriodEnd: row.chargePeriodEnd,
    ProviderName: row.providerName,
    BillingAccountId: row.billingAccountId,
    BillingAccountName: row.billingAccountName,
    ServiceName: row.serviceName,
    ServiceCategory: row.serviceCategory,
    RegionName: row.regionName,
    AvailabilityZone: row.availabilityZone,
    ResourceId: row.resourceId,
    ResourceName: row.resourceName,
    SubAccountId: row.subAccountId,
    SubAccountName: row.subAccountName,
    Tags: row.tags,
  };
}

function buildEmptyState(message = "No upload selected or no billing data found.") {
  return {
    success: true,
    message,
    kpis: {},
    visuals: {},
    table: {},
  };
}

function buildExecutiveActions({
  forecast,
  budget,
  unallocatedPercent,
  topRiskServices = [],
  freshnessHours,
}) {
  const actions = [];

  if (budget > 0 && forecast > budget) {
    actions.push({
      action: "Contain forecast overrun",
      owner: "FinOps Lead",
      impact: numberOrZero(forecast - budget),
      eta: "3 business days",
      status: "open",
    });
  }

  if (unallocatedPercent > 5) {
    actions.push({
      action: "Close chargeback tag gaps",
      owner: "Cloud Platform Team",
      impact: roundTo(unallocatedPercent, 2),
      eta: "1 week",
      status: "in-progress",
    });
  }

  if (topRiskServices.length > 0) {
    actions.push({
      action: `Investigate volatility in ${topRiskServices[0].service}`,
      owner: "Engineering Owner",
      impact: numberOrZero(topRiskServices[0].spend),
      eta: "2 business days",
      status: "open",
    });
  }

  if (freshnessHours > 24) {
    actions.push({
      action: "Recover billing ingestion freshness",
      owner: "DataOps",
      impact: roundTo(freshnessHours, 1),
      eta: "Same day",
      status: "escalated",
    });
  }

  if (!actions.length) {
    actions.push({
      action: "Maintain current spend controls",
      owner: "FinOps Lead",
      impact: 0,
      eta: "This week",
      status: "on-track",
    });
  }

  return actions.slice(0, 5);
}

function computeTopRiskServices(rows = []) {
  const last30DaysBoundary = addUtcDays(endOfUtcDay(NOW()), -29);
  const recentRows = rows.filter((row) => {
    if (!row.chargePeriodStart) return false;
    const date = new Date(row.chargePeriodStart);
    return date >= last30DaysBoundary;
  });

  const byService = groupRowsBy(recentRows, (row) => row.serviceName || "Unknown");
  const totalSpend = recentRows.reduce((sum, row) => sum + row.billedCost, 0);

  const risk = [];
  for (const [service, serviceRows] of byService.entries()) {
    const daily = buildDailyTotals(serviceRows).map((entry) => entry.total);
    const spend = serviceRows.reduce((sum, row) => sum + row.billedCost, 0);
    const volatility = safeDivide(standardDeviation(daily), average(daily));
    const share = ratioPercent(spend, totalSpend);
    const score = roundTo(Math.min(volatility, 2) * 50 + share * 0.5, 2);

    risk.push({
      service,
      spend: roundTo(spend, 2),
      spendSharePercent: roundTo(share, 2),
      volatility: roundTo(volatility, 4),
      riskScore: score,
    });
  }

  return risk.sort((a, b) => b.riskScore - a.riskScore).slice(0, 10);
}

function computeMoMWaterfall(rows = []) {
  const current = NOW();
  const currentStart = startOfUtcMonth(current);
  const previousStart = startOfUtcMonth(addUtcMonths(currentStart, -1));
  const previousEnd = addUtcDays(currentStart, -1);

  const currentRows = rows.filter((row) => {
    if (!row.chargePeriodStart) return false;
    const date = new Date(row.chargePeriodStart);
    return date >= currentStart && date <= endOfUtcDay(current);
  });

  const previousRows = rows.filter((row) => {
    if (!row.chargePeriodStart) return false;
    const date = new Date(row.chargePeriodStart);
    return date >= previousStart && date <= previousEnd;
  });

  const currentTotals = buildServiceTotals(currentRows);
  const previousTotals = buildServiceTotals(previousRows);

  const previousMap = new Map(previousTotals.map((entry) => [entry.name, entry.value]));
  const keys = new Set([
    ...currentTotals.map((entry) => entry.name),
    ...previousTotals.map((entry) => entry.name),
  ]);

  return Array.from(keys)
    .map((name) => {
      const currentValue = toNumber(currentTotals.find((entry) => entry.name === name)?.value, 0);
      const previousValue = toNumber(previousMap.get(name), 0);
      const delta = currentValue - previousValue;

      return {
        service: name,
        previous: roundTo(previousValue, 2),
        current: roundTo(currentValue, 2),
        delta: roundTo(delta, 2),
      };
    })
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
    .slice(0, 12);
}

function parseCommitmentExpiry(tags) {
  const rawExpiry = getTagValue(tags, [
    "commitment_expiry",
    "ri_expiry",
    "savings_plan_expiry",
    "cud_expiry",
    "expiry",
    "expiration",
  ]);

  if (!rawExpiry) return null;
  const date = new Date(rawExpiry);
  return Number.isNaN(date.getTime()) ? null : date;
}

function percentile(values = [], percentileValue = 0.75) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.max(
    0,
    Math.min(sorted.length - 1, Math.floor(sorted.length * percentileValue))
  );
  return sorted[index];
}

function buildIssueSeverity(costValue) {
  const cost = toNumber(costValue, 0);
  if (cost >= 5000) return "critical";
  if (cost >= 1000) return "high";
  if (cost >= 250) return "medium";
  return "low";
}

function makeScenarioForecast(baseForecast, scenarioMultipliers = {}) {
  const baseMultiplier = toNumber(scenarioMultipliers.base, 1);
  const upsideMultiplier = toNumber(scenarioMultipliers.upside, 1.15);
  const downsideMultiplier = toNumber(scenarioMultipliers.downside, 0.9);

  const base = baseForecast * baseMultiplier;
  const upside = baseForecast * upsideMultiplier;
  const downside = baseForecast * downsideMultiplier;

  return {
    base: roundTo(base, 2),
    upside: roundTo(upside, 2),
    downside: roundTo(downside, 2),
    variance: roundTo(upside - downside, 2),
    multipliers: {
      base: baseMultiplier,
      upside: upsideMultiplier,
      downside: downsideMultiplier,
    },
  };
}

async function loadContext({
  clientId,
  requestedUploadIds = [],
  filters = {},
  startDate = null,
  endDate = null,
}) {
  const uploadIds = await resolveUploadIds(clientId, requestedUploadIds);
  const whereClause = await buildScopedWhereClause({
    uploadIds,
    filters,
    startDate,
    endDate,
  });

  return { uploadIds, whereClause };
}

export const clientJDashboardService = {
  async getFilters({ clientId, requestedUploadIds = [] }) {
    const uploadIds = await resolveUploadIds(clientId, requestedUploadIds);
    if (!uploadIds.length) {
      return {
        providers: ["All"],
        services: ["All"],
        regions: ["All"],
        dateRange: { min: null, max: null },
        uploadIds: [],
      };
    }

    const whereClause = { uploadid: { [Op.in]: uploadIds } };

    const [providers, services, regions, bounds] = await Promise.all([
      BillingUsageFact.findAll({
        where: whereClause,
        include: [{ model: CloudAccount, as: "cloudAccount", required: true, attributes: [] }],
        attributes: [[fn("DISTINCT", col("cloudAccount.providername")), "value"]],
        raw: true,
      }),
      BillingUsageFact.findAll({
        where: whereClause,
        include: [{ model: Service, as: "service", required: true, attributes: [] }],
        attributes: [[fn("DISTINCT", col("service.servicename")), "value"]],
        raw: true,
      }),
      BillingUsageFact.findAll({
        where: whereClause,
        include: [{ model: Region, as: "region", required: true, attributes: [] }],
        attributes: [[fn("DISTINCT", col("region.regionname")), "value"]],
        raw: true,
      }),
      getDateBounds(whereClause),
    ]);

    return {
      providers: ["All", ...unique(providers.map((entry) => entry.value))],
      services: ["All", ...unique(services.map((entry) => entry.value))],
      regions: ["All", ...unique(regions.map((entry) => entry.value))],
      dateRange: {
        min: bounds.minChargeDate,
        max: bounds.maxChargeDate,
      },
      uploadIds,
    };
  },

  async getExecutiveOverview({
    clientId,
    requestedUploadIds = [],
    filters = {},
    budget = 0,
  }) {
    const now = NOW();
    const todayEnd = endOfUtcDay(now);
    const monthStart = startOfUtcMonth(now);
    const previousMonthStart = startOfUtcMonth(addUtcMonths(monthStart, -1));
    const previousMonthEnd = addUtcDays(monthStart, -1);

    const uploadIds = await resolveUploadIds(clientId, requestedUploadIds);
    if (!uploadIds.length) return buildEmptyState("No completed uploads found for this client.");

    const [allWhere, mtdWhere, previousWhere] = await Promise.all([
      buildScopedWhereClause({ uploadIds, filters }),
      buildScopedWhereClause({
        uploadIds,
        filters,
        startDate: monthStart,
        endDate: todayEnd,
      }),
      buildScopedWhereClause({
        uploadIds,
        filters,
        startDate: previousMonthStart,
        endDate: previousMonthEnd,
      }),
    ]);

    if (!allWhere || !mtdWhere || !previousWhere) {
      return buildEmptyState("Selected filters returned no matching data.");
    }

    const [mtdSpend, previousMonthSpend, listSpendMtd, effectiveSpendMtd, mtdRows, bounds] =
      await Promise.all([
        sumField(mtdWhere, "billedcost"),
        sumField(previousWhere, "billedcost"),
        sumField(mtdWhere, "listcost"),
        sumField(mtdWhere, "effectivecost"),
        fetchFactRows({
          whereClause: mtdWhere,
          include: getInclude({ withResource: false, withSubAccount: false, withCommitment: false }),
        }),
        getDateBounds(allWhere),
      ]);

    const realizedSavings = Math.max(0, potentialSavings(listSpendMtd, effectiveSpendMtd));
    const daysElapsed = Math.max(1, now.getUTCDate());
    const daysInMonth = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0)
    ).getUTCDate();
    const avgDaily = dailyAverageSpend(mtdSpend, daysElapsed);
    const eomForecast = forecastedMonthlySpend(avgDaily, daysInMonth);
    const varianceValue = budgetVariance(eomForecast, budget);
    const budgetUtilization = budgetUtilizationPercentage(eomForecast, budget);

    const unallocatedCost = mtdRows.reduce((sum, row) => {
      const hasOwner = hasTagValue(row.tags, ["owner"]);
      const hasCostCenter = hasTagValue(row.tags, ["cost_center", "costcenter", "cc"]);
      const hasProject = hasTagValue(row.tags, ["project", "project_code"]);
      const hasEnvironment = hasTagValue(row.tags, ["environment", "env"]);
      const allocated = hasOwner && (hasCostCenter || hasProject) && hasEnvironment;
      return sum + (allocated ? 0 : row.billedCost);
    }, 0);

    const unallocatedSpendPercent = ratioPercent(unallocatedCost, mtdSpend);
    const spendMoMPercent = monthOverMonthPercentage(mtdSpend, previousMonthSpend);

    const freshnessHours = (() => {
      if (!bounds.maxChargeDate) return null;
      const maxDate = new Date(bounds.maxChargeDate);
      if (Number.isNaN(maxDate.getTime())) return null;
      return (now.getTime() - maxDate.getTime()) / (1000 * 60 * 60);
    })();

    const allRowsForRisk = await fetchFactRows({
      whereClause: allWhere,
      include: getInclude({ withResource: false, withSubAccount: false, withCommitment: false }),
    });

    const topRiskServices = computeTopRiskServices(allRowsForRisk);
    const moMWaterfall = computeMoMWaterfall(allRowsForRisk);
    const topActions = buildExecutiveActions({
      forecast: eomForecast,
      budget,
      unallocatedPercent: unallocatedSpendPercent,
      topRiskServices,
      freshnessHours: toNumber(freshnessHours, 0),
    });

    return {
      success: true,
      uploadIds,
      kpis: {
        mtdSpend: numberOrZero(mtdSpend),
        eomForecast: numberOrZero(eomForecast),
        budget: numberOrZero(budget),
        budgetVariance: numberOrZero(varianceValue),
        budgetUtilizationPercent: numberOrZero(budgetUtilization),
        realizedSavings: numberOrZero(realizedSavings),
        unallocatedSpendPercent: numberOrZero(unallocatedSpendPercent),
        dataFreshnessHours: freshnessHours == null ? null : roundTo(freshnessHours, 2),
        monthOverMonthPercent: numberOrZero(spendMoMPercent),
      },
      visuals: {
        budgetBullet: {
          actual: numberOrZero(mtdSpend),
          forecast: numberOrZero(eomForecast),
          budget: numberOrZero(budget),
          variance: numberOrZero(varianceValue),
        },
        momVarianceWaterfall: moMWaterfall,
        topRiskBar: topRiskServices,
      },
      table: {
        topActionsThisWeek: topActions,
      },
      meta: {
        periodStart: monthStart.toISOString(),
        periodEnd: todayEnd.toISOString(),
        sourceRows: allRowsForRisk.length,
      },
    };
  },

  async getDataExplorer({
    clientId,
    requestedUploadIds = [],
    filters = {},
    startDate = null,
    endDate = null,
    page = 1,
    limit = 50,
    sortBy = "chargePeriodStart",
    sortOrder = "desc",
    groupBy = "service",
    search = "",
    columnFilters = {},
    selectedRowIds = [],
  }) {
    const { uploadIds, whereClause } = await loadContext({
      clientId,
      requestedUploadIds,
      filters,
      startDate,
      endDate,
    });

    if (!uploadIds.length || !whereClause) {
      return {
        success: true,
        uploadIds,
        kpis: {
          recordCount: 0,
          filteredSpend: 0,
          avgUnitCost: 0,
          selectedRowsImpact: 0,
        },
        visuals: {
          pivotView: [],
          distributions: [],
          columnDataBars: {},
        },
        table: {
          rows: [],
          pagination: { page, limit, total: 0, totalPages: 1 },
          savedViews: [],
        },
      };
    }

    const totalDatabaseCount = await BillingUsageFact.count({ where: whereClause });
    const scanLimit = Math.min(totalDatabaseCount || DATA_EXPLORER_SCAN_LIMIT, DATA_EXPLORER_SCAN_LIMIT);

    const scannedRows = await fetchFactRows({
      whereClause,
      limit: scanLimit || DATA_EXPLORER_SCAN_LIMIT,
      include: getInclude({ withResource: true, withSubAccount: true, withCommitment: true }),
    });

    const filteredRows = applyDataExplorerFilters(scannedRows, { search, columnFilters });
    const sortedRows = sortRows(filteredRows, sortBy, sortOrder);
    const paginated = paginateRows(sortedRows, page, limit);

    const mappedRows = paginated.data.map(mapExplorerRow);
    const filteredSpend = filteredRows.reduce((sum, row) => sum + row.billedCost, 0);
    const totalConsumed = filteredRows.reduce((sum, row) => sum + row.consumedQuantity, 0);
    const avgUnitCost = safeDivide(filteredSpend, totalConsumed);

    const selectedSet = new Set(selectedRowIds || []);
    const selectedRowsImpact = filteredRows
      .filter((row) => selectedSet.has(row.id))
      .reduce((sum, row) => sum + row.billedCost, 0);

    const pivotKeySelector = (row) => {
      switch (groupBy) {
        case "provider":
          return row.providerName || "Unknown";
        case "region":
          return row.regionName || "Unknown";
        case "chargeCategory":
          return row.chargeCategory || "Unknown";
        case "environment":
          return getTagValue(row.tags, ["environment", "env"]) || "Unknown";
        case "service":
        default:
          return row.serviceName || "Unknown";
      }
    };

    const pivotGroups = groupRowsBy(filteredRows, pivotKeySelector);
    const pivotView = Array.from(pivotGroups.entries())
      .map(([group, rows]) => {
        const spend = rows.reduce((sum, row) => sum + row.billedCost, 0);
        return {
          group,
          spend: roundTo(spend, 2),
          records: rows.length,
          percent: roundTo(ratioPercent(spend, filteredSpend), 2),
        };
      })
      .sort((a, b) => b.spend - a.spend)
      .slice(0, 25);

    const distributions = buildServiceTotals(filteredRows)
      .slice(0, 10)
      .map((entry) => ({
        name: entry.name,
        value: entry.value,
        sharePercent: roundTo(ratioPercent(entry.value, filteredSpend), 2),
      }));

    const columnDataBars = {
      billedCostMax: roundTo(Math.max(...filteredRows.map((row) => row.billedCost), 0), 2),
      consumedQuantityMax: roundTo(
        Math.max(...filteredRows.map((row) => row.consumedQuantity), 0),
        2
      ),
      effectiveCostMax: roundTo(Math.max(...filteredRows.map((row) => row.effectiveCost), 0), 2),
    };

    return {
      success: true,
      uploadIds,
      kpis: {
        recordCount: filteredRows.length,
        filteredSpend: numberOrZero(filteredSpend),
        avgUnitCost: numberOrZero(avgUnitCost),
        selectedRowsImpact: numberOrZero(selectedRowsImpact),
      },
      visuals: {
        pivotView,
        distributions,
        columnDataBars,
      },
      table: {
        rows: mappedRows,
        pagination: paginated.pagination,
        savedViews: [
          { id: "default-finops", name: "Default FinOps", scope: "global" },
          { id: "owner-missing", name: "Missing Owners", scope: "governance" },
          { id: "high-unit-cost", name: "High Unit Cost", scope: "optimization" },
        ],
      },
      meta: {
        totalDatabaseCount,
        scannedCount: scannedRows.length,
        isTruncated: totalDatabaseCount > scannedRows.length,
      },
    };
  },

  async exportDataExplorerCsv({
    clientId,
    requestedUploadIds = [],
    filters = {},
    startDate = null,
    endDate = null,
    search = "",
    columnFilters = {},
    visibleColumns = [],
    selectedRowIds = [],
  }) {
    const { uploadIds, whereClause } = await loadContext({
      clientId,
      requestedUploadIds,
      filters,
      startDate,
      endDate,
    });

    if (!uploadIds.length || !whereClause) {
      return "Id,BilledCost,ServiceName,RegionName,ProviderName\n";
    }

    const totalCount = await BillingUsageFact.count({ where: whereClause });
    const rows = await fetchFactRows({
      whereClause,
      limit: Math.min(totalCount || CSV_EXPORT_LIMIT, CSV_EXPORT_LIMIT),
      include: getInclude(),
    });

    const filteredRows = applyDataExplorerFilters(rows, { search, columnFilters });
    const selectedSet = new Set(selectedRowIds || []);
    const rowsToExport =
      selectedSet.size > 0 ? filteredRows.filter((row) => selectedSet.has(row.id)) : filteredRows;

    const mappedRows = rowsToExport.map(mapExplorerRow);
    const fallbackColumns = [
      "Id",
      "BilledCost",
      "ServiceName",
      "RegionName",
      "ProviderName",
      "ChargePeriodStart",
      "ResourceId",
      "Tags",
    ];

    const columns = visibleColumns?.length ? visibleColumns : fallbackColumns;
    const escape = (value) => {
      if (value == null) return "";
      const serialized = typeof value === "object" ? JSON.stringify(value) : String(value);
      return /[,"\n]/.test(serialized)
        ? `"${serialized.replace(/"/g, '""')}"`
        : serialized;
    };

    const header = columns.join(",");
    const records = mappedRows.map((row) => columns.map((column) => escape(row[column])).join(","));
    return [header, ...records].join("\n");
  },

  async getSpendIntelligence({
    clientId,
    requestedUploadIds = [],
    filters = {},
    startDate = null,
    endDate = null,
  }) {
    const now = NOW();
    const defaultEnd = endDate || endOfUtcDay(now);
    const defaultStart = startDate || addUtcDays(defaultEnd, -89);

    const { uploadIds, whereClause } = await loadContext({
      clientId,
      requestedUploadIds,
      filters,
      startDate: defaultStart,
      endDate: defaultEnd,
    });

    if (!uploadIds.length || !whereClause) {
      return buildEmptyState("No spend data found for spend intelligence.");
    }

    const rows = await fetchFactRows({
      whereClause,
      include: getInclude({ withResource: false, withSubAccount: false, withCommitment: false }),
    });

    if (!rows.length) return buildEmptyState("No spend data found for selected period.");

    const totalSpend = rows.reduce((sum, row) => sum + row.billedCost, 0);
    const dailyTotals = buildDailyTotals(rows);
    const dailyValues = dailyTotals.map((entry) => entry.total);
    const baseline = average(dailyValues);
    const volatility = safeDivide(standardDeviation(dailyValues), baseline);
    const threshold = anomalyThreshold(baseline, standardDeviation(dailyValues), 2);
    const anomalyImpact = dailyTotals
      .filter((entry) => entry.total > threshold)
      .reduce((sum, entry) => sum + (entry.total - threshold), 0);

    const serviceTotals = buildServiceTotals(rows);
    const topConcentration = serviceTotals.length
      ? ratioPercent(serviceTotals[0].value, totalSpend)
      : 0;

    const topServices = serviceTotals.slice(0, 5).map((entry) => entry.name);
    const topServiceSet = new Set(topServices);

    const stackedByDate = new Map();
    rows.forEach((row) => {
      const date = toUtcDateKey(row.chargePeriodStart);
      if (!date) return;

      if (!stackedByDate.has(date)) {
        const base = { date, total: 0, Others: 0 };
        topServices.forEach((service) => {
          base[service] = 0;
        });
        stackedByDate.set(date, base);
      }

      const bucket = stackedByDate.get(date);
      const serviceKey = topServiceSet.has(row.serviceName) ? row.serviceName : "Others";
      bucket[serviceKey] += row.billedCost;
      bucket.total += row.billedCost;
    });

    const stackedAreaTrend = Array.from(stackedByDate.values()).sort((a, b) =>
      a.date.localeCompare(b.date)
    );

    let cumulative = 0;
    const pareto = serviceTotals.map((entry) => {
      cumulative += ratioPercent(entry.value, totalSpend);
      return {
        service: entry.name,
        spend: entry.value,
        cumulativePercent: roundTo(cumulative, 2),
      };
    });

    const midPoint = Math.floor(dailyTotals.length / 2);
    const previousPeriodDates = new Set(dailyTotals.slice(0, midPoint).map((entry) => entry.date));
    const currentPeriodDates = new Set(dailyTotals.slice(midPoint).map((entry) => entry.date));

    const previousByService = new Map();
    const currentByService = new Map();
    const driverMap = new Map();

    rows.forEach((row) => {
      const date = toUtcDateKey(row.chargePeriodStart);
      if (!date) return;
      const service = row.serviceName || "Unknown";

      if (!driverMap.has(service)) {
        driverMap.set(service, {
          priorCost: 0,
          currentCost: 0,
          priorQuantity: 0,
          currentQuantity: 0,
        });
      }

      const driver = driverMap.get(service);
      if (previousPeriodDates.has(date)) {
        previousByService.set(service, (previousByService.get(service) || 0) + row.billedCost);
        driver.priorCost += row.billedCost;
        driver.priorQuantity += row.consumedQuantity;
      } else if (currentPeriodDates.has(date)) {
        currentByService.set(service, (currentByService.get(service) || 0) + row.billedCost);
        driver.currentCost += row.billedCost;
        driver.currentQuantity += row.consumedQuantity;
      }
    });

    const serviceKeys = new Set([
      ...Array.from(previousByService.keys()),
      ...Array.from(currentByService.keys()),
    ]);

    const varianceWaterfall = Array.from(serviceKeys)
      .map((service) => {
        const previous = toNumber(previousByService.get(service), 0);
        const current = toNumber(currentByService.get(service), 0);
        return {
          service,
          previous: roundTo(previous, 2),
          current: roundTo(current, 2),
          delta: roundTo(current - previous, 2),
        };
      })
      .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
      .slice(0, 12);

    const riskMatrixScatter = serviceTotals.slice(0, 20).map((entry) => {
      const relatedRows = rows.filter((row) => row.serviceName === entry.name);
      const serviceDaily = buildDailyTotals(relatedRows).map((item) => item.total);
      const serviceVolatility = safeDivide(standardDeviation(serviceDaily), average(serviceDaily));
      return {
        service: entry.name,
        spend: entry.value,
        spendSharePercent: roundTo(ratioPercent(entry.value, totalSpend), 2),
        volatility: roundTo(serviceVolatility, 4),
      };
    });

    const rollingWindow = 7;
    const predictabilityLine = dailyTotals.map((entry, index) => {
      const windowValues = dailyTotals
        .slice(Math.max(0, index - rollingWindow + 1), index + 1)
        .map((item) => item.total);
      const mean = average(windowValues);
      const sigma = standardDeviation(windowValues);
      return {
        date: entry.date,
        actual: entry.total,
        predicted: roundTo(mean, 2),
        lowerBand: roundTo(Math.max(0, mean - sigma), 2),
        upperBand: roundTo(mean + sigma, 2),
      };
    });

    const driverDecomposition = Array.from(driverMap.entries())
      .map(([service, values]) => {
        const priorRate = safeDivide(values.priorCost, values.priorQuantity);
        const currentRate = safeDivide(values.currentCost, values.currentQuantity);
        const delta = values.currentCost - values.priorCost;
        const volumeImpact = (values.currentQuantity - values.priorQuantity) * priorRate;
        const rateImpact = (currentRate - priorRate) * values.priorQuantity;
        const mixImpact = delta - volumeImpact - rateImpact;

        return {
          service,
          prior: roundTo(values.priorCost, 2),
          current: roundTo(values.currentCost, 2),
          delta: roundTo(delta, 2),
          volumeImpact: roundTo(volumeImpact, 2),
          rateImpact: roundTo(rateImpact, 2),
          mixImpact: roundTo(mixImpact, 2),
        };
      })
      .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
      .slice(0, 25);

    return {
      success: true,
      uploadIds,
      kpis: {
        totalSpend: numberOrZero(totalSpend),
        dailyBaseline: numberOrZero(baseline),
        volatility: numberOrZero(volatility),
        topConcentrationPercent: numberOrZero(topConcentration),
        anomalyImpact: numberOrZero(anomalyImpact),
      },
      visuals: {
        stackedAreaTrend,
        pareto,
        varianceWaterfall,
        riskMatrixScatter,
        predictabilityLine,
      },
      table: {
        driverDecomposition,
      },
      meta: {
        periodStart: defaultStart.toISOString(),
        periodEnd: defaultEnd.toISOString(),
        sourceRows: rows.length,
      },
    };
  },

  async getAllocationChargeback({
    clientId,
    requestedUploadIds = [],
    filters = {},
    startDate = null,
    endDate = null,
    page = 1,
    limit = 50,
  }) {
    const now = NOW();
    const periodStart = startDate || startOfUtcMonth(now);
    const periodEnd = endDate || endOfUtcDay(now);

    const { uploadIds, whereClause } = await loadContext({
      clientId,
      requestedUploadIds,
      filters,
      startDate: periodStart,
      endDate: periodEnd,
    });

    if (!uploadIds.length || !whereClause) {
      return buildEmptyState("No allocation data found.");
    }

    const rows = await fetchFactRows({
      whereClause,
      include: getInclude({ withCommitment: false }),
    });

    if (!rows.length) return buildEmptyState("No chargeback rows found in selected period.");

    const normalized = rows.map((row) => {
      const owner = getTagValue(row.tags, ["owner", "service_owner"]);
      const environment = getTagValue(row.tags, ["environment", "env"]);
      const costCenter = getTagValue(row.tags, ["cost_center", "costcenter", "cc"]);
      const project = getTagValue(row.tags, ["project", "project_code"]);
      const businessUnit = getTagValue(row.tags, ["business_unit", "bu", "department"]);
      const team = getTagValue(row.tags, ["team", "squad"]);

      const tagCoverage = ALLOCATION_REQUIRED_TAGS.filter((tagKey) => {
        if (tagKey === "cost_center") return !!costCenter;
        if (tagKey === "project") return !!project;
        if (tagKey === "owner") return !!owner;
        if (tagKey === "environment") return !!environment;
        return false;
      }).length;

      const allocated = !!owner && !!environment && (!!costCenter || !!project || !!businessUnit);
      const chargebackComplete = !!owner && (!!costCenter || !!project);

      return {
        ...row,
        owner,
        environment,
        costCenter,
        project,
        businessUnit,
        team,
        allocated,
        chargebackComplete,
        tagCoverageRatio: safeDivide(tagCoverage, ALLOCATION_REQUIRED_TAGS.length),
      };
    });

    const totalSpend = normalized.reduce((sum, row) => sum + row.billedCost, 0);
    const allocatedSpend = normalized
      .filter((row) => row.allocated)
      .reduce((sum, row) => sum + row.billedCost, 0);
    const unallocatedSpend = totalSpend - allocatedSpend;
    const tagCoveragePercent =
      average(normalized.map((row) => row.tagCoverageRatio)) * 100;
    const chargebackCompletenessPercent = ratioPercent(
      normalized.filter((row) => row.chargebackComplete).length,
      normalized.length
    );
    const reconciliationDelta = Math.abs(
      normalized.reduce((sum, row) => sum + row.billedCost, 0) -
        normalized.reduce((sum, row) => sum + row.effectiveCost, 0)
    );

    const buildStacked = (keySelector) => {
      const map = new Map();
      normalized.forEach((row) => {
        const key = keySelector(row) || "Unspecified";
        if (!map.has(key)) map.set(key, { key, allocated: 0, unallocated: 0 });
        const bucket = map.get(key);
        if (row.allocated) bucket.allocated += row.billedCost;
        else bucket.unallocated += row.billedCost;
      });

      return Array.from(map.values())
        .map((entry) => ({
          key: entry.key,
          allocated: roundTo(entry.allocated, 2),
          unallocated: roundTo(entry.unallocated, 2),
          total: roundTo(entry.allocated + entry.unallocated, 2),
        }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 20);
    };

    const stackedBars = {
      byBusinessUnit: buildStacked((row) => row.businessUnit),
      byProject: buildStacked((row) => row.project),
      byEnvironment: buildStacked((row) => row.environment),
    };

    const treemapByCostCenter = buildStacked((row) => row.costCenter).map((entry) => ({
      name: entry.key,
      value: entry.total,
    }));

    const heatmapByTeam = (() => {
      const teamMap = new Map();
      normalized.forEach((row) => {
        const team = row.team || "Unassigned";
        if (!teamMap.has(team)) {
          teamMap.set(team, {
            team,
            totalRows: 0,
            owner: 0,
            environment: 0,
            costCenter: 0,
            project: 0,
          });
        }
        const bucket = teamMap.get(team);
        bucket.totalRows += 1;
        if (row.owner) bucket.owner += 1;
        if (row.environment) bucket.environment += 1;
        if (row.costCenter) bucket.costCenter += 1;
        if (row.project) bucket.project += 1;
      });

      return Array.from(teamMap.values()).map((entry) => ({
        team: entry.team,
        ownerCoverage: roundTo(ratioPercent(entry.owner, entry.totalRows), 2),
        environmentCoverage: roundTo(ratioPercent(entry.environment, entry.totalRows), 2),
        costCenterCoverage: roundTo(ratioPercent(entry.costCenter, entry.totalRows), 2),
        projectCoverage: roundTo(ratioPercent(entry.project, entry.totalRows), 2),
      }));
    })();

    const sortedLedger = [...normalized].sort((a, b) => b.billedCost - a.billedCost);
    const ledgerPaged = paginateRows(sortedLedger, page, limit);
    const ledgerRows = ledgerPaged.data.map((row) => ({
      invoiceLineId: row.id,
      chargeDate: row.chargePeriodStart,
      service: row.serviceName,
      region: row.regionName,
      owner: row.owner || "Unassigned",
      project: row.project || "Unassigned",
      costCenter: row.costCenter || "Unassigned",
      environment: row.environment || "Unassigned",
      amount: roundTo(row.billedCost, 2),
      approvalStatus: row.chargebackComplete ? "approved" : "pending",
      exportReady: row.chargebackComplete,
    }));

    return {
      success: true,
      uploadIds,
      kpis: {
        allocatedPercent: numberOrZero(ratioPercent(allocatedSpend, totalSpend)),
        unallocatedAmount: numberOrZero(unallocatedSpend),
        tagCoveragePercent: numberOrZero(tagCoveragePercent),
        chargebackCompletenessPercent: numberOrZero(chargebackCompletenessPercent),
        reconciliationDelta: numberOrZero(reconciliationDelta),
      },
      visuals: {
        stackedBars,
        treemapByCostCenter,
        tagHeatmapByTeam: heatmapByTeam,
      },
      table: {
        chargebackLedger: ledgerRows,
        pagination: ledgerPaged.pagination,
      },
      meta: {
        periodStart: periodStart.toISOString(),
        periodEnd: periodEnd.toISOString(),
        sourceRows: normalized.length,
      },
    };
  },

  async getOptimizationResources({
    clientId,
    requestedUploadIds = [],
    filters = {},
    startDate = null,
    endDate = null,
  }) {
    const now = NOW();
    const periodEnd = endDate || endOfUtcDay(now);
    const periodStart = startDate || addUtcDays(periodEnd, -29);

    const { uploadIds, whereClause } = await loadContext({
      clientId,
      requestedUploadIds,
      filters,
      startDate: periodStart,
      endDate: periodEnd,
    });

    if (!uploadIds.length || !whereClause) {
      return buildEmptyState("No optimization data found.");
    }

    const rows = await fetchFactRows({ whereClause, include: getInclude({ withCommitment: false }) });
    if (!rows.length) return buildEmptyState("No optimization candidates found.");

    const resources = new Map();
    rows.forEach((row) => {
      const resourceId = row.resourceId || `unmapped-${row.id}`;
      if (!resources.has(resourceId)) {
        resources.set(resourceId, {
          resourceId,
          service: row.serviceName,
          owner: getTagValue(row.tags, ["owner"]) || "Unassigned",
          team: getTagValue(row.tags, ["team", "squad"]) || "Unknown",
          totalCost: 0,
          totalQuantity: 0,
          totalListCost: 0,
          totalEffectiveCost: 0,
          firstSeen: row.chargePeriodStart,
          lastSeen: row.chargePeriodStart,
        });
      }

      const bucket = resources.get(resourceId);
      bucket.totalCost += row.billedCost;
      bucket.totalQuantity += row.consumedQuantity;
      bucket.totalListCost += row.listCost;
      bucket.totalEffectiveCost += row.effectiveCost;
      if (row.chargePeriodStart && new Date(row.chargePeriodStart) < new Date(bucket.firstSeen)) {
        bucket.firstSeen = row.chargePeriodStart;
      }
      if (row.chargePeriodStart && new Date(row.chargePeriodStart) > new Date(bucket.lastSeen)) {
        bucket.lastSeen = row.chargePeriodStart;
      }
    });

    const resourceList = Array.from(resources.values()).map((resource) => ({
      ...resource,
      unitCost: safeDivide(resource.totalCost, resource.totalQuantity),
      savingsGap: Math.max(0, resource.totalListCost - resource.totalEffectiveCost),
      ageDays: Math.max(
        1,
        Math.ceil((now.getTime() - new Date(resource.firstSeen).getTime()) / (1000 * 60 * 60 * 24))
      ),
    }));

    const unitCosts = resourceList
      .filter((resource) => resource.totalQuantity > 0)
      .map((resource) => resource.unitCost);
    const p75UnitCost = percentile(unitCosts, 0.75);

    const recommendations = [];
    resourceList.forEach((resource) => {
      if (resource.totalQuantity === 0 && resource.totalCost > 0) {
        recommendations.push({
          id: `${resource.resourceId}-idle`,
          category: "idle",
          resourceId: resource.resourceId,
          owner: resource.owner,
          service: resource.service,
          confidence: "high",
          effort: "low",
          risk: "low",
          potentialSavings: roundTo(resource.totalCost * 0.9, 2),
          dueDate: addUtcDays(now, 7).toISOString(),
          realizationTracking: "identified",
        });
      }

      if (resource.totalQuantity > 0 && resource.unitCost > p75UnitCost * 1.25) {
        const potentialSavings = resource.totalCost * 0.25;
        recommendations.push({
          id: `${resource.resourceId}-rightsizing`,
          category: "rightsizing",
          resourceId: resource.resourceId,
          owner: resource.owner,
          service: resource.service,
          confidence: "medium",
          effort: "medium",
          risk: "medium",
          potentialSavings: roundTo(potentialSavings, 2),
          dueDate: addUtcDays(now, 14).toISOString(),
          realizationTracking: "identified",
        });
      }

      if (resource.savingsGap > 0) {
        recommendations.push({
          id: `${resource.resourceId}-discount-gap`,
          category: "pricing",
          resourceId: resource.resourceId,
          owner: resource.owner,
          service: resource.service,
          confidence: "medium",
          effort: "low",
          risk: "low",
          potentialSavings: roundTo(resource.savingsGap, 2),
          dueDate: addUtcDays(now, 21).toISOString(),
          realizationTracking: "identified",
        });
      }
    });

    const sortedRecommendations = recommendations.sort(
      (a, b) => b.potentialSavings - a.potentialSavings
    );
    const potentialSavingsValue = sortedRecommendations.reduce(
      (sum, recommendation) => sum + recommendation.potentialSavings,
      0
    );
    const inProgressSavings = potentialSavingsValue * 0.35;
    const realizedSavingsValue = resourceList.reduce((sum, resource) => sum + resource.savingsGap, 0);
    const idleResources = resourceList.filter(
      (resource) => resource.totalQuantity === 0 && resource.totalCost > 0
    );
    const rightsizingCount = sortedRecommendations.filter(
      (recommendation) => recommendation.category === "rightsizing"
    ).length;

    const savingsFunnel = {
      identified: roundTo(potentialSavingsValue, 2),
      inProgress: roundTo(inProgressSavings, 2),
      realized: roundTo(Math.min(realizedSavingsValue, potentialSavingsValue), 2),
    };

    const savingsVsRisk = sortedRecommendations.slice(0, 40).map((recommendation) => ({
      id: recommendation.id,
      category: recommendation.category,
      savings: recommendation.potentialSavings,
      risk:
        recommendation.risk === "low"
          ? 1
          : recommendation.risk === "medium"
          ? 2
          : 3,
      effort:
        recommendation.effort === "low"
          ? 1
          : recommendation.effort === "medium"
          ? 2
          : 3,
    }));

    const agingHistogram = (() => {
      const bins = [
        { range: "0-30", min: 0, max: 30, count: 0, cost: 0 },
        { range: "31-90", min: 31, max: 90, count: 0, cost: 0 },
        { range: "91-180", min: 91, max: 180, count: 0, cost: 0 },
        { range: "181+", min: 181, max: Number.MAX_SAFE_INTEGER, count: 0, cost: 0 },
      ];

      resourceList.forEach((resource) => {
        const bucket = bins.find(
          (entry) => resource.ageDays >= entry.min && resource.ageDays <= entry.max
        );
        if (!bucket) return;
        bucket.count += 1;
        bucket.cost += resource.totalCost;
      });

      return bins.map((entry) => ({
        range: entry.range,
        count: entry.count,
        cost: roundTo(entry.cost, 2),
      }));
    })();

    const lifecycleTrend = (() => {
      const byDate = new Map();
      rows.forEach((row) => {
        const date = toUtcDateKey(row.chargePeriodStart);
        if (!date) return;
        if (!byDate.has(date)) {
          byDate.set(date, { date, active: 0, idle: 0, new: 0 });
        }
      });

      resourceList.forEach((resource) => {
        const first = toUtcDateKey(resource.firstSeen);
        const last = toUtcDateKey(resource.lastSeen);
        byDate.forEach((bucket, date) => {
          if (date < first || date > last) return;
          if (resource.totalQuantity === 0) bucket.idle += 1;
          else bucket.active += 1;
        });
        if (first && byDate.has(first)) byDate.get(first).new += 1;
      });

      return Array.from(byDate.values()).sort((a, b) => a.date.localeCompare(b.date));
    })();

    return {
      success: true,
      uploadIds,
      kpis: {
        potentialSavings: numberOrZero(potentialSavingsValue),
        inProgressSavings: numberOrZero(inProgressSavings),
        realizedSavings: numberOrZero(realizedSavingsValue),
        idleCount: idleResources.length,
        idleCost: numberOrZero(idleResources.reduce((sum, row) => sum + row.totalCost, 0)),
        rightsizingCount,
      },
      visuals: {
        savingsFunnel,
        savingsVsRisk,
        agingHistogram,
        resourceLifecycleTrend: lifecycleTrend,
      },
      table: {
        recommendationBacklog: sortedRecommendations.slice(0, 150),
      },
      meta: {
        periodStart: periodStart.toISOString(),
        periodEnd: periodEnd.toISOString(),
        resourceCount: resourceList.length,
      },
    };
  },

  async getCommitmentsRates({
    clientId,
    requestedUploadIds = [],
    filters = {},
    startDate = null,
    endDate = null,
  }) {
    const now = NOW();
    const periodEnd = endDate || endOfUtcDay(now);
    const periodStart = startDate || addUtcDays(periodEnd, -89);

    const { uploadIds, whereClause } = await loadContext({
      clientId,
      requestedUploadIds,
      filters,
      startDate: periodStart,
      endDate: periodEnd,
    });

    if (!uploadIds.length || !whereClause) {
      return buildEmptyState("No commitment data found.");
    }

    const rows = await fetchFactRows({ whereClause, include: getInclude() });
    if (!rows.length) return buildEmptyState("No commitment rows found.");

    const totalSpend = rows.reduce((sum, row) => sum + row.billedCost, 0);
    const committedRows = rows.filter(
      (row) =>
        row.commitmentDiscountId &&
        String(row.commitmentDiscountId).trim() !== ""
    );
    const committedSet = new Set(committedRows.map((row) => row.id));
    const onDemandRows = rows.filter((row) => !committedSet.has(row.id));

    const committedSpend = committedRows.reduce((sum, row) => sum + row.billedCost, 0);
    const coveragePercent = ratioPercent(committedSpend, totalSpend);
    const consumedCommitted = committedRows.reduce((sum, row) => sum + row.consumedQuantity, 0);
    const pricingCommitted = committedRows.reduce((sum, row) => sum + row.pricingQuantity, 0);
    const utilizationPercent = ratioPercent(consumedCommitted, pricingCommitted);

    const wasteCost = committedRows.reduce((sum, row) => {
      const unusedQty = Math.max(0, row.pricingQuantity - row.consumedQuantity);
      return sum + unusedQty * row.contractedUnitPrice;
    }, 0);
    const wastePercent = ratioPercent(wasteCost, committedSpend);

    const effectiveUnitRate = safeDivide(
      committedRows.reduce((sum, row) => sum + row.effectiveCost, 0),
      consumedCommitted
    );
    const onDemandRate = safeDivide(
      onDemandRows.reduce((sum, row) => sum + row.billedCost, 0),
      onDemandRows.reduce((sum, row) => sum + row.consumedQuantity, 0)
    );
    const effectiveRateDelta = effectiveUnitRate - onDemandRate;

    const expiryCounts = { d30: 0, d60: 0, d90: 0 };
    const expiryTimelineMap = new Map();
    committedRows.forEach((row) => {
      const expiry = parseCommitmentExpiry(row.tags);
      if (!expiry) return;
      const daysUntilExpiry = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      if (daysUntilExpiry <= 30) expiryCounts.d30 += 1;
      if (daysUntilExpiry <= 60) expiryCounts.d60 += 1;
      if (daysUntilExpiry <= 90) expiryCounts.d90 += 1;

      const month = toMonthKey(expiry);
      if (!month) return;
      expiryTimelineMap.set(month, (expiryTimelineMap.get(month) || 0) + 1);
    });

    const monthly = groupRowsBy(rows, (row) => toMonthKey(row.chargePeriodStart) || "Unknown");
    const coverageUtilizationTrend = Array.from(monthly.entries())
      .filter(([month]) => month !== "Unknown")
      .map(([month, monthRows]) => {
        const monthCommittedRows = monthRows.filter((row) => row.commitmentDiscountId);
        const monthCommittedSpend = monthCommittedRows.reduce(
          (sum, row) => sum + row.billedCost,
          0
        );
        const monthTotalSpend = monthRows.reduce((sum, row) => sum + row.billedCost, 0);
        const monthConsumed = monthCommittedRows.reduce(
          (sum, row) => sum + row.consumedQuantity,
          0
        );
        const monthPricing = monthCommittedRows.reduce(
          (sum, row) => sum + row.pricingQuantity,
          0
        );

        return {
          month,
          coveragePercent: roundTo(ratioPercent(monthCommittedSpend, monthTotalSpend), 2),
          utilizationPercent: roundTo(ratioPercent(monthConsumed, monthPricing), 2),
        };
      })
      .sort((a, b) => a.month.localeCompare(b.month));

    const onDemandVsCommitted = {
      committedSpend: roundTo(committedSpend, 2),
      onDemandSpend: roundTo(totalSpend - committedSpend, 2),
      committedPercent: roundTo(coveragePercent, 2),
      onDemandPercent: roundTo(100 - coveragePercent, 2),
    };

    const commitmentBurnDown = coverageUtilizationTrend.map((entry, index, list) => {
      const initial = list.reduce((sum, item) => sum + item.coveragePercent, 0);
      const consumed = list.slice(0, index + 1).reduce((sum, item) => sum + item.coveragePercent, 0);
      return {
        month: entry.month,
        remainingCoverageIndex: roundTo(Math.max(0, initial - consumed), 2),
      };
    });

    const recommendations = [];
    if (coveragePercent < 65) {
      recommendations.push({
        action: "Purchase additional commitments",
        reason: "Coverage below target threshold",
        expectedROI: roundTo((65 - coveragePercent) * 0.8, 2),
        priority: "high",
      });
    }
    if (utilizationPercent < 80) {
      recommendations.push({
        action: "Modify commitment mix",
        reason: "Utilization indicates over-commitment",
        expectedROI: roundTo((80 - utilizationPercent) * 0.5, 2),
        priority: "medium",
      });
    }
    if (expiryCounts.d30 > 0) {
      recommendations.push({
        action: "Renew expiring commitments",
        reason: `${expiryCounts.d30} commitments expire within 30 days`,
        expectedROI: roundTo(expiryCounts.d30 * 3.5, 2),
        priority: "high",
      });
    }

    const expiryTimeline = Array.from(expiryTimelineMap.entries())
      .map(([month, count]) => ({ month, count }))
      .sort((a, b) => a.month.localeCompare(b.month));

    return {
      success: true,
      uploadIds,
      kpis: {
        coveragePercent: numberOrZero(coveragePercent),
        utilizationPercent: numberOrZero(utilizationPercent),
        wastePercent: numberOrZero(wastePercent),
        expiry30: expiryCounts.d30,
        expiry60: expiryCounts.d60,
        expiry90: expiryCounts.d90,
        effectiveRateDelta: numberOrZero(effectiveRateDelta),
      },
      visuals: {
        coverageUtilizationTrend,
        expiryTimeline,
        commitmentBurnDown,
        onDemandVsCommitted,
      },
      table: {
        recommendations: recommendations.length
          ? recommendations
          : [
              {
                action: "Maintain current commitment strategy",
                reason: "Coverage/utilization are within acceptable band",
                expectedROI: 0,
                priority: "low",
              },
            ],
      },
      meta: {
        periodStart: periodStart.toISOString(),
        periodEnd: periodEnd.toISOString(),
        committedRows: committedRows.length,
      },
    };
  },

  async getForecastingBudgets({
    clientId,
    requestedUploadIds = [],
    filters = {},
    startDate = null,
    endDate = null,
    budget = 0,
    scenarioMultipliers = {},
  }) {
    const now = NOW();
    const periodEnd = endDate || endOfUtcDay(now);
    const periodStart = startDate || addUtcDays(periodEnd, -119);

    const { uploadIds, whereClause } = await loadContext({
      clientId,
      requestedUploadIds,
      filters,
      startDate: periodStart,
      endDate: periodEnd,
    });

    if (!uploadIds.length || !whereClause) {
      return buildEmptyState("No forecasting data found.");
    }

    const rows = await fetchFactRows({
      whereClause,
      include: getInclude({ withResource: false, withSubAccount: false, withCommitment: false }),
    });
    if (!rows.length) return buildEmptyState("No forecasting rows found.");

    const dailyTotals = buildDailyTotals(rows);
    const recent14 = dailyTotals.slice(-14).map((entry) => entry.total);
    const baseline = average(recent14.length ? recent14 : dailyTotals.map((entry) => entry.total));
    const std = standardDeviation(recent14.length ? recent14 : dailyTotals.map((entry) => entry.total));

    const monthStart = startOfUtcMonth(now);
    const mtdSpend = rows
      .filter((row) => row.chargePeriodStart && new Date(row.chargePeriodStart) >= monthStart)
      .reduce((sum, row) => sum + row.billedCost, 0);
    const daysInMonth = endOfUtcMonth(now).getUTCDate();
    const elapsed = Math.max(1, now.getUTCDate());
    const remainingDays = Math.max(0, daysInMonth - elapsed);
    const baseForecast = mtdSpend + baseline * remainingDays;
    const scenario = makeScenarioForecast(baseForecast, scenarioMultipliers);

    const resolvedBudget = budget > 0 ? budget : roundTo(baseForecast * 1.05, 2);
    const breachProbability = (() => {
      const ratio = safeDivide(scenario.base, resolvedBudget);
      if (ratio >= 1.15) return 0.95;
      if (ratio >= 1.05) return 0.8;
      if (ratio >= 1) return 0.6;
      if (ratio >= 0.9) return 0.3;
      return 0.1;
    })();

    const daysToBreach =
      scenario.base <= resolvedBudget
        ? null
        : Math.max(0, Math.ceil((resolvedBudget - mtdSpend) / Math.max(baseline, 1)));

    const mape = (() => {
      const errors = [];
      for (let index = 7; index < dailyTotals.length; index += 1) {
        const actual = dailyTotals[index].total;
        const forecast = average(dailyTotals.slice(index - 7, index).map((entry) => entry.total));
        if (actual > 0) {
          errors.push(Math.abs((actual - forecast) / actual));
        }
      }
      return errors.length ? average(errors) * 100 : 0;
    })();

    const forecastLine = [...dailyTotals];
    let rollingBase = baseline;
    for (let i = 1; i <= 30; i += 1) {
      const date = toUtcDateKey(addUtcDays(periodEnd, i));
      const predicted = rollingBase;
      forecastLine.push({
        date,
        total: null,
        predicted: roundTo(predicted, 2),
        lower: roundTo(Math.max(0, predicted - std), 2),
        upper: roundTo(predicted + std, 2),
      });
      rollingBase = (rollingBase * 4 + predicted) / 5;
    }

    const scenarioBands = {
      base: scenario.base,
      upside: scenario.upside,
      downside: scenario.downside,
      variance: scenario.variance,
      multipliers: scenario.multipliers,
    };

    const monthlyMap = new Map();
    rows.forEach((row) => {
      const month = toMonthKey(row.chargePeriodStart);
      if (!month) return;
      monthlyMap.set(month, (monthlyMap.get(month) || 0) + row.billedCost);
    });
    const budgetVarianceBars = Array.from(monthlyMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-6)
      .map(([month, spend]) => ({
        month,
        spend: roundTo(spend, 2),
        budget: roundTo(resolvedBudget, 2),
        variance: roundTo(spend - resolvedBudget, 2),
      }));

    const serviceTotals = buildServiceTotals(rows);
    const budgetWatchlist = serviceTotals.slice(0, 20).map((entry) => {
      const serviceRows = rows.filter((row) => row.serviceName === entry.name);
      const serviceDaily = buildDailyTotals(serviceRows);
      const recent = average(serviceDaily.slice(-7).map((item) => item.total));
      const prior = average(serviceDaily.slice(-14, -7).map((item) => item.total));
      const growth = prior > 0 ? ((recent - prior) / prior) * 100 : 0;

      const serviceForecast = recent * remainingDays + serviceRows
        .filter((row) => row.chargePeriodStart && new Date(row.chargePeriodStart) >= monthStart)
        .reduce((sum, row) => sum + row.billedCost, 0);

      const breachRisk = Math.min(
        100,
        Math.max(0, ratioPercent(serviceForecast, Math.max(resolvedBudget, 1)))
      );

      return {
        scope: entry.name,
        owner: getTagValue(serviceRows[0]?.tags, ["owner"]) || "Unassigned",
        breachRiskPercent: roundTo(breachRisk, 2),
        growthPercent: roundTo(growth, 2),
        mitigationAction:
          growth > 20
            ? "Run immediate cost review and cap autoscaling"
            : "Track weekly and validate reservation posture",
      };
    });

    return {
      success: true,
      uploadIds,
      kpis: {
        forecastAccuracyMAPE: numberOrZero(mape),
        budgetBreachProbability: numberOrZero(breachProbability * 100),
        daysToBreach,
        scenarioVariance: numberOrZero(scenario.variance),
      },
      visuals: {
        forecastLineWithConfidence: forecastLine,
        scenarioBands,
        budgetVarianceBars,
      },
      table: {
        budgetWatchlist,
      },
      meta: {
        periodStart: periodStart.toISOString(),
        periodEnd: periodEnd.toISOString(),
        budget: resolvedBudget,
      },
    };
  },

  async getUnitEconomics({
    clientId,
    requestedUploadIds = [],
    filters = {},
    startDate = null,
    endDate = null,
    unitKey = "requests",
    targetUnitCost = 0,
    revenue = 0,
  }) {
    const now = NOW();
    const periodEnd = endDate || endOfUtcDay(now);
    const periodStart = startDate || addUtcDays(periodEnd, -89);

    const { uploadIds, whereClause } = await loadContext({
      clientId,
      requestedUploadIds,
      filters,
      startDate: periodStart,
      endDate: periodEnd,
    });

    if (!uploadIds.length || !whereClause) {
      return buildEmptyState("No unit economics data found.");
    }

    const rows = await fetchFactRows({
      whereClause,
      include: getInclude({ withCommitment: false }),
    });
    if (!rows.length) return buildEmptyState("No unit economics rows found.");

    const unitCandidates = [
      `${unitKey}`,
      `${unitKey}_count`,
      `${unitKey}Count`,
      "units",
      "unit_count",
      "requests",
      "request_count",
      "orders",
      "order_count",
      "customers",
      "customer_count",
      "workloads",
      "workload_count",
    ];

    const enrichedRows = rows.map((row) => {
      const tagUnitValue = parseTagNumeric(getTagValue(row.tags, unitCandidates));
      const units = tagUnitValue != null ? tagUnitValue : row.consumedQuantity;
      const normalizedUnits = Math.max(0, toNumber(units, 0));
      const owner = getTagValue(row.tags, ["owner"]) || "Unassigned";
      const product = getTagValue(row.tags, ["product", "application", "service_name"]) || row.serviceName;
      const team = getTagValue(row.tags, ["team", "squad", "business_unit"]) || "Unknown";

      return {
        ...row,
        units: normalizedUnits,
        owner,
        product,
        team,
        unitCost: safeDivide(row.billedCost, normalizedUnits),
      };
    });

    const totalSpend = enrichedRows.reduce((sum, row) => sum + row.billedCost, 0);
    const totalUnits = enrichedRows.reduce((sum, row) => sum + row.units, 0);
    const costPerUnit = safeDivide(totalSpend, totalUnits);
    const resolvedTarget = targetUnitCost > 0 ? targetUnitCost : costPerUnit;
    const grossMarginImpact =
      revenue > 0 ? roundTo(((revenue - totalSpend) / revenue) * 100, 2) : null;

    const daily = buildDailyTotals(enrichedRows);
    const midpoint = Math.floor(daily.length / 2);
    const firstHalf = daily.slice(0, midpoint);
    const secondHalf = daily.slice(midpoint);
    const firstHalfSet = new Set(firstHalf.map((entry) => entry.date));
    const secondHalfSet = new Set(secondHalf.map((entry) => entry.date));

    const firstHalfUnitCost = safeDivide(
      firstHalf.reduce((sum, row) => sum + row.total, 0),
      enrichedRows
        .filter((row) => firstHalfSet.has(toUtcDateKey(row.chargePeriodStart)))
        .reduce((sum, row) => sum + row.units, 0)
    );
    const secondHalfUnitCost = safeDivide(
      secondHalf.reduce((sum, row) => sum + row.total, 0),
      enrichedRows
        .filter((row) => secondHalfSet.has(toUtcDateKey(row.chargePeriodStart)))
        .reduce((sum, row) => sum + row.units, 0)
    );
    const efficiencyTrend = firstHalfUnitCost > 0
      ? ((secondHalfUnitCost - firstHalfUnitCost) / firstHalfUnitCost) * 100
      : 0;

    const unitCostTrend = (() => {
      const byDate = new Map();
      enrichedRows.forEach((row) => {
        const date = toUtcDateKey(row.chargePeriodStart);
        if (!date) return;
        if (!byDate.has(date)) byDate.set(date, { cost: 0, units: 0 });
        const bucket = byDate.get(date);
        bucket.cost += row.billedCost;
        bucket.units += row.units;
      });

      return Array.from(byDate.entries())
        .map(([date, metrics]) => ({
          date,
          totalCost: roundTo(metrics.cost, 2),
          units: roundTo(metrics.units, 2),
          unitCost: roundTo(safeDivide(metrics.cost, metrics.units), 4),
        }))
        .sort((a, b) => a.date.localeCompare(b.date));
    })();

    const benchmarkBars = (() => {
      const byTeam = new Map();
      enrichedRows.forEach((row) => {
        const key = row.team || "Unknown";
        if (!byTeam.has(key)) byTeam.set(key, { cost: 0, units: 0 });
        const bucket = byTeam.get(key);
        bucket.cost += row.billedCost;
        bucket.units += row.units;
      });

      return Array.from(byTeam.entries())
        .map(([team, metrics]) => ({
          team,
          unitCost: roundTo(safeDivide(metrics.cost, metrics.units), 4),
          totalCost: roundTo(metrics.cost, 2),
          totalUnits: roundTo(metrics.units, 2),
        }))
        .sort((a, b) => b.unitCost - a.unitCost)
        .slice(0, 20);
    })();

    const outlierScatter = benchmarkBars.map((entry) => ({
      label: entry.team,
      xUnits: entry.totalUnits,
      yUnitCost: entry.unitCost,
      totalCost: entry.totalCost,
    }));

    const byOwnerProduct = new Map();
    enrichedRows.forEach((row) => {
      const key = `${row.owner}::${row.product}`;
      if (!byOwnerProduct.has(key)) {
        byOwnerProduct.set(key, {
          owner: row.owner,
          product: row.product,
          cost: 0,
          units: 0,
        });
      }
      const bucket = byOwnerProduct.get(key);
      bucket.cost += row.billedCost;
      bucket.units += row.units;
    });

    const unitEconomicsTable = Array.from(byOwnerProduct.values())
      .map((entry) => {
        const actual = safeDivide(entry.cost, entry.units);
        const variance = actual - resolvedTarget;
        const varianceReason =
          variance > 0.2 * resolvedTarget
            ? "Higher-than-target resource intensity"
            : variance < -0.2 * resolvedTarget
            ? "Efficiency gain vs target"
            : "Within expected operating range";

        return {
          owner: entry.owner,
          scope: entry.product,
          actualUnitCost: roundTo(actual, 4),
          targetUnitCost: roundTo(resolvedTarget, 4),
          variance: roundTo(variance, 4),
          varianceReason,
        };
      })
      .sort((a, b) => b.actualUnitCost - a.actualUnitCost)
      .slice(0, 100);

    return {
      success: true,
      uploadIds,
      kpis: {
        costPerUnit: numberOrZero(costPerUnit),
        totalUnits: numberOrZero(totalUnits),
        grossMarginImpactPercent: grossMarginImpact,
        efficiencyTrendPercent: numberOrZero(efficiencyTrend),
      },
      visuals: {
        unitCostTrend,
        benchmarkBars,
        outlierScatter,
      },
      table: {
        unitEconomics: unitEconomicsTable,
      },
      meta: {
        unitKey,
        periodStart: periodStart.toISOString(),
        periodEnd: periodEnd.toISOString(),
      },
    };
  },

  async getGovernanceDataHealth({
    clientId,
    requestedUploadIds = [],
    filters = {},
    startDate = null,
    endDate = null,
    freshnessSlaHours = 24,
  }) {
    const now = NOW();
    const periodEnd = endDate || endOfUtcDay(now);
    const periodStart = startDate || addUtcDays(periodEnd, -89);

    const { uploadIds, whereClause } = await loadContext({
      clientId,
      requestedUploadIds,
      filters,
      startDate: periodStart,
      endDate: periodEnd,
    });

    if (!uploadIds.length || !whereClause) {
      return buildEmptyState("No governance/data health data found.");
    }

    const rows = await fetchFactRows({
      whereClause,
      include: getInclude({ withResource: false, withSubAccount: false, withCommitment: false }),
    });
    if (!rows.length) return buildEmptyState("No governance rows found.");

    const bounds = await getDateBounds(whereClause);
    const freshnessHours = bounds.maxChargeDate
      ? (now.getTime() - new Date(bounds.maxChargeDate).getTime()) / (1000 * 60 * 60)
      : null;

    const rowChecks = rows.map((row) => {
      const missingTags = GOVERNANCE_REQUIRED_TAGS.filter((tagKey) => {
        if (tagKey === "cost_center") {
          return !hasTagValue(row.tags, ["cost_center", "costcenter", "cc"]);
        }
        return !hasTagValue(row.tags, [tagKey]);
      });

      const hasMetadata = !!row.resourceId && !!row.serviceName && !!row.regionName;
      const metadataComplete = hasMetadata;
      const isViolation = missingTags.length > 0 || !hasMetadata || row.billedCost < 0;
      return {
        ...row,
        missingTags,
        metadataComplete,
        isViolation,
      };
    });

    const metadataCompletenessPercent = ratioPercent(
      rowChecks.filter((row) => row.metadataComplete).length,
      rowChecks.length
    );
    const tagCompliancePercent =
      ratioPercent(
        rowChecks.filter((row) => row.missingTags.length === 0).length,
        rowChecks.length
      );
    const policyViolations = rowChecks.filter((row) => row.isViolation);

    const daily = buildDailyTotals(rowChecks);
    const threshold = anomalyThreshold(
      average(daily.map((entry) => entry.total)),
      standardDeviation(daily.map((entry) => entry.total)),
      2
    );
    const anomalies = daily.filter((entry) => entry.total > threshold);

    const freshnessScore =
      freshnessHours == null
        ? 0
        : freshnessHours <= freshnessSlaHours
        ? 100
        : Math.max(0, 100 - ((freshnessHours - freshnessSlaHours) / freshnessSlaHours) * 100);

    const anomalyPenalty = Math.min(40, anomalies.length * 2);
    const dataHealthScore = Math.max(
      0,
      roundTo(
        freshnessScore * 0.35 +
          metadataCompletenessPercent * 0.35 +
          tagCompliancePercent * 0.3 -
          anomalyPenalty,
        2
      )
    );

    const complianceMatrix = (() => {
      const teamMap = new Map();
      rowChecks.forEach((row) => {
        const team = getTagValue(row.tags, ["team", "squad", "business_unit"]) || "Unassigned";
        if (!teamMap.has(team)) {
          teamMap.set(team, {
            team,
            totalRows: 0,
            owner: 0,
            environment: 0,
            application: 0,
            costCenter: 0,
          });
        }
        const bucket = teamMap.get(team);
        bucket.totalRows += 1;
        if (hasTagValue(row.tags, ["owner"])) bucket.owner += 1;
        if (hasTagValue(row.tags, ["environment", "env"])) bucket.environment += 1;
        if (hasTagValue(row.tags, ["application", "app"])) bucket.application += 1;
        if (hasTagValue(row.tags, ["cost_center", "costcenter", "cc"])) bucket.costCenter += 1;
      });

      return Array.from(teamMap.values()).map((entry) => ({
        team: entry.team,
        owner: roundTo(ratioPercent(entry.owner, entry.totalRows), 2),
        environment: roundTo(ratioPercent(entry.environment, entry.totalRows), 2),
        application: roundTo(ratioPercent(entry.application, entry.totalRows), 2),
        costCenter: roundTo(ratioPercent(entry.costCenter, entry.totalRows), 2),
      }));
    })();

    const scoreTrend = (() => {
      const dateMap = new Map();
      rowChecks.forEach((row) => {
        const date = toUtcDateKey(row.chargePeriodStart);
        if (!date) return;
        if (!dateMap.has(date)) {
          dateMap.set(date, { date, total: 0, bad: 0 });
        }
        const bucket = dateMap.get(date);
        bucket.total += 1;
        if (row.isViolation) bucket.bad += 1;
      });

      return Array.from(dateMap.values())
        .map((entry) => ({
          date: entry.date,
          score: roundTo(100 - ratioPercent(entry.bad, entry.total), 2),
        }))
        .sort((a, b) => a.date.localeCompare(b.date));
    })();

    const issueBacklog = policyViolations
      .map((row) => ({
        id: row.id,
        severity: buildIssueSeverity(row.billedCost),
        owner: getTagValue(row.tags, ["owner"]) || "Unassigned",
        sla: addUtcDays(new Date(row.chargePeriodStart || now), 7).toISOString(),
        rootCause:
          row.missingTags.length > 0
            ? `Missing tags: ${row.missingTags.join(", ")}`
            : "Missing mandatory metadata",
        status: "open",
        impactedCost: roundTo(row.billedCost, 2),
      }))
      .sort((a, b) => b.impactedCost - a.impactedCost)
      .slice(0, 200);

    const severityDistribution = ["critical", "high", "medium", "low"].map((severity) => ({
      severity,
      count: issueBacklog.filter((issue) => issue.severity === severity).length,
    }));

    return {
      success: true,
      uploadIds,
      kpis: {
        dataHealthScore: numberOrZero(dataHealthScore),
        freshnessSlaHours: numberOrZero(freshnessSlaHours),
        freshnessHours: freshnessHours == null ? null : roundTo(freshnessHours, 2),
        metadataCompletenessPercent: numberOrZero(metadataCompletenessPercent),
        policyViolations: policyViolations.length,
        anomalyCount: anomalies.length,
      },
      visuals: {
        complianceMatrix,
        scoreTrend,
        anomalyTimeline: anomalies,
        severityDistribution,
      },
      table: {
        issueBacklog,
      },
      meta: {
        periodStart: periodStart.toISOString(),
        periodEnd: periodEnd.toISOString(),
        sourceRows: rows.length,
      },
    };
  },

  async getReports({
    clientId,
    requestedUploadIds = [],
    filters = {},
  }) {
    const { uploadIds, whereClause } = await loadContext({
      clientId,
      requestedUploadIds,
      filters,
    });

    if (!uploadIds.length || !whereClause) {
      return buildEmptyState("No reporting data found.");
    }

    const [totalCount, bounds] = await Promise.all([
      BillingUsageFact.count({ where: whereClause }),
      getDateBounds(whereClause),
    ]);

    const now = NOW();
    const lastRun = now.toISOString();
    const freshnessHours = bounds.maxChargeDate
      ? (now.getTime() - new Date(bounds.maxChargeDate).getTime()) / (1000 * 60 * 60)
      : null;

    const reportCatalog = [
      {
        id: "cfo-pack",
        name: "CFO Executive Pack",
        audience: ["CFO", "Finance Ops"],
        frequency: "weekly",
        format: "PDF + CSV",
      },
      {
        id: "cto-pack",
        name: "CTO Engineering Cost Pack",
        audience: ["CTO", "Platform Leads"],
        frequency: "weekly",
        format: "Dashboard snapshot",
      },
      {
        id: "finops-pack",
        name: "FinOps Operating Pack",
        audience: ["FinOps", "Cloud Operations"],
        frequency: "daily",
        format: "CSV + API digest",
      },
    ];

    const scheduleSuccess = freshnessHours != null && freshnessHours <= 24 ? 100 : 75;
    const audienceCoverage = 100;
    const scheduleTimeline = reportCatalog.map((report, index) => ({
      reportId: report.id,
      reportName: report.name,
      lastRun,
      nextRun: addUtcDays(now, index + 1).toISOString(),
      status: freshnessHours != null && freshnessHours <= 24 ? "on-time" : "delayed",
    }));

    const deliveryLogs = Array.from({ length: 7 }).map((_, index) => ({
      timestamp: addUtcDays(now, -index).toISOString(),
      report: reportCatalog[index % reportCatalog.length].name,
      channel: index % 2 === 0 ? "email" : "api",
      status: freshnessHours != null && freshnessHours <= 24 ? "delivered" : "delayed",
      audience: reportCatalog[index % reportCatalog.length].audience.join(", "),
    }));

    return {
      success: true,
      uploadIds,
      kpis: {
        reportScheduleSuccessPercent: scheduleSuccess,
        lastRun,
        audienceCoveragePercent: audienceCoverage,
      },
      visuals: {
        reportCatalogCards: reportCatalog,
        scheduleTimeline,
      },
      table: {
        packs: reportCatalog.map((report) => ({
          name: report.name,
          audience: report.audience.join(", "),
          frequency: report.frequency,
          format: report.format,
        })),
        deliveryLogs,
      },
      meta: {
        sourceRowCount: totalCount,
        freshnessHours: freshnessHours == null ? null : roundTo(freshnessHours, 2),
      },
    };
  },
};
