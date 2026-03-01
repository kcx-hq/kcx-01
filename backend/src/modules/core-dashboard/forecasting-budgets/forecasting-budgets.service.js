import { roundTo } from "../../../common/utils/cost.calculations.js";
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

const buildBudgetRows = (rows, currentCost, forecastCost, daysElapsed, totalDays) => {
  const elapsedPct = totalDays > 0 ? roundTo(percent(daysElapsed, totalDays, null), 2) : 0;
  const mapped = (rows || []).map((row, idx) => {
    const consumed = roundTo(n(row?.totalCost), 2);
    const budget = row?.budget == null ? roundTo(consumed * 1.1, 2) : roundTo(n(row.budget), 2);
    const share = safeDivide(consumed, currentCost, 0);
    const forecast = roundTo(forecastCost * share, 2);
    const variance = budgetVarianceValue(forecast, budget, 2);
    const consumptionPct = budgetConsumptionPct(consumed, budget, 2);
    const variancePct = roundTo(percent(variance, budget, null), 2);
    const status =
      consumptionPct >= 100
        ? "breached"
        : consumptionPct >= 90 || variance > 0
          ? "at_risk"
          : consumptionPct >= 80
            ? "watch"
            : "on_track";
    return {
      id: `b-${idx + 1}`,
      scopeType: "team_product_env",
      scope: `${row?.team || "Unassigned"} / ${row?.product || "Unmapped"} / ${row?.environment || "All"}`,
      owner: row?.team || "unassigned@kcx.example",
      budgetType: row?.budget == null ? "rolling_derived" : "fixed",
      budget,
      consumed,
      forecast,
      variance,
      variancePct,
      consumptionPct,
      timeElapsedPct: elapsedPct,
      threshold: { warn: 80, high: 90, breach: 100 },
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
  const { mapePct, biasPct, accuracyScore, errors } = computeForecastErrorStats(trend, {
    lookback: 7,
    valueSelector: (row) => row?.cost,
  });
  if (!errors.length) {
    return { mapePct: null, biasPct: null, accuracyScore: null, byScope: [], topMisses: [] };
  }
  const topMisses = [...errors]
    .sort((a, b) => n(b.absErrorPct) - n(a.absErrorPct))
    .slice(0, 8)
    .map((row, i) => ({
      id: `miss-${i + 1}`,
      scope: row.date || `window-${i + 1}`,
      actual: row.actual,
      forecast: row.forecast,
      missValue: roundTo(row.actual - row.forecast, 2),
      missPct: row.absErrorPct,
      biasPct: row.biasPct,
      link: "/dashboard/cost-drivers",
    }));
  return {
    mapePct,
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
  async getSummary({ filters = {}, uploadIds = [], period = "mtd", compareTo = "previous_period", costBasis = "actual" } = {}) {
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
          forecastActualTracking: { mapePct: null, biasPct: null, accuracyScore: null, byScope: [], topMisses: [] },
          alertsEscalation: { unacknowledgedCount: 0, states: [], alerts: [] },
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

    const [unit, quality, actionCenter] = await Promise.all([
      unitEconomicsService.getSummary({ filters, period: window.unitPeriod, compareTo: c, costBasis: b, uploadIds }),
      dataQualityService.analyzeDataQuality({ filters, uploadIds }),
      optimizationService.getActionCenter({ filters, period: window.optPeriod, uploadIds }),
    ]);

    const totalDays = window.days;
    const daysElapsed = Math.max(1, n(unit?.summary?.currentWindow?.days || 1));
    const daysRemaining = Math.max(0, totalDays - daysElapsed);
    const currentCost = roundTo(n(unit?.summary?.currentWindow?.totalCost ?? unit?.unitEconomics?.totalCost), 2);
    const previousCost = roundTo(n(unit?.summary?.previousWindow?.totalCost ?? unit?.unitEconomics?.previousTotalCost), 2);
    const burnRate = burnRatePerDay(currentCost, daysElapsed, 2);
    const forecastCost = runRateForecast(currentCost, daysElapsed, totalDays, 2);
    const prevDays = Math.max(1, n(unit?.summary?.previousWindow?.days || daysElapsed));
    const prevForecast = runRateForecast(previousCost, prevDays, totalDays, 2);
    const forecastDrift = roundTo(delta(forecastCost, prevForecast, null), 2);

    const showbackRows = Array.isArray(unit?.showbackRows) ? unit.showbackRows : [];
    const explicitBudget = roundTo(showbackRows.reduce((s, row) => s + n(row?.budget), 0), 2);
    const budget = explicitBudget > 0 ? explicitBudget : roundTo(Math.max(forecastCost * 1.05, previousCost * 1.08, currentCost * 1.1), 2);
    const budgetConsumptionPctValue = budgetConsumptionPct(currentCost, budget, 2);
    const budgetVarianceForecast = budgetVarianceValue(forecastCost, budget, 2);
    const plannedBurnRate = burnRatePerDay(budget, totalDays, 2);
    const burnVsPlanPct = roundTo(growthPct(burnRate, plannedBurnRate, null), 2);
    const breachEtaDays = computeBreachEtaDays(budget, currentCost, burnRate, 2);
    const requiredDailySpend = computeRequiredDailySpend(budget, currentCost, daysRemaining, 2);

    const currentVolume = roundTo(n(unit?.summary?.currentWindow?.totalQuantity ?? unit?.unitEconomics?.totalQuantity), 2);
    const previousVolume = roundTo(n(unit?.summary?.previousWindow?.totalQuantity ?? unit?.unitEconomics?.previousTotalQuantity), 2);
    const forecastVolume = runRateForecast(currentVolume, daysElapsed, totalDays, 2);
    const unitCostForecast = roundTo(safeDivide(forecastCost, Math.max(1, forecastVolume), 0), 6);
    const volatilityPct = n(unit?.unitEconomics?.volatilityPct);
    const gates = buildGates(quality);
    const confidence = buildConfidence(gates, volatilityPct);

    const lowerCost = roundTo(forecastCost * (1 - confidence.confidenceBandPct / 100), 2);
    const upperCost = roundTo(forecastCost * (1 + confidence.confidenceBandPct / 100), 2);
    const lowerVolume = roundTo(forecastVolume * (1 - confidence.confidenceBandPct / 120), 2);
    const upperVolume = roundTo(forecastVolume * (1 + confidence.confidenceBandPct / 120), 2);

    const budgetRows = buildBudgetRows(showbackRows, currentCost, forecastCost, daysElapsed, totalDays);
    const tracking = buildTracking(unit?.unitEconomics?.trend || []);
    const elasticity = Number.isFinite(n(unit?.unitEconomics?.elasticityScore)) ? n(unit?.unitEconomics?.elasticityScore) : 0.8;

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

    return {
      controls: { period: p, compareTo: c, costBasis: b, currency: "USD" },
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
        unitCostForecast,
        mapePct: tracking.mapePct,
        atRiskBudgetCount: budgetRows.atRisk.length,
      },
      confidence: { ...confidence, gates },
      submodules: {
        budgetSetupOwnership: {
          hierarchy: ["org", "business_unit", "team/product", "environment/provider"],
          budgetType: explicitBudget > 0 ? "fixed" : "rolling_derived",
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
};
