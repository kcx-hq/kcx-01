import { dataQualityRepository } from './data-quality.repository.js';
import { costSharePercentage, roundTo } from '../../../../common/utils/cost.calculations.js';
import { FINOPS_CONSTANTS } from '../../../../common/constants/finops.constants.js';
import {
  toNumber,
  clamp,
  scoreBandStatus,
  confidenceLevelFromScore as formulaConfidenceLevelFromScore,
} from '../../shared/core-dashboard.formulas.js';

const n = toNumber;
const dateKey = (v) => {
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
};
const monthKey = (v) => {
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? 'unknown' : d.toISOString().slice(0, 7);
};
const hoursDiff = (a, b) => {
  const d1 = new Date(a);
  const d2 = new Date(b);
  if (Number.isNaN(d1.getTime()) || Number.isNaN(d2.getTime())) return null;
  return (d2.getTime() - d1.getTime()) / 3600000;
};
const tagsObj = (raw) => {
  if (!raw) return {};
  if (typeof raw === 'object') return Object.fromEntries(Object.entries(raw).map(([k, v]) => [String(k).toLowerCase(), v]));
  if (typeof raw !== 'string') return {};
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return {};
    return Object.fromEntries(Object.entries(parsed).map(([k, v]) => [String(k).toLowerCase(), v]));
  } catch {
    return {};
  }
};
const present = (v) => {
  if (v === null || v === undefined) return false;
  const s = String(v).trim().toLowerCase();
  return s !== '' && s !== 'null' && s !== 'undefined';
};
const pick = (...vals) => vals.find((v) => present(v)) || null;
const tag = (t, key) => {
  if (key === 'owner') return pick(t.owner, t.team, t.owneremail, t.owner_email);
  if (key === 'costcenter') return pick(t.costcenter, t.cost_center, t.costcentre);
  if (key === 'environment') return pick(t.environment, t.env);
  return pick(t[key]);
};
const invalid = (key, v) => {
  if (!present(v)) return false;
  const s = String(v).trim().toLowerCase();
  if (key === 'environment') return !new Set(['prod', 'production', 'live', 'dev', 'development', 'staging', 'test', 'qa', 'sandbox', 'non-prod', 'nonprod']).has(s);
  if (key === 'owner') return String(v).trim().length < 3;
  if (key === 'costcenter') return !/^[a-zA-Z0-9_\-/]{2,64}$/.test(String(v).trim());
  return false;
};
const isShared = (r) => `${r.chargecategory || ''} ${r.chargeclass || ''}`.toLowerCase().includes('shared');
const isCredit = (r) => ['credit', 'refund', 'tax', 'discount'].some((w) => `${r.chargecategory || ''} ${r.chargeclass || ''} ${r.chargedescription || ''}`.toLowerCase().includes(w));

const cv = (arr) => {
  if (!Array.isArray(arr) || arr.length < 2) return 0;
  const mean = arr.reduce((s, v) => s + v, 0) / arr.length;
  if (mean === 0) return 0;
  const variance = arr.reduce((s, v) => s + (v - mean) ** 2, 0) / arr.length;
  return Math.sqrt(variance) / Math.abs(mean);
};
const scoreFromThreshold = (value, greenTest, amberTest) => {
  if (greenTest(value)) return 100;
  if (amberTest(value)) return 70;
  return 30;
};

const empty = {
  score: 0,
  totalRows: 0,
  costAtRisk: 0,
  buckets: { untagged: [], missingMeta: [], anomalies: [], all: [] },
  compliance: [],
  trendData: [],
  topOffenders: [],
  governance: null,
};

const SNAPSHOT_CACHE = new Map();
const SNAPSHOT_TTL_MS = 60000;

const mapScoreToSeverity = (score) => {
  return scoreBandStatus(score, { pass: 90, warn: 75 });
};

const confidenceLevelFromScore = (score) =>
  formulaConfidenceLevelFromScore(score, { high: 90, medium: 75 });

const severityRank = {
  pass: 0,
  warn: 1,
  fail: 2,
};

const normalizeGateSeverity = (value) => {
  const v = String(value || '').toLowerCase();
  if (v === 'fail' || v === 'warn' || v === 'pass') return v;
  return 'pass';
};

function buildQualityImpactBanner(governance) {
  const ingestion = governance?.ingestionReliability || {};
  const denom = governance?.denominatorQuality || {};
  const basis = governance?.costBasisConsistency || {};

  const freshnessLag = n(ingestion.freshnessLagHours);
  const coverageCompleteness = n(ingestion.coverageCompletenessPct);
  const missingDays = n(ingestion.missingDays30d);
  const duplicates = n(ingestion.duplicateLoadPct);
  const denominatorGate = String(denom.trustGateStatus || 'pass').toLowerCase();
  const currencyConsistency = n(basis.currencyConsistencyPct);

  const freshnessSeverity =
    freshnessLag > 36 ? 'fail' : freshnessLag > 24 ? 'warn' : 'pass';
  const coverageSeverity =
    missingDays > 0 || coverageCompleteness < 90 || duplicates > 1
      ? 'fail'
      : coverageCompleteness < 98 || duplicates > 0
      ? 'warn'
      : 'pass';
  const denominatorSeverity =
    denominatorGate === 'blocked'
      ? 'fail'
      : denominatorGate === 'flagged'
      ? 'warn'
      : 'pass';
  const basisSeverity =
    currencyConsistency < 99
      ? 'fail'
      : basis.amortizationModeConsistency < 85
      ? 'warn'
      : 'pass';

  const gates = [
    {
      id: 'freshness',
      label: 'Data Freshness',
      severity: freshnessSeverity,
      message:
        freshnessSeverity === 'fail'
          ? 'Pipeline freshness exceeded hard SLA.'
          : freshnessSeverity === 'warn'
          ? 'Pipeline freshness is outside target SLA.'
          : 'Pipeline freshness is within SLA.',
    },
    {
      id: 'coverage',
      label: 'Coverage Gates',
      severity: coverageSeverity,
      message:
        coverageSeverity === 'fail'
          ? 'Missing days/accounts or duplicates reduce coverage trust.'
          : coverageSeverity === 'warn'
          ? 'Minor coverage gaps detected.'
          : 'Coverage gates are healthy.',
    },
    {
      id: 'denominator_quality',
      label: 'Denominator Quality',
      severity: denominatorSeverity,
      message:
        denominatorSeverity === 'fail'
          ? 'Unit metric denominator quality is blocked.'
          : denominatorSeverity === 'warn'
          ? 'Unit metric denominator quality is flagged.'
          : 'Unit metric denominator quality is healthy.',
    },
    {
      id: 'cost_basis',
      label: 'Currency & Cost Basis',
      severity: basisSeverity,
      message:
        basisSeverity === 'fail'
          ? 'Currency/basis mismatches are impacting trust.'
          : basisSeverity === 'warn'
          ? 'Currency/basis checks show mild drift.'
          : 'Currency/basis checks are consistent.',
    },
  ];

  const failCount = gates.filter((gate) => gate.severity === 'fail').length;
  const warnCount = gates.filter((gate) => gate.severity === 'warn').length;

  let overallSeverity = 'medium';
  if (denominatorSeverity === 'fail' || failCount >= 2 || freshnessLag > 48) {
    overallSeverity = 'critical';
  } else if (failCount === 1) {
    overallSeverity = 'high';
  } else if (warnCount > 0) {
    overallSeverity = 'medium';
  } else {
    overallSeverity = 'low';
  }

  const impactScope = new Set();
  if (freshnessSeverity !== 'pass' || basisSeverity !== 'pass') {
    impactScope.add('Spend KPIs');
    impactScope.add('Forecast');
  }
  if (coverageSeverity !== 'pass') {
    impactScope.add('Allocation');
  }
  if (denominatorSeverity !== 'pass') {
    impactScope.add('Unit Econ');
  }

  const message =
    overallSeverity === 'critical'
      ? 'Limited confidence in key numbers. Resolve governance gates before decisions.'
      : overallSeverity === 'high'
      ? 'Some numbers are partially reliable. Review failed gates before approvals.'
      : overallSeverity === 'medium'
      ? 'Data quality warnings detected. Use caution and review flagged checks.'
      : 'All governance trust gates are healthy.';

  return {
    last_checked_ts: governance?.generatedAt || new Date().toISOString(),
    severity: overallSeverity,
    confidence_level: confidenceLevelFromScore(governance?.overview?.trustScore),
    recommended_owner: 'FinOps',
    overall_status: overallSeverity === 'low' ? 'pass' : overallSeverity === 'medium' ? 'warn' : 'fail',
    message,
    active_gate_ids: gates.filter((gate) => gate.severity !== 'pass').map((gate) => gate.id),
    impact_scope_chips: Array.from(impactScope),
    gate_summaries: gates,
    behavior: {
      confidence_label_mode:
        overallSeverity === 'critical'
          ? 'limited_confidence'
          : overallSeverity === 'medium' || overallSeverity === 'high'
          ? 'medium_confidence'
          : 'high_confidence',
    },
    ttl_seconds: 60,
  };
}

