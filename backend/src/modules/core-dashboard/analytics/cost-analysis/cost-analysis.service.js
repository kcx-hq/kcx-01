import { costAnalysisRepository } from "./cost-analysis.repository.js";
import { BillingUsageFact, Resource, Service, Region, CloudAccount } from "../../../../models/index.js";
import { Op } from "sequelize";
import { costGrowthRate, dailyAverageSpend, roundTo } from "../../../../common/utils/cost.calculations.js";

const DEF_RANGE = "30d";
const DEF_GRAN = "daily";
const DEF_COMPARE = "previous_period";
const DEF_BASIS = "actual";
const DEF_GROUP = "ServiceName";
const TOP_SERIES = 8;
const TOP_N = 10;
const TOP_RISK_ROWS = 20;
const TOP_ANOMALY_HIGHLIGHTS = 3;
const DAY_MS = 86400000;

const GROUP_DIM = {
  ServiceName: "service",
  RegionName: "region",
  ProviderName: "provider",
  Account: "account",
  Team: "team",
  App: "app",
  Env: "env",
  CostCategory: "costCategory",
};

const asDate = (v) => {
  const d = v ? new Date(v) : null;
  return d && !Number.isNaN(d.getTime()) ? d : null;
};
const shiftDays = (d, n) => new Date(new Date(d).getTime() + n * DAY_MS);
const shiftMonths = (d, n) => {
  const x = new Date(d);
  x.setMonth(x.getMonth() + n);
  return x;
};
const dateKey = (d) => (asDate(d) ? new Date(d).toISOString().split("T")[0] : null);
const compareDayKeys = (a, b) => {
  if (a === b) return 0;
  return a > b ? 1 : -1;
};
const todayKey = () => dateKey(new Date());

const scopedLink = (path, scope = {}, patch = {}) => {
  const params = new URLSearchParams();
  const merged = { ...scope, ...patch };
  for (const [key, value] of Object.entries(merged)) {
    if (value === undefined || value === null) continue;
    const text = String(value).trim();
    if (!text) continue;
    params.set(key, text);
  }
  const query = params.toString();
  return query ? `${path}?${query}` : path;
};

const buildScopeParams = ({
  filters = {},
  range,
  gran,
  compareTo,
  basis,
  groupBy,
  currentStartKey = null,
  currentEndKey = null,
}) => {
  const params = {
    timeRange: range,
    granularity: gran,
    compareTo,
    costBasis: basis,
    groupBy,
  };
  const keys = ["provider", "service", "region", "account", "subAccount", "app", "team", "env", "costCategory"];
  keys.forEach((key) => {
    const value = filters[key];
    if (value && value !== "All") {
      params[key] = String(value);
    }
  });
  if (filters.tagKey) params.tagKey = String(filters.tagKey);
  if (filters.tagValue) params.tagValue = String(filters.tagValue);
  if (currentStartKey) params.startDate = currentStartKey;
  if (currentEndKey) params.endDate = currentEndKey;
  return params;
};

const normalizeUploadIds = (input = {}) => {
  if (Array.isArray(input.uploadIds)) return input.uploadIds.filter(Boolean);
  if (input.uploadIds) return [String(input.uploadIds)];
  if (input.uploadId) return [String(input.uploadId)];
  return [];
};

const tagVal = (tags, keys) => {
  if (!tags || typeof tags !== "object") return null;
  const lower = Object.keys(tags).reduce((acc, k) => ((acc[k.toLowerCase()] = tags[k]), acc), {});
  for (const k of keys) {
    const v = lower[k.toLowerCase()];
    if (v !== undefined && v !== null && String(v).trim() !== "") return String(v).trim();
  }
  return null;
};

const dims = (row) => {
  const tags = row?.tags && typeof row.tags === "object" ? row.tags : {};
  return {
    provider: row?.cloudAccount?.providername || "Unknown",
    service: row?.service?.servicename || "Unknown Service",
    region: row?.region?.regionname || "Unknown Region",
    account: row?.cloudAccount?.billingaccountname || row?.cloudAccount?.billingaccountid || "Unallocated Account",
    subAccount: row?.subaccountid || "Unknown Sub Account",
    costCategory: row?.chargecategory || "Uncategorized",
    app: tagVal(tags, ["app", "application", "service"]) || "Unmapped App",
    team: tagVal(tags, ["team", "owner", "squad", "business_unit"]) || "Unmapped Team",
    env: tagVal(tags, ["env", "environment", "stage"]) || "Unmapped Env",
  };
};

