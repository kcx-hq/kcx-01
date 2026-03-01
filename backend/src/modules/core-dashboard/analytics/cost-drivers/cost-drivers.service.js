import { costGrowthRate, roundTo } from '../../../../common/utils/cost.calculations.js';
import { costDriversRepository } from './cost-drivers.repository.js';

/**
 * Calculate cost drivers from time series data
 * This is a lightweight version that works with already-fetched time series data
 * @param {Array} timeSeriesResult - Array of { date, cost, groupId } objects
 * @param {Object} nameMap - Map of groupId to display names
 * @returns {Object} Driver analysis data
 */
export function calculateCostDrivers(timeSeriesResult, nameMap) {
  if (!timeSeriesResult || timeSeriesResult.length === 0) {
    return {
      overallStats: {
        totalCurr: 0,
        totalPrev: 0,
        diff: 0,
        pct: 0,
        totalIncreases: 0,
        totalDecreases: 0
      },
      dynamics: {
        newSpend: 0,
        expansion: 0,
        deleted: 0,
        optimization: 0
      },
      increases: [],
      decreases: []
    };
  }

  // Group by groupId and calculate current vs previous period
  const groups = {};
  const dates = [...new Set(timeSeriesResult.map(r => r.date))].sort();

  if (dates.length === 0) {
    return {
      overallStats: {},
      dynamics: {},
      increases: [],
      decreases: []
    };
  }

  // Split into current and previous periods (roughly half)
  const midPoint = Math.floor(dates.length / 2);
  const prevDates = new Set(dates.slice(0, midPoint));
  const currDates = new Set(dates.slice(midPoint));

  timeSeriesResult.forEach(row => {
    const groupId = String(row.groupId || 'unknown');
    const cost = parseFloat(row.cost || 0);
    const date = row.date;

    if (!groups[groupId]) {
      groups[groupId] = {
        id: groupId,
        name: nameMap[groupId] || `Unknown (${groupId})`,
        curr: 0,
        prev: 0,
        rows: []
      };
    }

    if (currDates.has(date)) {
      groups[groupId].curr += cost;
    } else if (prevDates.has(date)) {
      groups[groupId].prev += cost;
    }

    groups[groupId].rows.push({ ...row, cost });
  });

  // Calculate differences
  const allResults = Object.values(groups).map(group => ({
    name: group.name,
    id: group.id,
    curr: group.curr,
    prev: group.prev,
    diff: group.curr - group.prev,
    pct:
      group.prev === 0
        ? (group.curr > 0 ? Infinity : 0)
        : ((group.curr - group.prev) / group.prev) * 100,
    isNew: group.prev === 0 && group.curr > 0,
    isDeleted: group.curr === 0 && group.prev > 0,
    rows: group.rows
  }));

  // Separate increases and decreases
  const increases = allResults
    .filter(r => r.diff > 0)
    .sort((a, b) => b.diff - a.diff)
    .slice(0, 10);

  const decreases = allResults
    .filter(r => r.diff < 0)
    .sort((a, b) => a.diff - b.diff)
    .slice(0, 10);

  // Calculate totals
  const totalCurr = allResults.reduce((sum, r) => sum + r.curr, 0);
  const totalPrev = allResults.reduce((sum, r) => sum + r.prev, 0);
  const totalDiff = totalCurr - totalPrev;

  // Calculate dynamics
  const dynamics = {
    newSpend: allResults.filter(r => r.isNew).reduce((sum, r) => sum + r.diff, 0),
    expansion: allResults.filter(r => !r.isNew && r.diff > 0).reduce((sum, r) => sum + r.diff, 0),
    deleted: allResults.filter(r => r.isDeleted).reduce((sum, r) => sum + Math.abs(r.diff), 0),
    optimization: allResults.filter(r => !r.isDeleted && r.diff < 0).reduce((sum, r) => sum + Math.abs(r.diff), 0)
  };

  return {
    score: normalizedScore,
    level,
    rules,
    signals: {
      quantityCoveragePercent: roundTo(quantityCoveragePercent, 2),
      modelResidualPercentOfNet: roundTo(modelResidualPercentOfNet, 2),
      missingTagSpendPercent: roundTo(missingTagSpendPercent, 2),
      skuMappingCoveragePercent: roundTo(skuMappingCoveragePercent, 2),
      periodDataCompletenessPercent: roundTo(periodDataCompletenessPercent, 2),
      providerCount,
      topProviderCurrentSharePercent: roundTo(topProviderCurrentSharePercent, 2),
      mixedProviderScope: providerCount > 1,
    },
  };
};