export const dataQualityService = {
  async analyzeDataQuality(options = {}) {
    const { filters = {}, startDate, endDate, uploadIds = [] } = options;
    const rowsRaw = await dataQualityRepository.getBillingFactsForQuality({ filters, startDate, endDate, uploadIds });
    if (!Array.isArray(rowsRaw) || rowsRaw.length === 0) return { ...empty };

    const required = Array.from(new Set([...(FINOPS_CONSTANTS.REQUIRED_TAGS || []).map((x) => String(x).toLowerCase()), 'owner', 'costcenter', 'environment', 'project']));
    const trackedKeys = ['owner', 'costcenter', 'environment', 'app', 'product', 'project', 'team'];

    const day = new Map();
    const month = new Map();
    const tagKeyStats = new Map();
    const invalidStats = new Map();
    const teamViol = new Map();
    const svcViol = new Map();
    const accViol = new Map();
    const missSvc = new Map();
    const missAcc = new Map();
    const ownerByAccountMonth = new Map();
    const dup = new Map();
    const currencySpend = new Map();
    const modeSpend = new Map();

    let totalAbs = 0;
    let taggedAbs = 0;
    let allocatedAbs = 0;
    let sharedAbs = 0;
    let sharedLeakAbs = 0;
    let validDenAbs = 0;
    let missDenAbs = 0;
    let mismatchDenAbs = 0;
    let violatedAbs = 0;
    let lateCount = 0;
    let staleDenCount = 0;
    let denRows = 0;
    let lastIngest = null;
    const uniqueViolated = new Set();
    const violations = [];
    const rows = [];

    rowsRaw.forEach((r, idx) => {
      const cost = n(r.BilledCost ?? r.billedcost);
      const abs = Math.abs(cost);
      const d = dateKey(r.ChargePeriodStart || r.chargeperiodstart) || 'unknown';
      const m = monthKey(r.ChargePeriodStart || r.chargeperiodstart);
      const t = tagsObj(r.Tags ?? r.tags);
      const owner = tag(t, 'owner');
      const cc = tag(t, 'costcenter');
      const env = tag(t, 'environment');
      const project = tag(t, 'project');
      const acc = r.cloudaccountid || r.CloudAccountId || r.cloudAccount?.billingaccountid || 'unknown-account';
      const accName = r.cloudAccount?.billingaccountname || r.billingaccountname || acc;
      const svc = r.ServiceName || r.service?.servicename || 'Unknown';
      const region = r.RegionName || r.region?.regionname || 'Unknown';
      const curr = String(r.cloudAccount?.billingcurrency || r.billingcurrency || 'USD').toUpperCase();
      const hLate = hoursDiff(r.ChargePeriodStart || r.chargeperiodstart, r.createdat || r.CreatedAt);
      const isLate = hLate !== null && hLate > 48;
      const hasDen = n(r.consumedquantity ?? r.ConsumedQuantity) > 0 && present(r.consumedunit ?? r.ConsumedUnit);
      const freq = String(r.chargefrequency || r.ChargeFrequency || '').toLowerCase();
      const mismatch = hasDen && (freq.includes('month') || freq.includes('year'));
      const shared = isShared(r);
      const credit = isCredit(r);
      const mode = `${r.chargecategory || ''} ${r.chargeclass || ''}`.toLowerCase().includes('amort')
        ? 'amortized'
        : `${r.chargecategory || ''} ${r.chargeclass || ''}`.toLowerCase().includes('blended')
        ? 'blended'
        : `${r.chargecategory || ''} ${r.chargeclass || ''}`.toLowerCase().includes('net')
        ? 'net'
        : 'actual';

      dup.set([r.uploadid, d, acc, r.serviceid || svc, r.resourceid || r.ResourceId || 'na', cost].join('|'), (dup.get([r.uploadid, d, acc, r.serviceid || svc, r.resourceid || r.ResourceId || 'na', cost].join('|')) || 0) + 1);

      totalAbs += abs;
      currencySpend.set(curr, (currencySpend.get(curr) || 0) + abs);
      modeSpend.set(mode, (modeSpend.get(mode) || 0) + abs);
      if (isLate) lateCount += 1;
      if (hasDen) {
        validDenAbs += abs;
        denRows += 1;
      } else missDenAbs += abs;
      if (mismatch) mismatchDenAbs += abs;
      if (hasDen && hLate !== null && hLate > 72) staleDenCount += 1;

      const missingReq = required.filter((k) => !present(tag(t, k)));
      const isTagged = missingReq.length === 0;
      if (isTagged) taggedAbs += abs;
      if (present(owner)) allocatedAbs += abs;
      if (shared) {
        sharedAbs += abs;
        if (!present(owner) && !present(t.shared)) sharedLeakAbs += abs;
      }

      trackedKeys.forEach((k) => {
        const v = tag(t, k);
        const c = tagKeyStats.get(k) || { spend: 0 };
        const iv = invalidStats.get(k) || { presentSpend: 0, invalidSpend: 0 };
        if (present(v)) {
          c.spend += abs;
          iv.presentSpend += abs;
          if (invalid(k, v)) iv.invalidSpend += abs;
        }
        tagKeyStats.set(k, c);
        invalidStats.set(k, iv);
      });

      const rowViol = [];
      if (!present(owner) || !present(cc) || !present(env) || !present(project)) rowViol.push({ severity: 'critical', policy: 'mandatory_tags', reason: 'Missing required tags' });
      if (String(region).toLowerCase().includes('gov') || String(region).toLowerCase().includes('cn-')) rowViol.push({ severity: 'high', policy: 'restricted_region', reason: 'Restricted region usage' });
      if (shared && !present(owner)) rowViol.push({ severity: 'medium', policy: 'orphan_shared_cost', reason: 'Shared cost missing owner' });
      if (cost <= 0) rowViol.push({ severity: 'low', policy: 'non_positive_cost', reason: 'Zero/negative billed cost' });
      if (rowViol.length) {
        const vKey = `${idx}-${acc}-${svc}-${d}`;
        if (!uniqueViolated.has(vKey)) {
          uniqueViolated.add(vKey);
          violatedAbs += abs;
        }
        rowViol.forEach((v) => {
          violations.push({ ...v, spend: abs, date: d, owner: owner || 'unassigned', serviceName: svc, accountName: accName });
          teamViol.set(owner || 'unassigned', (teamViol.get(owner || 'unassigned') || 0) + abs);
          svcViol.set(svc, (svcViol.get(svc) || 0) + abs);
          accViol.set(accName, (accViol.get(accName) || 0) + abs);
        });
      }

      if (!isTagged) {
        missSvc.set(svc, (missSvc.get(svc) || 0) + abs);
        missAcc.set(accName, (missAcc.get(accName) || 0) + abs);
      }

      if (!day.has(d)) day.set(d, { date: d, total: 0, tagged: 0, allocated: 0, shared: 0, violated: 0, den: 0, denMismatch: 0, credit: 0, commitment: 0, accounts: new Set() });
      const dr = day.get(d);
      dr.total += abs;
      if (isTagged) dr.tagged += abs;
      if (present(owner)) dr.allocated += abs;
      if (shared) dr.shared += abs;
      if (rowViol.length) dr.violated += abs;
      if (hasDen) dr.den += abs;
      if (mismatch) dr.denMismatch += abs;
      if (credit) dr.credit += abs;
      if (present(r.commitmentdiscountid || r.CommitmentDiscountId)) dr.commitment += abs;
      dr.accounts.add(acc);

      if (!month.has(m)) month.set(m, { month: m, total: 0, unallocated: 0, shared: 0, serviceShared: new Map() });
      const mr = month.get(m);
      mr.total += abs;
      if (!present(owner)) mr.unallocated += abs;
      if (shared) {
        mr.shared += abs;
        mr.serviceShared.set(svc, (mr.serviceShared.get(svc) || 0) + abs);
      }

      const monthOwners = ownerByAccountMonth.get(acc) || new Map();
      const ownerSpend = monthOwners.get(m) || new Map();
      const oKey = owner || 'unassigned';
      ownerSpend.set(oKey, (ownerSpend.get(oKey) || 0) + abs);
      monthOwners.set(m, ownerSpend);
      ownerByAccountMonth.set(acc, monthOwners);

      const ingestAt = r.createdat || r.CreatedAt;
      if (ingestAt && (!lastIngest || new Date(ingestAt) > new Date(lastIngest))) lastIngest = ingestAt;

      rows.push({
        ...r,
        _parsedCost: cost,
        _issues: [
          ...(isTagged ? [] : ['Untagged']),
          ...(!present(r.ResourceId || r.resourceid) ? ['Missing ID'] : []),
          ...(!present(svc) || svc === 'Unknown' ? ['Missing Service'] : []),
          ...(cost <= 0 ? ['Zero Cost'] : []),
        ],
      });
    });

    const totalRows = rows.length;
    const duplicateCount = Array.from(dup.values()).reduce((sum, c) => sum + Math.max(0, c - 1), 0);
    const duplicatePct = roundTo(costSharePercentage(duplicateCount, totalRows), 2);
    const taggedPct = roundTo(costSharePercentage(taggedAbs, totalAbs), 2);
    const untagged = Math.max(0, totalAbs - taggedAbs);
    const untaggedPct = roundTo(costSharePercentage(untagged, totalAbs), 2);
    const allocatedPct = roundTo(costSharePercentage(allocatedAbs, totalAbs), 2);
    const unallocated = Math.max(0, totalAbs - allocatedAbs);
    const unallocatedPct = roundTo(costSharePercentage(unallocated, totalAbs), 2);
    const sharedPct = roundTo(costSharePercentage(sharedAbs, totalAbs), 2);
    const leakagePct = roundTo(costSharePercentage(sharedLeakAbs, totalAbs), 2);
    const denCoveragePct = roundTo(costSharePercentage(validDenAbs, totalAbs), 2);
    const denMissingPct = roundTo(costSharePercentage(missDenAbs, totalAbs), 2);
    const denMismatchPct = roundTo(costSharePercentage(mismatchDenAbs, totalAbs), 2);

    const dayRows = Array.from(day.values()).filter((d) => d.date !== 'unknown').sort((a, b) => a.date.localeCompare(b.date));
    const monthRows = Array.from(month.values()).filter((m) => m.month !== 'unknown').sort((a, b) => a.month.localeCompare(b.month));
    const curMonth = monthRows.length ? monthRows[monthRows.length - 1] : null;
    const prevMonth = monthRows.length > 1 ? monthRows[monthRows.length - 2] : null;
    const unallocCurPct = curMonth ? costSharePercentage(curMonth.unallocated, curMonth.total) : 0;
    const unallocPrevPct = prevMonth ? costSharePercentage(prevMonth.unallocated, prevMonth.total) : 0;
    const unallocTrend = roundTo(unallocCurPct - unallocPrevPct, 2);
    const sharedCurPct = curMonth ? costSharePercentage(curMonth.shared, curMonth.total) : sharedPct;
    const sharedPrevPct = prevMonth ? costSharePercentage(prevMonth.shared, prevMonth.total) : sharedPct;
    const poolDrift = roundTo(sharedCurPct - sharedPrevPct, 2);

    let transitions = 0;
    let stable = 0;
    ownerByAccountMonth.forEach((mapByMonth) => {
      const keys = Array.from(mapByMonth.keys()).sort();
      let prev = null;
      const unique = new Set();
      keys.forEach((mk) => {
        const dominant = Array.from((mapByMonth.get(mk) || new Map()).entries()).sort((a, b) => b[1] - a[1])[0]?.[0] || 'unassigned';
        unique.add(dominant);
        if (prev !== null && dominant !== prev) transitions += 1;
        prev = dominant;
      });
      if (unique.size <= 1) stable += 1;
    });
    const accountCount = ownerByAccountMonth.size;
    const ruleChurnRate = accountCount ? roundTo((transitions / accountCount) * 100, 2) : 0;
    const mappingStabilityPct = accountCount ? roundTo((stable / accountCount) * 100, 2) : 0;
    const unallocTrendScore = unallocTrend <= 0 ? 100 : unallocTrend <= 2 ? 70 : unallocTrend <= 5 ? 40 : 20;
    const allocationConfidenceScore = roundTo(allocatedPct * 0.4 + (100 - clamp(ruleChurnRate, 0, 100)) * 0.2 + mappingStabilityPct * 0.2 + unallocTrendScore * 0.2, 2);

    const sharedCv = cv(dayRows.map((d) => costSharePercentage(d.shared, d.total)));
    const basisStabilityScore = roundTo(clamp(100 - sharedCv * 100, 0, 100), 2);
    const poolDriftScore = scoreFromThreshold(Math.abs(poolDrift), (v) => v <= 1, (v) => v <= 3);
    const leakageScore = scoreFromThreshold(leakagePct, (v) => v <= 1, (v) => v <= 3);
    const sharedPoolHealthScore = roundTo(poolDriftScore * 0.5 + leakageScore * 0.3 + basisStabilityScore * 0.2, 2);

    const violatedPct = roundTo(costSharePercentage(violatedAbs, totalAbs), 2);
    const policyComplianceScore = roundTo(clamp(100 - violatedPct, 0, 100), 2);
    const severitySummary = ['critical', 'high', 'medium', 'low'].map((sev) => {
      const hit = violations.filter((v) => v.severity === sev);
      const spend = hit.reduce((s, r) => s + r.spend, 0);
      return { severity: sev, count: hit.length, violatedSpend: roundTo(spend, 2), violatedSpendPct: roundTo(costSharePercentage(spend, totalAbs), 2) };
    });

    const freshnessLagHours = lastIngest ? roundTo((Date.now() - new Date(lastIngest).getTime()) / 3600000, 2) : null;
    const maxDate = dayRows.length ? dayRows[dayRows.length - 1].date : null;
    const expectedDays = [];
    if (maxDate) {
      const end = new Date(`${maxDate}T00:00:00.000Z`);
      for (let i = 29; i >= 0; i -= 1) expectedDays.push(new Date(end.getTime() - i * 86400000).toISOString().slice(0, 10));
    }
    const dayMap = new Map(dayRows.map((d) => [d.date, d]));
    const missingDays = expectedDays.filter((d) => !dayMap.has(d));
    const accountsLast30 = new Set();
    expectedDays.forEach((d) => (dayMap.get(d)?.accounts || new Set()).forEach((a) => accountsLast30.add(a)));
    const expectedAccounts = await dataQualityRepository.getDistinctAccountIdsForUploads({ uploadIds, provider: filters.provider || 'All' });
    const completenessPct = roundTo(costSharePercentage(accountsLast30.size, expectedAccounts.length || accountsLast30.size || 1), 2);

    const freshnessScore = freshnessLagHours === null ? 30 : freshnessLagHours <= 6 ? 100 : freshnessLagHours <= 24 ? 70 : 30;
    const missingDaysScore = missingDays.length === 0 ? 100 : missingDays.length <= 2 ? 70 : 30;
    const duplicateScore = duplicatePct === 0 ? 100 : duplicatePct <= 1 ? 70 : 30;
    const completenessScore = completenessPct >= 98 ? 100 : completenessPct >= 90 ? 70 : 30;
    const ingestionReliabilityScore = roundTo(freshnessScore * 0.35 + missingDaysScore * 0.25 + duplicateScore * 0.2 + completenessScore * 0.2, 2);

    const dominantCurrency = Array.from(currencySpend.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] || 'USD';
    const dominantPct = roundTo(costSharePercentage(currencySpend.get(dominantCurrency) || 0, totalAbs), 2);
    const amortizationModeConsistency = modeSpend.size <= 1 ? 100 : modeSpend.size === 2 ? 75 : 50;
    const creditConsistencyScore = roundTo(clamp(100 - cv(dayRows.map((d) => costSharePercentage(d.credit, d.total))) * 100, 0, 100), 2);
    const commitmentConsistency = roundTo(clamp(100 - cv(dayRows.map((d) => costSharePercentage(d.commitment, d.total))) * 100, 0, 100), 2);
    const costBasisConsistencyScore = roundTo(dominantPct * 0.4 + amortizationModeConsistency * 0.2 + creditConsistencyScore * 0.2 + commitmentConsistency * 0.2, 2);

    const alignmentPct = roundTo(clamp(100 - denMismatchPct, 0, 100), 2);
    const stalePct = denRows ? roundTo((staleDenCount / denRows) * 100, 2) : 0;
    const denominatorCoverageScore = roundTo(denCoveragePct * 0.6 + alignmentPct * 0.25 + (100 - clamp(stalePct, 0, 100)) * 0.15, 2);
    const denGate = denCoveragePct < 70 || alignmentPct < 85 ? 'blocked' : denCoveragePct < 85 || stalePct > 10 ? 'flagged' : 'pass';

    const invalidWeighted = roundTo(trackedKeys.reduce((s, k) => {
      const v = invalidStats.get(k) || { invalidSpend: 0, presentSpend: 0 };
      return s + costSharePercentage(v.invalidSpend, v.presentSpend || 1);
    }, 0) / trackedKeys.length, 2);
    const tagComplianceScore = roundTo(taggedPct * 0.7 + (100 - invalidWeighted) * 0.3, 2);

    const weights = { tagCompliance: 0.18, allocationConfidence: 0.18, sharedPoolHealth: 0.14, policyCompliance: 0.15, ingestionReliability: 0.15, costBasisConsistency: 0.1, denominatorCoverage: 0.1 };
    let trustScore = tagComplianceScore * weights.tagCompliance + allocationConfidenceScore * weights.allocationConfidence + sharedPoolHealthScore * weights.sharedPoolHealth + policyComplianceScore * weights.policyCompliance + ingestionReliabilityScore * weights.ingestionReliability + costBasisConsistencyScore * weights.costBasisConsistency + denominatorCoverageScore * weights.denominatorCoverage;
    if (freshnessLagHours !== null && freshnessLagHours > 24) trustScore = Math.min(trustScore, 60);
    if (missingDays.length >= 3) trustScore = Math.min(trustScore, 55);
    if (dominantPct < 99) trustScore = Math.min(trustScore, 50);
    if (completenessPct < 90) trustScore = Math.min(trustScore, 60);
    trustScore = roundTo(clamp(trustScore, 0, 100), 2);

    const coverageByKey = trackedKeys.map((k) => {
      const c = tagKeyStats.get(k) || { spend: 0 };
      const iv = invalidStats.get(k) || { invalidSpend: 0, presentSpend: 0 };
      return { key: k, coveragePct: roundTo(costSharePercentage(c.spend, totalAbs), 2), invalidValuePct: roundTo(costSharePercentage(iv.invalidSpend, iv.presentSpend || 1), 2) };
    });
    const topMissingByService = Array.from(missSvc.entries()).map(([service, spend]) => ({ service, spend: roundTo(spend, 2), spendPct: roundTo(costSharePercentage(spend, totalAbs), 2) })).sort((a, b) => b.spend - a.spend).slice(0, 8);
    const topMissingByAccount = Array.from(missAcc.entries()).map(([account, spend]) => ({ account, spend: roundTo(spend, 2), spendPct: roundTo(costSharePercentage(spend, totalAbs), 2) })).sort((a, b) => b.spend - a.spend).slice(0, 8);
    const topViolatingTeams = Array.from(teamViol.entries()).map(([owner, spend]) => ({ owner, violatedSpend: roundTo(spend, 2), violatedSpendPct: roundTo(costSharePercentage(spend, totalAbs), 2) })).sort((a, b) => b.violatedSpend - a.violatedSpend).slice(0, 8);
    const topViolatingServices = Array.from(svcViol.entries()).map(([service, spend]) => ({ service, violatedSpend: roundTo(spend, 2), violatedSpendPct: roundTo(costSharePercentage(spend, totalAbs), 2) })).sort((a, b) => b.violatedSpend - a.violatedSpend).slice(0, 8);
    const topViolatingAccounts = Array.from(accViol.entries()).map(([account, spend]) => ({ account, violatedSpend: roundTo(spend, 2), violatedSpendPct: roundTo(costSharePercentage(spend, totalAbs), 2) })).sort((a, b) => b.violatedSpend - a.violatedSpend).slice(0, 8);
    const topContributorsToGrowth = !curMonth || !prevMonth ? [] : Array.from(new Set([...Array.from(curMonth.serviceShared.keys()), ...Array.from(prevMonth.serviceShared.keys())])).map((service) => ({ service, currentSpend: roundTo(curMonth.serviceShared.get(service) || 0, 2), previousSpend: roundTo(prevMonth.serviceShared.get(service) || 0, 2), delta: roundTo((curMonth.serviceShared.get(service) || 0) - (prevMonth.serviceShared.get(service) || 0), 2) })).filter((r) => r.delta > 0).sort((a, b) => b.delta - a.delta).slice(0, 5);
    const driftEvents = [
      ...(dominantPct < 100 ? [{ id: 'currency_drift', label: 'Currency consistency drift', detail: `${dominantPct}% spend in dominant currency ${dominantCurrency}`, severity: dominantPct < 99 ? 'high' : 'medium' }] : []),
      ...(modeSpend.size > 1 ? [{ id: 'basis_mode_drift', label: 'Cost basis mode drift', detail: `${modeSpend.size} basis modes detected`, severity: modeSpend.size > 2 ? 'high' : 'medium' }] : []),
      ...(creditConsistencyScore < 70 ? [{ id: 'credits_refunds_drift', label: 'Credits/refunds treatment drift', detail: `Consistency score ${creditConsistencyScore}`, severity: 'medium' }] : []),
      ...(commitmentConsistency < 70 ? [{ id: 'commitment_drift', label: 'Commitment treatment drift', detail: `Consistency score ${commitmentConsistency}`, severity: 'medium' }] : []),
    ];

    const risks = [
      { id: 'tag_coverage', title: 'Tag coverage risk', level: taggedPct < 85 ? 'red' : taggedPct < 95 ? 'amber' : 'green', value: taggedPct, threshold: '>=95%', impactedSpend: untagged, owner: 'Cloud Platform', steps: ['Open missing-tag services by spend.', 'Validate tag propagation breaks.', 'Replay ingestion validation.'] },
      { id: 'allocation_confidence', title: 'Allocation confidence drift', level: allocationConfidenceScore < 75 ? 'red' : allocationConfidenceScore < 90 ? 'amber' : 'green', value: allocationConfidenceScore, threshold: '>=90', impactedSpend: unallocated, owner: 'FinOps Allocation', steps: ['Inspect unallocated trend.', 'Review owner mapping churn.', 'Lock mapping effective dates.'] },
      { id: 'shared_pool', title: 'Shared pool drift risk', level: Math.abs(poolDrift) > 3 ? 'red' : Math.abs(poolDrift) > 1 ? 'amber' : 'green', value: poolDrift, threshold: 'abs <=1pp', impactedSpend: sharedAbs, owner: 'FinOps + Platform', steps: ['Open shared growth contributors.', 'Check leakage rows.', 'Review allocation basis stability.'] },
      { id: 'policy', title: 'Policy violated spend risk', level: violatedPct > 3 ? 'red' : violatedPct > 1 ? 'amber' : 'green', value: violatedPct, threshold: '<=1%', impactedSpend: violatedAbs, owner: 'Security + Governance', steps: ['Prioritize critical/high violations.', 'Route violating owners.', 'Track closure evidence.'] },
      { id: 'ingestion', title: 'Ingestion reliability risk', level: ingestionReliabilityScore < 75 ? 'red' : ingestionReliabilityScore < 90 ? 'amber' : 'green', value: ingestionReliabilityScore, threshold: '>=90', impactedSpend: totalAbs, owner: 'Data Engineering', steps: ['Check freshness and missing days.', 'Backfill and dedupe.', 'Recompute trust snapshot.'] },
      { id: 'denominator', title: 'Denominator quality risk', level: denCoveragePct < 85 ? 'red' : denCoveragePct < 95 ? 'amber' : 'green', value: denCoveragePct, threshold: '>=95%', impactedSpend: missDenAbs, owner: 'Product Analytics', steps: ['Find missing denominator mappings.', 'Validate volume source cadence.', 'Unblock unit KPI gate after fix.'] },
    ];
    const topRisks = risks.filter((r) => r.level !== 'green').map((r) => ({ ...r, impactPct: roundTo(costSharePercentage(r.impactedSpend, totalAbs), 2), weightedRank: (r.level === 'red' ? 3 : 2) * 100 + roundTo(costSharePercentage(r.impactedSpend, totalAbs), 2) })).sort((a, b) => b.weightedRank - a.weightedRank).slice(0, 5);

    const governance = {
      purpose: 'Control layer for compliance, coverage, consistency, and trust gating.',
      nonOverlap: ['No spend trend analysis from Cost Analysis.', 'No variance decomposition from Cost Drivers.', 'No optimization ranking duplication from Optimization.'],
      informationArchitecture: {
        sections: [
          'Governance Overview',
          'Tag & Metadata Compliance',
          'Ownership & Allocation Health',
          'Shared Cost Pool Integrity',
          'Policy Compliance',
          'Data Freshness & Ingestion Reliability',
          'Cost Basis Consistency',
          'Denominator & Unit Metric Data Quality',
        ],
        userFlow: [
          'Review trust score and top risks.',
          'Open failing subsection by risk ID.',
          'Inspect contributor rows and trend.',
          'Follow root-cause playbook steps.',
          'Re-run ingestion and verify score recovery.',
        ],
      },
      overview: {
        state: trustScore >= 85 ? 'green' : trustScore >= 70 ? 'amber' : 'red',
        trustScore,
        scores: { tagComplianceScore, allocationConfidenceScore, sharedPoolHealthScore, ingestionReliabilityScore, denominatorCoverageScore, policyComplianceScore, costBasisConsistencyScore },
        topRisks,
      },
      tagMetadata: {
        tagCoveragePct: taggedPct,
        untaggedSpend: roundTo(untagged, 2),
        untaggedSpendPct: untaggedPct,
        invalidValuePct: invalidWeighted,
        coverageByKey,
        trend: dayRows.map((d) => ({ date: d.date, tagCoveragePct: roundTo(costSharePercentage(d.tagged, d.total), 2), ownershipCoveragePct: roundTo(costSharePercentage(d.allocated, d.total), 2), sharedPoolPct: roundTo(costSharePercentage(d.shared, d.total), 2), denominatorCoveragePct: roundTo(costSharePercentage(d.den, d.total), 2) })),
        topMissingByService,
        topMissingByAccount,
      },
      ownershipAllocation: { allocatedPct, unallocatedPct, unallocatedSpend: roundTo(unallocated, 2), unallocatedTrendMoM: unallocTrend, allocationConfidenceScore, ruleChurnRate, mappingStabilityPct },
      sharedPoolIntegrity: { sharedPoolSpend: roundTo(sharedAbs, 2), sharedPoolPct: sharedPct, poolDrift, leakageSpend: roundTo(sharedLeakAbs, 2), leakagePct, basisStabilityScore, topContributorsToGrowth },
      policyCompliance: { violationsCount: violations.length, violatedSpend: roundTo(violatedAbs, 2), violatedSpendPct: violatedPct, severitySummary, violationsTrend: dayRows.map((d) => ({ date: d.date, violatedSpendPct: roundTo(costSharePercentage(d.violated, d.total), 2) })), topViolatingTeams, topViolatingServices, topViolatingAccounts },
      ingestionReliability: {
        lastSuccessfulIngestion: lastIngest,
        freshnessLagHours,
        missingDays30d: missingDays.length,
        missingDaysList: missingDays,
        lateArrivingDataCount: lateCount,
        duplicateLoadCount: duplicateCount,
        duplicateLoadPct: duplicatePct,
        expectedAccounts: expectedAccounts.length,
        ingestedAccounts30d: accountsLast30.size,
        missingAccountsCount: Math.max(0, (expectedAccounts.length || 0) - accountsLast30.size),
        coverageCompletenessPct: completenessPct,
        score: ingestionReliabilityScore,
      },
      costBasisConsistency: { dominantCurrency, currencies: Array.from(currencySpend.entries()).map(([currency, spend]) => ({ currency, spend: roundTo(spend, 2), spendPct: roundTo(costSharePercentage(spend, totalAbs), 2) })).sort((a, b) => b.spend - a.spend), currencyConsistencyPct: dominantPct, amortizationModeConsistency, detectedModes: Array.from(modeSpend.keys()), creditsRefundConsistency: creditConsistencyScore, commitmentTreatmentConsistency: commitmentConsistency, costBasisDriftEvents: driftEvents },
      denominatorQuality: { denominatorCoveragePct: denCoveragePct, missingDenominatorSpend: roundTo(missDenAbs, 2), missingDenominatorSpendPct: denMissingPct, granularityAlignmentPct: alignmentPct, granularityMismatchSpend: roundTo(mismatchDenAbs, 2), staleDenominatorCount: staleDenCount, denominatorStalenessPct: stalePct, trustGateStatus: denGate, score: denominatorCoverageScore },
      formulas: {
        tagCoveragePct: 'Tagged Spend / Total Spend * 100',
        untaggedSpendPct: 'Untagged Spend / Total Spend * 100',
        ownershipCoveragePct: 'Allocated Spend / Total Spend * 100',
        unallocatedTrendMoM: 'Unallocated% current - Unallocated% previous',
        sharedPoolPct: 'Shared Pool Spend / Total Spend * 100',
        poolDrift: 'SharedPool% current - SharedPool% baseline',
        policyViolatedSpendPct: 'Violated Spend / Total Spend * 100',
        freshnessLagHours: 'Now - LastIngestionTime',
        denominatorCoveragePct: 'Spend with valid denominator / Total Spend * 100',
        trustScore: 'Weighted composite with hard control gates',
      },
      kpiDictionary: [
        {
          metric: 'Tag Coverage %',
          definition: 'Share of scoped spend with all required governance tags.',
          formula: 'Tagged Spend / Total Spend * 100',
          thresholds: { green: '>= 95', amber: '80 - <95', red: '< 80' },
          granularity: 'Daily and monthly rollup',
          owner: 'Cloud Platform',
        },
        {
          metric: 'Ownership Coverage %',
          definition: 'Share of scoped spend mapped to a valid owner/team.',
          formula: 'Allocated Spend / Total Spend * 100',
          thresholds: { green: '>= 95', amber: '80 - <95', red: '< 80' },
          granularity: 'Daily and monthly rollup',
          owner: 'FinOps Allocation',
        },
        {
          metric: 'Shared Pool %',
          definition: 'Portion of scoped spend classified as shared pool.',
          formula: 'Shared Pool Spend / Total Spend * 100',
          thresholds: { green: '<= 15', amber: '> 15 and <= 25', red: '> 25' },
          granularity: 'Monthly',
          owner: 'FinOps + Platform',
        },
        {
          metric: 'Policy Violated Spend %',
          definition: 'Share of spend tied to policy violations.',
          formula: 'Violated Spend / Total Spend * 100',
          thresholds: { green: '<= 1', amber: '> 1 and <= 3', red: '> 3' },
          granularity: 'Daily and monthly rollup',
          owner: 'Security + Governance',
        },
        {
          metric: 'Ingestion Freshness Lag (hours)',
          definition: 'Elapsed time since last successful billing data load.',
          formula: 'Now - LastIngestionTime',
          thresholds: { green: '<= 6h', amber: '> 6h and <= 24h', red: '> 24h' },
          granularity: 'Hourly snapshot',
          owner: 'Data Engineering',
        },
        {
          metric: 'Denominator Coverage %',
          definition: 'Share of spend with valid denominator data for unit economics.',
          formula: 'Spend with Valid Denominator / Total Spend * 100',
          thresholds: { green: '>= 95', amber: '85 - <95', red: '< 85' },
          granularity: 'Daily and monthly rollup',
          owner: 'Product Analytics',
        },
      ],
      weightingModel: { ...weights, hardGates: ['Freshness lag > 24h => trust score capped at 60', 'Missing days >= 3 => trust score capped at 55', 'Currency consistency < 99% => trust score capped at 50', 'Coverage completeness < 90% => trust score capped at 60', 'Denominator coverage < 70% => unit KPI gate blocked'] },
      driftSignals: [
        { metric: 'Tag coverage', decayCondition: 'Drops by > 2pp over last 7 days', action: 'Run tag propagation audit and owner follow-up' },
        { metric: 'Unallocated spend', decayCondition: 'MoM increase > 2pp', action: 'Review allocation mapping changes and enforce ownership mapping' },
        { metric: 'Shared pool drift', decayCondition: 'Pool drift magnitude > 1pp', action: 'Inspect shared contributor delta and leakage rows' },
        { metric: 'Policy violated spend', decayCondition: 'Violations spend > 1%', action: 'Escalate high/critical violations to Security and FinOps' },
        { metric: 'Ingestion reliability', decayCondition: 'Missing days > 0 in trailing 30d', action: 'Backfill missing days and rerun trust snapshot' },
      ],
      rootCausePaths: risks.map((risk) => ({
        riskId: risk.id,
        title: risk.title,
        level: risk.level,
        steps: risk.steps.slice(0, 3),
      })),
      views: {
        risksTable: ['riskId', 'title', 'level', 'value', 'threshold', 'impactedSpend', 'owner'],
        tagCoverageTable: ['key', 'coveragePct', 'invalidValuePct'],
        sharedPoolContributors: ['service', 'currentSpend', 'previousSpend', 'delta'],
        policyViolationsByOwner: ['owner', 'violatedSpend', 'violatedSpendPct'],
        ingestionHealth: ['lastSuccessfulIngestion', 'freshnessLagHours', 'missingDays30d', 'duplicateLoadCount', 'coverageCompletenessPct'],
      },
      generatedAt: new Date().toISOString(),
      formulaVersion: 'governance_v1',
      currency: 'USD',
    };

    return {
      score: trustScore,
      totalRows,
      costAtRisk: roundTo(untagged, 2),
      buckets: {
        untagged: rows.filter((row) => row._issues.includes('Untagged')),
        missingMeta: rows.filter((row) => row._issues.includes('Missing ID') || row._issues.includes('Missing Service')),
        anomalies: rows.filter((row) => row._issues.includes('Zero Cost')),
        all: rows,
      },
      compliance: coverageByKey.slice(0, 5).map((row) => ({ key: row.key, count: 0, pct: row.coveragePct })),
      trendData: dayRows.map((d) => ({ date: d.date, score: roundTo(costSharePercentage(d.tagged, d.total), 2) })),
      topOffenders: topMissingByService.slice(0, 5).map((row) => ({ name: row.service, count: 0, cost: row.spend })),
      governance,
      tagCoveragePct: taggedPct,
      ownershipCoveragePct: allocatedPct,
      sharedPoolPct: sharedPct,
      policyViolatedSpendPct: violatedPct,
      freshnessLagHours,
      denominatorCoveragePct: denCoveragePct,
    };
  },

  async getGovernanceSnapshot(options = {}, ttlMs = SNAPSHOT_TTL_MS) {
    const { filters = {}, startDate = null, endDate = null, uploadIds = [] } = options;
    const cacheKey = JSON.stringify({
      filters,
      startDate,
      endDate,
      uploadIds: Array.isArray(uploadIds) ? [...uploadIds].sort() : [],
    });

    const cached = SNAPSHOT_CACHE.get(cacheKey);
    const nowMs = Date.now();
    if (cached && nowMs - cached.createdAt <= ttlMs) {
      return cached.payload;
    }

    const payload = await this.analyzeDataQuality(options);
    SNAPSHOT_CACHE.set(cacheKey, { createdAt: nowMs, payload });
    return payload;
  },

  async getQualityImpactBanner(options = {}) {
    const snapshot = await this.getGovernanceSnapshot(options, 60000);
    const governance = snapshot?.governance || null;
    if (!governance) {
      return {
        last_checked_ts: new Date().toISOString(),
        severity: 'critical',
        confidence_level: 'low',
        recommended_owner: 'FinOps',
        overall_status: 'fail',
        message: 'Limited confidence in key numbers. Upload scoped billing data to evaluate trust gates.',
        active_gate_ids: ['freshness', 'coverage', 'denominator_quality', 'cost_basis'],
        impact_scope_chips: ['Spend KPIs', 'Allocation', 'Unit Econ', 'Forecast'],
        gate_summaries: [],
        behavior: { confidence_label_mode: 'limited_confidence' },
        ttl_seconds: 60,
      };
    }

    return buildQualityImpactBanner(governance);
  },

  async getFreshnessStatus(options = {}) {
    const snapshot = await this.getGovernanceSnapshot(options, 120000);
    const governance = snapshot?.governance || null;
    const m = governance?.ingestionReliability || {};
    const score = n(m.score);

    return {
      last_checked_ts: governance?.generatedAt || new Date().toISOString(),
      severity: mapScoreToSeverity(score),
      confidence_level: confidenceLevelFromScore(snapshot?.score),
      recommended_owner: 'Data Engineering',
      summary: {
        reliability_score: score,
        freshness_lag_hours: m.freshnessLagHours,
        missing_days_30d: m.missingDays30d || 0,
        duplicate_load_pct: n(m.duplicateLoadPct),
      },
      sources: [
        {
          provider: options?.filters?.provider || 'All',
          source_id: 'billing-ingestion',
          last_success_ts: m.lastSuccessfulIngestion || null,
          lag_hours: m.freshnessLagHours,
          sla_soft_hours: 24,
          sla_hard_hours: 36,
          status:
            n(m.freshnessLagHours) > 36
              ? 'fail'
              : n(m.freshnessLagHours) > 24
              ? 'warn'
              : 'pass',
        },
      ],
    };
  },

  async getCoverageGates(options = {}) {
    const snapshot = await this.getGovernanceSnapshot(options, 120000);
    const governance = snapshot?.governance || null;
    const m = governance?.ingestionReliability || {};

    const gates = {
      missing_accounts: {
        value: n(m.missingAccountsCount),
        status: n(m.missingAccountsCount) > 0 ? 'fail' : 'pass',
      },
      missing_days: {
        value: n(m.missingDays30d),
        status: n(m.missingDays30d) > 0 ? 'fail' : 'pass',
      },
      duplicates: {
        value: n(m.duplicateLoadCount),
        status: n(m.duplicateLoadPct) > 1 ? 'fail' : n(m.duplicateLoadCount) > 0 ? 'warn' : 'pass',
      },
      late_arriving: {
        value: n(m.lateArrivingDataCount),
        status: n(m.lateArrivingDataCount) > 0 ? 'warn' : 'pass',
      },
    };

    const gateLevels = Object.values(gates).map((g) => normalizeGateSeverity(g.status));
    const worstLevel = gateLevels.reduce((worst, cur) =>
      severityRank[cur] > severityRank[worst] ? cur : worst, 'pass');

    return {
      last_checked_ts: governance?.generatedAt || new Date().toISOString(),
      severity: worstLevel,
      confidence_level: confidenceLevelFromScore(snapshot?.score),
      recommended_owner: 'Data Engineering',
      gates,
      summary: {
        expected_accounts: n(m.expectedAccounts),
        ingested_accounts_30d: n(m.ingestedAccounts30d),
        coverage_completeness_pct: n(m.coverageCompletenessPct),
      },
      rows: {
        missing_days: Array.isArray(m.missingDaysList) ? m.missingDaysList : [],
      },
    };
  },

  async getTagCompliance(options = {}) {
    const snapshot = await this.getGovernanceSnapshot(options, 180000);
    const governance = snapshot?.governance || null;
    const m = governance?.tagMetadata || {};

    return {
      last_checked_ts: governance?.generatedAt || new Date().toISOString(),
      severity: mapScoreToSeverity(governance?.overview?.scores?.tagComplianceScore),
      confidence_level: confidenceLevelFromScore(snapshot?.score),
      recommended_owner: 'FinOps',
      spend_weighted_compliance_pct: n(m.tagCoveragePct),
      missing_tag_spend: n(m.untaggedSpend),
      invalid_value_pct: n(m.invalidValuePct),
      matrix_rows: Array.isArray(m.coverageByKey) ? m.coverageByKey : [],
      top_offenders: {
        services: Array.isArray(m.topMissingByService) ? m.topMissingByService : [],
        accounts: Array.isArray(m.topMissingByAccount) ? m.topMissingByAccount : [],
      },
    };
  },

  async getOwnershipCompleteness(options = {}) {
    const snapshot = await this.getGovernanceSnapshot(options, 180000);
    const governance = snapshot?.governance || null;
    const m = governance?.ownershipAllocation || {};

    return {
      last_checked_ts: governance?.generatedAt || new Date().toISOString(),
      severity: mapScoreToSeverity(m.allocationConfidenceScore),
      confidence_level: confidenceLevelFromScore(snapshot?.score),
      recommended_owner: 'FinOps',
      required_fields: ['team', 'product', 'environment', 'cost_center'],
      completeness_score_pct: n(m.allocatedPct),
      unowned_spend: n(m.unallocatedSpend),
      coverage: {
        allocated_pct: n(m.allocatedPct),
        unallocated_pct: n(m.unallocatedPct),
        mapping_stability_pct: n(m.mappingStabilityPct),
      },
      drivers: [
        { key: 'unallocated_trend_mom', value: n(m.unallocatedTrendMoM) },
        { key: 'rule_churn_rate', value: n(m.ruleChurnRate) },
      ],
    };
  },

  async getCurrencyBasisChecks(options = {}) {
    const snapshot = await this.getGovernanceSnapshot(options, 120000);
    const governance = snapshot?.governance || null;
    const m = governance?.costBasisConsistency || {};

    const mismatchPct = Math.max(0, 100 - n(m.currencyConsistencyPct));
    return {
      last_checked_ts: governance?.generatedAt || new Date().toISOString(),
      severity: mismatchPct > 3 ? 'fail' : mismatchPct > 1 ? 'warn' : 'pass',
      confidence_level: confidenceLevelFromScore(snapshot?.score),
      recommended_owner: 'Finance',
      fx_health: {
        source_status: n(m.currencyConsistencyPct) >= 99 ? 'healthy' : 'degraded',
        stale_hours: null,
        missing_pairs: Math.max(0, (Array.isArray(m.currencies) ? m.currencies.length : 0) - 1),
      },
      mismatch_spend_pct: roundTo(mismatchPct, 2),
      basis_checks: {
        dominant_currency: m.dominantCurrency || 'USD',
        amortization_mode_consistency: n(m.amortizationModeConsistency),
        commitment_treatment_consistency: n(m.commitmentTreatmentConsistency),
        credits_refunds_consistency: n(m.creditsRefundConsistency),
      },
      drift_events: Array.isArray(m.costBasisDriftEvents) ? m.costBasisDriftEvents : [],
    };
  },

  async getDenominatorQuality(options = {}) {
    const snapshot = await this.getGovernanceSnapshot(options, 90000);
    const governance = snapshot?.governance || null;
    const m = governance?.denominatorQuality || {};

    const severity =
      m.trustGateStatus === 'blocked' ? 'fail' : m.trustGateStatus === 'flagged' ? 'warn' : 'pass';

    const reasonCodes = [];
    if (n(m.denominatorCoveragePct) < 95) reasonCodes.push('missing_denominator');
    if (n(m.granularityAlignmentPct) < 95) reasonCodes.push('granularity_mismatch');
    if (n(m.denominatorStalenessPct) > 10) reasonCodes.push('stale_denominator');

    return {
      last_checked_ts: governance?.generatedAt || new Date().toISOString(),
      severity,
      confidence_level: confidenceLevelFromScore(snapshot?.score),
      recommended_owner: 'Product Analytics',
      readiness_status: m.trustGateStatus || 'blocked',
      availability_pct: n(m.denominatorCoveragePct),
      mapping_completeness_pct: n(m.granularityAlignmentPct),
      invalid_volume_pct: n(m.denominatorStalenessPct),
      reason_codes: reasonCodes,
      affected_metric_keys: ['unit_cost', 'cost_per_request', 'cost_per_transaction'],
      impact: {
        unit_economics_confidence: severity === 'fail' ? 'low' : severity === 'warn' ? 'medium' : 'high',
      },
    };
  },

  async getControlViolations(options = {}) {
    const snapshot = await this.getGovernanceSnapshot(options, 120000);
    const governance = snapshot?.governance || null;
    const m = governance?.policyCompliance || {};
    const severity = n(m.violatedSpendPct) > 3 ? 'fail' : n(m.violatedSpendPct) > 1 ? 'warn' : 'pass';

    return {
      last_checked_ts: governance?.generatedAt || new Date().toISOString(),
      severity,
      confidence_level: confidenceLevelFromScore(snapshot?.score),
      recommended_owner: 'Security',
      summary: {
        violation_count: n(m.violationsCount),
        violated_spend: n(m.violatedSpend),
        violated_spend_pct: n(m.violatedSpendPct),
      },
      severity_summary: Array.isArray(m.severitySummary) ? m.severitySummary : [],
      top_violating_teams: Array.isArray(m.topViolatingTeams) ? m.topViolatingTeams : [],
      top_violating_services: Array.isArray(m.topViolatingServices) ? m.topViolatingServices : [],
      top_violating_accounts: Array.isArray(m.topViolatingAccounts) ? m.topViolatingAccounts : [],
      policy_categories: [
        'non_prod_threshold',
        'public_ip_exposure',
        'unapproved_region',
        'missing_required_tags',
      ],
    };
  },
};
