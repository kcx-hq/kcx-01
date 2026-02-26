import { unitEconomicsRepository } from "./unit-economics.repository.js";
import { getDateRange } from "../../../common/utils/date.helpers.js";
import {
  costGrowthRate,
  roundTo,
} from "../../../common/utils/cost.calculations.js";
import { scoreAllocationConfidence } from "./allocation/confidence.scorer.js";
import { validateOwnershipBalance } from "./allocation/ownership.validator.js";
import { summarizeSharedPoolByCategory } from "./allocation/shared-pool.calculator.js";
import { buildAllocationOverview } from "./allocation/allocation.engine.js";
import { calculateElasticity } from "./unit-economics/elasticity.engine.js";
import { analyzeVolatility } from "./unit-economics/volatility.analyzer.js";
import { buildUnitCostDecomposition } from "./unit-economics/decomposition.engine.js";
import { classifyEfficiency } from "./unit-economics/efficiency.classifier.js";
import { forecastUnitEconomics } from "./forecasting/unit-forecast.engine.js";
import { calculateBreakEven } from "./forecasting/break-even.calculator.js";
import { buildTeamProductBenchmark } from "./comparisons/team-benchmark.js";
import { buildEnvironmentBenchmark } from "./comparisons/environment-benchmark.js";
import { buildRegionBenchmark } from "./comparisons/region-benchmark.js";
import { buildMarginOverlay } from "./margin/margin.engine.js";
import { validateFormulaBalance } from "./validation/formula.validator.js";
import { guardAggregationIntegrity } from "./validation/aggregation.guard.js";
import { validatePeriodAlignment } from "./validation/period-alignment.guard.js";
import { toAllocationDto } from "./dto/allocation.dto.js";
import { toUnitEconomicsDto } from "./dto/unit-economics.dto.js";
import { buildAllocationUnitEconomicsViewModel } from "./presentation/allocation-unit-economics.viewmodel.js";

const n = (v) => Number.parseFloat(v || 0) || 0;
const isObject = (v) => v && typeof v === "object" && !Array.isArray(v);
const DAY_MS = 24 * 60 * 60 * 1000;
const clampPct = (value) => Math.max(0, Math.min(100, roundTo(n(value), 2)));

const normalizeTags = (tags) => {
  if (!tags) return {};
  if (typeof tags === "string") {
    try {
      const parsed = JSON.parse(tags);
      if (!isObject(parsed)) return {};
      const out = {};
      Object.entries(parsed).forEach(([k, v]) => {
        out[String(k).toLowerCase()] = v;
      });
      return out;
    } catch {
      return {};
    }
  }
  if (!isObject(tags)) return {};
  const out = {};
  Object.entries(tags).forEach(([k, v]) => {
    out[String(k).toLowerCase()] = v;
  });
  return out;
};

const pickTag = (tags, keys, fallback = null) => {
  for (const key of keys) {
    const value = tags[String(key).toLowerCase()];
    if (value !== undefined && value !== null && String(value).trim()) return String(value).trim();
  }
  return fallback;
};

const pickRowField = (row, keys) => {
  if (!row || typeof row !== "object") return null;
  const normalized = {};
  Object.entries(row).forEach(([k, v]) => {
    normalized[String(k).toLowerCase()] = v;
  });
  for (const key of keys) {
    const value = normalized[String(key).toLowerCase()];
    if (value !== undefined && value !== null && String(value).trim()) return String(value).trim();
  }
  return null;
};

const pickDimension = (row, tags, keys, fallback = null) => {
  const tagValue = pickTag(tags, keys, null);
  if (tagValue !== null && tagValue !== undefined && String(tagValue).trim()) return String(tagValue).trim();
  const rowValue = pickRowField(row, keys);
  if (rowValue !== null && rowValue !== undefined && String(rowValue).trim()) return String(rowValue).trim();
  return fallback;
};

const sharedRow = (tags, product, team) => {
  const allocationType = String(pickTag(tags, ["allocation_type", "cost_type"], "") || "").toLowerCase();
  if (["shared", "common", "platform_shared"].includes(allocationType)) return true;
  if (String(product || "").toLowerCase().includes("shared")) return true;
  if (String(team || "").toLowerCase().includes("shared")) return true;
  return false;
};

const sanitizeBasis = (value) => {
  const basis = String(value || "actual").toLowerCase();
  if (basis === "amortized" || basis === "net" || basis === "actual") return basis;
  return "actual";
};

const rowCostByBasis = (row, basis) => {
  const billed = n(row.billedcost);
  const effective = n(row.effectivecost);
  const contracted = n(row.contractedcost);

  if (basis === "amortized") return effective || billed;
  if (basis === "net") return contracted || effective || billed;
  return billed || effective;
};

