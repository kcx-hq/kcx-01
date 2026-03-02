import { roundTo } from "../../../common/utils/cost.calculations.js";
import AppError from "../../../errors/AppError.js";
import { DashboardBudgetTarget } from "../../../models/index.js";
import { unitEconomicsService } from "../unit-economics/unit-economics.service.js";
import { dataQualityService } from "../analytics/data-quality/data-quality.service.js";
import { optimizationService } from "../optimization/optimization.service.js";
import {
  toNumber,
  clamp,
  safeDivide,
  percent,
  delta,
  growthPct,
  runRateForecast,
  burnRatePerDay,
  budgetConsumptionPct,
  budgetVarianceValue,
  breachEtaDays as computeBreachEtaDays,
  requiredDailySpend as computeRequiredDailySpend,
  confidenceLevelFromScore,
  computeForecastErrorStats,
} from "../shared/core-dashboard.formulas.js";

const n = toNumber;

const normalizePeriod = (v) => {
  const p = String(v || "mtd").toLowerCase();
  return ["mtd", "qtd", "30d", "90d"].includes(p) ? p : "mtd";
};

const normalizeBasis = (v) => {
  const b = String(v || "actual").toLowerCase();
  return ["actual", "amortized", "net"].includes(b) ? b : "actual";
};

const normalizeCompare = (v) => {
  const c = String(v || "previous_period").toLowerCase();
  return ["previous_period", "same_period_last_month", "none"].includes(c)
    ? c
    : "previous_period";
};

const periodToWindow = (period) => {
  if (period === "90d" || period === "qtd") return { days: 90, unitPeriod: "90d", optPeriod: "last90days" };
  if (period === "30d") return { days: 30, unitPeriod: "30d", optPeriod: "last30days" };
  return { days: 30, unitPeriod: "month", optPeriod: "last30days" };
};

const MONTH_NAMES = [
  "january",
  "february",
  "march",
  "april",
  "may",
  "june",
  "july",
  "august",
  "september",
  "october",
  "november",
  "december",
];
const RUNTIME_BUDGET_TARGETS = new Map();

const normalizeScopeFilterValue = (value) => {
  const trimmed = String(value || "All").trim();
  return trimmed || "All";
};

const normalizeBudgetFilters = (filters = {}) => ({
  provider: normalizeScopeFilterValue(filters.provider),
  service: normalizeScopeFilterValue(filters.service),
  region: normalizeScopeFilterValue(filters.region),
});

const resolveBudgetMonthKey = ({ budgetMonth = null, budgetYear = null, referenceDate = new Date() } = {}) => {
  const rawMonth = String(budgetMonth || "").trim();
  const yearCandidate = Number(budgetYear);
  const referenceYear = Number.isFinite(yearCandidate) && yearCandidate >= 2000 && yearCandidate <= 2100
    ? Math.trunc(yearCandidate)
    : referenceDate.getUTCFullYear();

  if (/^\d{4}-\d{2}$/.test(rawMonth)) {
    const [yearPart, monthPart] = rawMonth.split("-");
    const monthNum = Number(monthPart);
    if (monthNum >= 1 && monthNum <= 12) {
      return `${yearPart}-${String(monthNum).padStart(2, "0")}`;
    }
  }

  let monthIndex = -1;
  if (rawMonth) {
    const lower = rawMonth.toLowerCase();
    monthIndex = MONTH_NAMES.findIndex(
      (monthName) => monthName === lower || monthName.slice(0, 3) === lower.slice(0, 3)
    );
    if (monthIndex < 0) {
      const asNumber = Number(lower);
      if (Number.isFinite(asNumber) && asNumber >= 1 && asNumber <= 12) {
        monthIndex = Math.trunc(asNumber) - 1;
      }
    }
  }

  if (monthIndex < 0) {
    monthIndex = referenceDate.getUTCMonth();
  }

  return `${referenceYear}-${String(monthIndex + 1).padStart(2, "0")}`;
};

const budgetTargetMapKey = ({ clientId, monthKey, provider, service, region }) =>
  `${clientId}::${monthKey}::${provider}::${service}::${region}`;

const isBudgetTargetTableMissingError = (error) => {
  const message = String(error?.message || "").toLowerCase();
  return (
    message.includes("dashboard_budget_targets") &&
    (message.includes("does not exist") ||
      message.includes("doesn't exist") ||
      message.includes("no such table") ||
      message.includes("relation"))
  );
};

const getBudgetTargetRecord = async ({ clientId, filters = {}, budgetMonth = null } = {}) => {
  if (!clientId) return null;
  const scoped = normalizeBudgetFilters(filters);
  const monthKey = resolveBudgetMonthKey({ budgetMonth });
  const where = {
    clientid: clientId,
    monthkey: monthKey,
    provider: scoped.provider,
    service: scoped.service,
    region: scoped.region,
  };

  try {
    const record = await DashboardBudgetTarget.findOne({ where });
    if (record) return record;
  } catch (error) {
    if (!isBudgetTargetTableMissingError(error)) {
      throw error;
    }
  }

  const fallbackValue = RUNTIME_BUDGET_TARGETS.get(
    budgetTargetMapKey({
      clientId,
      monthKey,
      provider: scoped.provider,
      service: scoped.service,
      region: scoped.region,
    })
  );
  if (fallbackValue == null) return null;
  return { targetamount: fallbackValue };
};

