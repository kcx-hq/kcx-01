import { costGrowthRate, roundTo } from '../../../../common/utils/cost.calculations.js';
import { costDriversRepository } from './cost-drivers.repository.js';
import { createHash } from 'crypto';
import logger from "../../../../lib/logger.js";

const DEF_RANGE = '30d';
const DEF_COMPARE = 'previous_period';
const DEF_BASIS = 'actual';
const DEF_DIMENSION = 'service';
const DEF_ROW_LIMIT = 100;
const MAX_ROW_LIMIT = 500;
const DAY_MS = 86400000;
const UNEXPLAINED_WARN_THRESHOLD_PERCENT = 5;
const TOP_EXECUTIVE_ROWS = 5;
const MODEL_VERSION = 'cost_drivers_v2.1';
const CONTRACT_VERSION = 'cost_drivers_contract_v1';

const DEFAULT_FILTERS = {
  provider: 'All',
  service: 'All',
  region: 'All',
  account: 'All',
  subAccount: 'All',
  team: 'All',
  app: 'All',
  env: 'All',
  costCategory: 'All',
  tagKey: '',
  tagValue: '',
};

const DRIVER_LABELS = {
  newServicesResources: 'New Services / Resources',
  usageGrowth: 'Usage Growth',
  ratePriceChange: 'Rate / Price Change',
  mixShift: 'Mix Shift',
  creditsDiscountChange: 'Credits / Discount Change',
  savingsRemovals: 'Savings / Removals',
  unexplainedVariance: 'Unexplained Variance',
};

const DRIVER_TYPES = {
  newServicesResources: 'new_services_resources',
  usageGrowth: 'usage_growth',
  ratePriceChange: 'rate_price_change',
  mixShift: 'mix_shift',
  creditsDiscountChange: 'credits_discount_change',
  savingsRemovals: 'savings_removals',
  unexplainedVariance: 'unexplained_variance',
  roundingResidual: 'rounding_residual',
};

const DRIVER_ORDER = [
  'newServicesResources',
  'usageGrowth',
  'ratePriceChange',
  'mixShift',
  'creditsDiscountChange',
  'savingsRemovals',
];

const DIMENSION_META = {
  service: { key: 'service', legacy: 'ServiceName', title: 'Service' },
  account: { key: 'account', legacy: 'Account', title: 'Account' },
  region: { key: 'region', legacy: 'RegionName', title: 'Region' },
  team: { key: 'team', legacy: 'Team', title: 'Team' },
  sku: { key: 'sku', legacy: 'SkuId', title: 'SKU' },
};
const DIMENSION_KEYS = Object.keys(DIMENSION_META);

const PRIORITY = { high: 0, medium: 1, low: 2 };

const toNumber = (value, fallback = 0) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

const normalizeMatchKey = (value) => String(value ?? '').trim().toLowerCase();

const asDate = (value) => {
  const d = value ? new Date(value) : null;
  return d && !Number.isNaN(d.getTime()) ? d : null;
};

const dateKey = (value) => {
  const d = asDate(value);
  return d ? d.toISOString().slice(0, 10) : null;
};

const compareDayKeys = (a, b) => {
  if (a === b) return 0;
  return a > b ? 1 : -1;
};

const shiftMonths = (value, months) => {
  const d = asDate(value);
  if (!d) return null;
  const out = new Date(d);
  out.setMonth(out.getMonth() + months);
  return out;
};

const normalizeUploadIds = (input = {}) => {
  if (Array.isArray(input.uploadIds)) return input.uploadIds.map(String).map((x) => x.trim()).filter(Boolean);
  if (Array.isArray(input.uploadid)) return input.uploadid.map(String).map((x) => x.trim()).filter(Boolean);
  if (input.uploadIds) return String(input.uploadIds).split(',').map((x) => x.trim()).filter(Boolean);
  if (input.uploadid) return String(input.uploadid).split(',').map((x) => x.trim()).filter(Boolean);
  if (input.uploadId) return String(input.uploadId).split(',').map((x) => x.trim()).filter(Boolean);
  return [];
};

const normalizeTimeRange = (timeRange, period) => {
  if (typeof timeRange === 'string' && timeRange.trim()) {
    const r = timeRange.trim().toLowerCase();
    if (/^\d+d$/.test(r) || ['mtd', 'qtd', 'custom'].includes(r)) return r;
  }
  const p = toNumber(period, 30);
  if (p > 0) return `${Math.round(p)}d`;
  return DEF_RANGE;
};

const normalizeCompareTo = (value) => {
  const v = String(value || DEF_COMPARE).toLowerCase();
  if (['previous_period', 'same_period_last_month', 'custom_previous', 'none'].includes(v)) return v;
  return DEF_COMPARE;
};

const normalizeBasis = (value) => {
  const v = String(value || DEF_BASIS).toLowerCase();
  if (['actual', 'amortized', 'net'].includes(v)) return v;
  return DEF_BASIS;
};

const normalizeDimension = (value) => {
  if (!value) return DEF_DIMENSION;
  const text = String(value).trim();
  if (DIMENSION_META[text]) return text;
  const lower = text.toLowerCase();
  if (DIMENSION_META[lower]) return lower;

  for (const [key, meta] of Object.entries(DIMENSION_META)) {
    if (String(meta.legacy).toLowerCase() === lower) return key;
  }

  if (lower.includes('service')) return 'service';
  if (lower.includes('account')) return 'account';
  if (lower.includes('region')) return 'region';
  if (lower.includes('team')) return 'team';
  if (lower.includes('sku')) return 'sku';
  return DEF_DIMENSION;
};

const clampLimit = (value) => {
  const n = toNumber(value, DEF_ROW_LIMIT);
  if (!Number.isFinite(n) || n <= 0) return DEF_ROW_LIMIT;
  return Math.max(10, Math.min(MAX_ROW_LIMIT, Math.round(n)));
};

const tagValue = (tags, keys) => {
  if (!tags || typeof tags !== 'object') return null;
  const lowerMap = {};
  Object.keys(tags).forEach((key) => {
    lowerMap[String(key).toLowerCase()] = tags[key];
  });
  for (const key of keys) {
    const value = lowerMap[String(key).toLowerCase()];
    if (value !== undefined && value !== null && String(value).trim()) return String(value).trim();
  }
  return null;
};

const rowCostByBasis = (row, basis = DEF_BASIS) => {
  const billed = toNumber(row?.billedcost ?? row?.BilledCost, 0);
  const effective = toNumber(row?.effectivecost ?? row?.EffectiveCost, billed);
  const contracted = toNumber(row?.contractedcost ?? row?.ContractedCost, effective);
  if (basis === 'amortized') return effective;
  if (basis === 'net') return contracted;
  return billed;
};

const getDims = (row) => {
  const tags = row?.tags && typeof row.tags === 'object' ? row.tags : {};
  return {
    provider: row?.cloudAccount?.providername || row?.ProviderName || 'Unknown Provider',
    service: row?.service?.servicename || row?.ServiceName || 'Unknown Service',
    region: row?.region?.regionname || row?.RegionName || 'Unknown Region',
    account:
      row?.cloudAccount?.billingaccountname ||
      row?.cloudAccount?.billingaccountid ||
      row?.BillingAccountName ||
      row?.BillingAccountId ||
      'Unallocated Account',
    subAccount: row?.subAccount?.sub_account_name || row?.SubAccountName || row?.subaccountid || 'Unknown Sub Account',
    sku: row?.skuid || row?.SkuId || row?.SKU || 'Unknown SKU',
    resource: row?.resource?.resourcename || row?.ResourceName || row?.resourceid || row?.ResourceId || 'Unknown Resource',
    costCategory: row?.chargecategory || row?.ChargeCategory || 'Uncategorized',
    app: tagValue(tags, ['app', 'application', 'service']) || 'Unmapped App',
    team: tagValue(tags, ['team', 'owner', 'squad', 'business_unit']) || 'Unmapped Team',
    env: tagValue(tags, ['env', 'environment', 'stage']) || 'Unmapped Env',
  };
};