const rowCost = (row, basis) => {
  const billed = Number(row?.billedcost || 0);
  const effective = Number(row?.effectivecost ?? billed);
  const contracted = Number(row?.contractedcost ?? effective);
  if (basis === "amortized") return Number.isFinite(effective) ? effective : billed;
  if (basis === "net") return Number.isFinite(contracted) ? contracted : effective;
  return Number.isFinite(billed) ? billed : 0;
};

const bucketDate = (date, gran) => {
  const d = asDate(date);
  if (!d) return null;
  if (gran === "monthly") return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1)).toISOString().split("T")[0];
  if (gran === "weekly") {
    const x = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
    const delta = x.getUTCDay() === 0 ? -6 : 1 - x.getUTCDay();
    x.setUTCDate(x.getUTCDate() + delta);
    return x.toISOString().split("T")[0];
  }
  return d.toISOString().split("T")[0];
};

const availableBillingDayKeys = (rows = []) => {
  const today = todayKey();
  const set = new Set();
  for (const row of rows) {
    const key = dateKey(row?.chargeperiodstart);
    if (!key) continue;
    if (today && compareDayKeys(key, today) > 0) continue;
    set.add(key);
  }
  return [...set].sort(compareDayKeys);
};

const pickCurrentWindowDayKeys = (dayKeys = [], preset, startDate, endDate) => {
  if (!dayKeys.length) return [];
  const p = String(preset || DEF_RANGE).toLowerCase();
  const latest = dayKeys[dayKeys.length - 1];

  if (p === "custom") {
    const start = dateKey(startDate);
    const end = dateKey(endDate);
    if (!start || !end) return [];
    const lower = compareDayKeys(start, end) <= 0 ? start : end;
    const upper = compareDayKeys(start, end) <= 0 ? end : start;
    return dayKeys.filter((k) => compareDayKeys(k, lower) >= 0 && compareDayKeys(k, upper) <= 0);
  }

  if (p === "mtd") {
    const monthPrefix = latest.slice(0, 7);
    return dayKeys.filter((k) => k.startsWith(monthPrefix));
  }

  if (p === "qtd") {
    const ref = asDate(latest);
    if (!ref) return [];
    const startMonth = ref.getUTCMonth() - (ref.getUTCMonth() % 3);
    const quarterStart = dateKey(new Date(Date.UTC(ref.getUTCFullYear(), startMonth, 1)));
    if (!quarterStart) return [];
    return dayKeys.filter((k) => compareDayKeys(k, quarterStart) >= 0 && compareDayKeys(k, latest) <= 0);
  }

  const count = p === "7d" ? 7 : p === "90d" ? 90 : 30;
  return dayKeys.slice(-count);
};

const pickPreviousWindowDayKeys = (dayKeys = [], currentKeys = [], mode = DEF_COMPARE) => {
  if (!dayKeys.length || !currentKeys.length) return [];
  const m = String(mode || DEF_COMPARE).toLowerCase();
  if (m === "none") return [];

  const currentFirst = currentKeys[0];
  const currentIdx = dayKeys.findIndex((k) => k === currentFirst);
  const desired = currentKeys.length;
  if (currentIdx < 0 || desired <= 0) return [];

  if (m === "same_period_last_month") {
    const currentStartDate = asDate(currentKeys[0]);
    const currentEndDate = asDate(currentKeys[currentKeys.length - 1]);
    if (currentStartDate && currentEndDate) {
      const shiftedStart = dateKey(shiftMonths(currentStartDate, -1));
      const shiftedEnd = dateKey(shiftMonths(currentEndDate, -1));
      if (shiftedStart && shiftedEnd) {
        const lower = compareDayKeys(shiftedStart, shiftedEnd) <= 0 ? shiftedStart : shiftedEnd;
        const upper = compareDayKeys(shiftedStart, shiftedEnd) <= 0 ? shiftedEnd : shiftedStart;
        const candidate = dayKeys.filter((k) => compareDayKeys(k, lower) >= 0 && compareDayKeys(k, upper) <= 0);
        if (candidate.length >= desired) return candidate.slice(-desired);
      }
    }
  }

  const prevStart = Math.max(0, currentIdx - desired);
  return dayKeys.slice(prevStart, currentIdx);
};