const buildRunMeta = ({
  uploadIds = [],
  filters = {},
  controls = {},
  prepared = {},
  model = {},
  rowLimit = DEF_ROW_LIMIT,
}) => {
  const filterScope = {
    provider: filters.provider || 'All',
    service: filters.service || 'All',
    region: filters.region || 'All',
    account: filters.account || 'All',
    team: filters.team || 'All',
    app: filters.app || 'All',
    env: filters.env || 'All',
    costCategory: filters.costCategory || 'All',
  };

  const signatureInput = {
    uploadIds: [...uploadIds].sort(),
    controls: {
      timeRange: controls.timeRange || DEF_RANGE,
      compareTo: controls.compareTo || DEF_COMPARE,
      costBasis: controls.costBasis || DEF_BASIS,
      startDate: controls.startDate || null,
      endDate: controls.endDate || null,
      previousStartDate: controls.previousStartDate || null,
      previousEndDate: controls.previousEndDate || null,
    },
    filterScope,
    rawRowCount: toNumber(prepared.rawRowCount, 0),
    scopedRowCount: toNumber(prepared.scopedRowCount, 0),
    rowsInWindow: toNumber(model.modelMeta?.rowsInWindows, 0),
    currentDays: Array.isArray(prepared.currentDayKeys) ? prepared.currentDayKeys : [],
    previousDays: Array.isArray(prepared.previousDayKeys) ? prepared.previousDayKeys : [],
    totals: {
      current: toNumber(model.varianceSummary?.currentPeriodSpend, 0),
      previous: toNumber(model.varianceSummary?.previousPeriodSpend, 0),
      net: toNumber(model.varianceSummary?.netChange, 0),
    },
  };

  const sourceSignature = createHash('sha1')
    .update(JSON.stringify(signatureInput))
    .digest('hex');
  const runId = `cdr_${sourceSignature.slice(0, 12)}_${Date.now().toString(36)}`;

  return {
    runId,
    generatedAt: new Date().toISOString(),
    engineVersion: MODEL_VERSION,
    sourceSignature,
    rowLimitApplied: rowLimit,
    uploadCount: uploadIds.length,
    uploadIds,
    rawRowCount: toNumber(prepared.rawRowCount, 0),
    scopedRowCount: toNumber(prepared.scopedRowCount, 0),
    rowsInWindow: toNumber(model.modelMeta?.rowsInWindows, 0),
    rowsExcludedFuture: toNumber(model.modelMeta?.futureRowsExcluded, 0),
    creditRowsInWindow: toNumber(model.modelMeta?.creditRowsInWindows, 0),
    nonCreditRowsInWindow: toNumber(model.modelMeta?.nonCreditRowsInWindows, 0),
    dayCoverage: {
      availableDays: toNumber(prepared.dayKeys?.length, 0),
      currentDays: toNumber(prepared.currentDayKeys?.length, 0),
      previousDays: toNumber(prepared.previousDayKeys?.length, 0),
      firstBillingDate: prepared.dayKeys?.[0] || null,
      latestBillingDate: prepared.dayKeys?.[prepared.dayKeys.length - 1] || null,
    },
    filterScope,
  };
};

const formatContribution = (value, total) => {
  const denominator = Math.abs(toNumber(total, 0));
  if (!denominator) return 0;
  return (toNumber(value, 0) / denominator) * 100;
};