const buildGates = (quality) => {
  const g = quality?.governance || {};
  const ingestion = g?.ingestionReliability || {};
  const ownership = g?.ownershipAllocation || {};
  const tags = g?.tagMetadata || {};
  const basis = g?.costBasisConsistency || {};
  const den = g?.denominatorQuality || {};

  const mk = (id, label, value, pass, warn, threshold, failCap, consequence) => ({
    id,
    label,
    value: roundTo(n(value), 2),
    status: pass(n(value)) ? "pass" : warn(n(value)) ? "warn" : "fail",
    threshold,
    failCap,
    consequence,
  });

  return [
    mk(
      "data_freshness",
      "Data freshness gate",
      ingestion?.freshnessLagHours,
      (v) => v >= 0 && v <= 6,
      (v) => v <= 24,
      "<= 6h pass, <= 24h warn, > 24h fail",
      60,
      "Confidence capped when ingestion lag exceeds threshold."
    ),
    mk(
      "allocation_confidence",
      "Allocation confidence gate",
      ownership?.allocationConfidenceScore,
      (v) => v >= 90,
      (v) => v >= 75,
      ">= 90 pass, >= 75 warn, < 75 fail",
      70,
      "Bands widen when ownership mapping confidence is weak."
    ),
    mk(
      "tag_owner_coverage",
      "Tag/ownership coverage gate",
      tags?.tagCoveragePct,
      (v) => v >= 95,
      (v) => v >= 80,
      ">= 95 pass, >= 80 warn, < 80 fail",
      70,
      "Budgets are visible but marked incomplete if coverage is low."
    ),
    mk(
      "cost_basis_consistency",
      "Cost basis consistency gate",
      basis?.currencyConsistencyPct,
      (v) => v >= 99,
      (v) => v >= 95,
      ">= 99 pass, >= 95 warn, < 95 fail",
      65,
      "Comparisons are constrained when cost basis drifts."
    ),
    mk(
      "denominator_coverage",
      "Denominator coverage gate",
      den?.denominatorCoveragePct,
      (v) => v >= 95,
      (v) => v >= 70,
      ">= 95 pass, >= 70 warn, < 70 fail",
      55,
      "Unit forecast is advisory-only when denominator coverage is low."
    ),
  ];
};

const gateScore = (status) => (status === "pass" ? 100 : status === "warn" ? 65 : 30);

const buildConfidence = (gates, volatilityPct) => {
  const weights = {
    data_freshness: 0.2,
    allocation_confidence: 0.25,
    tag_owner_coverage: 0.2,
    cost_basis_consistency: 0.2,
    denominator_coverage: 0.15,
  };
  let score = 0;
  let cap = 100;
  let fails = 0;
  let warns = 0;
  gates.forEach((gate) => {
    score += gateScore(gate.status) * (weights[gate.id] || 0);
    if (gate.status === "fail") {
      fails += 1;
      cap = Math.min(cap, n(gate.failCap || 100));
    }
    if (gate.status === "warn") warns += 1;
  });
  const forecastScore = roundTo(Math.min(score, cap), 2);
  const budgetScore = roundTo(Math.min(score + 4, cap), 2);
  const band = roundTo(clamp(8 + n(volatilityPct) * 0.35 + fails * 8 + warns * 3, 8, 45), 2);
  return {
    forecastConfidence: {
      score: forecastScore,
      level: confidenceLevelFromScore(forecastScore, { high: 85, medium: 70 }),
      advisoryOnly: fails > 0,
    },
    budgetConfidence: {
      score: budgetScore,
      level: confidenceLevelFromScore(budgetScore, { high: 85, medium: 70 }),
      advisoryOnly: fails > 0 || budgetScore < 70,
    },
    confidenceBandPct: band,
    consequences: gates
      .filter((gate) => gate.status !== "pass")
      .map((gate) => `${gate.label}: ${gate.consequence}`),
  };
};

const buildBudgetRows = (
  rows,
  currentCost,
  forecastCost,
  daysElapsed,
  totalDays,
  { budgetTarget = null } = {}
) => {
  const elapsedPct = totalDays > 0 ? roundTo(percent(daysElapsed, totalDays, null), 2) : 0;
  const threshold = { warn: 80, high: 90, breach: 100 };
  const baseRows = (rows || []).map((row, idx) => {
    const consumed = roundTo(n(row?.totalCost), 2);
    const hasExplicitBudget = row?.budget != null;
    const sourceBudget = hasExplicitBudget ? roundTo(n(row.budget), 2) : roundTo(consumed * 1.1, 2);
    const share = safeDivide(consumed, currentCost, 0);
    const forecast = roundTo(forecastCost * share, 2);
    return {
      id: `b-${idx + 1}`,
      scopeType: "team_product_env",
      scope: `${row?.team || "Unassigned"} / ${row?.product || "Unmapped"} / ${row?.environment || "All"}`,
      owner: row?.team || "unassigned@kcx.example",
      hasExplicitBudget,
      sourceBudget,
      consumed,
      forecast,
    };
  });

  const hasBudgetTarget = Number.isFinite(n(budgetTarget)) && n(budgetTarget) >= 0;
  const totalTarget = roundTo(n(budgetTarget), 2);
  const totalConsumed = baseRows.reduce((sum, row) => sum + n(row.consumed), 0);
  const totalSourceBudget = baseRows.reduce((sum, row) => sum + n(row.sourceBudget), 0);

  let allocatedSum = 0;
  const mapped = baseRows.map((row, idx) => {
    let budget = row.sourceBudget;
    if (hasBudgetTarget) {
      if (idx === baseRows.length - 1) {
        budget = roundTo(totalTarget - allocatedSum, 2);
      } else {
        const weight = totalConsumed > 0
          ? safeDivide(row.consumed, totalConsumed, 0)
          : totalSourceBudget > 0
            ? safeDivide(row.sourceBudget, totalSourceBudget, 0)
            : safeDivide(1, Math.max(1, baseRows.length), 0);
        budget = roundTo(totalTarget * weight, 2);
        allocatedSum = roundTo(allocatedSum + budget, 2);
      }
      budget = Math.max(0, budget);
    }

    const variance = budgetVarianceValue(row.forecast, budget, 2);
    const consumptionPct = budgetConsumptionPct(row.consumed, budget, 2);
    const variancePct = roundTo(percent(variance, budget, null), 2);
    const status =
      consumptionPct >= threshold.breach
        ? "breached"
        : consumptionPct >= threshold.high || variance > 0
          ? "at_risk"
          : consumptionPct >= threshold.warn
            ? "watch"
            : "on_track";

    return {
      id: row.id,
      scopeType: row.scopeType,
      scope: row.scope,
      owner: row.owner,
      budgetType: hasBudgetTarget ? "monthly_target" : row.hasExplicitBudget ? "fixed" : "rolling_derived",
      budget,
      consumed: row.consumed,
      forecast: row.forecast,
      variance,
      variancePct,
      consumptionPct,
      timeElapsedPct: elapsedPct,
      threshold,
      status,
    };
  });

  const atRisk = [...mapped]
    .filter((row) => row.status === "at_risk" || row.status === "breached")
    .sort((a, b) => Math.abs(n(b.variancePct)) - Math.abs(n(a.variancePct)))
    .slice(0, 10);
  return { rows: mapped, atRisk };
};