const applyScopeFilters = (rows, filters = {}) => {
  const p = {
    provider: filters.provider || "All",
    service: filters.service || "All",
    region: filters.region || "All",
    account: filters.account || "All",
    subAccount: filters.subAccount || "All",
    app: filters.app || "All",
    team: filters.team || "All",
    env: filters.env || "All",
    costCategory: filters.costCategory || "All",
    tagKey: String(filters.tagKey || "").trim(),
    tagValue: String(filters.tagValue || "").trim(),
  };
  return rows.filter((row) => {
    const d = dims(row);
    if (p.provider !== "All" && d.provider !== p.provider) return false;
    if (p.service !== "All" && d.service !== p.service) return false;
    if (p.region !== "All" && d.region !== p.region) return false;
    if (p.account !== "All" && d.account !== p.account) return false;
    if (p.subAccount !== "All" && d.subAccount !== p.subAccount) return false;
    if (p.app !== "All" && d.app !== p.app) return false;
    if (p.team !== "All" && d.team !== p.team) return false;
    if (p.env !== "All" && d.env !== p.env) return false;
    if (p.costCategory !== "All" && d.costCategory !== p.costCategory) return false;
    if (p.tagKey && p.tagValue) {
      const tags = row?.tags && typeof row.tags === "object" ? row.tags : {};
      const ok = Object.keys(tags).some(
        (k) =>
          k.toLowerCase() === p.tagKey.toLowerCase() &&
          String(tags[k]).trim().toLowerCase() === p.tagValue.toLowerCase()
      );
      if (!ok) return false;
    }
    return true;
  });
};

const aggBy = (rows, dim, basis) => {
  const m = new Map();
  for (const r of rows) {
    const k = dims(r)[dim] || `Unknown ${dim}`;
    m.set(k, (m.get(k) || 0) + rowCost(r, basis));
  }
  return [...m.entries()].map(([name, value]) => ({ name, value: roundTo(value, 2) })).sort((a, b) => b.value - a.value);
};

const buildSeries = (rows, gran, dim, basis, compareTotals = []) => {
  const totals = new Map();
  const groups = new Map();
  const groupTotals = new Map();
  for (const r of rows) {
    const b = bucketDate(r?.chargeperiodstart, gran);
    if (!b) continue;
    const g = dims(r)[dim] || `Unknown ${dim}`;
    const c = rowCost(r, basis);
    totals.set(b, (totals.get(b) || 0) + c);
    groupTotals.set(g, (groupTotals.get(g) || 0) + c);
    if (!groups.has(b)) groups.set(b, new Map());
    const gm = groups.get(b);
    gm.set(g, (gm.get(g) || 0) + c);
  }
  const activeKeys = groupTotals.size
    ? [...groupTotals.entries()].sort((a, b) => b[1] - a[1]).slice(0, TOP_SERIES).map(([k]) => k)
    : [];
  const buckets = [...totals.keys()].sort((a, b) => new Date(a) - new Date(b));
  const compValsRaw = [...compareTotals.entries()]
    .sort((a, b) => new Date(a[0]) - new Date(b[0]))
    .map((x) => Number(x[1] || 0));
  const missing = Math.max(0, buckets.length - compValsRaw.length);
  const compVals =
    missing > 0 ? [...Array(missing).fill(0), ...compValsRaw] : compValsRaw.slice(-buckets.length);

  const series = buckets.map((b, idx) => {
    const row = { date: b, total: roundTo(totals.get(b) || 0, 2) };
    const gm = groups.get(b) || new Map();
    let other = 0;
    for (const [k, v] of gm.entries()) {
      if (activeKeys.includes(k)) row[k] = roundTo(v, 2);
      else other += v;
    }
    if (other > 0) row.Other = roundTo(other, 2);
    row.previousTotal = roundTo(compVals[idx] || 0, 2);
    row.deltaValue = roundTo(row.total - row.previousTotal, 2);
    row.deltaPercent = roundTo(costGrowthRate(row.total, row.previousTotal), 2);
    return row;
  });
  if (series.some((r) => r.Other > 0) && !activeKeys.includes("Other")) activeKeys.push("Other");
  return { series, activeKeys };
};

const volatility = (vals = []) => {
  if (!vals.length) return 0;
  const mean = vals.reduce((s, v) => s + v, 0) / vals.length;
  if (!mean) return 0;
  const variance = vals.reduce((s, v) => s + (v - mean) ** 2, 0) / vals.length;
  return (Math.sqrt(variance) / mean) * 100;
};