const isCreditLikeRow = (row) => {
  const text = [
    row?.chargecategory,
    row?.ChargeCategory,
    row?.chargeclass,
    row?.ChargeClass,
    row?.chargedescription,
    row?.ChargeDescription,
    row?.ItemDescription,
    row?.commitmentdiscountid,
    row?.CommitmentDiscountId,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  if (!text) return false;
  const markers = [
    'credit',
    'discount',
    'refund',
    'savings plan',
    'savingsplan',
    'reserved',
    'commitment',
    'ri ',
    'edp',
  ];
  return markers.some((marker) => text.includes(marker));
};

const buildAvailableDayKeys = (rows = []) => {
  const today = dateKey(new Date());
  const keys = new Set();
  for (const row of rows) {
    const key = dateKey(row?.chargeperiodstart || row?.ChargePeriodStart);
    if (!key) continue;
    if (today && compareDayKeys(key, today) > 0) continue;
    keys.add(key);
  }
  return [...keys].sort(compareDayKeys);
};

const pickCurrentWindowDayKeys = (dayKeys = [], range, startDate, endDate) => {
  if (!dayKeys.length) return [];
  const normalized = normalizeTimeRange(range);
  const latest = dayKeys[dayKeys.length - 1];

  if (normalized === 'custom') {
    const start = dateKey(startDate);
    const end = dateKey(endDate);
    if (!start || !end) return [];
    const lower = compareDayKeys(start, end) <= 0 ? start : end;
    const upper = compareDayKeys(start, end) <= 0 ? end : start;
    return dayKeys.filter((k) => compareDayKeys(k, lower) >= 0 && compareDayKeys(k, upper) <= 0);
  }

  if (normalized === 'mtd') {
    const monthPrefix = latest.slice(0, 7);
    return dayKeys.filter((k) => k.startsWith(monthPrefix));
  }

  if (normalized === 'qtd') {
    const ref = asDate(latest);
    if (!ref) return [];
    const quarterStartMonth = ref.getUTCMonth() - (ref.getUTCMonth() % 3);
    const quarterStart = dateKey(new Date(Date.UTC(ref.getUTCFullYear(), quarterStartMonth, 1)));
    if (!quarterStart) return [];
    return dayKeys.filter((k) => compareDayKeys(k, quarterStart) >= 0 && compareDayKeys(k, latest) <= 0);
  }

  const match = normalized.match(/^(\d+)d$/);
  const days = match ? Math.max(1, parseInt(match[1], 10)) : 30;
  return dayKeys.slice(-days);
};

const pickPreviousWindowDayKeys = (
  dayKeys = [],
  currentKeys = [],
  compareTo,
  previousStartDate,
  previousEndDate,
) => {
  if (!dayKeys.length || !currentKeys.length) return [];
  const mode = normalizeCompareTo(compareTo);
  if (mode === 'none') return [];

  if (mode === 'custom_previous') {
    const start = dateKey(previousStartDate);
    const end = dateKey(previousEndDate);
    if (start && end) {
      const lower = compareDayKeys(start, end) <= 0 ? start : end;
      const upper = compareDayKeys(start, end) <= 0 ? end : start;
      return dayKeys.filter((k) => compareDayKeys(k, lower) >= 0 && compareDayKeys(k, upper) <= 0);
    }
  }

  if (mode === 'same_period_last_month') {
    const currentStart = asDate(currentKeys[0]);
    const currentEnd = asDate(currentKeys[currentKeys.length - 1]);
    if (currentStart && currentEnd) {
      const shiftedStart = dateKey(shiftMonths(currentStart, -1));
      const shiftedEnd = dateKey(shiftMonths(currentEnd, -1));
      if (shiftedStart && shiftedEnd) {
        const lower = compareDayKeys(shiftedStart, shiftedEnd) <= 0 ? shiftedStart : shiftedEnd;
        const upper = compareDayKeys(shiftedStart, shiftedEnd) <= 0 ? shiftedEnd : shiftedStart;
        const candidates = dayKeys.filter((k) => compareDayKeys(k, lower) >= 0 && compareDayKeys(k, upper) <= 0);
        if (candidates.length >= currentKeys.length) return candidates.slice(-currentKeys.length);
      }
    }
  }

  const currentFirst = currentKeys[0];
  const currentStartIndex = dayKeys.findIndex((k) => k === currentFirst);
  const desired = currentKeys.length;
  if (currentStartIndex < 0 || desired <= 0) return [];
  const prevStart = Math.max(0, currentStartIndex - desired);
  return dayKeys.slice(prevStart, currentStartIndex);
};

const applyScopeFilters = (rows = [], filters = {}) => {
  const merged = { ...DEFAULT_FILTERS, ...filters };
  const normalizedTagKey = String(merged.tagKey || '').trim();
  const normalizedTagValue = String(merged.tagValue || '').trim().toLowerCase();

  return rows.filter((row) => {
    const d = getDims(row);
    if (merged.provider !== 'All' && d.provider !== merged.provider) return false;
    if (merged.service !== 'All' && d.service !== merged.service) return false;
    if (merged.region !== 'All' && d.region !== merged.region) return false;
    if (merged.account !== 'All' && d.account !== merged.account) return false;
    if (merged.subAccount !== 'All' && d.subAccount !== merged.subAccount) return false;
    if (merged.team !== 'All' && d.team !== merged.team) return false;
    if (merged.app !== 'All' && d.app !== merged.app) return false;
    if (merged.env !== 'All' && d.env !== merged.env) return false;
    if (merged.costCategory !== 'All' && d.costCategory !== merged.costCategory) return false;

    if (normalizedTagKey && normalizedTagValue) {
      const tags = row?.tags && typeof row.tags === 'object' ? row.tags : {};
      const found = Object.keys(tags).some(
        (tag) =>
          String(tag).toLowerCase() === normalizedTagKey.toLowerCase() &&
          String(tags[tag]).trim().toLowerCase() === normalizedTagValue,
      );
      if (!found) return false;
    }
    return true;
  });
};

const ensureMapEntry = (map, key, initFactory) => {
  if (!map.has(key)) map.set(key, initFactory());
  return map.get(key);
};

const createCategoryBucket = () => ({
  newServicesResources: 0,
  usageGrowth: 0,
  ratePriceChange: 0,
  mixShift: 0,
  creditsDiscountChange: 0,
  savingsRemovals: 0,
});

const addCategoryValue = (bucket, category, amount) => {
  if (!bucket || !Object.prototype.hasOwnProperty.call(bucket, category)) return;
  bucket[category] += toNumber(amount, 0);
};

const sumDriverCategories = (bucket = createCategoryBucket()) =>
  DRIVER_ORDER.reduce((sum, key) => sum + toNumber(bucket[key], 0), 0);

const pct = (curr, prev) => {
  if (!toNumber(prev, 0)) return curr > 0 ? 100 : 0;
  return costGrowthRate(curr, prev);
};

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const confidenceLevel = (score) => {
  if (score >= 80) return 'high';
  if (score >= 60) return 'medium';
  return 'low';
};

const confidenceLabelFromRisk = (riskLevel = 'low') => {
  if (riskLevel === 'low') return 'High';
  if (riskLevel === 'medium') return 'Medium';
  return 'Low';
};

const computeAttributionConfidence = ({
  quantityCoveragePercent,
  modelResidualPercentOfNet,
  missingTagSpendPercent,
  skuMappingCoveragePercent,
  periodDataCompletenessPercent,
  currencyConsistent,
  providerCount,
  topProviderCurrentSharePercent,
}) => {
  let score = 100;

  if (!currencyConsistent) score -= 25;
  if (modelResidualPercentOfNet > 5) score -= 20;
  else if (modelResidualPercentOfNet > 2) score -= 10;

  if (quantityCoveragePercent < 40) score -= 20;
  else if (quantityCoveragePercent < 70) score -= 10;

  if (missingTagSpendPercent > 20) score -= 15;
  else if (missingTagSpendPercent > 10) score -= 8;

  if (skuMappingCoveragePercent < 85) score -= 10;
  if (periodDataCompletenessPercent < 90) score -= 10;

  if (providerCount > 1 && topProviderCurrentSharePercent < 70) score -= 5;

  const normalizedScore = roundTo(clamp(score, 0, 100), 2);
  const level = confidenceLevel(normalizedScore);

  const rules = [
    {
      id: 'currency_consistency',
      label: 'Currency Consistency',
      status: currencyConsistent ? 'pass' : 'fail',
      detail: currencyConsistent ? 'Single reporting currency detected.' : 'Multiple currencies detected.',
    },
    {
      id: 'model_residual',
      label: 'Model Residual',
      status: modelResidualPercentOfNet <= 2 ? 'pass' : modelResidualPercentOfNet <= 5 ? 'warn' : 'fail',
      detail: `${roundTo(modelResidualPercentOfNet, 2)}% of net change remains at model level.`,
    },
    {
      id: 'quantity_coverage',
      label: 'Usage/Rate Decomposition Coverage',
      status: quantityCoveragePercent >= 70 ? 'pass' : quantityCoveragePercent >= 40 ? 'warn' : 'fail',
      detail: `${roundTo(quantityCoveragePercent, 2)}% of non-credit absolute variance is quantity-eligible.`,
    },
    {
      id: 'ownership_mapping',
      label: 'Ownership Mapping',
      status: missingTagSpendPercent <= 10 ? 'pass' : missingTagSpendPercent <= 20 ? 'warn' : 'fail',
      detail: `${roundTo(missingTagSpendPercent, 2)}% spend has unmapped team ownership.`,
    },
  ];

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
    rowsOut.sort(stableSortByAbsDeltaDesc);
    const limitedRows = rowsOut.slice(0, rowLimit);
    return {
      rows: limitedRows,
      totalCandidates,
      omittedByThreshold,
      omittedByRowLimit: Math.max(0, rowsOut.length - rowLimit),
    };
  };

  const serviceDimension = buildRowsForDimension('service');
  const accountDimension = buildRowsForDimension('account');
  const regionDimension = buildRowsForDimension('region');
  const teamDimension = buildRowsForDimension('team');
  const skuDimension = buildRowsForDimension('sku');

  const serviceRows = serviceDimension.rows;
  const accountRows = accountDimension.rows;
  const regionRows = regionDimension.rows;
  const teamRows = teamDimension.rows;
  const skuRows = skuDimension.rows;

  const top3ContributionPercent = (() => {
    const denominator = serviceRows.reduce((sum, row) => sum + Math.abs(row.deltaValue), 0);
    if (denominator <= 0) return 0;
    const top3 = serviceRows.slice(0, 3).reduce((sum, row) => sum + Math.abs(row.deltaValue), 0);
    return (top3 / denominator) * 100;
  })();

  const waterfallCore = DRIVER_ORDER.map((id) => ({
    id,
    label: DRIVER_LABELS[id],
    value: roundTo(globalBreakdown[id], 2),
  }));
  const roundedCoreSum = waterfallCore.reduce((sum, step) => sum + step.value, 0);
  const roundedNet = roundTo(netChange, 2);
  const modelResidualRounded = roundTo(unexplainedVariance, 2);
  const roundingResidual = roundTo(roundedNet - (roundedCoreSum + modelResidualRounded), 2);
  const roundedUnexplained = roundTo(modelResidualRounded + roundingResidual, 2);

  const waterfallSteps = [...waterfallCore];
  if (Math.abs(modelResidualRounded) > 0) {
    waterfallSteps.push({
      id: 'unexplainedVariance',
      label: 'Model Residual (Unexplained)',
      value: modelResidualRounded,
    });
  }
  if (Math.abs(roundingResidual) > 0) {
    waterfallSteps.push({
      id: 'roundingResidual',
      label: 'Rounding Residual',
      value: roundingResidual,
    });
  }

  const explainedValueRounded = roundTo(waterfallCore.reduce((sum, step) => sum + step.value, 0), 2);
  const computedEnd = roundTo(totalPreviousSpend + waterfallSteps.reduce((sum, step) => sum + step.value, 0), 2);
  const endRounded = roundTo(totalCurrentSpend, 2);

  const bySeverityDesc = (a, b) => {
    const diff = (PRIORITY[a.riskLevel] ?? 99) - (PRIORITY[b.riskLevel] ?? 99);
    if (diff !== 0) return diff;
    return stableSortByAbsDeltaDesc(a, b);
  };
  const sortedRiskRows = [...serviceRows].sort(bySeverityDesc);

  const trustChecks = {
    periodDataCompletenessPercent:
      currentDaySet.size > 0
        ? roundTo((dayTotalsCurrent.size / currentDaySet.size) * 100, 2)
        : 0,
    missingTagSpendPercent:
      totalCurrentSpend > 0 ? roundTo((unmappedTeamCurrentSpend / totalCurrentSpend) * 100, 2) : 0,
    skuMappingCoveragePercent:
      totalCurrentSpend > 0
        ? roundTo(((totalCurrentSpend - missingSkuCurrentSpend) / totalCurrentSpend) * 100, 2)
        : 0,
    futureRowsExcluded,
    currencyConsistency: {
      isConsistent: currencies.size <= 1,
      currencies: [...currencies],
      warning:
        currencies.size <= 1
          ? null
          : 'Multiple currencies detected in source rows. Normalize to one reporting currency for CFO-grade variance.',
    },
    quantityCoveragePercent:
      nonCreditAbsoluteDeltaTotal > 0
        ? roundTo((quantityEligibleAbsoluteDeltaTotal / nonCreditAbsoluteDeltaTotal) * 100, 2)
        : 0,
  };

  const providerRows = [...providerTotals.entries()].map(([provider, totals]) => ({
    provider,
    previousSpend: totals.previousSpend,
    currentSpend: totals.currentSpend,
  }));
  providerRows.sort((a, b) => b.currentSpend - a.currentSpend);
  const topProviderCurrentSharePercent =
    totalCurrentSpend > 0 ? roundTo((toNumber(providerRows[0]?.currentSpend, 0) / totalCurrentSpend) * 100, 2) : 0;

  const modelResidualPercentOfNet = netChangeAbs > 0 ? (Math.abs(modelResidualRounded) / netChangeAbs) * 100 : 0;
  const attributionConfidence = computeAttributionConfidence({
    quantityCoveragePercent: trustChecks.quantityCoveragePercent,
    modelResidualPercentOfNet,
    missingTagSpendPercent: trustChecks.missingTagSpendPercent,
    skuMappingCoveragePercent: trustChecks.skuMappingCoveragePercent,
    periodDataCompletenessPercent: trustChecks.periodDataCompletenessPercent,
    currencyConsistent: trustChecks.currencyConsistency.isConsistent,
    providerCount: providerRows.length,
    topProviderCurrentSharePercent,
  });

  const unexplainedAbs = Math.abs(roundedUnexplained);
  const unexplainedPercentOfNet =
    roundedNet !== 0 ? roundTo((unexplainedAbs / Math.abs(roundedNet)) * 100, 2) : 0;

  const unexplainedSeverity =
    unexplainedPercentOfNet >= UNEXPLAINED_WARN_THRESHOLD_PERCENT
      ? 'high'
      : unexplainedPercentOfNet >= 2
        ? 'medium'
        : 'low';

  const previousSpendRounded = roundTo(totalPreviousSpend, 2);
  const currentSpendRounded = roundTo(totalCurrentSpend, 2);
  const netChangeRounded = roundTo(netChange, 2);

  const trendSeries = (() => {
    const length = Math.max(currentDayKeys.length, previousDayKeys.length);
    if (!length) return [];

    const points = [];
    for (let idx = 0; idx < length; idx += 1) {
      const currentDay = currentDayKeys[idx] || null;
      const previousDay = previousDayKeys[idx] || null;
      const date = currentDay || previousDay;
      if (!date) continue;

      const currentSpend = currentDay ? toNumber(dayTotalsCurrent.get(currentDay), 0) : 0;
      const previousSpend = previousDay ? toNumber(dayTotalsPrevious.get(previousDay), 0) : 0;
      const deltaValue = currentSpend - previousSpend;

      const residualValue =
        Math.abs(netChangeRounded) > 0
          ? roundTo((deltaValue * roundedUnexplained) / netChangeRounded, 2)
          : 0;
      const explainedValue = roundTo(deltaValue - residualValue, 2);
      const residualAbsPctOfDelta =
        Math.abs(deltaValue) > 0 ? roundTo((Math.abs(residualValue) / Math.abs(deltaValue)) * 100, 2) : 0;

      const currentService = currentDay ? dailyServiceCurrent.get(currentDay) || new Map() : new Map();
      const previousService = previousDay ? dailyServicePrevious.get(previousDay) || new Map() : new Map();
      const serviceKeys = new Set([...currentService.keys(), ...previousService.keys()]);
      const driverTags = [...serviceKeys]
        .map((service) => ({
          name: service,
          deltaValue: toNumber(currentService.get(service), 0) - toNumber(previousService.get(service), 0),
        }))
        .filter((entry) => Math.abs(entry.deltaValue) > 0)
        .sort((a, b) => Math.abs(b.deltaValue) - Math.abs(a.deltaValue))
        .slice(0, 3)
        .map((entry) => entry.name);

      points.push({
        index: idx + 1,
        date,
        currentSpend: roundTo(currentSpend, 2),
        previousSpend: roundTo(previousSpend, 2),
        deltaValue: roundTo(deltaValue, 2),
        explainedValue,
        residualValue,
        residualAbsPctOfDelta,
        driverTags,
      });
    }
    return points;
  })();

  const executiveInsights = [];
  const topIncrease = serviceRows.find((row) => row.deltaValue > 0);
  if (topIncrease) {
    executiveInsights.push({
      id: 'top_increase_driver',
      severity: 'medium',
      title: `${topIncrease.name} is the largest increase driver`,
      detail: `${roundTo(topIncrease.deltaValue, 2)} increase (${roundTo(topIncrease.deltaPercent, 2)}%) vs previous period.`,
      evidencePayload: { dimension: 'service', driverKey: topIncrease.name },
      sourceMetricIds: ['decomposition.service', 'netChange'],
    });
  }

  const topNewService = serviceRows.find((row) => row.driverType === DRIVER_LABELS.newServicesResources && row.deltaValue > 0);
  if (topNewService) {
    executiveInsights.push({
      id: 'largest_new_service',
      severity: 'medium',
      title: `Largest net-new spend: ${topNewService.name}`,
      detail: `No prior-period spend; current-period impact is ${roundTo(topNewService.deltaValue, 2)}.`,
      evidencePayload: { dimension: 'service', driverKey: topNewService.name },
      sourceMetricIds: ['decomposition.service.newServicesResources'],
    });
  }

  const creditStep = waterfallCore.find((step) => step.id === 'creditsDiscountChange');
  if (creditStep && Math.abs(creditStep.value) > 0) {
    const isWorse = creditStep.value > 0;
    executiveInsights.push({
      id: 'credit_discount_shift',
      severity: isWorse ? 'high' : 'low',
      title: isWorse ? 'Credits/discount benefit declined' : 'Credits/discount benefit improved',
      detail: `${isWorse ? 'Increase' : 'Reduction'} of ${roundTo(Math.abs(creditStep.value), 2)} from credit and discount movement.`,
      evidencePayload: { dimension: 'service', driverKey: topIncrease?.name || 'All Services' },
      sourceMetricIds: ['waterfall.creditsDiscountChange'],
    });
  }

  const topSaving = serviceRows.find((row) => row.deltaValue < 0);
  if (topSaving) {
    executiveInsights.push({
      id: 'largest_improvement',
      severity: 'low',
      title: `${topSaving.name} delivered the largest improvement`,
      detail: `${roundTo(Math.abs(topSaving.deltaValue), 2)} reduction vs previous period.`,
      evidencePayload: { dimension: 'service', driverKey: topSaving.name },
      sourceMetricIds: ['decomposition.service', 'waterfall.savingsRemovals'],
    });
  }

  if (unexplainedSeverity !== 'low') {
    executiveInsights.push({
      id: 'unexplained_risk',
      severity: 'high',
      title: `Unexplained variance is ${roundTo(unexplainedPercentOfNet, 2)}% of net change`,
      detail: 'Investigate mapping gaps, tagging drift, and ingestion anomalies before sign-off.',
      evidencePayload: { dimension: 'service', driverKey: topIncrease?.name || 'All Services' },
      sourceMetricIds: ['unexplainedVariance.value', 'unexplainedVariance.percentOfNetChange'],
    });
  }

  const executiveSummary = executiveInsights.slice(0, TOP_EXECUTIVE_ROWS);

  const describeDriverEvidence = (row = {}) => {
    const breakdown = row.driverBreakdown || {};
    const candidates = [
      ['Usage', toNumber(breakdown.usageGrowth, 0)],
      ['Rate', toNumber(breakdown.ratePriceChange, 0)],
      ['Mix', toNumber(breakdown.mixShift, 0)],
      ['New', toNumber(breakdown.newServicesResources, 0)],
      ['Credits', toNumber(breakdown.creditsDiscountChange, 0)],
      ['Savings', toNumber(breakdown.savingsRemovals, 0)],
    ]
      .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))
      .slice(0, 2)
      .filter(([, value]) => Math.abs(value) > 0);

    if (!candidates.length) return 'No dominant evidence signal.';
    return candidates
      .map(([label, value]) => `${label} ${value >= 0 ? '+' : ''}${roundTo(value, 2).toFixed(2)}`)
      .join(' | ');
  };

  const topDrivers = serviceRows.slice(0, 10).map((row) => ({
    dimension: 'service',
    key: row.key,
    name: row.name,
    deltaValue: row.deltaValue,
    deltaPercent: row.deltaPercent,
    contributionPercent: row.contributionPercent,
    confidence: confidenceLabelFromRisk(row.riskLevel),
    riskLevel: row.riskLevel,
    evidenceSummary: describeDriverEvidence(row),
    evidencePayload: row.evidencePayload,
  }));

  const usageEffectValue = roundTo(globalBreakdown.usageGrowth, 2);
  const rateEffectValue = roundTo(globalBreakdown.ratePriceChange, 2);
  const interactionValue = roundTo(globalBreakdown.mixShift, 2);
  const totalExplainedFromSplit = roundTo(usageEffectValue + rateEffectValue + interactionValue, 2);
  const rateVsUsageSupported = trustChecks.quantityCoveragePercent >= 40 && nonCreditAbsoluteDeltaTotal > 0;
  const rateVsUsage = {
    supported: rateVsUsageSupported,
    supportReason: rateVsUsageSupported
      ? 'Usage and rate decomposition available for selected scope.'
      : 'Insufficient quantity coverage for reliable rate-vs-usage attribution.',
    coveragePercent: roundTo(trustChecks.quantityCoveragePercent, 2),
    summary: {
      usageEffectValue,
      rateEffectValue,
      interactionValue,
      totalExplainedFromSplit,
    },
    interpretation:
      Math.abs(usageEffectValue) >= Math.abs(rateEffectValue)
        ? 'Consumption movement is the larger contributor.'
        : 'Effective price movement is the larger contributor.',
    rows: serviceRows.slice(0, 10).map((row) => {
      const breakdown = row.driverBreakdown || {};
      return {
        key: row.key,
        name: row.name,
        usageEffectValue: roundTo(toNumber(breakdown.usageGrowth, 0), 2),
        rateEffectValue: roundTo(toNumber(breakdown.ratePriceChange, 0), 2),
        interactionValue: roundTo(toNumber(breakdown.mixShift, 0), 2),
        totalDeltaValue: roundTo(row.deltaValue, 2),
        confidence: confidenceLabelFromRisk(row.riskLevel),
        evidenceSummary: describeDriverEvidence(row),
      };
    }),
  };

  const kpiStrip = [
    {
      id: 'previous_period_spend',
      label: 'Previous Period Spend',
      value: previousSpendRounded,
      valueType: 'currency',
      formulaId: 'sum_previous_period_spend',
      tooltip:
        'Sum of all filtered billing rows in the comparison period. This is the baseline for variance attribution.',
      drilldown: { type: 'period_breakdown', target: 'previous' },
      sourceMetricIds: ['previousPeriodSpend'],
    },
    {
      id: 'current_period_spend',
      label: 'Current Period Spend',
      value: currentSpendRounded,
      valueType: 'currency',
      formulaId: 'sum_current_period_spend',
      tooltip:
        'Sum of all filtered billing rows in the selected current period. Must reconcile to billing-file row totals.',
      drilldown: { type: 'period_breakdown', target: 'current' },
      sourceMetricIds: ['currentPeriodSpend'],
    },
    {
      id: 'net_change',
      label: 'Net Change',
      value: netChangeRounded,
      secondaryValue: roundTo(pct(currentSpendRounded, previousSpendRounded), 2),
      valueType: 'currency_with_percent',
      formulaId: 'current_minus_previous',
      tooltip:
        'Current Period Spend minus Previous Period Spend. Positive means increase; negative means savings.',
      drilldown: { type: 'waterfall', target: 'net_change' },
      sourceMetricIds: ['currentPeriodSpend', 'previousPeriodSpend', 'netChange', 'netChangePercent'],
    },
    {
      id: 'explained_percent',
      label: 'Explained %',
      value: roundTo(explainedPercent, 2),
      valueType: 'percent',
      formulaId: '1_minus_abs_unexplained_div_abs_net_change',
      tooltip:
        '100 - (|Unexplained Variance| / |Net Change|). Indicates how much variance is mathematically attributed to known drivers.',
      drilldown: { type: 'unexplained', target: 'explained_percent' },
      sourceMetricIds: ['explainedPercent', 'explainedValue', 'unexplainedValue', 'netChange'],
    },
    {
      id: 'top_3_contributors_percent',
      label: 'Top 3 Contributors %',
      value: roundTo(top3ContributionPercent, 2),
      valueType: 'percent',
      formulaId: 'top3_abs_driver_delta_div_total_abs_driver_delta',
      tooltip:
        'Share of total absolute service-level variance explained by the top three service drivers.',
      drilldown: { type: 'decomposition', target: 'service' },
      sourceMetricIds: ['top3ContributorsPercent'],
    },
  ];

  return {
    varianceSummary: {
      previousPeriodSpend: previousSpendRounded,
      currentPeriodSpend: currentSpendRounded,
      netChange: netChangeRounded,
      netChangePercent: roundTo(pct(currentSpendRounded, previousSpendRounded), 2),
      explainedPercent: roundTo(explainedPercent, 2),
      top3ContributorsPercent: roundTo(top3ContributionPercent, 2),
      explainedValue: explainedValueRounded,
      unexplainedValue: roundTo(roundedUnexplained, 2),
    },
    kpiStrip,
    waterfall: {
      startValue: previousSpendRounded,
      endValue: currentSpendRounded,
      steps: waterfallSteps.map((step, idx) => ({
        id: step.id,
        label: step.label,
        value: roundTo(step.value, 2),
        direction: step.value > 0 ? 'increase' : step.value < 0 ? 'decrease' : 'neutral',
        order: idx + 1,
        driverType: DRIVER_TYPES[step.id] || 'other',
        contributionPctNet:
          Math.abs(netChangeRounded) > 0
            ? roundTo((roundTo(step.value, 2) / netChangeRounded) * 100, 2)
            : 0,
        contributionAbsPct:
          Math.abs(netChangeRounded) > 0
            ? roundTo((Math.abs(roundTo(step.value, 2)) / Math.abs(netChangeRounded)) * 100, 2)
            : 0,
        confidence: getWaterfallStepConfidence({
          stepId: step.id,
          value: step.value,
          quantityCoveragePercent: trustChecks.quantityCoveragePercent,
          modelResidualPercentOfNet,
          currencyConsistent: trustChecks.currencyConsistency.isConsistent,
        }),
      })),
      validation: {
        computedEnd,
        expectedEnd: endRounded,
        deltaDifference: roundTo(endRounded - computedEnd, 2),
        isBalanced: Math.abs(roundTo(endRounded - computedEnd, 2)) <= 0.01,
      },
    },
    trendComparison: {
      granularity: 'daily',
      series: trendSeries,
      residualOverlay: {
        unexplainedValue: roundTo(roundedUnexplained, 2),
        unexplainedPercentOfNet: unexplainedPercentOfNet,
        thresholdPercent: UNEXPLAINED_WARN_THRESHOLD_PERCENT,
        alert: unexplainedPercentOfNet >= UNEXPLAINED_WARN_THRESHOLD_PERCENT,
        severity: unexplainedSeverity,
      },
      windows: {
        current: {
          startDate: currentDayKeys[0] || null,
          endDate: currentDayKeys[currentDayKeys.length - 1] || null,
          days: currentDayKeys.length,
        },
        previous: {
          startDate: previousDayKeys[0] || null,
          endDate: previousDayKeys[previousDayKeys.length - 1] || null,
          days: previousDayKeys.length,
        },
      },
    },
    decomposition: {
      tabs: {
        service: { title: 'By Service', rows: serviceRows, totalRows: serviceRows.length, noiseThresholdApplied: noiseThreshold, omittedByThreshold: serviceDimension.omittedByThreshold, omittedByRowLimit: serviceDimension.omittedByRowLimit },
        account: { title: 'By Account', rows: accountRows, totalRows: accountRows.length, noiseThresholdApplied: noiseThreshold, omittedByThreshold: accountDimension.omittedByThreshold, omittedByRowLimit: accountDimension.omittedByRowLimit },
        region: { title: 'By Region', rows: regionRows, totalRows: regionRows.length, noiseThresholdApplied: noiseThreshold, omittedByThreshold: regionDimension.omittedByThreshold, omittedByRowLimit: regionDimension.omittedByRowLimit },
        team: { title: 'By Team', rows: teamRows, totalRows: teamRows.length, noiseThresholdApplied: noiseThreshold, omittedByThreshold: teamDimension.omittedByThreshold, omittedByRowLimit: teamDimension.omittedByRowLimit },
        sku: { title: 'By SKU', rows: skuRows, totalRows: skuRows.length, noiseThresholdApplied: noiseThreshold, omittedByThreshold: skuDimension.omittedByThreshold, omittedByRowLimit: skuDimension.omittedByRowLimit },
      },
      contributionScoreFormula:
        'Contribution Score = |Dimension Delta| / |Net Change| * 100. Values above 100 indicate offsetting movements across dimensions.',
      materiality: {
        thresholdValue: noiseThreshold,
        thresholdRule: 'max(userMinChange, 0.5% of |net change|, 0.01)',
      },
    },
    unexplainedVariance: {
      value: roundTo(roundedUnexplained, 2),
      modelResidualValue: roundTo(modelResidualRounded, 2),
      roundingResidualValue: roundTo(roundingResidual, 2),
      percentOfNetChange: unexplainedPercentOfNet,
      severity: unexplainedSeverity,
      thresholdPercent: UNEXPLAINED_WARN_THRESHOLD_PERCENT,
      governanceWarnings: [
        trustChecks.missingTagSpendPercent > 20 ? `High unmapped ownership spend (${trustChecks.missingTagSpendPercent}%).` : null,
        trustChecks.skuMappingCoveragePercent < 85 ? `Low SKU mapping coverage (${trustChecks.skuMappingCoveragePercent}%).` : null,
        trustChecks.periodDataCompletenessPercent < 90 ? `Missing day coverage in selected period (${trustChecks.periodDataCompletenessPercent}%).` : null,
        Math.abs(roundingResidual) > 0.05 ? `Rounding residual present (${roundingResidual}). Validate precision across aggregation layers.` : null,
        trustChecks.currencyConsistency.warning,
      ].filter(Boolean),
      checks: trustChecks,
    },
    attributionConfidence,
    executiveInsights: { bullets: executiveSummary },
    topDrivers,
    rateVsUsage,
    trust: {
      checks: trustChecks,
      riskLevel:
        unexplainedSeverity === 'high' || !trustChecks.currencyConsistency.isConsistent
          ? 'high'
          : unexplainedSeverity === 'medium'
            ? 'medium'
            : 'low',
    },
    modelMeta: {
      rowsInWindows,
      creditRowsInWindows,
      nonCreditRowsInWindows,
      futureRowsExcluded,
      providerCount: providerRows.length,
      topProviderCurrentSharePercent,
    },
    riskRows: sortedRiskRows.slice(0, rowLimit),
    availableServices: [...new Set(serviceRows.map((row) => row.name))].sort((a, b) => a.localeCompare(b)),
    legacy: {
      increases: serviceRows
        .filter((row) => row.deltaValue > 0)
        .map((row) => ({
          id: row.key,
          name: row.name,
          curr: row.currentSpend,
          prev: row.previousSpend,
          diff: row.deltaValue,
          pct: row.deltaPercent,
          contribution: row.contributionScore,
          isNew: row.previousSpend === 0 && row.currentSpend > 0,
          isDeleted: false,
          driverType: row.driverType,
          dimension: 'service',
          detailsPayload: row.evidencePayload,
        })),
      decreases: serviceRows
        .filter((row) => row.deltaValue < 0)
        .map((row) => ({
          id: row.key,
          name: row.name,
          curr: row.currentSpend,
          prev: row.previousSpend,
          diff: row.deltaValue,
          pct: row.deltaPercent,
          contribution: row.contributionScore,
          isNew: false,
          isDeleted: row.currentSpend === 0 && row.previousSpend > 0,
          driverType: row.driverType,
          dimension: 'service',
          detailsPayload: row.evidencePayload,
        })),
      overallStats: {
        totalCurr: currentSpendRounded,
        totalPrev: previousSpendRounded,
        diff: netChangeRounded,
        pct: roundTo(pct(currentSpendRounded, previousSpendRounded), 2),
        totalIncreases: roundTo(serviceRows.filter((row) => row.deltaValue > 0).reduce((sum, row) => sum + row.deltaValue, 0), 2),
        totalDecreases: roundTo(serviceRows.filter((row) => row.deltaValue < 0).reduce((sum, row) => sum + row.deltaValue, 0), 2),
      },
      dynamics: {
        newSpend: roundTo(globalBreakdown.newServicesResources, 2),
        expansion: roundTo(globalBreakdown.usageGrowth + globalBreakdown.ratePriceChange + globalBreakdown.mixShift, 2),
        deleted: roundTo(Math.abs(Math.min(0, globalBreakdown.savingsRemovals)), 2),
        optimization: roundTo(
          Math.abs(Math.min(0, globalBreakdown.usageGrowth + globalBreakdown.ratePriceChange + globalBreakdown.mixShift)),
          2,
        ),
      },
    },
  };
};