const buildTracking = (trend) => {
  const { errors } = computeForecastErrorStats(trend, {
    lookback: 7,
    valueSelector: (row) => row?.cost,
  });
  if (!errors.length) {
    return {
      mapePct: null,
      wapePct: null,
      biasPct: null,
      accuracyScore: null,
      byScope: [],
      topMisses: [],
    };
  }
  const avgActual =
    errors.reduce((sum, row) => sum + Math.abs(n(row.actual)), 0) / Math.max(1, errors.length);
  const denominatorFloor = Math.max(1, roundTo(avgActual * 0.2, 2));

  const stabilized = errors.map((row) => {
    const actual = n(row.actual);
    const forecast = n(row.forecast);
    const absErrorValue = Math.abs(actual - forecast);
    const denominator = Math.max(Math.abs(actual), denominatorFloor);
    const absErrorPct = roundTo(safeDivide(absErrorValue * 100, denominator, 0), 2);
    const biasPct = roundTo(safeDivide((forecast - actual) * 100, denominator, 0), 2);
    return {
      ...row,
      absErrorValue: roundTo(absErrorValue, 2),
      absErrorPct,
      biasPct,
    };
  });

  const mapePct = roundTo(
    stabilized.reduce((sum, row) => sum + n(row.absErrorPct), 0) / Math.max(1, stabilized.length),
    2
  );
  const biasPct = roundTo(
    stabilized.reduce((sum, row) => sum + n(row.biasPct), 0) / Math.max(1, stabilized.length),
    2
  );
  const accuracyScore = roundTo(clamp(100 - mapePct, 0, 100), 2);

  const totalAbsError = errors.reduce(
    (sum, row) => sum + Math.abs(n(row.actual) - n(row.forecast)),
    0
  );
  const totalActual = errors.reduce((sum, row) => sum + n(row.actual), 0);
  const wapePct = roundTo(percent(totalAbsError, totalActual, null), 2);
  const topMisses = [...stabilized]
    .sort((a, b) => n(b.absErrorValue) - n(a.absErrorValue))
    .slice(0, 8)
    .map((row, i) => ({
      id: `miss-${i + 1}`,
      scope: row.date || `window-${i + 1}`,
      actual: row.actual,
      forecast: row.forecast,
      missValue: roundTo(row.actual - row.forecast, 2),
      missPct: roundTo(row.absErrorPct, 2),
      biasPct: row.biasPct,
      link: "/dashboard/cost-drivers",
    }));
  return {
    mapePct,
    wapePct,
    biasPct,
    accuracyScore,
    byScope: topMisses.slice(0, 6).map((m) => ({
      scope: m.scope,
      actual: m.actual,
      forecast: m.forecast,
      errorPct: m.missPct,
      biasPct: m.biasPct,
    })),
    topMisses,
  };
};

const safeDate = (value) => {
  const dt = new Date(value);
  return Number.isNaN(dt.getTime()) ? null : dt;
};

const toIsoDate = (value) => {
  const dt = safeDate(value);
  return dt ? dt.toISOString().slice(0, 10) : null;
};

const buildForecastTimeline = ({
  trend,
  daysElapsed,
  totalDays,
  currentCost,
  forecastCost,
  confidenceBandPct,
}) => {
  const elapsed = Math.max(1, n(daysElapsed) || 1);
  const total = Math.max(elapsed, n(totalDays) || elapsed);
  const historyRaw = Array.isArray(trend) ? trend.slice(-elapsed) : [];
  let history = historyRaw
    .map((row) => ({
      date: toIsoDate(row?.date),
      value: roundTo(Math.max(0, n(row?.cost)), 2),
    }))
    .filter((row) => row.value >= 0);

  if (!history.length) {
    const perDay = safeDivide(currentCost, elapsed, 0);
    history = Array.from({ length: elapsed }, (_, index) => ({
      date: null,
      value: roundTo(perDay, 2),
      index,
    }));
  }

  const historyTotal = history.reduce((sum, row) => sum + n(row.value), 0);
  const scaleFactor = historyTotal > 0 ? safeDivide(currentCost, historyTotal, 1) : 1;

  const points = [];
  let cumulative = 0;
  let lastActualDate = safeDate(history[history.length - 1]?.date);

  history.forEach((row, idx) => {
    const actual = roundTo(n(row.value) * scaleFactor, 2);
    cumulative = roundTo(cumulative + actual, 2);
    const dateObj =
      safeDate(row.date) ||
      (lastActualDate
        ? new Date(lastActualDate.getTime() - (history.length - idx - 1) * 86400000)
        : null);

    points.push({
      dayIndex: idx + 1,
      date: dateObj ? dateObj.toISOString().slice(0, 10) : null,
      label: dateObj ? dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric" }) : `D${idx + 1}`,
      phase: "actual",
      actualToDate: cumulative,
      forecastToDate: idx === history.length - 1 ? cumulative : null,
      lowerBound: null,
      upperBound: null,
    });
  });

  if (!lastActualDate && points.length) {
    lastActualDate = safeDate(points[points.length - 1]?.date);
  }

  const remainingDays = Math.max(0, total - points.length);
  const remainingForecast = Math.max(0, roundTo(forecastCost - cumulative, 2));
  const perDayForecast = remainingDays > 0 ? safeDivide(remainingForecast, remainingDays, 0) : 0;
  const bandRatio = clamp(n(confidenceBandPct), 0, 60) / 100;

  for (let offset = 1; offset <= remainingDays; offset += 1) {
    cumulative = roundTo(cumulative + perDayForecast, 2);
    const dateObj = lastActualDate
      ? new Date(lastActualDate.getTime() + offset * 86400000)
      : null;
    points.push({
      dayIndex: points.length + 1,
      date: dateObj ? dateObj.toISOString().slice(0, 10) : null,
      label: dateObj
        ? dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric" })
        : `D${points.length + 1}`,
      phase: "forecast",
      actualToDate: null,
      forecastToDate: cumulative,
      lowerBound: roundTo(cumulative * (1 - bandRatio), 2),
      upperBound: roundTo(cumulative * (1 + bandRatio), 2),
    });
  }

  return {
    daysElapsed: points.filter((p) => p.phase === "actual").length,
    totalDays: points.length,
    points,
  };
};