const confidenceBucket = (confidence) => {
  const c = String(confidence || "").toLowerCase();
  if (c.includes("high")) return "high";
  if (c.includes("medium")) return "medium";
  return "low";
};

const pickAnomalyHighlights = (list = [], limit = TOP_ANOMALY_HIGHLIGHTS) => {
  const high = list.filter((item) => confidenceBucket(item.confidence) === "high");
  const medium = list.filter((item) => confidenceBucket(item.confidence) === "medium");
  const low = list.filter((item) => confidenceBucket(item.confidence) === "low");
  const picked = [];
  picked.push(...high.slice(0, limit));
  if (picked.length < limit) picked.push(...medium.slice(0, limit - picked.length));
  if (picked.length < limit) picked.push(...low.slice(0, limit - picked.length));
  return picked;
};

const detectAnoms = (series, rows, basis, scope = {}) => {
  if (!series.length) {
    return { threshold: 0, mean: 0, stdDev: 0, list: [], highlights: [], markers: [], impactTotal: 0 };
  }
  const vals = series.map((x) => Number(x.total || 0));
  const mean = vals.reduce((s, v) => s + v, 0) / vals.length;
  const variance = vals.reduce((s, v) => s + (v - mean) ** 2, 0) / vals.length;
  const stdDev = Math.sqrt(variance);
  const threshold = mean + 2 * stdDev;

  const byDate = rows.reduce((acc, r) => {
    const k = dateKey(r?.chargeperiodstart);
    if (!k) return acc;
    if (!acc[k]) acc[k] = [];
    acc[k].push(r);
    return acc;
  }, {});

  let impactTotal = 0;
  const list = [];
  for (const p of series) {
    const total = Number(p.total || 0);
    if (total <= threshold) continue;
    const impact = Math.max(0, total - threshold);
    impactTotal += impact;
    const dayRows = byDate[p.date] || [];
    const svc = aggBy(dayRows, "service", basis).slice(0, 3);
    const reg = aggBy(dayRows, "region", basis)[0];
    const acc = aggBy(dayRows, "account", basis)[0];
    const confRatio = threshold > 0 ? impact / threshold : 0;
    const confidence = confRatio > 0.5 ? "High" : confRatio > 0.25 ? "Medium" : "Low";
    list.push({
      id: `anomaly-${p.date}`,
      detectedAt: p.date,
      impact: roundTo(impact, 2),
      confidence,
      serviceHint: svc[0]?.name || "Mixed",
      regionHint: reg?.name || "Mixed",
      accountHint: acc?.name || "Mixed",
      topContributors: svc.map((x) => ({ name: x.name, spend: x.value })),
      baselineBefore: roundTo(Math.max(0, total - impact), 2),
      actualAfter: roundTo(total, 2),
      likelyDrivers: svc.slice(0, 2).map((x) => `${x.name} growth`),
      billingExplorerLink: scopedLink("/dashboard/data-explorer", scope, { anomalyDate: p.date }),
    });
  }
  const sorted = list.sort((a, b) => b.impact - a.impact).slice(0, 10);
  return {
    threshold: roundTo(threshold, 2),
    mean: roundTo(mean, 2),
    stdDev: roundTo(stdDev, 2),
    list: sorted,
    highlights: pickAnomalyHighlights(sorted),
    markers: sorted.map((x) => ({ date: x.detectedAt, impact: x.impact, confidence: x.confidence })),
    impactTotal: roundTo(impactTotal, 2),
  };
};

const buildForecast = (series, refDate, volScore) => {
  if (!series.length) return { projectedSpend: 0, lowerBound: 0, upperBound: 0, confidence: "Low", points: [] };
  const total = series.reduce((s, x) => s + Number(x.total || 0), 0);
  const avg = dailyAverageSpend(total, Math.max(1, series.length));
  const ref = asDate(refDate) || new Date();
  const dim = new Date(ref.getFullYear(), ref.getMonth() + 1, 0).getDate();
  const proj = avg * dim;
  const confidence = volScore <= 12 ? "High" : volScore <= 25 ? "Medium" : "Low";
  const band = confidence === "High" ? 0.07 : confidence === "Medium" ? 0.15 : 0.25;
  const last = asDate(series[series.length - 1]?.date) || ref;
  const points = Array.from({ length: 6 }).map((_, i) => {
    const d = shiftDays(last, i + 1);
    return {
      date: dateKey(d),
      forecast: roundTo(avg, 2),
      lower: roundTo(avg * (1 - band), 2),
      upper: roundTo(avg * (1 + band), 2),
    };
  });
  return {
    projectedSpend: roundTo(proj, 2),
    lowerBound: roundTo(proj * (1 - band), 2),
    upperBound: roundTo(proj * (1 + band), 2),
    confidence,
    points,
  };
};