const buildScopedData = async ({
  filters,
  uploadIds,
  period,
  timeRange,
  startDate,
  endDate,
  compareTo,
  previousStartDate,
  previousEndDate,
}) => {
  const normalizedRange = normalizeTimeRange(timeRange, period);
  const normalizedCompareTo = normalizeCompareTo(compareTo);

  const rawRows = await costDriversRepository.getBillingFactsForDrivers({
    filters,
    uploadIds,
  });

  const scopedRows = applyScopeFilters(rawRows || [], filters || {});
  const dayKeys = buildAvailableDayKeys(scopedRows);
  const currentDayKeys = pickCurrentWindowDayKeys(dayKeys, normalizedRange, startDate, endDate);
  const previousDayKeys = pickPreviousWindowDayKeys(
    dayKeys,
    currentDayKeys,
    normalizedCompareTo,
    previousStartDate,
    previousEndDate,
  );
  const currentDaySet = new Set(currentDayKeys);
  const previousDaySet = new Set(previousDayKeys);

  return {
    rawRowCount: Array.isArray(rawRows) ? rawRows.length : 0,
    scopedRowCount: scopedRows.length,
    scopedRows,
    dayKeys,
    currentDayKeys,
    previousDayKeys,
    currentDaySet,
    previousDaySet,
    normalizedRange,
    normalizedCompareTo,
  };
};