const stableSortByAbsDeltaDesc = (a, b) => {
  const diff = Math.abs(toNumber(b.deltaValue, 0)) - Math.abs(toNumber(a.deltaValue, 0));
  if (diff !== 0) return diff;
  return String(a.key || a.name || '').localeCompare(String(b.key || b.name || ''));
};

const getDominantDriverType = (row) => {
  const prev = toNumber(row.previousSpend, 0);
  const curr = toNumber(row.currentSpend, 0);
  if (prev === 0 && curr > 0) return DRIVER_LABELS.newServicesResources;
  if (curr === 0 && prev > 0) return DRIVER_LABELS.savingsRemovals;

  const weights = [
    ['newServicesResources', Math.abs(toNumber(row.driverBreakdown?.newServicesResources, 0))],
    ['usageGrowth', Math.abs(toNumber(row.driverBreakdown?.usageGrowth, 0))],
    ['ratePriceChange', Math.abs(toNumber(row.driverBreakdown?.ratePriceChange, 0))],
    ['mixShift', Math.abs(toNumber(row.driverBreakdown?.mixShift, 0))],
    ['creditsDiscountChange', Math.abs(toNumber(row.driverBreakdown?.creditsDiscountChange, 0))],
    ['savingsRemovals', Math.abs(toNumber(row.driverBreakdown?.savingsRemovals, 0))],
  ];

  weights.sort((a, b) => b[1] - a[1]);
  const top = weights[0]?.[0] || 'mixShift';
  return DRIVER_LABELS[top] || DRIVER_LABELS.mixShift;
};

const rowRiskLevel = (row, netChangeAbs) => {
  const score = toNumber(row.contributionScore, 0);
  const unexplained = Math.abs(toNumber(row.unexplainedContribution, 0));
  const unexplainedPct = netChangeAbs > 0 ? (unexplained / netChangeAbs) * 100 : 0;
  if (score >= 25 || unexplainedPct >= 10) return 'high';
  if (score >= 10 || unexplainedPct >= 5) return 'medium';
  return 'low';
};

const getWaterfallStepConfidence = ({
  stepId,
  value,
  quantityCoveragePercent,
  modelResidualPercentOfNet,
  currencyConsistent,
}) => {
  const absValue = Math.abs(toNumber(value, 0));
  if (absValue <= 0.01) return 'high';

  if (stepId === 'unexplainedVariance' || stepId === 'roundingResidual') {
    if (modelResidualPercentOfNet > 5) return 'low';
    if (modelResidualPercentOfNet > 2) return 'medium';
    return 'high';
  }

  if (stepId === 'usageGrowth' || stepId === 'ratePriceChange') {
    if (!currencyConsistent && stepId === 'ratePriceChange') return 'low';
    if (quantityCoveragePercent < 40) return 'low';
    if (quantityCoveragePercent < 70) return 'medium';
    return 'high';
  }

  return 'high';
};