const breakdownWithDelta = (curRows, prevRows, dim, totalSpend, compareLabel, basis, scope = {}) => {
  const cur = aggBy(curRows, dim, basis).slice(0, TOP_N);
  const prevMap = new Map(aggBy(prevRows, dim, basis).map((x) => [x.name, x.value]));
  return cur.map((r) => {
    const prev = Number(prevMap.get(r.name) || 0);
    const deltaValue = r.value - prev;
    const deltaPercent = prev > 0 ? (deltaValue / prev) * 100 : r.value > 0 ? 100 : 0;
    return {
      name: r.name,
      spend: roundTo(r.value, 2),
      sharePercent: roundTo(totalSpend > 0 ? (r.value / totalSpend) * 100 : 0, 2),
      deltaValue: roundTo(deltaValue, 2),
      deltaPercent: roundTo(deltaPercent, 2),
      compareLabel,
      drilldownLink: scopedLink("/dashboard/data-explorer", scope, { [dim]: r.name }),
      pinFilter: { [dim]: r.name },
    };
  });
};

const riskMatrix = (rows, gran, basis) => {
  const top = aggBy(rows, "service", basis).slice(0, TOP_RISK_ROWS);
  const total = top.reduce((s, x) => s + x.value, 0) || 1;
  const priority = { High: 0, Medium: 1, Low: 2 };
  return top
    .map((svc) => {
      const r = rows.filter((row) => dims(row).service === svc.name);
      const m = new Map();
      for (const row of r) {
        const b = bucketDate(row?.chargeperiodstart, gran);
        if (!b) continue;
        m.set(b, (m.get(b) || 0) + rowCost(row, basis));
      }
      const vol = volatility([...m.values()]);
      const share = (svc.value / total) * 100;
      const lvl = share >= 20 && vol >= 25 ? "High" : share >= 12 || vol >= 18 ? "Medium" : "Low";
      return {
        name: svc.name,
        spend: roundTo(svc.value, 2),
        spendShare: roundTo(share, 2),
        volatility: roundTo(vol, 2),
        riskLevel: lvl,
      };
    })
    .sort((a, b) => {
      const diff = (priority[a.riskLevel] ?? 3) - (priority[b.riskLevel] ?? 3);
      if (diff !== 0) return diff;
      return b.spend - a.spend;
    });
};

const pareto = (rows, basis) => {
  const svc = aggBy(rows, "service", basis);
  const acc = aggBy(rows, "account", basis);
  const reg = aggBy(rows, "region", basis);
  const total = svc.reduce((s, x) => s + x.value, 0) || 1;
  return {
    top10ServicesShare: roundTo((svc.slice(0, 10).reduce((s, x) => s + x.value, 0) / total) * 100, 2),
    top3AccountsShare: roundTo((acc.slice(0, 3).reduce((s, x) => s + x.value, 0) / total) * 100, 2),
    singleRegionShare: roundTo(((reg[0]?.value || 0) / total) * 100, 2),
    topServices: svc.slice(0, 10),
    topAccounts: acc.slice(0, 5),
    topRegions: reg.slice(0, 5),
  };
};