const buildDeepLinks = ({ dimension, key, filters, controls }) => {
  const params = new URLSearchParams();
  const merged = {
    provider: filters.provider,
    service: filters.service,
    region: filters.region,
    account: filters.account,
    team: filters.team,
    app: filters.app,
    env: filters.env,
    costCategory: filters.costCategory,
    timeRange: controls.timeRange,
    compareTo: controls.compareTo,
    startDate: controls.startDate,
    endDate: controls.endDate,
    previousStartDate: controls.previousStartDate,
    previousEndDate: controls.previousEndDate,
  };

  if (dimension && key) {
    const map = {
      service: 'service',
      account: 'account',
      region: 'region',
      team: 'team',
      sku: 'sku',
    };
    const dimParam = map[dimension];
    if (dimParam) merged[dimParam] = key;
  }

  Object.entries(merged).forEach(([k, v]) => {
    if (v === undefined || v === null) return;
    const text = String(v).trim();
    if (!text || text === 'All') return;
    params.set(k, text);
  });
  const query = params.toString();
  const suffix = query ? `?${query}` : '';

  return {
    billingExplorer: `/dashboard/data-explorer${suffix}`,
    resourceExplorer: `/dashboard/data-explorer${suffix}`,
    optimization: `/dashboard/optimization${suffix}`,
  };
};