const aggregateContributors = (rows, dimension, forecastCost) => {
  const keyFor = (row) => {
    if (dimension === "service") {
      return row?.service || row?.product || row?.category || "Unassigned";
    }
    if (dimension === "account") {
      return row?.account || row?.subscription || row?.project || row?.environment || "Unassigned";
    }
    return row?.team || row?.owner || "Unassigned";
  };

  const bucket = new Map();
  (rows || []).forEach((row) => {
    const key = String(keyFor(row) || "Unassigned").trim() || "Unassigned";
    const cost = roundTo(Math.max(0, n(row?.totalCost ?? row?.consumed)), 2);
    bucket.set(key, roundTo(n(bucket.get(key)) + cost, 2));
  });

  const grouped = [...bucket.entries()]
    .map(([name, currentCost]) => ({ name, currentCost: roundTo(currentCost, 2) }))
    .sort((a, b) => b.currentCost - a.currentCost);
  const scopedTotal = grouped.reduce((sum, row) => sum + n(row.currentCost), 0);

  return grouped.slice(0, 5).map((row, index) => {
    const sharePct = roundTo(percent(row.currentCost, scopedTotal, null), 2);
    return {
      rank: index + 1,
      name: row.name,
      currentCost: row.currentCost,
      previousCost: null,
      deltaValue: null,
      deltaPct: null,
      forecastDeltaContribution: null,
      forecastContribution: roundTo(n(forecastCost) * safeDivide(sharePct, 100, 0), 2),
      sharePct,
    };
  });
};

const buildContributorsFromVarianceRows = ({
  rows = [],
  forecastCost = 0,
  forecastDrift = 0,
}) => {
  const normalized = (rows || [])
    .map((row) => ({
      name: String(row?.name || "Unassigned"),
      currentCost: roundTo(n(row?.current), 2),
      previousCost: roundTo(n(row?.previous), 2),
      deltaValue: roundTo(n(row?.delta), 2),
      deltaPct: roundTo(n(row?.deltaPct), 2),
      contributionPct: roundTo(n(row?.contributionPct), 2),
    }))
    .filter((row) => row.currentCost > 0 || row.previousCost > 0);

  if (!normalized.length) return [];

  const totalCurrent = normalized.reduce((sum, row) => sum + n(row.currentCost), 0);
  const totalDelta = normalized.reduce((sum, row) => sum + n(row.deltaValue), 0);
  const totalAbsDelta = normalized.reduce((sum, row) => sum + Math.abs(n(row.deltaValue)), 0);
  const useDriftAttribution =
    totalAbsDelta < Math.max(0.01, Math.abs(n(forecastDrift)) * 0.05);

  const ranked = [...normalized].sort((a, b) => {
    if (n(a.deltaValue) >= 0 && n(b.deltaValue) < 0) return -1;
    if (n(a.deltaValue) < 0 && n(b.deltaValue) >= 0) return 1;
    return Math.abs(n(b.deltaValue)) - Math.abs(n(a.deltaValue));
  });

  return ranked.slice(0, 5).map((row, index) => {
    const sharePct = roundTo(percent(row.currentCost, totalCurrent, null), 2);
    const inferredDeltaValue = roundTo(n(forecastDrift) * safeDivide(sharePct, 100, 0), 2);
    const deltaValue = useDriftAttribution ? inferredDeltaValue : row.deltaValue;
    const previousCost = useDriftAttribution
      ? roundTo(Math.max(0, row.currentCost - inferredDeltaValue), 2)
      : row.previousCost;
    const deltaPct = previousCost > 0
      ? roundTo(percent(deltaValue, previousCost, null), 2)
      : row.currentCost > 0
        ? 100
        : 0;
    const driftShare = useDriftAttribution
      ? safeDivide(sharePct, 100, 0)
      : totalDelta !== 0
        ? n(row.deltaValue) / totalDelta
        : 0;
    return {
      rank: index + 1,
      name: row.name,
      currentCost: row.currentCost,
      previousCost,
      deltaValue,
      deltaPct,
      forecastDeltaContribution: roundTo(n(forecastDrift) * driftShare, 2),
      forecastContribution: roundTo(n(forecastCost) * safeDivide(sharePct, 100, 0), 2),
      sharePct,
    };
  });
};

const statusFromThresholds = (value, passAtOrAbove, warnAtOrAbove) => {
  const v = n(value);
  if (v >= passAtOrAbove) return "pass";
  if (v >= warnAtOrAbove) return "warn";
  return "fail";
};

const buildConfidenceChecklist = ({ quality, anomaliesCount }) => {
  const ingestion = quality?.governance?.ingestionReliability || {};
  const ownership = quality?.governance?.ownershipAllocation || {};

  const freshnessLag = n(ingestion?.freshnessLagHours);
  const freshnessStatus =
    freshnessLag <= 6 ? "pass" : freshnessLag <= 24 ? "warn" : "fail";

  const missingDays = n(ingestion?.missingDays30d);
  const missingAccounts = n(ingestion?.missingAccountsCount);
  const missingSignals = missingDays + missingAccounts;
  const missingStatus =
    missingSignals === 0 ? "pass" : missingSignals <= 3 ? "warn" : "fail";

  const allocationPct = n(ownership?.allocatedPct);
  const allocationStatus = statusFromThresholds(allocationPct, 95, 85);

  const anomaliesStatus =
    anomaliesCount <= 2 ? "pass" : anomaliesCount <= 5 ? "warn" : "fail";

  return [
    {
      id: "freshness_ok",
      label: "Data freshness OK",
      status: freshnessStatus,
      value: roundTo(freshnessLag, 2),
      valueLabel: `${roundTo(freshnessLag, 2)}h`,
      threshold: "<= 6h pass, <= 24h warn",
      detail: "Fresh ingestion keeps run-rate and drift comparable.",
    },
    {
      id: "missing_scope_coverage",
      label: "Missing days/accounts",
      status: missingStatus,
      value: missingSignals,
      valueLabel: `${missingDays} days, ${missingAccounts} accounts`,
      threshold: "0 pass, 1-3 warn, >3 fail",
      detail: "Missing ingestion windows can bias month-end projection.",
    },
    {
      id: "allocation_coverage",
      label: "Allocation coverage OK",
      status: allocationStatus,
      value: allocationPct,
      valueLabel: `${roundTo(allocationPct, 2)}%`,
      threshold: ">=95% pass, >=85% warn",
      detail: "Low ownership coverage reduces confidence in budget outcomes.",
    },
    {
      id: "recent_anomalies",
      label: "Recent anomalies",
      status: anomaliesStatus,
      value: anomaliesCount,
      valueLabel: `${anomaliesCount}`,
      threshold: "<=2 pass, <=5 warn, >5 fail",
      detail: "Frequent anomalies widen expected forecast uncertainty.",
    },
  ];
};