const emptySpendAnalytics = () => ({
  controls: {
    timeRange: DEF_RANGE,
    granularity: DEF_GRAN,
    compareTo: DEF_COMPARE,
    costBasis: DEF_BASIS,
    groupBy: DEF_GROUP,
    startDate: null,
    endDate: null,
    options: {
      timeRanges: ["7d", "30d", "90d", "mtd", "qtd", "custom"],
      granularities: ["daily", "weekly", "monthly"],
      compareTo: ["previous_period", "same_period_last_month", "none"],
      costBasis: ["actual", "amortized", "net"],
      groupBy: Object.keys(GROUP_DIM),
    },
  },
  kpiDeck: { totalSpend: 0, avgDailySpend: 0, peakDailySpend: 0, trendPercent: 0, volatilityScore: 0, topConcentrationShare: 0, anomalyImpact: 0, predictabilityScore: 0 },
  trend: { granularity: DEF_GRAN, compareLabel: "Previous period", activeKeys: [], series: [] },
  breakdown: { byProvider: [], byService: [], byRegion: [], byAccount: [], byTeam: [], byApp: [], byEnv: [], byCostCategory: [] },
  topMovers: [],
  anomalyDetection: { threshold: 0, mean: 0, stdDev: 0, list: [], highlights: [], markers: [], impactTotal: 0 },
  predictabilityRisk: { forecast: { projectedSpend: 0, lowerBound: 0, upperBound: 0, confidence: "Low", points: [] }, predictabilityScore: 0, volatilityScore: 0, riskMatrix: [] },
  concentrationPareto: { top10ServicesShare: 0, top3AccountsShare: 0, singleRegionShare: 0, topServices: [], topAccounts: [], topRegions: [] },
  drilldownPaths: { varianceDrivers: "/dashboard/cost-drivers", resourceInventory: "/dashboard/resources", billingExplorer: "/dashboard/data-explorer" },
});