const buildLegacyPeriods = ({ currentDayKeys, previousDayKeys, dayKeys }) => ({
  current: currentDayKeys.length ? `${currentDayKeys[0]}T00:00:00.000Z` : null,
  prev: previousDayKeys.length ? `${previousDayKeys[0]}T00:00:00.000Z` : null,
  max: dayKeys.length ? `${dayKeys[dayKeys.length - 1]}T00:00:00.000Z` : null,
});

const formatPeriodWindow = (start, end) => {
  if (start && end) return `${start} to ${end}`;
  if (start) return start;
  if (end) return end;
  return 'Not available';
};

const buildKpiInsight = ({
  card,
  controls,
  varianceSummary,
  serviceRows,
}) => {
  const currentWindow = formatPeriodWindow(controls.startDate, controls.endDate);
  const previousWindow = formatPeriodWindow(controls.previousStartDate, controls.previousEndDate);
  const formatMoney = (value) => `$${roundTo(toNumber(value, 0), 2).toFixed(2)}`;
  const formatPercent = (value) => `${roundTo(toNumber(value, 0), 2).toFixed(2)}%`;
  const top3 = (serviceRows || []).slice(0, 3).map((row) => ({
    name: row.name,
    deltaValue: roundTo(row.deltaValue, 2),
    contributionScore: roundTo(row.contributionScore, 2),
  }));

  if (card.id === 'previous_period_spend') {
    return {
      title: 'Baseline Window',
      summary: `Baseline spend is ${formatMoney(varianceSummary.previousPeriodSpend)} for the comparison window.`,
      points: [
        `Comparison period: ${previousWindow}.`,
        `Baseline value: ${formatMoney(varianceSummary.previousPeriodSpend)}.`,
      ],
    };
  }

  if (card.id === 'current_period_spend') {
    return {
      title: 'Current Analysis Window',
      summary: `Current spend is ${formatMoney(varianceSummary.currentPeriodSpend)} in the selected analysis window.`,
      points: [
        `Current period: ${currentWindow}.`,
        `Current value: ${formatMoney(varianceSummary.currentPeriodSpend)}.`,
      ],
    };
  }

  if (card.id === 'net_change') {
    const direction = toNumber(varianceSummary.netChange, 0) >= 0 ? 'increase' : 'reduction';
    return {
      title: 'Net Variance Movement',
      summary: `Net ${direction} is ${formatMoney(varianceSummary.netChange)} (${formatPercent(varianceSummary.netChangePercent)}).`,
      points: [
        `Current window: ${currentWindow}.`,
        `Comparison window: ${previousWindow}.`,
        `Formula: ${formatMoney(varianceSummary.currentPeriodSpend)} - ${formatMoney(varianceSummary.previousPeriodSpend)}.`,
      ],
      topContributors: top3,
    };
  }

  if (card.id === 'explained_percent') {
    return {
      title: 'Attribution Quality',
      summary: `${formatPercent(varianceSummary.explainedPercent)} of net variance is explained by known driver classes.`,
      points: [
        `Explained value: ${formatMoney(varianceSummary.explainedValue)}.`,
        `Unexplained value: ${formatMoney(varianceSummary.unexplainedValue)}.`,
        'Formula: 100 - (|Unexplained| / |Net Change| * 100).',
      ],
    };
  }

  if (card.id === 'top_3_contributors_percent') {
    const contributorNames = top3.map((item) => item.name).filter(Boolean);
    return {
      title: 'Top 3 Contributors',
      summary: `${formatPercent(varianceSummary.top3ContributorsPercent)} of service-level absolute variance is concentrated in the top 3 services.`,
      points: [
        `Current window: ${currentWindow}.`,
        `Comparison window: ${previousWindow}.`,
        contributorNames.length ? `Top drivers: ${contributorNames.join(', ')}.` : 'Top drivers not available in selected scope.',
      ],
      topContributors: top3,
    };
  }

  return {
    title: card.label,
    summary: card.tooltip,
    points: [],
  };
};