const dictionary = [
  { metric: "EOM Forecast (Run-rate)", formula: "(MTD Allocated Spend / Days Elapsed) * Total Days", scope: "Allocated cost" },
  { metric: "Budget Consumption %", formula: "(MTD Allocated Spend / Budget) * 100", scope: "Budget owner scope" },
  { metric: "Budget Variance (Forecast)", formula: "Forecasted Allocated Spend - Budget", scope: "Budget owner scope" },
  { metric: "Burn Rate", formula: "MTD Allocated Spend / Days Elapsed", scope: "Allocated cost" },
  { metric: "Breach ETA (days)", formula: "(Budget - MTD Spend) / Current Daily Burn", scope: "Budget owner scope" },
  { metric: "Required Daily Spend", formula: "(Budget - MTD Spend) / Days Remaining", scope: "Allocated cost" },
  { metric: "Forecast Drift", formula: "Forecast_current - Forecast_previous", scope: "Global forecast" },
  { metric: "Unit Cost Forecast", formula: "Forecasted Allocated Cost / Forecasted Volume", scope: "Unit-economics scope" },
  { metric: "MAPE", formula: "mean(|Actual - Forecast| / Actual) * 100", scope: "Forecast-to-actual tracking" },
  { metric: "Forecast Confidence (0-100)", formula: "Weighted governance gate score", scope: "Global + ownership planning" },
];