export const generateCostAnalysis = async (filters = {}, groupByParam) => {
  const uploadIds = normalizeUploadIds(filters);
  if (!uploadIds.length) throw new Error("uploadIds is required for cost analysis");

  const range = String(filters.timeRange || DEF_RANGE).toLowerCase();
  const gran = String(filters.granularity || DEF_GRAN).toLowerCase();
  const compareTo = String(filters.compareTo || DEF_COMPARE).toLowerCase();
  const basis = String(filters.costBasis || DEF_BASIS).toLowerCase();
  const groupBy = groupByParam || filters.groupBy || DEF_GROUP;
  const groupDim = GROUP_DIM[groupBy] || "service";

  const baseRows = await getCostDataWithResources({
    filters: {
      provider: filters.provider || "All",
      service: filters.service || "All",
      region: filters.region || "All",
      account: filters.account || "All",
      subAccount: filters.subAccount || "All",
      costCategory: filters.costCategory || "All",
    },
    uploadIds,
  });
  const scoped = applyScopeFilters(baseRows, filters);
  if (!scoped.length) {
    return {
      kpis: { totalSpend: 0, avgDaily: 0, peakUsage: 0, peakDate: null, trend: 0, forecastTotal: 0, atRiskSpend: 0 },
      chartData: [],
      predictabilityChartData: [],
      anomalies: [],
      activeKeys: [],
      drivers: [],
      riskData: [],
      breakdown: [],
      spendAnalytics: emptySpendAnalytics(),
      message: "No data found for selected filters.",
    };
  }

  const dayKeys = availableBillingDayKeys(scoped);
  const currentDayKeys = pickCurrentWindowDayKeys(dayKeys, range, filters.startDate, filters.endDate);
  if (!currentDayKeys.length) {
    return {
      kpis: { totalSpend: 0, avgDaily: 0, peakUsage: 0, peakDate: null, trend: 0, forecastTotal: 0, atRiskSpend: 0 },
      chartData: [],
      predictabilityChartData: [],
      anomalies: [],
      activeKeys: [],
      drivers: [],
      riskData: [],
      breakdown: [],
      spendAnalytics: emptySpendAnalytics(),
      message: "No data found for selected date range.",
    };
  }
  const previousDayKeys = pickPreviousWindowDayKeys(dayKeys, currentDayKeys, compareTo);
  const currentDaySet = new Set(currentDayKeys);
  const previousDaySet = new Set(previousDayKeys);
  const curRows = scoped.filter((r) => currentDaySet.has(dateKey(r?.chargeperiodstart)));
  const prevRows = scoped.filter((r) => previousDaySet.has(dateKey(r?.chargeperiodstart)));
  const compareLabel =
    compareTo === "none"
      ? "No comparison"
      : compareTo === "same_period_last_month"
        ? "Same period last month"
        : "Previous period";
  const refDate = asDate(currentDayKeys[currentDayKeys.length - 1]) || new Date();
  const scopeParams = buildScopeParams({
    filters,
    range,
    gran,
    compareTo,
    basis,
    groupBy,
    currentStartKey: currentDayKeys[0] || null,
    currentEndKey: currentDayKeys[currentDayKeys.length - 1] || null,
  });

  const prevBucketTotals = new Map();
  for (const r of prevRows) {
    const b = bucketDate(r?.chargeperiodstart, gran);
    if (!b) continue;
    prevBucketTotals.set(b, (prevBucketTotals.get(b) || 0) + rowCost(r, basis));
  }

  const trend = buildSeries(curRows, gran, groupDim, basis, prevBucketTotals);
  const chartData = trend.series.map((x) => {
    const y = { ...x };
    delete y.previousTotal;
    delete y.deltaValue;
    delete y.deltaPercent;
    return y;
  });
  const totalSpend = roundTo(trend.series.reduce((s, x) => s + Number(x.total || 0), 0), 2);
  const avgDaily = roundTo(dailyAverageSpend(totalSpend, trend.series.length || 1), 2);
  const peak = trend.series.reduce((m, x) => (Number(x.total || 0) > Number(m.total || 0) ? x : m), { total: 0, date: null });
  const prevTotal = roundTo(prevRows.reduce((s, r) => s + rowCost(r, basis), 0), 2);
  const trendPct = compareTo === "none" ? 0 : roundTo(costGrowthRate(totalSpend, prevTotal), 2);
  const anoms = detectAnoms(trend.series, curRows, basis, scopeParams);
  const volScore = roundTo(volatility(trend.series.map((x) => Number(x.total || 0))), 2);
  const predictabilityScore = roundTo(Math.max(0, 100 - volScore * 1.5), 2);
  const forecast = buildForecast(trend.series, refDate, volScore);

  const byService = breakdownWithDelta(curRows, prevRows, "service", totalSpend, compareLabel, basis, scopeParams);
  const byAccount = breakdownWithDelta(curRows, prevRows, "account", totalSpend, compareLabel, basis, scopeParams);
  const byProvider = breakdownWithDelta(curRows, prevRows, "provider", totalSpend, compareLabel, basis, scopeParams);
  const byRegion = breakdownWithDelta(curRows, prevRows, "region", totalSpend, compareLabel, basis, scopeParams);
  const byTeam = breakdownWithDelta(curRows, prevRows, "team", totalSpend, compareLabel, basis, scopeParams);
  const byApp = breakdownWithDelta(curRows, prevRows, "app", totalSpend, compareLabel, basis, scopeParams);
  const byEnv = breakdownWithDelta(curRows, prevRows, "env", totalSpend, compareLabel, basis, scopeParams);
  const byCostCategory = breakdownWithDelta(curRows, prevRows, "costCategory", totalSpend, compareLabel, basis, scopeParams);
  const concentrationShare = roundTo(Math.max(byService[0]?.sharePercent || 0, byAccount[0]?.sharePercent || 0), 2);

  const risks = riskMatrix(curRows, gran, basis);
  const atRiskSpend = roundTo(risks.filter((x) => x.riskLevel === "High").reduce((s, x) => s + Number(x.spend || 0), 0), 2);
  const paretoBlock = pareto(curRows, basis);
  const drivers = byService
    .slice(0, 8)
    .map((x) => ({ name: x.name, deltaValue: x.deltaValue, deltaPercent: x.deltaPercent, direction: x.deltaValue >= 0 ? "increase" : "decrease" }))
    .sort((a, b) => Math.abs(b.deltaValue) - Math.abs(a.deltaValue))
    .slice(0, 5);

  const spendAnalytics = {
    controls: {
      timeRange: range,
      granularity: gran,
      compareTo,
      costBasis: basis,
      groupBy,
      startDate: currentDayKeys[0] || null,
      endDate: currentDayKeys[currentDayKeys.length - 1] || null,
      options: {
        timeRanges: ["7d", "30d", "90d", "mtd", "qtd", "custom"],
        granularities: ["daily", "weekly", "monthly"],
        compareTo: ["previous_period", "same_period_last_month", "none"],
        costBasis: ["actual", "amortized", "net"],
        groupBy: Object.keys(GROUP_DIM),
      },
    },
    kpiDeck: {
      totalSpend,
      avgDailySpend: avgDaily,
      peakDailySpend: roundTo(Number(peak.total || 0), 2),
      trendPercent: trendPct,
      volatilityScore: volScore,
      topConcentrationShare: concentrationShare,
      anomalyImpact: anoms.impactTotal,
      predictabilityScore,
    },
    trend: {
      granularity: gran,
      compareLabel,
      activeKeys: trend.activeKeys,
      series: trend.series.map((x) => ({
        ...x,
        isAnomaly: anoms.markers.some((m) => m.date === x.date),
        anomalyImpact: anoms.markers.find((m) => m.date === x.date)?.impact || 0,
      })),
    },
    breakdown: { byProvider, byService, byRegion, byAccount, byTeam, byApp, byEnv, byCostCategory },
    topMovers: drivers,
    anomalyDetection: anoms,
    predictabilityRisk: { forecast, predictabilityScore, volatilityScore: volScore, riskMatrix: risks },
    concentrationPareto: paretoBlock,
    drilldownPaths: {
      varianceDrivers: scopedLink("/dashboard/cost-drivers", scopeParams),
      resourceInventory: scopedLink("/dashboard/resources", scopeParams),
      billingExplorer: scopedLink("/dashboard/data-explorer", scopeParams),
    },
  };

  return {
    kpis: {
      totalSpend,
      avgDaily,
      peakUsage: roundTo(Number(peak.total || 0), 2),
      peakDate: peak.date || null,
      trend: trendPct,
      forecastTotal: forecast.projectedSpend,
      atRiskSpend,
    },
    chartData,
    predictabilityChartData: [
      ...chartData,
      ...forecast.points.map((p) => ({ date: p.date, total: 0, forecast: p.forecast, lower: p.lower, upper: p.upper })),
    ],
    anomalies: anoms.list,
    activeKeys: trend.activeKeys,
    drivers,
    riskData: risks.map((r) => ({
      name: r.name,
      x: r.spend,
      y: r.volatility,
      z: r.spendShare,
      severity: String(r.riskLevel || "Low").toLowerCase(),
      status: r.riskLevel,
    })),
    breakdown: byService.map((r) => ({ name: r.name, value: r.spend, deltaValue: r.deltaValue, deltaPercent: r.deltaPercent })),
    spendAnalytics,
  };
};