const buildLegacyDetailAliases = ({ summary, trend, topSkuChanges, resourceBreakdown }) => ({
  trendData: (trend || []).map((point) => ({
    date: String(point.date || '').slice(5),
    val: Number(point.currentSpend || 0),
  })),
  subDrivers: (topSkuChanges || []).slice(0, 6).map((item) => ({
    name: item.sku,
    value: item.currentSpend,
  })),
  topResources: (resourceBreakdown || []).slice(0, 20).map((item) => ({
    id: item.resourceId,
    displayName: item.resourceName,
    cost: item.currentSpend,
  })),
  annualizedImpact: summary ? roundTo(Number(summary.deltaValue || 0) * 12, 2) : 0,
  insightText: summary
    ? `${summary.dimension}: ${summary.key || ''} changed by ${roundTo(Number(summary.deltaValue || 0), 2)}.`
    : '',
});

export const calculateCostDrivers = (timeSeriesResult = [], nameMap = {}) => {
  if (!timeSeriesResult.length) {
    return {
      overallStats: {
        totalCurr: 0,
        totalPrev: 0,
        diff: 0,
        pct: 0,
        totalIncreases: 0,
        totalDecreases: 0,
      },
      dynamics: { newSpend: 0, expansion: 0, deleted: 0, optimization: 0 },
      increases: [],
      decreases: [],
    };
  }

  const groups = new Map();
  const dates = [...new Set(timeSeriesResult.map((row) => row.date))].sort();
  const mid = Math.floor(dates.length / 2);
  const prevSet = new Set(dates.slice(0, mid));
  const currSet = new Set(dates.slice(mid));

  for (const row of timeSeriesResult) {
    const groupId = String(row.groupId || 'unknown');
    const cost = toNumber(row.cost, 0);
    const entry = ensureMapEntry(groups, groupId, () => ({
      id: groupId,
      name: nameMap[groupId] || `Unknown (${groupId})`,
      prev: 0,
      curr: 0,
    }));
    if (currSet.has(row.date)) entry.curr += cost;
    else if (prevSet.has(row.date)) entry.prev += cost;
  }

  const rows = [...groups.values()].map((entry) => {
    const diff = entry.curr - entry.prev;
    return {
      ...entry,
      diff,
      pct: roundTo(pct(entry.curr, entry.prev), 2),
      isNew: entry.prev === 0 && entry.curr > 0,
      isDeleted: entry.curr === 0 && entry.prev > 0,
    };
  });

  const increases = rows.filter((row) => row.diff > 0).sort((a, b) => b.diff - a.diff).slice(0, 10);
  const decreases = rows.filter((row) => row.diff < 0).sort((a, b) => a.diff - b.diff).slice(0, 10);
  const totalCurr = rows.reduce((sum, row) => sum + row.curr, 0);
  const totalPrev = rows.reduce((sum, row) => sum + row.prev, 0);

  return {
    overallStats: {
      totalCurr: roundTo(totalCurr, 2),
      totalPrev: roundTo(totalPrev, 2),
      diff: roundTo(totalCurr - totalPrev, 2),
      pct: roundTo(pct(totalCurr, totalPrev), 2),
      totalIncreases: roundTo(increases.reduce((sum, row) => sum + row.diff, 0), 2),
      totalDecreases: roundTo(decreases.reduce((sum, row) => sum + row.diff, 0), 2),
    },
    dynamics: {
      newSpend: roundTo(rows.filter((row) => row.isNew).reduce((sum, row) => sum + row.diff, 0), 2),
      expansion: roundTo(rows.filter((row) => !row.isNew && row.diff > 0).reduce((sum, row) => sum + row.diff, 0), 2),
      deleted: roundTo(Math.abs(rows.filter((row) => row.isDeleted).reduce((sum, row) => sum + row.diff, 0)), 2),
      optimization: roundTo(Math.abs(rows.filter((row) => !row.isDeleted && row.diff < 0).reduce((sum, row) => sum + row.diff, 0)), 2),
    },
    increases,
    decreases,
  };
};

