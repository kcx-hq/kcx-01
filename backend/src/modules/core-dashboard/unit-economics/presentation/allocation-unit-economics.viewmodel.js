const toNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const round = (value, digits = 2) => {
  const factor = 10 ** digits;
  return Math.round(toNumber(value) * factor) / factor;
};

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const parseDateLabel = (value) => {
  const text = String(value || "").trim();
  if (!text) return null;
  const date = new Date(text);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

const mapPeriodLabel = (period) => {
  const v = String(period || "").toLowerCase();
  if (v === "90d" || v === "last90days") return "Last 90 Days";
  if (v === "month" || v === "mtd") return "Month to Date";
  return "Last 30 Days";
};

const mapCompareLabel = (compareMode) =>
  String(compareMode || "previous_period") === "same_period_last_month"
    ? "Same Period Last Month"
    : "Previous Period";

const getCoverageState = (pct) => {
  const value = toNumber(pct);
  if (!Number.isFinite(value)) return "na";
  if (value >= 95) return "green";
  if (value >= 80) return "amber";
  return "red";
};

const stdDev = (values = []) => {
  if (values.length <= 1) return 0;
  const mean = values.reduce((sum, value) => sum + toNumber(value), 0) / values.length;
  const variance =
    values.reduce((sum, value) => sum + (toNumber(value) - mean) ** 2, 0) /
    Math.max(1, values.length - 1);
  return Math.sqrt(variance);
};

const growthPct = (curr, prev) => {
  const current = toNumber(curr);
  const previous = toNumber(prev);
  if (!previous) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
};

const mapElasticityClass = (classification) => {
  const value = String(classification || "undefined").toLowerCase();
  if (value === "strong_scale_advantage") return "scale_advantage";
  if (value === "efficient_scaling") return "efficient";
  if (value === "linear_scaling") return "linear";
  if (value === "degrading_scaling") return "inefficient";
  return "undefined";
};

const mapEfficiencyClassification = (status) => {
  const value = String(status || "").toLowerCase();
  if (value === "efficient_scaling") return "efficient_scaling";
  if (value === "degrading_efficiency") return "degrading_efficiency";
  if (value === "volatile_behavior") return "volatile_behavior";
  if (value === "linear_scaling") return "linear_scaling";
  return "insufficient_data";
};

const mapKpiStatus = (status) => {
  const value = String(status || "").toLowerCase();
  if (value === "efficient_scaling") return "improving";
  if (value === "degrading_efficiency") return "degrading";
  if (value === "volatile_behavior") return "volatile";
  if (value === "linear_scaling") return "stable";
  return "insufficient_data";
};

const mapEfficiencyStatus = (status) => {
  const value = String(status || "").toLowerCase();
  if (value === "improving") return "gain";
  if (value === "degrading") return "drop";
  if (value === "stable") return "stable";
  return "insufficient_data";
};

const mapRiskFlag = (flag) => {
  const value = String(flag || "").toLowerCase();
  if (value === "high_volatility") return "High unit-cost volatility";
  if (value === "infra_growth_outpacing_volume") return "Infra growth outpaces volume growth";
  if (value === "elasticity_degrading") return "Elasticity indicates degrading scaling";
  if (value === "elasticity_low_signal") return "Elasticity signal is weak";
  if (!value) return "Unspecified risk flag";
  return value.replaceAll("_", " ");
};

const withTrendSignals = (currentTrendRaw = [], previousTrendRaw = []) => {
  const current = Array.isArray(currentTrendRaw)
    ? currentTrendRaw.map((row) => ({
        date: String(row?.date || ""),
        cost: toNumber(row?.cost),
        quantity: toNumber(row?.quantity),
        unitPrice: toNumber(row?.unitPrice),
      }))
    : [];
  const previous = Array.isArray(previousTrendRaw)
    ? previousTrendRaw.map((row) => ({
        date: String(row?.date || ""),
        cost: toNumber(row?.cost),
        quantity: toNumber(row?.quantity),
        unitPrice: toNumber(row?.unitPrice),
      }))
    : [];

  if (!current.length) return [];

  const offset = previous.length - current.length;
  const enriched = current.map((point, index) => {
    const prevPoint = previous[index + offset] || null;
    const prevDay = index > 0 ? current[index - 1] : null;
    const dayCostGrowth = prevDay ? growthPct(point.cost, prevDay.cost) : 0;
    const dayVolumeGrowth = prevDay ? growthPct(point.quantity, prevDay.quantity) : 0;
    const elasticity =
      prevDay && Math.abs(dayVolumeGrowth) >= 0.01 ? dayCostGrowth / dayVolumeGrowth : null;
    return {
      date: point.date,
      cost: round(point.cost, 2),
      quantity: round(point.quantity, 2),
      unitPrice: round(point.unitPrice, 6),
      previousCost: round(prevPoint?.cost || 0, 2),
      previousQuantity: round(prevPoint?.quantity || 0, 2),
      previousUnitPrice: round(prevPoint?.unitPrice || 0, 6),
      elasticity: elasticity !== null && Number.isFinite(elasticity) ? round(elasticity, 4) : null,
      isChangePoint: false,
      isOptimizationEvent: false,
    };
  });

  const deltas = enriched
    .map((point, index) => (index === 0 ? 0 : point.unitPrice - enriched[index - 1].unitPrice))
    .slice(1);
  const absDeltas = deltas.map((value) => Math.abs(value));
  const meanAbsDelta =
    absDeltas.length > 0 ? absDeltas.reduce((sum, value) => sum + value, 0) / absDeltas.length : 0;
  const threshold = meanAbsDelta + stdDev(absDeltas) * 1.5;

  return enriched.map((point, index) => {
    if (index === 0) return point;
    const delta = point.unitPrice - enriched[index - 1].unitPrice;
    const isChangePoint = threshold > 0 && Math.abs(delta) >= threshold;
    return {
      ...point,
      isChangePoint,
      isOptimizationEvent: isChangePoint && delta < 0,
    };
  });
};

const normalizeDecomposition = (raw = {}) => {
  const components = Array.isArray(raw?.components) ? raw.components : [];
  return {
    startUnitCost: round(raw?.startUnitCost, 6),
    endUnitCost: round(raw?.endUnitCost, 6),
    components: components.map((component) => ({
      id:
        String(component?.id || "") === "shared_allocation_shift"
          ? "shared_allocation_impact"
          : component?.id,
      label: String(component?.label || "Unspecified"),
      value: round(component?.value, 6),
      contributionPct: round(component?.contributionPct, 2),
    })),
    validationDelta: round(raw?.validationDelta, 6),
  };
};

const buildVarianceRows = (rows = [], key) => {
  const grouped = new Map();

  rows.forEach((row) => {
    const name = String(row?.[key] || "Unknown");
    const current = toNumber(row?.finalCost);
    const deltaPct = toNumber(row?.deltaPct);
    const ratio = 1 + deltaPct / 100;
    const previous = ratio > 0 ? current / ratio : 0;
    const delta = current - previous;

    const entry = grouped.get(name) || { name, previous: 0, current: 0, delta: 0 };
    entry.previous += previous;
    entry.current += current;
    entry.delta += delta;
    grouped.set(name, entry);
  });

  const entries = Array.from(grouped.values());
  const totalDelta = entries.reduce((sum, row) => sum + row.delta, 0);
  const totalAbsDelta = entries.reduce((sum, row) => sum + Math.abs(row.delta), 0);

  return entries
    .map((row) => ({
      name: row.name,
      previous: round(row.previous, 2),
      current: round(row.current, 2),
      delta: round(row.delta, 2),
      deltaPct: row.previous > 0 ? round(((row.current - row.previous) / row.previous) * 100, 2) : 0,
      contributionPct:
        Math.abs(totalDelta) > 0
          ? round((row.delta / totalDelta) * 100, 2)
          : totalAbsDelta > 0
            ? round((Math.abs(row.delta) / totalAbsDelta) * 100, 2)
            : 0,
    }))
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
    .slice(0, 8);
};

const buildHeatmap = (rows = [], totalCost = 0) =>
  rows.slice(0, 8).map((row) => {
    const pctOfTotal = totalCost > 0 ? (toNumber(row?.totalCost) / totalCost) * 100 : 0;
    const intensityBand = pctOfTotal > 30 ? 5 : pctOfTotal > 20 ? 4 : pctOfTotal > 10 ? 3 : pctOfTotal > 5 ? 2 : 1;
    const riskFlags = [];
    if (String(row?.team || "").toLowerCase().includes("unassigned") && pctOfTotal > 8) {
      riskFlags.push("no_owner");
    }
    if (pctOfTotal > 35) riskFlags.push("concentration");
    return {
      team: String(row?.team || "Unassigned Team"),
      environment: String(row?.environment || "Unspecified"),
      spend: round(row?.totalCost, 2),
      pctOfTotal: round(pctOfTotal, 2),
      intensityBand,
      riskFlags,
    };
  });

const buildExportRows = (rows = [], periodLabel, costBasis, allocationRuleUsed) =>
  rows.map((row) => ({
    team: String(row?.team || "Unassigned Team"),
    product: String(row?.product || "Unmapped Product"),
    environment: String(row?.environment || "Unspecified"),
    directCost: round(row?.directCost, 2),
    sharedCost: round(row?.sharedAllocatedCost, 2),
    totalCost: round(row?.totalCost, 2),
    period: periodLabel,
    costBasis: String(costBasis || "actual"),
    allocationRuleUsed,
  }));

export const buildAllocationUnitEconomicsViewModel = ({
  payload = {},
  period = "last30days",
  costBasis = "actual",
  compareMode = "previous_period",
  unitMetric = "consumed_quantity",
} = {}) => {
  const comparison = payload?.comparison || {};
  const currentWindow = comparison?.currentWindow || {};
  const previousWindow = comparison?.previousWindow || {};
  const deltas = comparison?.deltas || {};
  const allocationOverview = payload?.allocationOverview || {};
  const allocation = payload?.allocation || {};
  const coverage = allocation?.coverage || {};
  const unallocated = payload?.unallocatedInsight || {};
  const unitEconomics = payload?.unitEconomics || {};
  const volatility = payload?.volatility || {};
  const elasticity = payload?.elasticity || {};
  const efficiency = payload?.efficiency || {};
  const margin = payload?.margin || unitEconomics?.margin || {};
  const forecast = payload?.forecast || unitEconomics?.forecast || {};
  const breakEven = payload?.breakEven || unitEconomics?.breakEven || {};
  const benchmarks = payload?.benchmarks || unitEconomics?.benchmarks || {};
  const sharedTransparency = payload?.sharedPoolTransparency || {};
  const denominatorGate = payload?.denominatorGate || {};
  const trust = payload?.trust || {};
  const ownershipDrift = payload?.ownershipDrift || {};
  const unitMetricDefinitions = payload?.unitMetricDefinitions || {};
  const showbackRows = Array.isArray(allocation?.rows) ? allocation.rows : [];
  const teamProductRows = Array.isArray(benchmarks?.teamProduct) ? benchmarks.teamProduct : [];
  const environmentRows = Array.isArray(benchmarks?.environment) ? benchmarks.environment : [];
  const trend = withTrendSignals(payload?.trend || unitEconomics?.trend || [], payload?.previousTrend || unitEconomics?.previousTrend || []);

  const currentStart = parseDateLabel(currentWindow?.startDate);
  const currentEnd = parseDateLabel(currentWindow?.endDate);
  const previousStart = parseDateLabel(previousWindow?.startDate);
  const previousEnd = parseDateLabel(previousWindow?.endDate);
  const comparisonLabel =
    currentStart && currentEnd && previousStart && previousEnd
      ? `${mapCompareLabel(compareMode)}: ${currentStart} - ${currentEnd} vs ${previousStart} - ${previousEnd}`
      : `${mapCompareLabel(compareMode)} comparison`;

  const status = mapKpiStatus(efficiency?.status);
  const elasticityClass = mapElasticityClass(elasticity?.classification);
  const volatilityLevel = String(volatility?.level || "low").toLowerCase();
  const elasticityConfidence =
    trend.length >= 21 && volatilityLevel === "low"
      ? "high"
      : trend.length >= 10 && volatilityLevel !== "high"
        ? "medium"
        : "low";

  const totalCost = toNumber(currentWindow?.totalCost || payload?.kpis?.totalCost);
  const sharedAllocatedCost = toNumber(currentWindow?.sharedCost);
  const sharedRatio = totalCost > 0 ? (sharedAllocatedCost / totalCost) * 100 : 0;

  const riskFlags = Array.isArray(efficiency?.riskFlags)
    ? efficiency.riskFlags.map(mapRiskFlag)
    : [];
  if (String(forecast?.confidence || "").toLowerCase() === "low") {
    riskFlags.push("Low forecast confidence");
  }
  if (sharedRatio > 30) riskFlags.push("High shared allocation dependency");

  const periodLabel = mapPeriodLabel(period);
  const normalizedDecomposition = normalizeDecomposition(
    payload?.decomposition || unitEconomics?.decomposition || {},
  );
  const teamVariance = buildVarianceRows(teamProductRows, "team");
  const productVariance = buildVarianceRows(teamProductRows, "product");

  return {
    kpis: {
      totalCost: round(currentWindow?.totalCost || payload?.kpis?.totalCost, 2),
      previousTotalCost: round(previousWindow?.totalCost, 2),
      directCost: round(currentWindow?.directCost, 2),
      sharedAllocatedCost: round(currentWindow?.sharedCost, 2),
      commitmentBenefit: round(currentWindow?.commitmentBenefit, 2),
      totalQuantity: round(currentWindow?.totalQuantity || payload?.kpis?.totalQuantity, 2),
      previousTotalQuantity: round(previousWindow?.totalQuantity, 2),
      avgUnitPrice: round(currentWindow?.avgUnitPrice || payload?.kpis?.avgUnitPrice, 6),
      previousAvgUnitPrice: round(previousWindow?.avgUnitPrice, 6),
      unitPriceChangePct: round(deltas?.unitCostChangePct || payload?.kpis?.unitPriceChangePct, 2),
      unitPriceDelta: round(deltas?.unitCostDelta, 6),
      status,
      comparisonLabel,
      elasticityScore:
        elasticity?.score === null || elasticity?.score === undefined
          ? null
          : round(elasticity?.score, 4),
      elasticityClass,
      elasticityConfidence,
      volatilityPct: round(volatility?.scorePct, 2),
      volatilityState:
        volatilityLevel === "high" ? "high" : volatilityLevel === "medium" ? "medium" : "low",
      trend,
      efficiencyStatus: mapEfficiencyStatus(status),
      efficiencyInsight: String(efficiency?.rootCause || "No efficiency signal available."),
      costGrowthPct: round(deltas?.costGrowthPct, 2),
      volumeGrowthPct: round(deltas?.volumeGrowthPct, 2),
      decomposition: normalizedDecomposition,
      forecast: {
        projectedCost: round(forecast?.projectedCost, 2),
        projectedVolume: round(forecast?.projectedVolume, 2),
        projectedUnitCost: round(forecast?.projectedUnitCost, 6),
        lowerUnitCost: round(forecast?.lowerUnitCost, 6),
        upperUnitCost: round(forecast?.upperUnitCost, 6),
        confidence:
          String(forecast?.confidence || "").toLowerCase() === "high"
            ? "high"
            : String(forecast?.confidence || "").toLowerCase() === "medium"
              ? "medium"
              : "low",
        method: String(forecast?.method || "moving_average"),
        assumptions: Array.isArray(forecast?.assumptions) ? forecast.assumptions : [],
      },
      target: {
        targetUnitCost:
          breakEven?.targetUnitCost === null || breakEven?.targetUnitCost === undefined
            ? null
            : round(breakEven?.targetUnitCost, 6),
        source:
          breakEven?.targetUnitCost === null || breakEven?.targetUnitCost === undefined
            ? "none"
            : "derived",
        gapValue:
          breakEven?.gapValue === null || breakEven?.gapValue === undefined
            ? null
            : round(breakEven?.gapValue, 6),
        gapPct:
          breakEven?.gapPct === null || breakEven?.gapPct === undefined
            ? null
            : round(breakEven?.gapPct, 2),
        improvementNeededPct:
          breakEven?.improvementNeededPct === null || breakEven?.improvementNeededPct === undefined
            ? null
            : round(breakEven?.improvementNeededPct, 2),
        impliedVolumeAtCurrentCost:
          breakEven?.requiredVolumeAtCurrentCost === null ||
          breakEven?.requiredVolumeAtCurrentCost === undefined
            ? null
            : round(breakEven?.requiredVolumeAtCurrentCost, 2),
      },
      insightPanel: {
        classification: mapEfficiencyClassification(efficiency?.status),
        rootCause: String(efficiency?.rootCause || "No root-cause narrative available."),
        riskFlags: Array.from(new Set(riskFlags)),
        summary: String(efficiency?.rootCause || "No efficiency summary available."),
      },
    },
    allocationOverview: {
      totalCloudCost: round(allocationOverview?.totalCloudCost, 2),
      allocatedPct: round(allocationOverview?.allocatedPct, 2),
      unallocatedPct: round(allocationOverview?.unallocatedPct, 2),
      sharedCostPoolAmount: round(allocationOverview?.sharedCostPoolAmount, 2),
      allocationMethod: String(allocationOverview?.allocationMethod || "direct_spend_weighted"),
      allocationConfidence: {
        score: round(allocationOverview?.allocationConfidence?.score, 2),
        level:
          String(allocationOverview?.allocationConfidence?.level || "").toLowerCase() === "high"
            ? "high"
            : String(allocationOverview?.allocationConfidence?.level || "").toLowerCase() ===
                "medium"
              ? "medium"
              : "low",
        factors: {
          tagCoveragePct: round(allocationOverview?.allocationConfidence?.factors?.tagCoveragePct, 2),
          sharedPoolRatioPct: round(
            allocationOverview?.allocationConfidence?.factors?.sharedPoolRatioPct,
            2,
          ),
          ruleCompletenessPct: round(
            allocationOverview?.allocationConfidence?.factors?.ruleCompletenessPct,
            2,
          ),
          dataConsistencyPct: round(
            allocationOverview?.allocationConfidence?.factors?.dataConsistencyPct,
            2,
          ),
        },
      },
    },
    coverage: {
      team: {
        label: "Allocated to Team",
        valuePct: round(coverage?.teamPct, 2),
        state: getCoverageState(coverage?.teamPct),
      },
      product: {
        label: "Allocated to Product",
        valuePct: round(coverage?.productPct, 2),
        state: getCoverageState(coverage?.productPct),
      },
      owner: {
        label: "Allocated to Owner",
        valuePct: round(coverage?.ownerPct, 2),
        state: getCoverageState(coverage?.ownerPct),
      },
      unallocatedAmount: round(coverage?.unallocatedAmount, 2),
      unallocatedPct: round(coverage?.unallocatedPct, 2),
    },
    sharedPool: {
      total: round(allocation?.sharedPoolTotal, 2),
      ruleApplied: String(allocation?.ruleApplied || "No shared pool detected"),
      redistributedAmount: round(allocation?.redistributedAmount, 2),
      rows: showbackRows,
    },
    sharedPoolTransparency: Array.isArray(sharedTransparency?.rows)
      ? sharedTransparency.rows.map((row) => ({
          sharedCategory: String(row?.sharedCategory || "Shared - Uncategorized"),
          cost: round(row?.cost, 2),
          allocationRule: String(row?.allocationRule || "direct_spend_weighted"),
          weightBasis: String(row?.weightBasis || "direct_cost"),
          distributedAmount: round(row?.distributedAmount, 2),
          rowCount: round(row?.rowCount, 0),
        }))
      : [],
    unallocatedInsight: {
      unallocatedAmount: round(unallocated?.unallocatedAmount, 2),
      unallocatedPct: round(unallocated?.unallocatedPct, 2),
      topContributingServices: Array.isArray(unallocated?.topContributingServices)
        ? unallocated.topContributingServices.map((row) => ({
            service: String(row?.service || "Unknown Service"),
            amount: round(row?.amount, 2),
          }))
        : [],
      tagCoveragePct: round(unallocated?.tagCoveragePct, 2),
      governanceMaturity:
        String(unallocated?.governanceMaturity || "").toLowerCase() === "strong"
          ? "strong"
          : String(unallocated?.governanceMaturity || "").toLowerCase() === "medium"
            ? "medium"
            : "weak",
    },
    showbackRows,
    teamProductUnitRows: teamProductRows,
    environmentUnitRows: environmentRows,
    margin: {
      available: Boolean(margin?.available),
      revenuePerUnit:
        margin?.revenuePerUnit === null || margin?.revenuePerUnit === undefined
          ? null
          : round(margin?.revenuePerUnit, 6),
      costPerUnit:
        margin?.costPerUnit === null || margin?.costPerUnit === undefined
          ? null
          : round(margin?.costPerUnit, 6),
      marginPerUnit:
        margin?.marginPerUnit === null || margin?.marginPerUnit === undefined
          ? null
          : round(margin?.marginPerUnit, 6),
      marginTrendPct:
        margin?.marginTrendPct === null || margin?.marginTrendPct === undefined
          ? null
          : round(margin?.marginTrendPct, 2),
    },
    teamVariance,
    productVariance,
    heatmap: buildHeatmap(showbackRows, totalCost),
    exportRows: buildExportRows(
      showbackRows,
      periodLabel,
      String(costBasis || "actual"),
      String(allocation?.ruleApplied || "No shared pool detected"),
    ),
    denominatorGate: {
      status: String(denominatorGate?.status || "fail").toLowerCase(),
      reasons: Array.isArray(denominatorGate?.reasons) ? denominatorGate.reasons.map((item) => String(item)) : [],
      metric: String(denominatorGate?.metric || unitMetricDefinitions?.selectedMetric || unitMetric || "consumed_quantity"),
      quantityCoveragePct: round(denominatorGate?.quantity_coverage_pct, 2),
    },
    trust: {
      dataFreshnessTs: trust?.data_freshness_ts || null,
      coveragePct: round(trust?.coverage_pct, 2),
      confidenceLevel: String(trust?.confidence_level || "low").toLowerCase(),
    },
    ownershipDrift: {
      series: Array.isArray(ownershipDrift?.series)
        ? ownershipDrift.series.map((row) => ({
            period: String(row?.period || ""),
            driftEvents: round(row?.drift_events, 0),
            impactedCost: round(row?.impacted_cost, 2),
            driftRatePct: round(row?.drift_rate_pct, 2),
          }))
        : [],
      flags: Array.isArray(ownershipDrift?.flags)
        ? ownershipDrift.flags.map((flag) => ({
            type: String(flag?.type || "integrity"),
            severity: String(flag?.severity || "low").toLowerCase(),
            team: String(flag?.team || "Unknown Team"),
            detail: String(flag?.detail || "No details available."),
          }))
        : [],
    },
    unitMetricDefinitions: {
      selectedMetric: String(unitMetricDefinitions?.selectedMetric || unitMetric || "consumed_quantity"),
      availableMetrics: Array.isArray(unitMetricDefinitions?.availableMetrics)
        ? unitMetricDefinitions.availableMetrics.map((metric) => ({
            key: String(metric?.key || "consumed_quantity"),
            label: String(metric?.label || "Consumed Quantity"),
          }))
        : [{ key: "consumed_quantity", label: "Consumed Quantity" }],
    },
    periodLabel,
    notes: [
      String(payload?.integrity?.aggregationIntegrity?.valid)
        ? "Allocation totals reconcile with scoped spend."
        : "Allocation reconciliation gap detected. Validate row-level mapping.",
      toNumber(allocation?.sharedPoolTotal) > 0
        ? "Shared pool redistributed by direct-cost weight for current scope."
        : "Shared pool is zero for selected scope.",
      "Unit economics metrics are computed on final allocated cost only.",
    ],
  };
};