export const forecastingBudgetsService = {
  async getSummary({
    clientId = null,
    filters = {},
    uploadIds = [],
    period = "mtd",
    compareTo = "previous_period",
    costBasis = "actual",
    budgetMonth = null,
  } = {}) {
    if (!Array.isArray(uploadIds) || uploadIds.length === 0) {
      return {
        controls: { period: "mtd", compareTo: "previous_period", costBasis: "actual", currency: "USD" },
        executiveSentence: "No scoped data available for forecasting and budgets.",
        kpiStrip: {
          eomForecastAllocatedCost: 0,
          budgetConsumptionPct: 0,
          budgetVarianceForecast: 0,
          burnRate: 0,
          breachEtaDays: null,
          requiredDailySpend: 0,
          forecastDrift: 0,
          forecastDriftPct: 0,
          unitCostForecast: 0,
          mapePct: null,
          atRiskBudgetCount: 0,
        },
        confidence: {
          gates: [],
          forecastConfidence: { score: 0, level: "low", advisoryOnly: true },
          budgetConfidence: { score: 0, level: "low", advisoryOnly: true },
          confidenceBandPct: 45,
          consequences: [],
        },
        submodules: {
          budgetSetupOwnership: { hierarchy: [], budgetType: "fixed", atRiskBudgets: [], rows: [] },
          forecastEngine: {
            selectedMethod: "hybrid_blend",
            methodologyOptions: [],
            forecastAllocatedCost: { current: 0, lower: 0, upper: 0, eoq: 0 },
            forecastVolume: { current: 0, lower: 0, upper: 0 },
            forecastUnitCost: { current: 0, lower: 0, upper: 0 },
            sensitivity: [],
            drivers: { volatilityPct: 0, costGrowthPct: 0, volumeGrowthPct: 0 },
          },
          budgetBurnControls: {
            burnRate: 0,
            plannedBurnRate: 0,
            burnVsPlanPct: 0,
            daysRemaining: 0,
            breachEtaDays: null,
            requiredDailySpend: 0,
            overrunAvoidedIfActionsCompleteBy: null,
          },
          scenarioPlanning: { constraints: [], scenarios: [], recommendedScenario: null },
          forecastActualTracking: {
            mapePct: null,
            wapePct: null,
            biasPct: null,
            accuracyScore: null,
            byScope: [],
            topMisses: [],
          },
          alertsEscalation: { unacknowledgedCount: 0, states: [], alerts: [] },
        },
        forecastView: {
          kpi: {
            eomForecast: 0,
            lastForecast: 0,
            driftValue: 0,
            driftPct: 0,
            runRatePerDay: 0,
            confidenceLevel: "low",
            confidenceScore: 0,
          },
          timeline: { daysElapsed: 0, totalDays: 0, points: [] },
          composition: { tabs: [] },
          accuracy: {
            metricLabel: "MAPE",
            mapePct: null,
            wapePct: null,
            biasPct: null,
            largestMissDays: [],
          },
          confidenceChecklist: [],
        },
        metricDictionary: dictionary,
        forecastMethodology: [],
        budgetStrategy: {
          hierarchy: ["org", "business_unit", "team/product", "environment/provider"],
          sharedPoolHandling: "Shared pool is tracked separately and redistributed into ownership budgets.",
          thresholds: { warn: 80, high: 90, breach: 100 },
          defaultAbsoluteImpactFloor: 500,
        },
        nonDuplicationRules: [
          "No trend duplication from Spend Analytics.",
          "No variance decomposition duplication from Cost Drivers.",
          "No opportunity table duplication from Optimization.",
        ],
        crossSectionMap: [],
      };
    }

    const p = normalizePeriod(period);
    const b = normalizeBasis(costBasis);
    const c = normalizeCompare(compareTo);
    const window = periodToWindow(p);
    const scopeFilters = normalizeBudgetFilters(filters);
    const resolvedBudgetMonth = resolveBudgetMonthKey({ budgetMonth });

    const [unit, quality, actionCenter] = await Promise.all([
      unitEconomicsService.getSummary({ filters, period: window.unitPeriod, compareTo: c, costBasis: b, uploadIds }),
      dataQualityService.analyzeDataQuality({ filters, uploadIds }),
      optimizationService.getActionCenter({ filters, period: window.optPeriod, uploadIds }),
    ]);

    const totalDays = window.days;
    const unitCurrentWindow = unit?.comparison?.currentWindow || {};
    const unitPreviousWindow = unit?.comparison?.previousWindow || {};
    const unitEconKpis = unit?.unitEconomics?.kpis || {};

    const daysElapsed = Math.max(1, n(unitCurrentWindow?.days || 1));
    const daysRemaining = Math.max(0, totalDays - daysElapsed);
    const currentCost = roundTo(n(unitCurrentWindow?.totalCost ?? unit?.kpis?.totalCost), 2);
    const previousCost = roundTo(n(unitPreviousWindow?.totalCost), 2);
    const burnRate = burnRatePerDay(currentCost, daysElapsed, 2);
    const forecastCost = runRateForecast(currentCost, daysElapsed, totalDays, 2);
    const prevDays = Math.max(1, n(unitPreviousWindow?.days || daysElapsed));
    const prevForecast = runRateForecast(previousCost, prevDays, totalDays, 2);
    const forecastDrift = roundTo(delta(forecastCost, prevForecast, null), 2);
    const forecastDriftPct = roundTo(growthPct(forecastCost, prevForecast, null), 2);

    const showbackRows = Array.isArray(unit?.allocation?.rows) ? unit.allocation.rows : [];
    const explicitBudget = roundTo(showbackRows.reduce((s, row) => s + n(row?.budget), 0), 2);
    const derivedBudget = roundTo(
      Math.max(forecastCost * 1.05, previousCost * 1.08, currentCost * 1.1),
      2
    );
    const savedBudgetTargetRecord = await getBudgetTargetRecord({
      clientId,
      filters: scopeFilters,
      budgetMonth: resolvedBudgetMonth,
    });
    const savedBudgetTarget =
      savedBudgetTargetRecord == null ? null : roundTo(n(savedBudgetTargetRecord.targetamount), 2);
    const budget =
      savedBudgetTarget != null ? savedBudgetTarget : explicitBudget > 0 ? explicitBudget : derivedBudget;
    const budgetConsumptionPctValue = budgetConsumptionPct(currentCost, budget, 2);
    const budgetVarianceForecast = budgetVarianceValue(forecastCost, budget, 2);
    const plannedBurnRate = burnRatePerDay(budget, totalDays, 2);
    const burnVsPlanPct = roundTo(growthPct(burnRate, plannedBurnRate, null), 2);
    const breachEtaDays = computeBreachEtaDays(budget, currentCost, burnRate, 2);
    const requiredDailySpend = computeRequiredDailySpend(budget, currentCost, daysRemaining, 2);

    const currentVolume = roundTo(n(unitCurrentWindow?.totalQuantity ?? unit?.kpis?.totalQuantity), 2);
    const previousVolume = roundTo(n(unitPreviousWindow?.totalQuantity), 2);
    const forecastVolume = runRateForecast(currentVolume, daysElapsed, totalDays, 2);
    const unitCostForecast = roundTo(safeDivide(forecastCost, Math.max(1, forecastVolume), 0), 6);
    const volatilityPct = n(unit?.volatility?.scorePct ?? unitEconKpis?.volatilityScorePct);
    const gates = buildGates(quality);
    const confidence = buildConfidence(gates, volatilityPct);

    const lowerCost = roundTo(forecastCost * (1 - confidence.confidenceBandPct / 100), 2);
    const upperCost = roundTo(forecastCost * (1 + confidence.confidenceBandPct / 100), 2);
    const lowerVolume = roundTo(forecastVolume * (1 - confidence.confidenceBandPct / 120), 2);
    const upperVolume = roundTo(forecastVolume * (1 + confidence.confidenceBandPct / 120), 2);

    const budgetRows = buildBudgetRows(showbackRows, currentCost, forecastCost, daysElapsed, totalDays, {
      budgetTarget: savedBudgetTarget,
    });
    const tracking = buildTracking(unit?.unitEconomics?.trend || []);
    const elasticity = Number.isFinite(n(unitEconKpis?.elasticityScore)) ? n(unitEconKpis?.elasticityScore) : 0.8;

    const scenarios = [
      { id: "baseline", label: "Baseline", knobs: { volumeGrowthPct: 0, commitmentCoverageChangePct: 0, optimizationExecutionRatePct: 0, sharedPoolShiftPct: 0 } },
      { id: "conservative", label: "Conservative", knobs: { volumeGrowthPct: -5, commitmentCoverageChangePct: 5, optimizationExecutionRatePct: 35, sharedPoolShiftPct: -2 } },
      { id: "growth", label: "Growth", knobs: { volumeGrowthPct: 15, commitmentCoverageChangePct: -5, optimizationExecutionRatePct: 10, sharedPoolShiftPct: 3 } },
      { id: "cost_cut", label: "Cost-Cut", knobs: { volumeGrowthPct: 2, commitmentCoverageChangePct: 8, optimizationExecutionRatePct: 60, sharedPoolShiftPct: -4 } },
    ].map((s) => {
      const vf = 1 + n(s.knobs.volumeGrowthPct) / 100;
      const vol = roundTo(Math.max(1, forecastVolume * vf), 2);
      const cost1 = forecastCost * (1 + (n(s.knobs.volumeGrowthPct) / 100) * elasticity);
      const cost2 = cost1 * (1 - n(s.knobs.commitmentCoverageChangePct) * 0.003);
      const cost3 = cost2 * (1 - n(s.knobs.optimizationExecutionRatePct) * 0.0025);
      const cost = roundTo(cost3 * (1 + n(s.knobs.sharedPoolShiftPct) * 0.004), 2);
      return {
        id: s.id,
        label: s.label,
        knobs: s.knobs,
        outputs: {
          forecastAllocatedCost: cost,
          forecastVolume: vol,
          forecastUnitCost: roundTo(cost / Math.max(1, vol), 6),
          varianceVsBudget: roundTo(cost - budget, 2),
          breachRiskPct: budget > 0 ? roundTo(clamp(percent(cost, budget, null), 0, 250), 2) : 0,
          marginPerUnitImpact: unit?.margin?.marginPerUnit == null ? null : roundTo(n(unit?.margin?.marginPerUnit) - roundTo(cost / Math.max(1, vol), 6), 6),
        },
      };
    });

    const alerts = [];
    budgetRows.atRisk.slice(0, 8).forEach((row, idx) => {
      alerts.push({
        id: `budget-risk-${idx + 1}`,
        type: "budget_threshold",
        severity: row.status === "breached" ? "critical" : "high",
        scope: row.scope,
        owner: row.owner,
        status: "unacknowledged",
        threshold: `${row.threshold.high}%`,
        current: `${row.consumptionPct}%`,
        links: { optimization: "/dashboard/optimization", governance: "/dashboard/data-quality", rootCause: "/dashboard/cost-drivers" },
      });
    });
    gates.filter((g) => g.status === "fail").forEach((g, idx) => {
      alerts.push({
        id: `gate-fail-${idx + 1}`,
        type: "confidence_gate",
        severity: "high",
        scope: "global",
        owner: "finops-controller@kcx.example",
        status: "investigating",
        threshold: g.threshold,
        current: String(g.value),
        links: { optimization: "/dashboard/optimization", governance: "/dashboard/data-quality", rootCause: "/dashboard/cost-drivers" },
      });
    });
    if (n(actionCenter?.commitmentGap?.onDemandPercentage) > 60) {
      alerts.push({
        id: "commitment-risk-1",
        type: "commitment_expiry",
        severity: n(actionCenter?.commitmentGap?.onDemandPercentage) > 75 ? "high" : "medium",
        scope: "global",
        owner: "finops-commitments@kcx.example",
        status: "unacknowledged",
        threshold: "<= 60%",
        current: `${roundTo(n(actionCenter?.commitmentGap?.onDemandPercentage), 2)}%`,
        links: { optimization: "/dashboard/optimization", governance: "/dashboard/data-quality", rootCause: "/dashboard/cost-drivers" },
      });
    }

    const costGrowthPct = roundTo(growthPct(currentCost, previousCost, null), 2);
    const volumeGrowthPct = roundTo(growthPct(currentVolume, previousVolume, null), 2);
    const timeline = buildForecastTimeline({
      trend: unit?.unitEconomics?.trend || [],
      daysElapsed,
      totalDays,
      currentCost,
      forecastCost,
      confidenceBandPct: confidence.confidenceBandPct,
    });
    const teamVarianceRows = Array.isArray(unit?.viewModel?.teamVariance)
      ? unit.viewModel.teamVariance
      : [];
    const productVarianceRows = Array.isArray(unit?.viewModel?.productVariance)
      ? unit.viewModel.productVariance
      : [];
    const compositionTabs = [
      {
        id: "team",
        label: "Team",
        contributors: buildContributorsFromVarianceRows({
          rows: teamVarianceRows,
          forecastCost,
          forecastDrift,
        }),
      },
      {
        id: "service",
        label: "Service",
        contributors: buildContributorsFromVarianceRows({
          rows: productVarianceRows,
          forecastCost,
          forecastDrift,
        }),
      },
    ]
      .map((tab) =>
        tab.contributors.length
          ? tab
          : {
              ...tab,
              contributors:
                tab.id === "team"
                  ? aggregateContributors(showbackRows, "team", forecastCost)
                  : aggregateContributors(showbackRows, "service", forecastCost),
            }
      )
      .filter((tab) => tab.contributors.length > 0);
    const anomaliesCount = Array.isArray(quality?.buckets?.anomalies) ? quality.buckets.anomalies.length : 0;
    const confidenceChecklist = buildConfidenceChecklist({ quality, anomaliesCount });

    return {
      controls: {
        period: p,
        compareTo: c,
        costBasis: b,
        currency: "USD",
        budgetMonth: resolvedBudgetMonth,
      },
      executiveSentence:
        `Allocated spend is projected at $${forecastCost.toFixed(2)} (${confidence.forecastConfidence.level} confidence). ` +
        `${budgetRows.atRisk.length} budgets are at risk and required daily spend is $${requiredDailySpend.toFixed(2)}.`,
      kpiStrip: {
        eomForecastAllocatedCost: forecastCost,
        budgetConsumptionPct: budgetConsumptionPctValue,
        budgetVarianceForecast,
        burnRate,
        breachEtaDays,
        requiredDailySpend,
        forecastDrift,
        forecastDriftPct,
        unitCostForecast,
        mapePct: tracking.mapePct,
        atRiskBudgetCount: budgetRows.atRisk.length,
      },
      confidence: { ...confidence, gates },
      submodules: {
        budgetSetupOwnership: {
          hierarchy: ["org", "business_unit", "team/product", "environment/provider"],
          budgetType:
            savedBudgetTarget != null
              ? "monthly_target"
              : explicitBudget > 0
                ? "fixed"
                : "rolling_derived",
          atRiskBudgets: budgetRows.atRisk,
          rows: budgetRows.rows,
        },
        forecastEngine: {
          selectedMethod: "hybrid_blend",
          methodologyOptions: [
            { id: "baseline_run_rate", label: "Baseline Run-Rate", useWhen: "Stable allocated spend and low volatility." },
            { id: "seasonality_adjusted", label: "Seasonality-Adjusted", useWhen: "Recurring periodic spend profile." },
            { id: "unit_based", label: "Unit-Based", useWhen: "Reliable denominator coverage and unit relationships." },
            { id: "hybrid_blend", label: "Hybrid Blend", useWhen: "Run-rate + governance confidence + volatility controls." },
          ],
          forecastAllocatedCost: { current: forecastCost, lower: lowerCost, upper: upperCost, eoq: roundTo(forecastCost * 3, 2) },
          forecastVolume: { current: forecastVolume, lower: lowerVolume, upper: upperVolume },
          forecastUnitCost: { current: unitCostForecast, lower: roundTo(lowerCost / Math.max(1, upperVolume), 6), upper: roundTo(upperCost / Math.max(1, lowerVolume), 6) },
          sensitivity: [
            { id: "vol_plus_10", label: "Volume +10%", allocatedCostDeltaPct: roundTo(elasticity * 10, 2), unitCostDeltaPct: roundTo(elasticity * 10 - 10, 2) },
            { id: "vol_minus_10", label: "Volume -10%", allocatedCostDeltaPct: roundTo(-elasticity * 10, 2), unitCostDeltaPct: roundTo(-elasticity * 10 + 10, 2) },
          ],
          drivers: { volatilityPct: roundTo(volatilityPct, 2), costGrowthPct, volumeGrowthPct },
        },
        budgetBurnControls: {
          burnRate,
          plannedBurnRate,
          burnVsPlanPct,
          daysRemaining,
          breachEtaDays,
          requiredDailySpend,
          overrunAvoidedIfActionsCompleteBy: actionCenter?.model?.summary?.topActionsThisWeek?.[0]?.etaDate || null,
        },
        scenarioPlanning: {
          constraints: [
            "Forecasts are computed on final allocated cost only.",
            "Unit forecasts are advisory if denominator gate fails.",
            "Scenario knobs are bounded for actionable planning.",
          ],
          scenarios,
          recommendedScenario: [...scenarios].sort((a, b) => n(a.outputs.forecastAllocatedCost) - n(b.outputs.forecastAllocatedCost))[0]?.id || null,
        },
        forecastActualTracking: tracking,
        alertsEscalation: {
          unacknowledgedCount: alerts.filter((a) => a.status === "unacknowledged").length,
          states: ["unacknowledged", "investigating", "mitigated", "closed"],
          alerts,
        },
      },
      forecastView: {
        kpi: {
          eomForecast: forecastCost,
          lastForecast: prevForecast,
          driftValue: forecastDrift,
          driftPct: forecastDriftPct,
          runRatePerDay: burnRate,
          confidenceLevel: confidence.forecastConfidence.level,
          confidenceScore: confidence.forecastConfidence.score,
        },
        timeline,
        composition: { tabs: compositionTabs },
        accuracy: {
          metricLabel: "MAPE",
          mapePct: tracking.mapePct,
          wapePct: tracking.wapePct,
          biasPct: tracking.biasPct,
          largestMissDays: tracking.topMisses.slice(0, 5),
        },
        confidenceChecklist,
      },
      metricDictionary: dictionary,
      forecastMethodology: [
        { id: "baseline_run_rate", label: "Baseline Run-Rate", useWhen: "Stable spend with low volatility." },
        { id: "seasonality_adjusted", label: "Seasonality-Adjusted", useWhen: "Known periodicity in spend behavior." },
        { id: "unit_based", label: "Unit-Based", useWhen: "Strong denominator and ownership quality." },
        { id: "hybrid_blend", label: "Hybrid Blend", useWhen: "Enterprise planning with confidence gates." },
      ],
      budgetStrategy: {
        hierarchy: ["org", "business_unit", "team/product", "environment/provider"],
        sharedPoolHandling: "Shared pool is tracked separately and redistributed into ownership budgets.",
        thresholds: { warn: 80, high: 90, breach: 100 },
        defaultAbsoluteImpactFloor: 500,
      },
      nonDuplicationRules: [
        "No trend duplication from Spend Analytics.",
        "No variance decomposition duplication from Cost Drivers.",
        "No opportunity table duplication from Optimization.",
      ],
      crossSectionMap: [
        { source: "Governance & Data Quality", input: "freshness, coverage, basis, denominator gates", output: "forecast confidence and advisory status" },
        { source: "Allocation & Unit Economics", input: "final allocated cost and ownership budgets", output: "budget ownership and unit forecast" },
        { source: "Optimization", input: "top action ETAs and commitment opportunities", output: "overrun avoidance and mitigation ETA" },
        { source: "Cost Drivers", input: "variance evidence", output: "forecast miss root-cause link-outs" },
      ],
    };
  },

  async saveBudgetTarget({
    clientId = null,
    userId = null,
    filters = {},
    budgetMonth = null,
    budgetTarget = null,
  } = {}) {
    if (!clientId) {
      throw new AppError(401, "UNAUTHENTICATED", "Authentication required");
    }

    const normalizedTarget = roundTo(n(budgetTarget, Number.NaN), 2);
    if (!Number.isFinite(normalizedTarget) || normalizedTarget < 0) {
      throw new AppError(400, "VALIDATION_ERROR", "budgetTarget must be a non-negative number");
    }

    const scopeFilters = normalizeBudgetFilters(filters);
    const monthKey = resolveBudgetMonthKey({ budgetMonth });

    const where = {
      clientid: clientId,
      monthkey: monthKey,
      provider: scopeFilters.provider,
      service: scopeFilters.service,
      region: scopeFilters.region,
    };

    let record = null;
    try {
      const existing = await DashboardBudgetTarget.findOne({ where });
      record = existing;

      if (record) {
        record.targetamount = normalizedTarget;
        record.updatedby = userId || null;
        await record.save();
      } else {
        record = await DashboardBudgetTarget.create({
          ...where,
          targetamount: normalizedTarget,
          createdby: userId || null,
          updatedby: userId || null,
        });
      }
    } catch (error) {
      if (!isBudgetTargetTableMissingError(error)) {
        throw error;
      }
      RUNTIME_BUDGET_TARGETS.set(
        budgetTargetMapKey({
          clientId,
          monthKey,
          provider: scopeFilters.provider,
          service: scopeFilters.service,
          region: scopeFilters.region,
        }),
        normalizedTarget
      );
    }

    return {
      saved: true,
      monthKey,
      budgetTarget: normalizedTarget,
      scope: scopeFilters,
      recordId: record?.id || null,
      updatedAt: record?.updatedAt || new Date().toISOString(),
    };
  },
};