const emptyResponse = (overrides = {}) => ({
  schemaVersion: CONTRACT_VERSION,
  controls: {
    timeRange: DEF_RANGE,
    compareTo: DEF_COMPARE,
    costBasis: DEF_BASIS,
    startDate: null,
    endDate: null,
    previousStartDate: null,
    previousEndDate: null,
    options: {
      timeRanges: ['7d', '30d', '90d', 'mtd', 'qtd', 'custom'],
      compareTo: ['previous_period', 'same_period_last_month', 'custom_previous', 'none'],
      costBasis: ['actual', 'amortized', 'net'],
      dimensions: DIMENSION_KEYS,
    },
  },
  periods: { current: null, prev: null, max: null },
  varianceSummary: {
    previousPeriodSpend: 0,
    currentPeriodSpend: 0,
    netChange: 0,
    netChangePercent: 0,
    explainedPercent: 0,
    top3ContributorsPercent: 0,
    explainedValue: 0,
    unexplainedValue: 0,
  },
  kpiStrip: [],
  waterfall: { startValue: 0, endValue: 0, steps: [], validation: { computedEnd: 0, expectedEnd: 0, deltaDifference: 0, isBalanced: true } },
  trendComparison: {
    granularity: 'daily',
    series: [],
    residualOverlay: {
      unexplainedValue: 0,
      unexplainedPercentOfNet: 0,
      thresholdPercent: UNEXPLAINED_WARN_THRESHOLD_PERCENT,
      alert: false,
      severity: 'low',
    },
    windows: {
      current: { startDate: null, endDate: null, days: 0 },
      previous: { startDate: null, endDate: null, days: 0 },
    },
  },
  decomposition: {
    activeTab: 'service',
    tabs: {
      service: { title: 'By Service', rows: [], totalRows: 0, noiseThresholdApplied: 0, omittedByThreshold: 0, omittedByRowLimit: 0 },
      account: { title: 'By Account', rows: [], totalRows: 0, noiseThresholdApplied: 0, omittedByThreshold: 0, omittedByRowLimit: 0 },
      region: { title: 'By Region', rows: [], totalRows: 0, noiseThresholdApplied: 0, omittedByThreshold: 0, omittedByRowLimit: 0 },
      team: { title: 'By Team', rows: [], totalRows: 0, noiseThresholdApplied: 0, omittedByThreshold: 0, omittedByRowLimit: 0 },
      sku: { title: 'By SKU', rows: [], totalRows: 0, noiseThresholdApplied: 0, omittedByThreshold: 0, omittedByRowLimit: 0 },
    },
    materiality: {
      thresholdValue: 0,
      thresholdRule: 'max(userMinChange, 0.5% of |net change|, 0.01)',
    },
  },
  unexplainedVariance: { value: 0, percentOfNetChange: 0, severity: 'low', thresholdPercent: UNEXPLAINED_WARN_THRESHOLD_PERCENT, governanceWarnings: [], checks: {} },
  executiveInsights: { bullets: [] },
  topDrivers: [],
  rateVsUsage: {
    supported: false,
    supportReason: 'Insufficient quantity coverage for reliable rate-vs-usage attribution.',
    coveragePercent: 0,
    summary: {
      usageEffectValue: 0,
      rateEffectValue: 0,
      interactionValue: 0,
      totalExplainedFromSplit: 0,
    },
    interpretation: 'No decomposition signal available.',
    rows: [],
  },
  trust: { checks: {}, riskLevel: 'low' },
  attributionConfidence: {
    score: 0,
    level: 'low',
    rules: [],
    signals: {},
  },
  runMeta: {
    runId: null,
    generatedAt: null,
    engineVersion: MODEL_VERSION,
    sourceSignature: null,
    rowLimitApplied: DEF_ROW_LIMIT,
    uploadCount: 0,
    uploadIds: [],
    rawRowCount: 0,
    scopedRowCount: 0,
    rowsInWindow: 0,
    rowsExcludedFuture: 0,
    creditRowsInWindow: 0,
    nonCreditRowsInWindow: 0,
    dayCoverage: {
      availableDays: 0,
      currentDays: 0,
      previousDays: 0,
      firstBillingDate: null,
      latestBillingDate: null,
    },
    filterScope: {},
  },
  drilldown: { activeDimension: 'service', topRows: [], detailApi: '/analytics/cost-drivers/details' },
  increases: [],
  decreases: [],
  overallStats: {
    totalCurr: 0,
    totalPrev: 0,
    diff: 0,
    pct: 0,
    totalIncreases: 0,
    totalDecreases: 0,
  },
  dynamics: { newSpend: 0, expansion: 0, deleted: 0, optimization: 0 },
  availableServices: [],
  periodsLegacy: { current: null, prev: null, max: null },
  ...overrides,
});