const rowService = (row) =>
  String(
    row?.["service.servicename"] ||
      row?.servicename ||
      row?.ServiceName ||
      row?.serviceName ||
      "Unknown Service",
  );

const rowRegion = (row) =>
  String(
    row?.["region.regionname"] ||
      row?.regionname ||
      row?.RegionName ||
      "Unknown Region",
  );

const rowChargeCategory = (row) =>
  String(row?.chargecategory || row?.ChargeCategory || "Shared - Uncategorized");

const revenueFromTags = (tags = {}) => {
  if (!tags || typeof tags !== "object") return 0;
  const keys = ["revenue", "revenue_amount", "business_revenue"];
  for (const key of keys) {
    const value = tags[key] ?? tags[key.toUpperCase()];
    const parsed = Number(value);
    if (Number.isFinite(parsed) && parsed > 0) return parsed;
  }
  return 0;
};

const toDate = (value) => {
  const d = value ? new Date(value) : null;
  return d && !Number.isNaN(d.getTime()) ? d : null;
};

const startOfDay = (value) => {
  const d = toDate(value);
  if (!d) return null;
  d.setHours(0, 0, 0, 0);
  return d;
};

const endOfDay = (value) => {
  const d = toDate(value);
  if (!d) return null;
  d.setHours(23, 59, 59, 999);
  return d;
};

const dayKey = (value) => {
  const d = toDate(value);
  return d ? d.toISOString().slice(0, 10) : null;
};

const safeDateRange = (startDate, endDate) => {
  const start = startOfDay(startDate);
  const end = endOfDay(endDate);
  if (!start || !end || start > end) return null;
  return { startDate: start, endDate: end };
};

const normalizeCompareMode = (value) => {
  const mode = String(value || "previous_period").toLowerCase();
  if (["previous_period", "same_period_last_month", "none"].includes(mode)) return mode;
  return "previous_period";
};

const shiftMonth = (value, months) => {
  const d = toDate(value);
  if (!d) return null;
  const shifted = new Date(d);
  shifted.setMonth(shifted.getMonth() + months);
  return shifted;
};

const resolvePreviousWindow = (currentWindow, compareTo) => {
  if (!currentWindow || compareTo === "none") return null;

  const { startDate, endDate } = currentWindow;
  if (compareTo === "same_period_last_month") {
    const shiftedStart = startOfDay(shiftMonth(startDate, -1));
    const shiftedEnd = endOfDay(shiftMonth(endDate, -1));
    if (!shiftedStart || !shiftedEnd || shiftedStart > shiftedEnd) return null;
    return { startDate: shiftedStart, endDate: shiftedEnd };
  }

  const daySpan = Math.max(1, Math.floor((endDate.getTime() - startDate.getTime()) / DAY_MS) + 1);
  const prevEnd = endOfDay(new Date(startDate.getTime() - DAY_MS));
  if (!prevEnd) return null;
  const prevStart = startOfDay(new Date(prevEnd.getTime() - (daySpan - 1) * DAY_MS));
  if (!prevStart || prevStart > prevEnd) return null;
  return { startDate: prevStart, endDate: prevEnd };
};

const inRange = (value, range) => {
  const d = toDate(value);
  if (!d || !range) return false;
  return d >= range.startDate && d <= range.endDate;
};

const calcCommitmentBenefit = (row) => {
  const quantity = n(row.consumedquantity);
  if (quantity <= 0) return 0;
  const listUnit = n(row.listunitprice);
  const contractedUnit = n(row.contractedunitprice);
  if (listUnit <= 0 || contractedUnit <= 0 || contractedUnit >= listUnit) return 0;
  return (listUnit - contractedUnit) * quantity;
};

const aggregateWindow = (rows = [], basis = "actual") => {
  const daily = new Map();
  let totalCost = 0;
  let totalQuantity = 0;
  let directCost = 0;
  let sharedCost = 0;
  let commitmentBenefit = 0;

  for (const row of rows) {
    const key = dayKey(row.chargeperiodstart);
    if (!key) continue;

    const cost = rowCostByBasis(row, basis);
    const quantity = n(row.consumedquantity);
    const tags = normalizeTags(row.tags);
    const team = pickDimension(row, tags, ["team", "business_unit", "squad"], "Unassigned Team");
    const product = pickDimension(row, tags, ["product", "application", "app"], "Unmapped Product");
    const isShared = sharedRow(tags, product, team);

    totalCost += cost;
    totalQuantity += quantity;
    commitmentBenefit += calcCommitmentBenefit(row);

    if (isShared) sharedCost += cost;
    else directCost += cost;

    if (!daily.has(key)) {
      daily.set(key, { date: key, cost: 0, quantity: 0 });
    }
    const dailyRow = daily.get(key);
    dailyRow.cost += cost;
    dailyRow.quantity += quantity;
  }

  const trend = Array.from(daily.values())
    .sort((a, b) => String(a.date).localeCompare(String(b.date)))
    .map((row) => ({
      date: row.date,
      cost: roundTo(row.cost, 2),
      quantity: roundTo(row.quantity, 2),
      unitPrice: row.quantity > 0 ? roundTo(row.cost / row.quantity, 6) : 0,
    }));

  const avgUnitPrice = totalQuantity > 0 ? totalCost / totalQuantity : 0;
  return {
    trend,
    totalCost: roundTo(totalCost, 2),
    totalQuantity: roundTo(totalQuantity, 2),
    avgUnitPrice: roundTo(avgUnitPrice, 6),
    directCost: roundTo(directCost, 2),
    sharedCost: roundTo(sharedCost, 2),
    commitmentBenefit: roundTo(commitmentBenefit, 2),
  };
};