const buildModel = ({
  rows,
  currentDaySet,
  previousDaySet,
  currentDayKeys = [],
  previousDayKeys = [],
  basis,
  minChange,
  rowLimit,
}) => {
  const lineMap = new Map();
  const dimensionTotals = {
    service: new Map(),
    account: new Map(),
    region: new Map(),
    team: new Map(),
    sku: new Map(),
  };
  const dimensionCategories = {
    service: new Map(),
    account: new Map(),
    region: new Map(),
    team: new Map(),
    sku: new Map(),
  };
  const creditDimensionBuckets = {
    service: new Map(),
    account: new Map(),
    region: new Map(),
    team: new Map(),
    sku: new Map(),
  };
  const providerTotals = new Map();

  const dayTotalsCurrent = new Map();
  const dayTotalsPrevious = new Map();
  const dailyServiceCurrent = new Map();
  const dailyServicePrevious = new Map();
  const currencies = new Set();

  let totalCurrentSpend = 0;
  let totalPreviousSpend = 0;
  let unmappedTeamCurrentSpend = 0;
  let missingSkuCurrentSpend = 0;
  let futureRowsExcluded = 0;
  let rowsInWindows = 0;
  let creditRowsInWindows = 0;
  let nonCreditRowsInWindows = 0;
  let nonCreditAbsoluteDeltaTotal = 0;
  let quantityEligibleAbsoluteDeltaTotal = 0;

  const today = dateKey(new Date());

  const ensureDimensionTotal = (dimensionKey, value) =>
    ensureMapEntry(dimensionTotals[dimensionKey], value, () => ({ previousSpend: 0, currentSpend: 0 }));

  const ensureDimensionCategory = (dimensionKey, value) =>
    ensureMapEntry(dimensionCategories[dimensionKey], value, createCategoryBucket);

  const ensureCreditDimension = (dimensionKey, value) =>
    ensureMapEntry(creditDimensionBuckets[dimensionKey], value, () => ({ previousSpend: 0, currentSpend: 0 }));

  const addDailyServiceCost = (bucketMap, day, service, amount) => {
    const dayBucket = ensureMapEntry(bucketMap, day, () => new Map());
    dayBucket.set(service, (dayBucket.get(service) || 0) + amount);
  };

  for (const row of rows) {
    const day = dateKey(row?.chargeperiodstart || row?.ChargePeriodStart);
    if (!day) continue;
    if (today && compareDayKeys(day, today) > 0) {
      futureRowsExcluded += 1;
      continue;
    }

    const inCurrent = currentDaySet.has(day);
    const inPrevious = previousDaySet.has(day);
    if (!inCurrent && !inPrevious) continue;
    rowsInWindows += 1;

    const d = getDims(row);
    const cost = rowCostByBasis(row, basis);
    const qty = toNumber(row?.consumedquantity || row?.ConsumedQuantity, 0);
    const currency = row?.billingcurrency || row?.BillingCurrency || row?.currency || 'USD';
    if (currency) currencies.add(String(currency).toUpperCase());

    if (inCurrent) {
      totalCurrentSpend += cost;
      dayTotalsCurrent.set(day, (dayTotalsCurrent.get(day) || 0) + cost);
      addDailyServiceCost(dailyServiceCurrent, day, d.service, cost);
      if (d.team === 'Unmapped Team') unmappedTeamCurrentSpend += cost;
      if (d.sku === 'Unknown SKU') missingSkuCurrentSpend += cost;
    }
    if (inPrevious) {
      totalPreviousSpend += cost;
      dayTotalsPrevious.set(day, (dayTotalsPrevious.get(day) || 0) + cost);
      addDailyServiceCost(dailyServicePrevious, day, d.service, cost);
    }

    const providerEntry = ensureMapEntry(providerTotals, d.provider, () => ({ previousSpend: 0, currentSpend: 0 }));
    if (inCurrent) providerEntry.currentSpend += cost;
    if (inPrevious) providerEntry.previousSpend += cost;

    for (const key of DIMENSION_KEYS) {
      const totalEntry = ensureDimensionTotal(key, d[key]);
      if (inCurrent) totalEntry.currentSpend += cost;
      if (inPrevious) totalEntry.previousSpend += cost;
    }

    if (isCreditLikeRow(row)) {
      creditRowsInWindows += 1;
      for (const key of DIMENSION_KEYS) {
        const creditEntry = ensureCreditDimension(key, d[key]);
        if (inCurrent) creditEntry.currentSpend += cost;
        if (inPrevious) creditEntry.previousSpend += cost;
      }
      continue;
    }
    nonCreditRowsInWindows += 1;

    const token = `${d.service}||::||${d.account}||::||${d.region}||::||${d.team}||::||${d.sku}||::||${d.resource}`;
    const line = ensureMapEntry(lineMap, token, () => ({
      token,
      dims: d,
      currentSpend: 0,
      previousSpend: 0,
      currentQty: 0,
      previousQty: 0,
    }));

    if (inCurrent) {
      line.currentSpend += cost;
      line.currentQty += qty;
    }
    if (inPrevious) {
      line.previousSpend += cost;
      line.previousQty += qty;
    }
  }

  const globalBreakdown = createCategoryBucket();

  for (const line of lineMap.values()) {
    const prev = line.previousSpend;
    const curr = line.currentSpend;
    const delta = curr - prev;
    const absDelta = Math.abs(delta);
    nonCreditAbsoluteDeltaTotal += absDelta;

    let usageContribution = 0;
    let rateContribution = 0;
    let mixContribution = 0;
    let newContribution = 0;
    let removalContribution = 0;

    if (prev === 0 && curr > 0) {
      newContribution = delta;
    } else if (curr === 0 && prev > 0) {
      removalContribution = delta;
    } else if (prev > 0 || curr > 0) {
      const prevQty = line.previousQty;
      const currQty = line.currentQty;
      if (prevQty > 0 && currQty > 0) {
        quantityEligibleAbsoluteDeltaTotal += absDelta;
        const prevRate = prev / prevQty;
        const currRate = curr / currQty;
        usageContribution = (currQty - prevQty) * prevRate;
        rateContribution = (currRate - prevRate) * currQty;
        mixContribution = delta - usageContribution - rateContribution;
      } else {
        mixContribution = delta;
      }
    }

    addCategoryValue(globalBreakdown, 'newServicesResources', newContribution);
    addCategoryValue(globalBreakdown, 'usageGrowth', usageContribution);
    addCategoryValue(globalBreakdown, 'ratePriceChange', rateContribution);
    addCategoryValue(globalBreakdown, 'mixShift', mixContribution);
    addCategoryValue(globalBreakdown, 'savingsRemovals', removalContribution);

    for (const key of DIMENSION_KEYS) {
      const value = line.dims[key];
      const bucket = ensureDimensionCategory(key, value);
      addCategoryValue(bucket, 'newServicesResources', newContribution);
      addCategoryValue(bucket, 'usageGrowth', usageContribution);
      addCategoryValue(bucket, 'ratePriceChange', rateContribution);
      addCategoryValue(bucket, 'mixShift', mixContribution);
      addCategoryValue(bucket, 'savingsRemovals', removalContribution);
    }
  }

  for (const key of DIMENSION_KEYS) {
    for (const [value, pair] of creditDimensionBuckets[key].entries()) {
      const delta = pair.currentSpend - pair.previousSpend;
      addCategoryValue(globalBreakdown, 'creditsDiscountChange', delta);
      const bucket = ensureDimensionCategory(key, value);
      addCategoryValue(bucket, 'creditsDiscountChange', delta);
    }
  }

  const netChange = totalCurrentSpend - totalPreviousSpend;
  const explainedWithoutUnexplained = sumDriverCategories(globalBreakdown);
  const unexplainedVariance = netChange - explainedWithoutUnexplained;

  const netChangeAbs = Math.abs(netChange);
  const explainedPercent =
    netChangeAbs > 0
      ? Math.max(0, 100 - (Math.abs(unexplainedVariance) / netChangeAbs) * 100)
      : Math.abs(unexplainedVariance) < 0.01
        ? 100
        : 0;

  const noiseThreshold = Math.max(toNumber(minChange, 0), roundTo(netChangeAbs * 0.005, 2), 0.01);

  const buildRowsForDimension = (dimensionKey) => {
    const rowsOut = [];
    let totalCandidates = 0;
    let omittedByThreshold = 0;

    for (const [value, totals] of dimensionTotals[dimensionKey].entries()) {
      totalCandidates += 1;
      const previousSpend = totals.previousSpend;
      const currentSpend = totals.currentSpend;
      const deltaValue = currentSpend - previousSpend;
      if (Math.abs(deltaValue) < noiseThreshold) {
        omittedByThreshold += 1;
        continue;
      }

      const category = dimensionCategories[dimensionKey].get(value) || createCategoryBucket();
      const explained = sumDriverCategories(category);
      const unexplainedContribution = deltaValue - explained;
      const isNewSpend = previousSpend === 0 && currentSpend > 0;
      const isRemovedSpend = currentSpend === 0 && previousSpend > 0;
      const deltaPercent = roundTo(pct(currentSpend, previousSpend), 2);
      const deltaPercentDisplay = isNewSpend
        ? 'NEW'
        : isRemovedSpend
          ? 'REMOVED'
          : `${Number(deltaPercent).toFixed(2)}%`;

      const row = {
        key: value,
        name: value,
        previousSpend: roundTo(previousSpend, 2),
        currentSpend: roundTo(currentSpend, 2),
        deltaValue: roundTo(deltaValue, 2),
        deltaPercent,
        deltaPercentDisplay,
        isNewSpend,
        isRemovedSpend,
        contributionPercent: roundTo(formatContribution(deltaValue, netChange), 2),
        contributionScore: roundTo(Math.abs(formatContribution(deltaValue, netChange)), 2),
        driverBreakdown: {
          newServicesResources: roundTo(category.newServicesResources, 2),
          usageGrowth: roundTo(category.usageGrowth, 2),
          ratePriceChange: roundTo(category.ratePriceChange, 2),
          mixShift: roundTo(category.mixShift, 2),
          creditsDiscountChange: roundTo(category.creditsDiscountChange, 2),
          savingsRemovals: roundTo(category.savingsRemovals, 2),
        },
        unexplainedContribution: roundTo(unexplainedContribution, 2),
        driverType: DRIVER_LABELS.mixShift,
        riskLevel: 'low',
        evidencePayload: {
          dimension: dimensionKey,
          driverKey: value,
        },
      };

      row.driverType = getDominantDriverType(row);
      row.riskLevel = rowRiskLevel(row, netChangeAbs);
      rowsOut.push(row);
    }
  }
  return `Review the "${topOp}" operation usage. This represents the largest portion of the cost change.`;
}