export const costDriversService = {
  async getCostDrivers(options = {}) {
    try {
      const {
        filters = {},
        period = 30,
        dimension = 'ServiceName',
        minChange = 0,
        activeServiceFilter = 'All',
        uploadIds = [],
        timeRange,
        compareTo,
        costBasis,
        startDate,
        endDate,
        previousStartDate,
        previousEndDate,
        rowLimit,
      } = options;

      const ids = normalizeUploadIds({ uploadIds, uploadId: filters.uploadId, uploadid: filters.uploadid });
      if (!ids.length) {
        return emptyResponse({
          controls: {
            ...emptyResponse().controls,
            timeRange: normalizeTimeRange(timeRange, period),
            compareTo: normalizeCompareTo(compareTo),
            costBasis: normalizeBasis(costBasis),
          },
          message: 'No upload selected. Please select a billing upload to analyze cost drivers.',
        });
      }

      const prepared = await buildScopedData({
        filters,
        uploadIds: ids,
        period,
        timeRange,
        startDate,
        endDate,
        compareTo,
        previousStartDate,
        previousEndDate,
      });

      if (!prepared.scopedRows.length) {
        return emptyResponse({
          controls: {
            ...emptyResponse().controls,
            timeRange: prepared.normalizedRange,
            compareTo: prepared.normalizedCompareTo,
            costBasis: normalizeBasis(costBasis),
          },
          periods: buildLegacyPeriods(prepared),
          periodsLegacy: buildLegacyPeriods(prepared),
          message: 'No data found for selected filters.',
        });
      }

      if (!prepared.currentDayKeys.length) {
        return emptyResponse({
          controls: {
            ...emptyResponse().controls,
            timeRange: prepared.normalizedRange,
            compareTo: prepared.normalizedCompareTo,
            costBasis: normalizeBasis(costBasis),
          },
          periods: buildLegacyPeriods(prepared),
          periodsLegacy: buildLegacyPeriods(prepared),
          message: 'No data found for selected current period.',
        });
      }

      const normalizedDimension = normalizeDimension(dimension);
      const effectiveLimit = clampLimit(rowLimit || filters.rowLimit || DEF_ROW_LIMIT);
      const normalizedBasis = normalizeBasis(costBasis);

      const model = buildModel({
        rows: prepared.scopedRows,
        currentDaySet: prepared.currentDaySet,
        previousDaySet: prepared.previousDaySet,
        currentDayKeys: prepared.currentDayKeys,
        previousDayKeys: prepared.previousDayKeys,
        basis: normalizedBasis,
        minChange,
        rowLimit: effectiveLimit,
      });

      const controls = {
        timeRange: prepared.normalizedRange,
        compareTo: prepared.normalizedCompareTo,
        costBasis: normalizedBasis,
        startDate: prepared.currentDayKeys[0] || null,
        endDate: prepared.currentDayKeys[prepared.currentDayKeys.length - 1] || null,
        previousStartDate: prepared.previousDayKeys[0] || null,
        previousEndDate: prepared.previousDayKeys[prepared.previousDayKeys.length - 1] || null,
        activeDimension: normalizedDimension,
        options: emptyResponse().controls.options,
      };

      const decompositionTabs = {};
      for (const dimKey of DIMENSION_KEYS) {
        const tab = model.decomposition.tabs[dimKey];
        decompositionTabs[dimKey] = {
          ...tab,
          rows: tab.rows.map((row) => ({
            ...row,
            deepLinks: buildDeepLinks({
              dimension: dimKey,
              key: row.key,
              filters,
              controls,
            }),
          })),
        };
      }

      const selectedRows = decompositionTabs[normalizedDimension]?.rows || decompositionTabs.service.rows;
      const serviceRows = decompositionTabs.service?.rows || [];
      const topRows = selectedRows.slice(0, TOP_EXECUTIVE_ROWS);
      const runMeta = buildRunMeta({
        uploadIds: ids,
        filters,
        controls,
        prepared,
        model,
        rowLimit: effectiveLimit,
      });

      const legacyIncreases =
        activeServiceFilter && activeServiceFilter !== 'All'
          ? model.legacy.increases.filter((row) =>
              row.name.toLowerCase().includes(String(activeServiceFilter).toLowerCase()),
            )
          : model.legacy.increases;
      const legacyDecreases =
        activeServiceFilter && activeServiceFilter !== 'All'
          ? model.legacy.decreases.filter((row) =>
              row.name.toLowerCase().includes(String(activeServiceFilter).toLowerCase()),
            )
          : model.legacy.decreases;

      const kpiStrip = model.kpiStrip.map((card) => ({
        ...card,
        insight: buildKpiInsight({
          card,
          controls,
          varianceSummary: model.varianceSummary,
          serviceRows,
        }),
      }));

      return {
        schemaVersion: CONTRACT_VERSION,
        controls,
        periodWindows: {
          current: {
            startDate: controls.startDate,
            endDate: controls.endDate,
            days: prepared.currentDayKeys.length,
          },
          previous: {
            startDate: controls.previousStartDate,
            endDate: controls.previousEndDate,
            days: prepared.previousDayKeys.length,
          },
          latestBillingDate: prepared.dayKeys[prepared.dayKeys.length - 1] || null,
        },
        periods: buildLegacyPeriods(prepared),
        varianceSummary: model.varianceSummary,
        kpiStrip,
        waterfall: model.waterfall,
        trendComparison: model.trendComparison,
        decomposition: {
          ...model.decomposition,
          activeTab: normalizedDimension,
          tabs: decompositionTabs,
        },
        topDrivers: model.topDrivers,
        rateVsUsage: model.rateVsUsage,
        unexplainedVariance: model.unexplainedVariance,
        executiveInsights: model.executiveInsights,
        trust: model.trust,
        attributionConfidence: model.attributionConfidence,
        runMeta,
        drilldown: {
          activeDimension: normalizedDimension,
          topRows,
          detailApi: '/analytics/cost-drivers/details',
        },
        increases: legacyIncreases,
        decreases: legacyDecreases,
        overallStats: model.legacy.overallStats,
        dynamics: model.legacy.dynamics,
        availableServices: model.availableServices,
        periodsLegacy: buildLegacyPeriods(prepared),
        message:
          !legacyIncreases.length && !legacyDecreases.length
            ? 'No cost changes detected in selected windows.'
            : undefined,
      };
    } catch (error) {
      logger.error({ err: error }, 'Error in costDriversService.getCostDrivers');
      throw error;
    }
  },
  async getDriverDetails(options = {}) {
    const {
      driver = null,
      driverKey = null,
      dimension = 'service',
      period = 30,
      filters = {},
      uploadIds = [],
      timeRange,
      compareTo,
      costBasis,
      startDate,
      endDate,
      previousStartDate,
      previousEndDate,
    } = options;

    const resolvedDimension = normalizeDimension(
      dimension || driver?.dimension || driver?.detailsPayload?.dimension || 'service',
    );
    const resolvedKey =
      driverKey ||
      driver?.driverKey ||
      driver?.key ||
      driver?.name ||
      driver?.id ||
      driver?.detailsPayload?.driverKey ||
      null;
    const normalizedResolvedKey = normalizeMatchKey(resolvedKey);

    if (!resolvedKey) {
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
        insightText: '',
        links: {
          billingExplorer: '/dashboard/data-explorer',
          resourceExplorer: '/dashboard/data-explorer',
          optimization: '/dashboard/optimization',
        },
        actionPayload: null,
      };
    }

    const ids = normalizeUploadIds({ uploadIds, uploadId: filters.uploadId, uploadid: filters.uploadid });
    if (!ids.length) {
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
        insightText: '',
        links: {
          billingExplorer: '/dashboard/data-explorer',
          resourceExplorer: '/dashboard/data-explorer',
          optimization: '/dashboard/optimization',
        },
        actionPayload: null,
      };
    }

    const normalizedBasis = normalizeBasis(costBasis);
    const prepared = await buildScopedData({
      filters,
      uploadIds: ids,
      period,
      timeRange,
      startDate,
      endDate,
      compareTo,
      previousStartDate,
      previousEndDate,
    });

    const controls = {
      timeRange: prepared.normalizedRange,
      compareTo: prepared.normalizedCompareTo,
      startDate: prepared.currentDayKeys[0] || null,
      endDate: prepared.currentDayKeys[prepared.currentDayKeys.length - 1] || null,
      previousStartDate: prepared.previousDayKeys[0] || null,
      previousEndDate: prepared.previousDayKeys[prepared.previousDayKeys.length - 1] || null,
      costBasis: normalizedBasis,
    };

    const model = buildModel({
      rows: prepared.scopedRows,
      currentDaySet: prepared.currentDaySet,
      previousDaySet: prepared.previousDaySet,
      currentDayKeys: prepared.currentDayKeys,
      previousDayKeys: prepared.previousDayKeys,
      basis: normalizedBasis,
      minChange: 0,
      rowLimit: MAX_ROW_LIMIT,
    });

    const tabRows = model.decomposition.tabs[resolvedDimension]?.rows || [];
    const targetRow = tabRows.find((row) => {
      const rowKey = normalizeMatchKey(row?.key);
      const rowName = normalizeMatchKey(row?.name);
      return rowKey === normalizedResolvedKey || rowName === normalizedResolvedKey;
    });

    const trendMapCurrent = new Map();
    const trendMapPrevious = new Map();
    const resourceMap = new Map();
    const skuMap = new Map();

    for (const row of prepared.scopedRows) {
      const day = dateKey(row?.chargeperiodstart || row?.ChargePeriodStart);
      if (!day) continue;
      const dims = getDims(row);
      const dimensionValue = normalizeMatchKey(dims[resolvedDimension]);
      if (dimensionValue !== normalizedResolvedKey) continue;

      const inCurrent = prepared.currentDaySet.has(day);
      const inPrevious = prepared.previousDaySet.has(day);
      if (!inCurrent && !inPrevious) continue;

      const cost = rowCostByBasis(row, normalizedBasis);
      if (inCurrent) trendMapCurrent.set(day, (trendMapCurrent.get(day) || 0) + cost);
      if (inPrevious) trendMapPrevious.set(day, (trendMapPrevious.get(day) || 0) + cost);

      const resourceKey = dims.resource || 'Unknown Resource';
      const resourceEntry = ensureMapEntry(resourceMap, resourceKey, () => ({
        resourceId: row?.resourceid || row?.ResourceId || resourceKey,
        resourceName: resourceKey,
        previousSpend: 0,
        currentSpend: 0,
      }));
      if (inCurrent) resourceEntry.currentSpend += cost;
      if (inPrevious) resourceEntry.previousSpend += cost;

      const skuKey = dims.sku || 'Unknown SKU';
      const skuEntry = ensureMapEntry(skuMap, skuKey, () => ({
        sku: skuKey,
        previousSpend: 0,
        currentSpend: 0,
      }));
      if (inCurrent) skuEntry.currentSpend += cost;
      if (inPrevious) skuEntry.previousSpend += cost;
    }

    const trendKeys = [...new Set([...trendMapCurrent.keys(), ...trendMapPrevious.keys()])].sort(compareDayKeys);
    const trend = trendKeys.map((day) => ({
      date: day,
      currentSpend: roundTo(trendMapCurrent.get(day) || 0, 2),
      previousSpend: roundTo(trendMapPrevious.get(day) || 0, 2),
      deltaValue: roundTo((trendMapCurrent.get(day) || 0) - (trendMapPrevious.get(day) || 0), 2),
    }));

    const resourceBreakdown = [...resourceMap.values()]
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
      .slice(0, 100);

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

    const links = buildDeepLinks({
      dimension: resolvedDimension,
      key: resolvedKey,
      filters,
      controls,
    });

    const summary = targetRow
      ? {
          key: targetRow.key,
          dimension: resolvedDimension,
          driverType: targetRow.driverType,
          previousSpend: targetRow.previousSpend,
          currentSpend: targetRow.currentSpend,
          deltaValue: targetRow.deltaValue,
          deltaPercent: targetRow.deltaPercent,
          contributionScore: targetRow.contributionScore,
          contributionPercent: targetRow.contributionPercent,
          unexplainedContribution: targetRow.unexplainedContribution,
          driverBreakdown: targetRow.driverBreakdown,
          riskLevel: targetRow.riskLevel,
        }
      : driver
        ? {
            key: resolvedKey,
            dimension: resolvedDimension,
            driverType: driver.driverType || 'Unknown',
            previousSpend: roundTo(toNumber(driver.previousSpend, 0), 2),
            currentSpend: roundTo(toNumber(driver.currentSpend, 0), 2),
            deltaValue: roundTo(toNumber(driver.deltaValue, 0), 2),
            deltaPercent: roundTo(toNumber(driver.deltaPercent, 0), 2),
            contributionScore: roundTo(toNumber(driver.contributionScore, 0), 2),
            contributionPercent: roundTo(toNumber(driver.contributionPercent, 0), 2),
            unexplainedContribution: roundTo(toNumber(driver.unexplainedContribution, 0), 2),
            driverBreakdown: driver.driverBreakdown || null,
            riskLevel: driver.riskLevel || 'low',
          }
      : null;

    const actionPayload = summary
      ? {
          title: `Investigate variance for ${resolvedKey}`,
          owner: 'FinOps',
          expectedImpact: Math.abs(summary.deltaValue),
          confidence: summary.riskLevel === 'low' ? 'High' : summary.riskLevel === 'medium' ? 'Medium' : 'Low',
          source: 'cost_drivers',
          dimension: resolvedDimension,
          driverKey: resolvedKey,
        }
      : null;

    const legacy = buildLegacyDetailAliases({
      summary,
      trend,
      topSkuChanges,
      resourceBreakdown,
    });

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