export const unitEconomicsService = {
  async getSummary({
    filters = {},
    period = null,
    compareTo = "previous_period",
    costBasis = "actual",
    uploadIds = [],
  }) {
    const latestChargeDate = period
      ? await unitEconomicsRepository.getLatestChargePeriodStart({ filters, uploadIds })
      : null;
    const { startDate, endDate } = getDateRange(period, latestChargeDate);
    const currentWindow = safeDateRange(startDate, endDate);
    const compareMode = normalizeCompareMode(compareTo);
    const previousWindow = resolvePreviousWindow(currentWindow, compareMode);
    const safeBasis = sanitizeBasis(costBasis);
    const attachViewModel = (payload) => ({
      ...payload,
      viewModel: buildAllocationUnitEconomicsViewModel({
        payload,
        period,
        costBasis: safeBasis,
        compareMode,
      }),
    });
    const queryStartDate =
      currentWindow && previousWindow
        ? new Date(
            Math.min(currentWindow.startDate.getTime(), previousWindow.startDate.getTime()),
          )
        : currentWindow
          ? currentWindow.startDate
          : startDate;
    const queryEndDate =
      currentWindow && previousWindow
        ? new Date(
            Math.max(currentWindow.endDate.getTime(), previousWindow.endDate.getTime()),
          )
        : currentWindow
          ? currentWindow.endDate
          : endDate;

    const rows = await unitEconomicsRepository.getFacts({
      filters,
      startDate: queryStartDate || null,
      endDate: queryEndDate || null,
      uploadIds
    });

    if (!rows.length || !currentWindow) {
      return attachViewModel({
        kpis: {
          totalCost: 0,
          totalQuantity: 0,
          avgUnitPrice: 0,
          unitPriceChangePct: 0,
          driftDetected: false,
          costBasis: safeBasis,
        },
        trend: [],
        previousTrend: [],
        drift: null,
        comparison: {
          mode: compareMode,
          currentWindow: {
            startDate: currentWindow?.startDate?.toISOString() || null,
            endDate: currentWindow?.endDate?.toISOString() || null,
            days: 0,
            totalCost: 0,
            totalQuantity: 0,
            avgUnitPrice: 0,
            directCost: 0,
            sharedCost: 0,
            commitmentBenefit: 0,
          },
          previousWindow: {
            startDate: previousWindow?.startDate?.toISOString() || null,
            endDate: previousWindow?.endDate?.toISOString() || null,
            days: 0,
            totalCost: 0,
            totalQuantity: 0,
            avgUnitPrice: 0,
            directCost: 0,
            sharedCost: 0,
            commitmentBenefit: 0,
          },
          deltas: {
            costDelta: 0,
            costGrowthPct: 0,
            volumeDelta: 0,
            volumeGrowthPct: 0,
            unitCostDelta: 0,
            unitCostChangePct: 0,
          },
        },
        allocation: {
          rows: [],
          sharedPoolTotal: 0,
          redistributedAmount: 0,
          ruleApplied: "No shared pool detected",
          coverage: {
            teamPct: 0,
            ownerPct: 0,
            productPct: 0,
            unallocatedAmount: 0,
            unallocatedPct: 0,
          },
        },
        allocationOverview: {
          totalCloudCost: 0,
          allocatedPct: 0,
          unallocatedPct: 0,
          sharedCostPoolAmount: 0,
          allocationMethod: "direct_spend_weighted",
          allocationConfidence: { score: 0, level: "low", factors: {} },
        },
        allocationConfidence: { score: 0, level: "low", factors: {} },
        allocationValidation: {},
        sharedPoolTransparency: { rows: [], validation: { sharedPoolTotal: 0, distributedTotal: 0, balanceDiff: 0, isBalanced: true } },
        unallocatedInsight: {
          unallocatedAmount: 0,
          unallocatedPct: 0,
          topContributingServices: [],
          tagCoveragePct: 0,
          governanceMaturity: "weak",
        },
        unitEconomics: {
          kpis: {
            unitCost: 0,
            unitCostChangePct: 0,
            elasticityScore: null,
            elasticityClass: "undefined",
            volumeGrowthPct: 0,
            infraGrowthPct: 0,
            volatilityScorePct: 0,
            volatilityLevel: "low",
          },
          trend: [],
          previousTrend: [],
          decomposition: { startUnitCost: 0, endUnitCost: 0, components: [], validationDelta: 0 },
          benchmarks: { teamProduct: [], environment: [], region: [] },
          margin: { available: false, revenuePerUnit: null, costPerUnit: null, marginPerUnit: null, marginTrendPct: null },
          forecast: { projectedCost: 0, projectedVolume: 0, projectedUnitCost: 0, lowerUnitCost: 0, upperUnitCost: 0, method: "moving_average", confidence: "low", assumptions: [] },
          breakEven: { targetUnitCost: null, gapValue: null, gapPct: null, improvementNeededPct: null, requiredVolumeAtCurrentCost: null },
        },
        benchmarks: { teamProduct: [], environment: [], region: [] },
        forecast: { projectedCost: 0, projectedVolume: 0, projectedUnitCost: 0, lowerUnitCost: 0, upperUnitCost: 0, method: "moving_average", confidence: "low", assumptions: [] },
        breakEven: { targetUnitCost: null, gapValue: null, gapPct: null, improvementNeededPct: null, requiredVolumeAtCurrentCost: null },
        margin: { available: false, revenuePerUnit: null, costPerUnit: null, marginPerUnit: null, marginTrendPct: null },
        efficiency: { status: "stable", rootCause: "No data.", confidenceLevel: "low", riskFlags: [] },
        elasticity: { score: null, classification: "undefined" },
        volatility: { scorePct: 0, level: "low" },
        decomposition: { startUnitCost: 0, endUnitCost: 0, components: [], validationDelta: 0 },
        integrity: {
          decompositionBalance: { isBalanced: true, difference: 0, epsilon: 0.0002 },
          aggregationIntegrity: { valid: true, difference: 0, totalCost: 0, rowTotal: 0 },
          periodAlignment: { aligned: true, costWindow: { startDate: null, endDate: null }, volumeWindow: { startDate: null, endDate: null } },
        },
      });
    }

    const currentRows = rows.filter((row) => inRange(row.chargeperiodstart, currentWindow));
    const previousRows = previousWindow
      ? rows.filter((row) => inRange(row.chargeperiodstart, previousWindow))
      : [];
    const currentWindowAggregate = aggregateWindow(currentRows, safeBasis);
    const previousWindowAggregate = aggregateWindow(previousRows, safeBasis);

    /** ---- Daily aggregation ---- */
    const allocationBuckets = new Map();
    const previousAllocationBuckets = new Map();
    const environmentBuckets = new Map();
    const previousEnvironmentBuckets = new Map();
    const regionBuckets = new Map();
    const previousRegionBuckets = new Map();
    const sharedCategoryRows = [];
    const unallocatedService = new Map();
    let spendWithTeam = 0;
    let spendWithOwner = 0;
    let spendWithProduct = 0;
    let revenueCurrent = 0;
    let revenuePrevious = 0;
    let sharedPoolTotal = 0;

    for (const r of currentRows) {
      const cost = rowCostByBasis(r, safeBasis);
      const tags = normalizeTags(r.tags);

      const team = pickDimension(r, tags, ["team", "business_unit", "squad"], "Unassigned Team");
      const owner = pickDimension(
        r,
        tags,
        ["owner", "owneremail", "owner_email", "productowner"],
        null,
      );
      const product = pickDimension(r, tags, ["product", "application", "app"], "Unmapped Product");
      const environment = pickDimension(r, tags, ["environment", "env", "stage"], "Unspecified");
      const region = rowRegion(r);
      const serviceName = rowService(r);
      const quantity = n(r.consumedquantity);
      const isShared = sharedRow(tags, product, team);
      revenueCurrent += revenueFromTags(tags);

      if (team !== "Unassigned Team") spendWithTeam += cost;
      if (owner || team !== "Unassigned Team") spendWithOwner += cost;
      if (product !== "Unmapped Product") spendWithProduct += cost;

      if (isShared) {
        sharedPoolTotal += cost;
        sharedCategoryRows.push({
          chargeCategory: rowChargeCategory(r),
          cost: roundTo(cost, 2),
        });
      } else {
        const bucketKey = `${team}::${product}::${environment}`;
        const bucket = allocationBuckets.get(bucketKey) || {
          key: bucketKey,
          team,
          product,
          environment,
          directCost: 0,
          quantity: 0,
        };
        bucket.directCost += cost;
        bucket.quantity += quantity;
        allocationBuckets.set(bucketKey, bucket);

        const envBucket = environmentBuckets.get(environment) || {
          environment,
          finalCost: 0,
          quantity: 0,
        };
        envBucket.finalCost += cost;
        envBucket.quantity += quantity;
        environmentBuckets.set(environment, envBucket);

        const regionBucket = regionBuckets.get(region) || {
          region,
          finalCost: 0,
          quantity: 0,
        };
        regionBucket.finalCost += cost;
        regionBucket.quantity += quantity;
        regionBuckets.set(region, regionBucket);
      }

      if (team === "Unassigned Team") {
        const current = unallocatedService.get(serviceName) || 0;
        unallocatedService.set(serviceName, current + cost);
      }
    }

    for (const r of previousRows) {
      const cost = rowCostByBasis(r, safeBasis);
      const tags = normalizeTags(r.tags);
      const team = pickDimension(r, tags, ["team", "business_unit", "squad"], "Unassigned Team");
      const product = pickDimension(r, tags, ["product", "application", "app"], "Unmapped Product");
      const environment = pickDimension(r, tags, ["environment", "env", "stage"], "Unspecified");
      const region = rowRegion(r);
      const quantity = n(r.consumedquantity);
      const isShared = sharedRow(tags, product, team);
      revenuePrevious += revenueFromTags(tags);

      if (isShared) continue;

      const bucketKey = `${team}::${product}::${environment}`;
      const prevBucket = previousAllocationBuckets.get(bucketKey) || {
        key: bucketKey,
        team,
        product,
        environment,
        finalCost: 0,
        quantity: 0,
      };
      prevBucket.finalCost += cost;
      prevBucket.quantity += quantity;
      previousAllocationBuckets.set(bucketKey, prevBucket);

      const prevEnv = previousEnvironmentBuckets.get(environment) || {
        environment,
        finalCost: 0,
        quantity: 0,
      };
      prevEnv.finalCost += cost;
      prevEnv.quantity += quantity;
      previousEnvironmentBuckets.set(environment, prevEnv);

      const prevRegion = previousRegionBuckets.get(region) || {
        region,
        finalCost: 0,
        quantity: 0,
      };
      prevRegion.finalCost += cost;
      prevRegion.quantity += quantity;
      previousRegionBuckets.set(region, prevRegion);
    }

    const trend = currentWindowAggregate.trend;

    /** ---- KPIs ---- */
    const totalCost = currentWindowAggregate.totalCost;
    const totalQuantity = currentWindowAggregate.totalQuantity;
    const avgUnitPrice = currentWindowAggregate.avgUnitPrice;
    const directTotal = Array.from(allocationBuckets.values()).reduce((sum, row) => sum + row.directCost, 0);

    const allocationRows = Array.from(allocationBuckets.values())
      .map((row) => {
        const weight = directTotal > 0 ? row.directCost / directTotal : 0;
        const sharedAllocatedCost = sharedPoolTotal * weight;
        const total = row.directCost + sharedAllocatedCost;
        return {
          key: row.key,
          team: row.team,
          product: row.product,
          environment: row.environment,
          directCost: roundTo(row.directCost, 2),
          sharedAllocatedCost: roundTo(sharedAllocatedCost, 2),
          totalCost: roundTo(total, 2),
          quantity: roundTo(row.quantity, 2),
          unitCost: row.quantity > 0 ? roundTo(total / row.quantity, 6) : 0,
          pctOfTotal: totalCost > 0 ? roundTo((total / totalCost) * 100, 2) : 0,
          budget: null,
          budgetVariance: null,
        };
      })
      .sort((a, b) => b.totalCost - a.totalCost);

    const redistributedAmount = allocationRows.reduce((sum, row) => sum + row.sharedAllocatedCost, 0);
    const safeTotalCost = totalCost > 0 ? totalCost : 1;
    const unallocatedAmount = Math.max(0, totalCost - spendWithTeam);
    const coverage = {
      teamPct: clampPct((spendWithTeam / safeTotalCost) * 100),
      ownerPct: clampPct((spendWithOwner / safeTotalCost) * 100),
      productPct: clampPct((spendWithProduct / safeTotalCost) * 100),
      unallocatedAmount: roundTo(unallocatedAmount, 2),
      unallocatedPct: clampPct((unallocatedAmount / safeTotalCost) * 100),
    };
    const sharedPoolRatioPct = safeTotalCost > 0 ? (sharedPoolTotal / safeTotalCost) * 100 : 0;
    const allocationConfidence = scoreAllocationConfidence({
      tagCoveragePct: coverage.teamPct,
      sharedPoolRatioPct,
      ruleCompletenessPct: 100,
      dataConsistencyPct: 100,
    });
    const ownershipValidation = validateOwnershipBalance({
      allocationRows,
      sharedPoolTotal,
      redistributedAmount,
    });
    const sharedPoolTransparency = summarizeSharedPoolByCategory({
      sharedRows: sharedCategoryRows,
      allocationMethod: "direct_spend_weighted",
      weightBasis: "direct_cost",
    });
    const allocationOverview = buildAllocationOverview({
      totalCloudCost: totalCost,
      coverage,
      sharedPoolAmount: sharedPoolTotal,
      allocationMethod: "direct_spend_weighted",
      allocationConfidence,
    });
    const unallocatedTopServices = Array.from(unallocatedService.entries())
      .map(([service, amount]) => ({
        service,
        amount: roundTo(amount, 2),
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
    const unallocatedInsight = {
      unallocatedAmount: coverage.unallocatedAmount,
      unallocatedPct: coverage.unallocatedPct,
      topContributingServices: unallocatedTopServices,
      tagCoveragePct: coverage.teamPct,
      governanceMaturity:
        coverage.teamPct >= 95 ? "strong" : coverage.teamPct >= 80 ? "medium" : "weak",
    };

    /** ---- Drift detection (first 70% vs last 30%) ---- */
    const split = Math.floor(trend.length * 0.7) || 1;
    const base = trend.slice(0, split);
    const curr = trend.slice(split);

    const baseUnit =
      base.reduce((s, r) => s + r.cost, 0) /
      (base.reduce((s, r) => s + r.quantity, 0) || 1);

    const currUnit =
      curr.reduce((s, r) => s + r.cost, 0) /
      (curr.reduce((s, r) => s + r.quantity, 0) || 1);

    const changePct = costGrowthRate(currUnit, baseUnit);
    const costDelta = currentWindowAggregate.totalCost - previousWindowAggregate.totalCost;
    const quantityDelta =
      currentWindowAggregate.totalQuantity - previousWindowAggregate.totalQuantity;
    const unitDelta = currentWindowAggregate.avgUnitPrice - previousWindowAggregate.avgUnitPrice;
    const costGrowthPct = costGrowthRate(
      currentWindowAggregate.totalCost,
      previousWindowAggregate.totalCost,
    );
    const volumeGrowthPct = costGrowthRate(
      currentWindowAggregate.totalQuantity,
      previousWindowAggregate.totalQuantity,
    );
    const unitCostChangePct = costGrowthRate(
      currentWindowAggregate.avgUnitPrice,
      previousWindowAggregate.avgUnitPrice,
    );
    const currentDaySpan =
      Math.max(
        1,
        Math.floor((currentWindow.endDate.getTime() - currentWindow.startDate.getTime()) / DAY_MS) + 1,
      );
    const previousDaySpan = previousWindow
      ? Math.max(
          1,
          Math.floor((previousWindow.endDate.getTime() - previousWindow.startDate.getTime()) / DAY_MS) + 1,
        )
      : 0;
    const elasticity = calculateElasticity({
      costGrowthPct,
      volumeGrowthPct,
    });
    const volatility = analyzeVolatility(trend.map((row) => row.unitPrice));

    const prevUnitPrice =
      previousWindowAggregate.totalQuantity > 0
        ? previousWindowAggregate.totalCost / previousWindowAggregate.totalQuantity
        : 0;
    const usageGrowthCost =
      previousWindowAggregate.totalQuantity > 0
        ? (currentWindowAggregate.totalQuantity - previousWindowAggregate.totalQuantity) * prevUnitPrice
        : 0;
    const priceChangeCost =
      currentWindowAggregate.totalQuantity > 0
        ? (currentWindowAggregate.avgUnitPrice - prevUnitPrice) * currentWindowAggregate.totalQuantity
        : 0;
    const infraGrowthCost =
      previousWindowAggregate.totalCost === 0 && currentWindowAggregate.totalCost > 0
        ? currentWindowAggregate.totalCost
        : 0;
    const mixShiftCost =
      costDelta - usageGrowthCost - priceChangeCost - infraGrowthCost;
    const commitmentDelta =
      currentWindowAggregate.commitmentBenefit - previousWindowAggregate.commitmentBenefit;
    const sharedAllocationShiftCost =
      currentWindowAggregate.sharedCost - previousWindowAggregate.sharedCost;

    const decomposition = buildUnitCostDecomposition({
      waterfallSteps: [
        { id: "newServicesResources", value: infraGrowthCost },
        { id: "usageGrowth", value: usageGrowthCost },
        { id: "ratePriceChange", value: priceChangeCost },
        { id: "mixShift", value: mixShiftCost },
        { id: "creditsDiscountChange", value: -commitmentDelta },
        { id: "savingsRemovals", value: 0 },
      ],
      currentVolume: currentWindowAggregate.totalQuantity,
      startUnitCost: prevUnitPrice,
      endUnitCost: currentWindowAggregate.avgUnitPrice,
      sharedAllocationShiftCost,
    });

    const efficiency = classifyEfficiency({
      unitCostChangePct,
      costGrowthPct,
      volumeGrowthPct,
      volatilityLevel: volatility.level,
      elasticityClassification: elasticity.classification,
    });
    const forecast = forecastUnitEconomics({
      trend,
      horizonDays: Math.max(7, Math.min(30, currentDaySpan || 30)),
      volatilityPct: volatility.scorePct,
    });
    const breakEven = calculateBreakEven({
      currentCost: currentWindowAggregate.totalCost,
      currentUnitCost: currentWindowAggregate.avgUnitPrice,
      previousUnitCost: prevUnitPrice,
      explicitTargetUnitCost: null,
    });
    const margin = buildMarginOverlay({
      revenue: revenueCurrent,
      finalAllocatedCost: currentWindowAggregate.totalCost,
      volume: currentWindowAggregate.totalQuantity,
      previousRevenue: revenuePrevious,
      previousCost: previousWindowAggregate.totalCost,
      previousVolume: previousWindowAggregate.totalQuantity,
    });

    const currentTeamRows = allocationRows.map((row) => ({
      key: row.key,
      team: row.team,
      product: row.product,
      finalCost: row.totalCost,
      quantity: row.quantity,
    }));
    const previousTeamRows = Array.from(previousAllocationBuckets.values()).map((row) => ({
      key: row.key,
      team: row.team,
      product: row.product,
      finalCost: roundTo(row.finalCost, 2),
      quantity: roundTo(row.quantity, 2),
    }));
    const teamProductBenchmark = buildTeamProductBenchmark({
      currentRows: currentTeamRows,
      previousRows: previousTeamRows,
    });

    const envMap = new Map();
    allocationRows.forEach((row) => {
      const current = envMap.get(row.environment) || {
        environment: row.environment,
        finalCost: 0,
        quantity: 0,
      };
      current.finalCost += n(row.totalCost);
      current.quantity += n(row.quantity);
      envMap.set(row.environment, current);
    });
    const envCurrentRows = Array.from(envMap.values()).map((row) => ({
      environment: row.environment,
      finalCost: roundTo(row.finalCost, 2),
      quantity: roundTo(row.quantity, 2),
    }));
    const envPreviousRows = Array.from(previousEnvironmentBuckets.values()).map((row) => ({
      environment: row.environment,
      finalCost: roundTo(row.finalCost, 2),
      quantity: roundTo(row.quantity, 2),
    }));
    const environmentBenchmark = buildEnvironmentBenchmark({
      currentRows: envCurrentRows,
      previousRows: envPreviousRows,
    });

    const regionCurrentDirect = Array.from(regionBuckets.values());
    const regionPreviousDirect = Array.from(previousRegionBuckets.values());
    const regionDirectTotal = regionCurrentDirect.reduce((sum, row) => sum + n(row.finalCost), 0);
    const regionCurrentRows = regionCurrentDirect.map((row) => {
      const weight = regionDirectTotal > 0 ? n(row.finalCost) / regionDirectTotal : 0;
      const sharedAllocated = sharedPoolTotal * weight;
      return {
        region: row.region,
        finalCost: roundTo(n(row.finalCost) + sharedAllocated, 2),
        quantity: roundTo(n(row.quantity), 2),
      };
    });
    const regionPreviousRows = regionPreviousDirect.map((row) => ({
      region: row.region,
      finalCost: roundTo(n(row.finalCost), 2),
      quantity: roundTo(n(row.quantity), 2),
    }));
    const regionBenchmark = buildRegionBenchmark({
      currentRows: regionCurrentRows,
      previousRows: regionPreviousRows,
    });

    const decompositionBalance = validateFormulaBalance({
      expected: decomposition.endUnitCost - decomposition.startUnitCost,
      actual: decomposition.components.reduce((sum, item) => sum + n(item.value), 0),
      epsilon: 0.0002,
    });
    const aggregationIntegrity = guardAggregationIntegrity({
      totalCost,
      allocationRows,
    });
    const periodAlignment = validatePeriodAlignment({
      costWindow: currentWindow,
      volumeWindow: currentWindow,
    });

    const allocationDto = toAllocationDto({
      overview: allocationOverview,
      coverage,
      sharedPool: {
        total: roundTo(sharedPoolTotal, 2),
        redistributedAmount: roundTo(redistributedAmount, 2),
        ruleApplied:
          sharedPoolTotal > 0
            ? "Shared pool redistributed by direct-cost weight (row-level)."
            : "No shared pool detected",
      },
      transparency: sharedPoolTransparency,
      unallocatedInsight,
      validation: {
        ownership: ownershipValidation,
        aggregation: aggregationIntegrity,
      },
    });
    const unitEconomicsDto = toUnitEconomicsDto({
      kpis: {
        unitCost: roundTo(currentWindowAggregate.avgUnitPrice, 6),
        unitCostChangePct: roundTo(unitCostChangePct, 2),
        elasticityScore: elasticity.score,
        elasticityClass: elasticity.classification,
        volumeGrowthPct: roundTo(volumeGrowthPct, 2),
        infraGrowthPct: roundTo(costGrowthPct, 2),
        volatilityScorePct: roundTo(volatility.scorePct, 2),
        volatilityLevel: volatility.level,
      },
      trend,
      previousTrend: previousWindowAggregate.trend,
      decomposition,
      benchmarks: {
        teamProduct: teamProductBenchmark,
        environment: environmentBenchmark,
        region: regionBenchmark,
      },
      margin,
      forecast,
      breakEven,
    });

    return attachViewModel({
      kpis: {
        totalCost: roundTo(totalCost, 2),
        totalQuantity: roundTo(totalQuantity, 2),
        avgUnitPrice: roundTo(avgUnitPrice, 6),
        unitPriceChangePct: roundTo(changePct, 2),
        driftDetected: Math.abs(changePct) > 15,
        costBasis: safeBasis,
      },
      trend,
      drift: {
        baselineUnitPrice: roundTo(baseUnit, 6),
        currentUnitPrice: roundTo(currUnit, 6),
        changePct: roundTo(changePct, 2),
        thresholdPct: 15,
        status:
          Math.abs(changePct) > 30
            ? "critical"
            : Math.abs(changePct) > 15
            ? "warning"
            : "stable"
      },
      previousTrend: previousWindowAggregate.trend,
      comparison: {
        mode: compareMode,
        currentWindow: {
          startDate: currentWindow.startDate.toISOString(),
          endDate: currentWindow.endDate.toISOString(),
          days: currentDaySpan,
          totalCost: currentWindowAggregate.totalCost,
          totalQuantity: currentWindowAggregate.totalQuantity,
          avgUnitPrice: currentWindowAggregate.avgUnitPrice,
          directCost: currentWindowAggregate.directCost,
          sharedCost: currentWindowAggregate.sharedCost,
          commitmentBenefit: currentWindowAggregate.commitmentBenefit,
        },
        previousWindow: {
          startDate: previousWindow?.startDate?.toISOString() || null,
          endDate: previousWindow?.endDate?.toISOString() || null,
          days: previousDaySpan,
          totalCost: previousWindowAggregate.totalCost,
          totalQuantity: previousWindowAggregate.totalQuantity,
          avgUnitPrice: previousWindowAggregate.avgUnitPrice,
          directCost: previousWindowAggregate.directCost,
          sharedCost: previousWindowAggregate.sharedCost,
          commitmentBenefit: previousWindowAggregate.commitmentBenefit,
        },
        deltas: {
          costDelta: roundTo(costDelta, 2),
          costGrowthPct: roundTo(costGrowthPct, 2),
          volumeDelta: roundTo(quantityDelta, 2),
          volumeGrowthPct: roundTo(volumeGrowthPct, 2),
          unitCostDelta: roundTo(unitDelta, 6),
          unitCostChangePct: roundTo(unitCostChangePct, 2),
        },
      },
      allocation: {
        rows: allocationRows,
        sharedPoolTotal: roundTo(sharedPoolTotal, 2),
        redistributedAmount: roundTo(redistributedAmount, 2),
        ruleApplied:
          sharedPoolTotal > 0
            ? "Shared pool redistributed by direct-cost weight (row-level)."
            : "No shared pool detected",
        coverage,
      },
      allocationOverview: allocationDto.overview,
      allocationConfidence: allocationDto.overview?.allocationConfidence || allocationConfidence,
      allocationValidation: allocationDto.validation,
      sharedPoolTransparency: allocationDto.transparency,
      unallocatedInsight: allocationDto.unallocatedInsight,
      unitEconomics: unitEconomicsDto,
      benchmarks: unitEconomicsDto.benchmarks,
      forecast,
      breakEven,
      margin,
      efficiency: efficiency,
      elasticity,
      volatility,
      decomposition,
      integrity: {
        decompositionBalance,
        aggregationIntegrity,
        periodAlignment,
      },
    });
  }
};