export const getFilterDropdowns = async (uploadIds = []) => costAnalysisRepository.getFilterOptionsForUploads(uploadIds);

export async function getCostDataWithResources(params = {}) {
  const { filters = {}, startDate = null, endDate = null, uploadIds = [] } = params;
  const {
    provider = "All",
    service = "All",
    region = "All",
    account = "All",
    subAccount = "All",
    costCategory = "All",
  } = filters;

  const ids = Array.isArray(uploadIds) ? uploadIds.map(String).map((x) => x.trim()).filter(Boolean) : [];
  if (!ids.length) return [];

  const where = { uploadid: { [Op.in]: ids }, billedcost: { [Op.gt]: 0 } };
  if (startDate || endDate) {
    where.chargeperiodstart = {};
    if (startDate) where.chargeperiodstart[Op.gte] = startDate;
    if (endDate) where.chargeperiodstart[Op.lte] = endDate;
  }
  if (subAccount !== "All") where.subaccountid = subAccount;
  if (costCategory !== "All") where.chargecategory = costCategory;

  const include = [
    {
      model: CloudAccount,
      as: "cloudAccount",
      required: provider !== "All" || account !== "All",
      attributes: ["id", "providername", "billingaccountid", "billingaccountname"],
      ...(provider !== "All" ? { where: { providername: provider } } : {}),
    },
    {
      model: Service,
      as: "service",
      required: service !== "All",
      attributes: ["serviceid", "servicename"],
      ...(service !== "All" ? { where: { servicename: service } } : {}),
    },
    {
      model: Region,
      as: "region",
      required: region !== "All",
      attributes: ["id", "regionname"],
      ...(region !== "All" ? { where: { regionname: region } } : {}),
    },
    {
      model: Resource,
      as: "resource",
      required: false,
      attributes: ["resourceid", "resourcename", "resourcetype"],
    },
  ];

  if (account !== "All") {
    include[0].where = {
      ...(include[0].where || {}),
      [Op.or]: [{ billingaccountname: account }, { billingaccountid: account }],
    };
  }

  const rows = await BillingUsageFact.findAll({
    where,
    include,
    attributes: [
      "id",
      "uploadid",
      "cloudaccountid",
      "serviceid",
      "regionid",
      "resourceid",
      "subaccountid",
      "billedcost",
      "effectivecost",
      "contractedcost",
      "listcost",
      "chargeperiodstart",
      "tags",
      "chargedescription",
      "chargecategory",
      "chargeclass",
      "consumedquantity",
    ],
    order: [["chargeperiodstart", "ASC"]],
    raw: false,
  });

  return Array.isArray(rows) ? rows : [];
}

export async function getCostData(params = {}) {
  return getCostDataWithResources(params);
}

export const costsService = { getCostDataWithResources, getCostData };
export default costsService;