/**
 * Analyze cost drivers and return fully computed, UI-ready data
 */
export const costDriversService = {
  /**
   * Get cost drivers analysis
   *
   * ✅ Update: uploadIds is now request-driven (same approach as cost analysis)
   * - If caller passes uploadIds, we use them
   * - Else if caller passes filters.uploadId, we convert to uploadIds=[uploadId]
   * - Logic/calculations remain unchanged
   */
  async getCostDrivers(options = {}) {
    try {
      const {
        filters = {},
        period = 30,
        dimension = 'ServiceName', // Default dimension - can be extended in future
        minChange = 0,
        activeServiceFilter = 'All', // NOTE: This is now client-side only, kept for backward compatibility
        uploadIds = []
      } = options;

      // ✅ same approach as cost analysis: allow a single uploadId to drive isolation
      const effectiveUploadIds =
        uploadIds && uploadIds.length > 0
          ? uploadIds
          : (filters.uploadId ? [filters.uploadId] : []);

      // Fetch raw billing facts
      const rawData = await costDriversRepository.getBillingFactsForDrivers({
        filters,
        period,
        uploadIds: effectiveUploadIds
      });

      if (!rawData || rawData.length === 0) {
        return {
          increases: [],
          decreases: [],
          overallStats: {
            totalCurr: 0,
            totalPrev: 0,
            diff: 0,
            pct: 0,
            totalIncreases: 0,
            totalDecreases: 0
          },
          dynamics: {
            newSpend: 0,
            expansion: 0,
            deleted: 0,
            optimization: 0
          },
          periods: {
            current: null,
            prev: null,
            max: null
          },
          availableServices: []
        };
      }

      // Clean and process data
      const cleanData = rawData
        .map(d => {
          let date = null;
          if (d.ChargePeriodStart) {
            date = new Date(d.ChargePeriodStart);
            // Check if date is valid
            if (isNaN(date.getTime())) {
              date = null;
            }
          }
          return {
            ...d,
            cost: parseFloat(d.BilledCost) || 0,
            date: date
          };
        })
        .filter(d => d.date !== null && !isNaN(d.date.getTime()));

      if (cleanData.length === 0) {
        return {
          increases: [],
          decreases: [],
          overallStats: {},
          dynamics: {},
          periods: {},
          availableServices: []
        };
      }

      // Calculate date ranges - use max date as end of current period
      const maxDate = new Date(Math.max(...cleanData.map(d => d.date.getTime())));
      const cutoffCurrent = new Date(maxDate);
      cutoffCurrent.setDate(cutoffCurrent.getDate() - period);
      const cutoffPrev = new Date(cutoffCurrent);
      cutoffPrev.setDate(cutoffPrev.getDate() - period);

      // Ensure dates are valid
      if (isNaN(cutoffCurrent.getTime()) || isNaN(cutoffPrev.getTime())) {
        console.error('[Cost Drivers] Invalid date calculation');
        return {
          increases: [],
          decreases: [],
          overallStats: {},
          dynamics: {},
          periods: {}
        };
      }

      // Group data by dimension
      const groups = {};
      let totalCurr = 0;
      let totalPrev = 0;

      cleanData.forEach(row => {
        // NOTE: activeServiceFilter is now handled client-side only for instant filtering
        // Server-side filtering removed to improve performance and responsiveness

        // Skip dates outside our period range (older than cutoffPrev)
        if (row.date <= cutoffPrev) return;

        const key = row[dimension] || 'Unknown';
        if (!groups[key]) {
          groups[key] = { curr: 0, prev: 0, rows: [] };
        }

        const dateStr = row.date.toISOString().split('T')[0];

        if (row.date > cutoffCurrent) {
          groups[key].curr += row.cost;
          groups[key].rows.push({
            ...row,
            period: 'curr',
            dateStr: dateStr,
            cost: row.cost
          });
          totalCurr += row.cost;
        } else if (row.date > cutoffPrev) {
          groups[key].prev += row.cost;
          groups[key].rows.push({
            ...row,
            period: 'prev',
            dateStr: dateStr,
            cost: row.cost
          });
          totalPrev += row.cost;
        }
      });

      // Calculate differences and percentages
      const allResults = Object.entries(groups)
        .map(([name, stats]) => ({
          name,
          id: name, // Add id for frontend compatibility
          curr: stats.curr,
          prev: stats.prev,
          rows: stats.rows,
          diff: stats.curr - stats.prev,
          pct:
            stats.prev === 0
              ? (stats.curr > 0 ? Infinity : 0)
              : ((stats.curr - stats.prev) / stats.prev) * 100,
          isNew: stats.prev === 0 && stats.curr > 0,
          isDeleted: stats.curr === 0 && stats.prev > 0
        }))
        .filter(item => Math.abs(item.diff) >= minChange);

      // Separate increases and decreases, sort by absolute difference
      const increases = allResults
        .filter(r => r.diff > 0)
        .sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff));

      const decreases = allResults
        .filter(r => r.diff < 0)
        .sort((a, b) => Math.abs(a.diff) - Math.abs(b.diff));

      // Calculate dynamics
      const dynamics = {
        newSpend: allResults.filter(r => r.isNew).reduce((a, b) => a + b.diff, 0),
        expansion: allResults.filter(r => !r.isNew && r.diff > 0).reduce((a, b) => a + b.diff, 0),
        deleted: allResults.filter(r => r.isDeleted).reduce((a, b) => a + b.diff, 0),
        optimization: allResults.filter(r => !r.isDeleted && r.diff < 0).reduce((a, b) => a + b.diff, 0)
      };

      // Overall stats
      const overallStats = {
        totalCurr,
        totalPrev,
        diff: totalCurr - totalPrev,
        pct: totalPrev ? ((totalCurr - totalPrev) / totalPrev) * 100 : 0,
        totalIncreases: increases.reduce((a, i) => a + i.diff, 0),
        totalDecreases: decreases.reduce((a, i) => a + i.diff, 0)
      };

      // Extract unique services from the data for filter options
      const availableServices = [...new Set(cleanData.map(d => d.ServiceName).filter(Boolean))].sort();

      return {
        increases,
        decreases,
        overallStats,
        dynamics,
        periods: {
          current: cutoffCurrent.toISOString(),
          prev: cutoffPrev.toISOString(),
          max: maxDate.toISOString()
        },
        availableServices // Add available services for frontend filter
      };
    } catch (error) {
      console.error('Error in driversService.getCostDrivers:', error.message);
      throw error;
    }
  },
  async getDriverDetails(options = {}) {
    const { driver, period = 30, uploadIds = [] } = options;

    if (!driver || !driver.rows) {
      return {
        schemaVersion: CONTRACT_VERSION,
        summary: null,
        trend: [],
        resourceBreakdown: [],
        topSkuChanges: [],
        trendData: [],
        subDrivers: [],
        topResources: [],
        annualizedImpact: 0,
        insightText: ''
      };
    }

    // Calculate daily trend
    const dailyTrend = {};
    driver.rows.forEach(r => {
      if (r.dateStr) {
        dailyTrend[r.dateStr] = (dailyTrend[r.dateStr] || 0) + (r.cost || 0);
      }
    });

    const trendData = Object.entries(dailyTrend)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, val]) => ({
        date: date.slice(5), // Remove year for display
        val: parseFloat(val || 0)
      }));

    // Calculate operations breakdown
    const operationsMap = {};
    driver.rows.filter(r => r.period === 'curr').forEach(r => {
      let op = r.UsageType || r.Operation || r.ItemDescription || r.ServiceName || 'General Usage';
      if (op.length > 40) op = op.substring(0, 37) + '...';
      operationsMap[op] = (operationsMap[op] || 0) + (r.cost || 0);
    });

    const subDrivers = Object.entries(operationsMap)
      .map(([name, value]) => ({ name, value: parseFloat(value || 0) }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    // Calculate top resources
    const resourceMap = {};
    driver.rows.filter(r => r.period === 'curr').forEach(r => {
      const uniqueKey = r.ResourceId || r.ResourceName || 'Unknown';
      if (!resourceMap[uniqueKey]) {
        resourceMap[uniqueKey] = {
          id: uniqueKey,
          cost: 0,
          displayName: r.ResourceName || r.ResourceId || r.ItemDescription || 'Unknown Resource'
        };
      }
      resourceMap[uniqueKey].cost += (r.cost || 0);
    });

    const topSkuChanges = [...skuMap.values()]
      .map((entry) => {
        const deltaValue = entry.currentSpend - entry.previousSpend;
        return {
          ...entry,
          previousSpend: roundTo(entry.previousSpend, 2),
          currentSpend: roundTo(entry.currentSpend, 2),
          deltaValue: roundTo(deltaValue, 2),
          deltaPercent: roundTo(pct(entry.currentSpend, entry.previousSpend), 2),
        };
      })
      .sort(stableSortByAbsDeltaDesc)
      .slice(0, 20);

    // Calculate annualized impact based on actual period
    const annualizedImpact = driver.diff * (365 / period);

    // Generate insight
    const insightText = getSmartInsight(driver.name, subDrivers);

    return {
      schemaVersion: CONTRACT_VERSION,
      summary,
      trend,
      resourceBreakdown,
      topSkuChanges,
      ...legacy,
      links,
      actionPayload,
      context: {
        schemaVersion: CONTRACT_VERSION,
        controls,
        unexplainedVariance: model.unexplainedVariance,
      },
    };
  },
};
