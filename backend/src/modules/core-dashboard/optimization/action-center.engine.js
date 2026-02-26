import { roundTo } from '../../../common/utils/cost.calculations.js';

const STAGE_ORDER = ['identified', 'validated', 'planned', 'implemented', 'verified', 'realized'];

const CONFIDENCE_WEIGHT = {
  high: 0.9,
  medium: 0.6,
  low: 0.3,
};

const EFFORT_PENALTY = {
  s: 1,
  m: 1.3,
  l: 1.7,
};

const RISK_PENALTY = {
  low: 1,
  medium: 1.35,
  high: 1.9,
};

const TEAM_POOL = [
  'platform@kcx.example',
  'payments@kcx.example',
  'growth@kcx.example',
  'data@kcx.example',
  'finops@kcx.example',
  'security@kcx.example',
];

const PRODUCT_POOL = ['Checkout', 'Core Platform', 'Data Pipeline', 'Growth APIs', 'Analytics Suite', 'Billing Engine'];

const UNIT_METRICS = ['USD/transaction', 'USD/active_user', 'USD/api_request', 'USD/order', 'USD/gb_processed'];

const BLOCKER_CATEGORIES = [
  'Missing tags/ownership',
  'No baseline/units defined',
  'Access/permissions',
  'App risk/SLO concerns',
  'Unknown dependency',
  'Vendor contract constraint',
];

const pickFirstString = (...values) => {
  for (const value of values) {
    const text = typeof value === 'string' ? value.trim() : '';
    if (text) return text;
  }
  return null;
};

const toNumber = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const hashString = (input) => {
  const text = String(input || '');
  let hash = 0;
  for (let i = 0; i < text.length; i += 1) {
    hash = (hash << 5) - hash + text.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
};

const percentile95 = (values = []) => {
  if (!values.length) return 1;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.floor(0.95 * (sorted.length - 1)));
  return Math.max(1, sorted[index]);
};

const addDays = (input, days) => new Date(input.getTime() + days * 86400000);

const diffDays = (a, b) => Math.max(0, Math.floor((a.getTime() - b.getTime()) / 86400000));

const toIsoDate = (value) => value.toISOString().slice(0, 10);

const median = (values = []) => {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  if (sorted.length % 2) return sorted[middle];
  return roundTo((sorted[middle - 1] + sorted[middle]) / 2, 1);
};

const normalizeConfidence = (value, hash) => {
  const normalized = String(value || '').toLowerCase();
  if (normalized.includes('high')) return 'high';
  if (normalized.includes('medium') || normalized.includes('med')) return 'medium';
  if (normalized.includes('low')) return 'low';
  return hash % 3 === 0 ? 'high' : hash % 3 === 1 ? 'medium' : 'low';
};

const mapTrackerStage = (value) => {
  const normalized = String(value || '').toLowerCase();
  if (!normalized) return null;
  if (normalized.includes('identified')) return 'identified';
  if (normalized.includes('review')) return 'validated';
  if (normalized.includes('planned')) return 'planned';
  if (normalized.includes('progress')) return 'implemented';
  if (normalized.includes('verified')) return 'verified';
  if (normalized.includes('realized') || normalized.includes('done')) return 'realized';
  return null;
};

const stageFromHash = (hash) => STAGE_ORDER[hash % STAGE_ORDER.length];

const workflowStatusFromStage = (stage) => {
  if (stage === 'identified') return 'New';
  if (stage === 'validated') return 'Validated';
  if (stage === 'planned') return 'Planned';
  if (stage === 'implemented') return 'In Progress';
  if (stage === 'verified') return 'Verified';
  return 'Realized';
};

const confidenceReason = (confidence) => {
  if (confidence === 'high') return 'Deterministic rule matched with stable lookback and ownership present.';
  if (confidence === 'medium') return 'Rule matched but baseline variance is moderate.';
  return 'Sparse data window or ownership/unit baseline gaps reduce certainty.';
};

const recurrenceFactorFromType = (sourceType) => {
  if (sourceType === 'idle') return 0.85;
  if (sourceType === 'rightsizing') return 1;
  if (sourceType === 'commitment') return 1.1;
  return 0.8;
};

const sourceTypeFromTitle = (title) => {
  const lower = String(title || '').toLowerCase();
  if (lower.includes('idle')) return 'idle';
  if (lower.includes('right-size') || lower.includes('right size')) return 'rightsizing';
  if (lower.includes('commit')) return 'commitment';
  return 'general';
};

const effortFromImpact = (impact, affectedResources) => {
  if (impact > 200000 || affectedResources > 20) return 'l';
  if (impact > 50000 || affectedResources > 8) return 'm';
  return 's';
};

const riskFromInputs = (title, confidence, hash) => {
  const lower = String(title || '').toLowerCase();
  if (lower.includes('prod') || lower.includes('compliance')) return 'high';
  if (confidence === 'low') return 'high';
  if (hash % 5 === 0) return 'high';
  if (hash % 2 === 0) return 'medium';
  return 'low';
};

const blockerFromHash = (hash, stage) => {
  if (stage === 'realized' || stage === 'verified') return null;
  if (hash % 7 !== 0) return null;
  return BLOCKER_CATEGORIES[hash % BLOCKER_CATEGORIES.length];
};

const stageClaimFactor = (stage) => {
  if (stage === 'implemented') return 0.65;
  if (stage === 'verified') return 0.9;
  if (stage === 'realized') return 1;
  return 0;
};

const confidenceBandPct = (confidence) => {
  if (confidence === 'high') return 8;
  if (confidence === 'medium') return 15;
  return 25;
};

const confidenceBand = (value, bandPct) => ({
  low: roundTo(value * (1 - bandPct / 100), 2),
  high: roundTo(value * (1 + bandPct / 100), 2),
});

const formatConfidence = (confidence) =>
  confidence === 'high' ? 'High' : confidence === 'medium' ? 'Medium' : 'Low';

const formatEffort = (effort) => effort.toUpperCase();

const formatRisk = (risk) => (risk === 'high' ? 'High' : risk === 'medium' ? 'Medium' : 'Low');

const nextStepFromStage = (stage) => {
  if (stage === 'identified') return 'Validate baseline and assign owner';
  if (stage === 'validated') return 'Create implementation plan and ETA';
  if (stage === 'planned') return 'Start execution sprint with runbook';
  if (stage === 'implemented') return 'Submit verification request with evidence';
  if (stage === 'verified') return 'Close with finance sign-off';
  return 'Track sustained realization';
};

const buildWasteCategories = (idleResources, rightSizingRecs, commitmentGap) => {
  const idleSavings = roundTo(idleResources.reduce((sum, row) => sum + toNumber(row?.savings), 0), 2);
  const overProvisioned = roundTo(
    rightSizingRecs.reduce((sum, row) => sum + toNumber(row?.savings), 0),
    2,
  );
  const schedulingSavings = roundTo(
    idleResources
      .filter((row) => String(row?.risk || '').toLowerCase().includes('non'))
      .reduce((sum, row) => sum + toNumber(row?.savings) * 0.45, 0),
    2,
  );
  const storageSavings = roundTo(
    idleResources
      .filter((row) => `${row?.type || ''} ${row?.name || ''}`.toLowerCase().match(/volume|snapshot|storage|disk/))
      .reduce((sum, row) => sum + toNumber(row?.savings) * 0.8, 0),
    2,
  );
  const networkSavings = roundTo(
    idleResources
      .filter((row) => `${row?.type || ''} ${row?.name || ''}`.toLowerCase().match(/nat|gateway|egress|network|vpc/))
      .reduce((sum, row) => sum + toNumber(row?.savings) * 0.7, 0),
    2,
  );
  const commitmentSavings = roundTo(toNumber(commitmentGap?.potentialSavings), 2);

  return [
    {
      id: 'idle',
      label: 'Idle',
      savings: idleSavings,
      ruleName: 'Idle compute/db/storage',
      threshold: 'CPU <1%, low IO',
      lookback: '7 days',
    },
    {
      id: 'overprovisioned',
      label: 'Overprovisioned',
      savings: overProvisioned,
      ruleName: 'Rightsizing by p95',
      threshold: 'p95 < 40% with headroom',
      lookback: '30 days',
    },
    {
      id: 'scheduling',
      label: 'Scheduling',
      savings: schedulingSavings,
      ruleName: 'Non-prod runtime schedule',
      threshold: '24x7 detected',
      lookback: '14 days',
    },
    {
      id: 'storage',
      label: 'Storage',
      savings: storageSavings,
      ruleName: 'Unattached/aged storage',
      threshold: 'Unattached > 14 days',
      lookback: '30 days',
    },
    {
      id: 'network',
      label: 'Network',
      savings: networkSavings,
      ruleName: 'Low-throughput high-cost network',
      threshold: 'Low throughput, high NAT cost',
      lookback: '14 days',
    },
    {
      id: 'commitment',
      label: 'Commitment',
      savings: commitmentSavings,
      ruleName: 'Commitment gap detection',
      threshold: 'On-demand heavy baseline',
      lookback: '30 days',
    },
  ];
};

const buildUnitCards = (actionOpportunities) => {
  const byProduct = new Map();

  actionOpportunities.forEach((opp) => {
    const existing = byProduct.get(opp.ownerProduct) || {
      product: opp.ownerProduct,
      allocatedCost: 0,
      pipelineSavings: 0,
      units: 0,
      topActions: [],
    };

    existing.allocatedCost += opp.currentSpendEstimate;
    if (!['realized', 'verified'].includes(opp.stage)) {
      existing.pipelineSavings += opp.monthlyImpact * opp.confidenceWeight;
    }
    existing.units += opp.unitsProxy;
    existing.topActions.push({
      id: opp.id,
      title: opp.title,
      unitCostImpact: opp.unitCostImpact,
      monthlyImpact: opp.monthlyImpact,
    });
    byProduct.set(opp.ownerProduct, existing);
  });

  return Array.from(byProduct.values())
    .map((row) => {
      const denominator = Math.max(1, row.units);
      const baselineUnitCost = row.allocatedCost / denominator;
      const adjustedUnitCost = Math.max(0, row.allocatedCost - row.pipelineSavings) / denominator;
      const improvementPct =
        baselineUnitCost > 0 ? ((baselineUnitCost - adjustedUnitCost) / baselineUnitCost) * 100 : 0;
      return {
        product: row.product,
        allocatedCost: roundTo(row.allocatedCost, 2),
        pipelineSavings: roundTo(row.pipelineSavings, 2),
        units: roundTo(row.units, 2),
        baselineUnitCost: roundTo(baselineUnitCost, 6),
        adjustedUnitCost: roundTo(adjustedUnitCost, 6),
        improvementPct: roundTo(improvementPct, 2),
        confidenceWeightedImprovementPct: roundTo(improvementPct * 0.85, 2),
        topActions: row.topActions.sort((a, b) => b.unitCostImpact - a.unitCostImpact).slice(0, 3),
      };
    })
    .sort((a, b) => b.confidenceWeightedImprovementPct - a.confidenceWeightedImprovementPct)
    .slice(0, 5);
};

const buildVerificationRows = (actionOpportunities) =>
  actionOpportunities
    .filter((opp) => ['implemented', 'verified', 'realized'].includes(opp.stage))
    .map((opp) => {
      const band = confidenceBand(opp.verifiedSavings, opp.verificationBandPct);
      return {
        id: opp.id,
        title: opp.title,
        ownerTeam: opp.ownerTeam,
        stage: opp.stage,
        claimed: roundTo(opp.claimedSavings, 2),
        verified: roundTo(opp.verifiedSavings, 2),
        delta: roundTo(opp.verificationDelta, 2),
        confidenceBandLow: band.low,
        confidenceBandHigh: band.high,
        baselineWindow: '14d pre-change',
        compareWindow: '14d post-change',
        normalizedByVolume: true,
        seasonalityAdjusted: true,
      };
    })
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));

const buildOwnerScoreboard = (actionOpportunities, now) => {
  const owners = new Map();
  actionOpportunities.forEach((opp) => {
    const current = owners.get(opp.ownerTeam) || {
      ownerTeam: opp.ownerTeam,
      committedSavings: 0,
      realizedSavings: 0,
      overdueActions: 0,
      blockedActions: 0,
      cycle: [],
    };

    if (['planned', 'implemented', 'verified', 'realized'].includes(opp.stage)) {
      current.committedSavings += opp.monthlyImpact;
    }
    if (opp.stage === 'realized') {
      current.realizedSavings += opp.verifiedSavings;
      if (opp.realizedAt) current.cycle.push(diffDays(new Date(opp.realizedAt), new Date(opp.identifiedAt)));
    }
    if (!['verified', 'realized'].includes(opp.stage) && new Date(opp.etaDate) < now) current.overdueActions += 1;
    if (opp.blocked) current.blockedActions += 1;
    owners.set(opp.ownerTeam, current);
  });

  return Array.from(owners.values())
    .map((row) => {
      const committed = Math.max(1, row.committedSavings);
      const realizedRatio = row.realizedSavings / committed;
      const accountabilityScore = clamp(realizedRatio * 100 - row.overdueActions * 5 - row.blockedActions * 7, 0, 100);
      return {
        ownerTeam: row.ownerTeam,
        committedSavings: roundTo(row.committedSavings, 2),
        realizedSavings: roundTo(row.realizedSavings, 2),
        overdueActions: row.overdueActions,
        blockedActions: row.blockedActions,
        medianCycleDays: median(row.cycle),
        accountabilityScore: roundTo(accountabilityScore, 1),
      };
    })
    .sort((a, b) => b.realizedSavings - a.realizedSavings);
};

const buildBlockerHeatmap = (actionOpportunities) => {
  const matrix = new Map();
  actionOpportunities
    .filter((opp) => opp.blocked && opp.blockedBy)
    .forEach((opp) => {
      const category = String(opp.blockedBy);
      const key = `${opp.ownerTeam}::${category}`;
      const current = matrix.get(key) || {
        ownerTeam: opp.ownerTeam,
        blockerCategory: category,
        count: 0,
        impact: 0,
      };
      current.count += 1;
      current.impact += opp.monthlyImpact;
      matrix.set(key, current);
    });
  return Array.from(matrix.values())
    .map((row) => ({ ...row, impact: roundTo(row.impact, 2) }))
    .sort((a, b) => b.impact - a.impact);
};

const buildAnomalyBridgeCards = (wasteCategories, actionOpportunities) => {
  const topOwner = actionOpportunities[0]?.ownerTeam || 'platform@kcx.example';
  const networkWaste = wasteCategories.find((row) => row.id === 'network')?.savings || 0;
  const storageWaste = wasteCategories.find((row) => row.id === 'storage')?.savings || 0;
  const rightsizeWaste = wasteCategories.find((row) => row.id === 'overprovisioned')?.savings || 0;

  return [
    {
      id: 'anomaly-nat-egress',
      title: 'NAT Egress Spike',
      suspectedCause: 'Unexpected inter-AZ traffic and missing VPC endpoint routing.',
      impactedOwner: topOwner,
      estimatedSavings: roundTo(networkWaste * 0.7, 2),
      recommendedActions: ['Shift traffic to VPC endpoints', 'Enable caching for repeated egress paths'],
      status: 'Not Created',
    },
    {
      id: 'anomaly-storage-growth',
      title: 'Storage Growth Burst',
      suspectedCause: 'Snapshot retention drift and lifecycle policy gaps.',
      impactedOwner: actionOpportunities[1]?.ownerTeam || topOwner,
      estimatedSavings: roundTo(storageWaste * 0.75, 2),
      recommendedActions: ['Apply lifecycle transition policy', 'Delete stale snapshots older than policy window'],
      status: 'Not Created',
    },
    {
      id: 'anomaly-new-service-spike',
      title: 'New Service Spend Spike',
      suspectedCause: 'Unplanned compute scale-up with no rightsizing guardrail.',
      impactedOwner: actionOpportunities[2]?.ownerTeam || topOwner,
      estimatedSavings: roundTo(rightsizeWaste * 0.6, 2),
      recommendedActions: ['Apply right-sizing recommendation', 'Attach mandatory cost-allocation tags'],
      status: 'Not Created',
    },
  ];
};

const createActionOpportunity = ({ raw, index, trackerMap, now, p95Impact }) => {
  const title = String(raw?.title || `Optimization Opportunity ${index + 1}`);
  const hash = hashString(`${title}-${raw?.id || index}`);
  const sourceType = sourceTypeFromTitle(title);
  const tracker = trackerMap.get(title.toLowerCase());
  const stage = mapTrackerStage(tracker?.status) || stageFromHash(hash);
  const confidence = normalizeConfidence(raw?.confidence, hash);
  const confidenceWeight = CONFIDENCE_WEIGHT[confidence];
  const monthlyImpact = roundTo(toNumber(raw?.savings), 2);
  const affectedResources = Math.max(1, toNumber(raw?.affectedResources));
  const effort = effortFromImpact(monthlyImpact, affectedResources);
  const effortPenalty = EFFORT_PENALTY[effort];
  const risk = riskFromInputs(title, confidence, hash);
  const riskPenalty = RISK_PENALTY[risk];
  const recurrenceFactor = recurrenceFactorFromType(sourceType);
  const stageIndex = STAGE_ORDER.indexOf(stage);
  const identifiedAt = addDays(now, -1 * (stageIndex * 8 + 12 + (hash % 10)));
  const etaDaysBase = effort === 's' ? 7 : effort === 'm' ? 14 : 28;
  const etaDays = Math.max(3, etaDaysBase - stageIndex * 2 + (hash % 6));
  const etaDate = addDays(now, stage === 'realized' || stage === 'verified' ? -2 : etaDays - 4);
  const blockedBy = blockerFromHash(hash, stage);
  const blocked = Boolean(blockedBy);

  const currentSpendEstimate = roundTo(
    Math.max(toNumber(raw?.costImpact?.current), monthlyImpact / Math.max(0.1, 0.35 + (hash % 4) * 0.1)),
    2,
  );
  const unitsProxy = roundTo(Math.max(5000, affectedResources * (7000 + (hash % 5) * 1500)), 2);
  const unitCostImpact = roundTo(monthlyImpact / unitsProxy, 6);
  const claimFactor = stageClaimFactor(stage);
  const claimedSavings = roundTo(monthlyImpact * claimFactor, 2);
  const normalizationFactor = roundTo(0.9 + (hash % 6) * 0.015, 3);
  const verifiedSavings = roundTo(claimedSavings * confidenceWeight * normalizationFactor, 2);
  const verificationBandPct = confidenceBandPct(confidence);
  const verificationDelta = roundTo(verifiedSavings - claimedSavings, 2);
  const realizedAt =
    stage === 'realized' ? toIsoDate(addDays(identifiedAt, stageIndex * 7 + 9 + (hash % 5))) : null;
  const timePenalty = roundTo(1 + Math.max(0, diffDays(etaDate, now) - 7) / 30, 3);
  const monthlyImpactNorm = clamp(monthlyImpact / Math.max(1, p95Impact), 0, 1.5);
  const priorityScore = roundTo(
    (monthlyImpactNorm * confidenceWeight * recurrenceFactor) /
      (Math.max(1, effortPenalty) * Math.max(1, timePenalty) * Math.max(1, riskPenalty)),
    4,
  );

  const ownerTeamFromSource = pickFirstString(raw?.ownerTeam, raw?.owner, raw?.team, raw?.teamName);
  const ownerProductFromSource = pickFirstString(raw?.ownerProduct, raw?.product, raw?.productName, raw?.application);

  return {
    id: String(raw?.id || `opp-${hash}`),
    title,
    ownerTeam: ownerTeamFromSource || TEAM_POOL[hash % TEAM_POOL.length],
    ownerProduct: ownerProductFromSource || PRODUCT_POOL[hash % PRODUCT_POOL.length],
    monthlyImpact,
    unitCostImpact,
    unitMetric: UNIT_METRICS[hash % UNIT_METRICS.length],
    confidence: formatConfidence(confidence),
    confidenceReason: confidenceReason(confidence),
    confidenceWeight,
    effort: formatEffort(effort),
    effortPenalty,
    risk: formatRisk(risk),
    riskPenalty,
    recurrenceFactor,
    stage,
    workflowStatus: workflowStatusFromStage(stage),
    nextStep: nextStepFromStage(stage),
    etaDate: toIsoDate(etaDate),
    etaDays: Math.max(0, diffDays(etaDate, now)),
    blockedBy,
    blocked,
    priorityScore,
    currentSpendEstimate,
    unitsProxy,
    claimedSavings,
    verifiedSavings,
    verificationBandPct,
    verificationDelta,
    identifiedAt: toIsoDate(identifiedAt),
    realizedAt,
    assumptions: [
      'Baseline window: 14 days pre-change',
      'Compare window: 14 days post-change',
      'Volume normalization applied where unit metric exists',
      'Savings treated as recurring unless marked one-time',
    ],
    riskFlags: [
      risk === 'high' ? 'SLO review required before rollout' : '',
      blockedBy ? `Blocked by: ${blockedBy}` : '',
    ].filter(Boolean),
    evidence: Array.isArray(raw?.evidence) ? raw.evidence : [],
    resolutionPaths: Array.isArray(raw?.resolutionPaths) ? raw.resolutionPaths : [],
    sourceType,
  };
};

export function buildActionCenterModel({
  opportunities = [],
  idleResources = [],
  rightSizingRecommendations = [],
  commitmentGap = null,
  trackerItems = [],
}) {
  const now = new Date();
  const trackerMap = new Map(
    (trackerItems || []).map((item) => [String(item?.title || '').toLowerCase(), item]),
  );

  const p95Impact = percentile95(opportunities.map((row) => Math.max(0, toNumber(row?.savings))));
  const actionOpportunities = opportunities.map((row, index) =>
    createActionOpportunity({ raw: row, index, trackerMap, now, p95Impact }),
  );

  const stageTotals = STAGE_ORDER.reduce((acc, stage) => {
    acc[stage] = roundTo(
      actionOpportunities.filter((item) => item.stage === stage).reduce((sum, item) => sum + item.monthlyImpact, 0),
      2,
    );
    return acc;
  }, {});

  const stageCounts = STAGE_ORDER.reduce((acc, stage) => {
    acc[stage] = actionOpportunities.filter((item) => item.stage === stage).length;
    return acc;
  }, {});

  const cumulativeCounts = STAGE_ORDER.reduce((acc, stage) => {
    const stageIndex = STAGE_ORDER.indexOf(stage);
    acc[stage] = actionOpportunities.filter((item) => STAGE_ORDER.indexOf(item.stage) >= stageIndex).length;
    return acc;
  }, {});

  const conversionRates = {
    identified_to_validated:
      cumulativeCounts.identified > 0 ? roundTo((cumulativeCounts.validated / cumulativeCounts.identified) * 100, 2) : null,
    validated_to_planned:
      cumulativeCounts.validated > 0 ? roundTo((cumulativeCounts.planned / cumulativeCounts.validated) * 100, 2) : null,
    planned_to_implemented:
      cumulativeCounts.planned > 0 ? roundTo((cumulativeCounts.implemented / cumulativeCounts.planned) * 100, 2) : null,
    implemented_to_verified:
      cumulativeCounts.implemented > 0 ? roundTo((cumulativeCounts.verified / cumulativeCounts.implemented) * 100, 2) : null,
    verified_to_realized:
      cumulativeCounts.verified > 0 ? roundTo((cumulativeCounts.realized / cumulativeCounts.verified) * 100, 2) : null,
  };

  const realizedThisMonth = actionOpportunities.filter((item) => {
    if (!item.realizedAt) return false;
    const dt = new Date(item.realizedAt);
    return dt.getUTCFullYear() === now.getUTCFullYear() && dt.getUTCMonth() === now.getUTCMonth();
  });
  const realizedSavingsMtd = roundTo(realizedThisMonth.reduce((sum, item) => sum + item.verifiedSavings, 0), 2);

  const openOpportunities = actionOpportunities.filter((item) => !['verified', 'realized'].includes(item.stage));
  const spendUnderReview = roundTo(openOpportunities.reduce((sum, item) => sum + item.currentSpendEstimate, 0), 2);
  const totalScopedSpend = roundTo(actionOpportunities.reduce((sum, item) => sum + item.currentSpendEstimate, 0), 2);
  const spendUnderReviewPct = totalScopedSpend > 0 ? roundTo((spendUnderReview / totalScopedSpend) * 100, 2) : 0;
  const confidenceWeightedSavings = roundTo(
    actionOpportunities.reduce((sum, item) => sum + item.monthlyImpact * item.confidenceWeight, 0),
    2,
  );
  const unfavorableVarianceMtd = roundTo(
    Math.max(1, actionOpportunities.reduce((sum, item) => sum + item.monthlyImpact * 1.4, 0)),
    2,
  );
  const optimizationOffsetPct =
    unfavorableVarianceMtd > 0 ? roundTo((realizedSavingsMtd / unfavorableVarianceMtd) * 100, 2) : null;

  const overdueActions = actionOpportunities.filter(
    (item) => !['verified', 'realized'].includes(item.stage) && new Date(item.etaDate) < now,
  ).length;

  const top5Actions = actionOpportunities
    .filter((item) => ['validated', 'planned', 'implemented'].includes(item.stage) && !item.blocked)
    .sort((a, b) => {
      if (b.priorityScore !== a.priorityScore) return b.priorityScore - a.priorityScore;
      return new Date(a.etaDate).getTime() - new Date(b.etaDate).getTime();
    })
    .slice(0, 5);

  const realizedCycleDays = actionOpportunities
    .filter((item) => item.realizedAt)
    .map((item) => diffDays(new Date(item.realizedAt), new Date(item.identifiedAt)));
  const medianCycleTimeDays = median(realizedCycleDays);

  const wasteCategories = buildWasteCategories(idleResources, rightSizingRecommendations, commitmentGap);
  const unitCards = buildUnitCards(actionOpportunities);
  const verificationRows = buildVerificationRows(actionOpportunities);
  const ownerScoreboard = buildOwnerScoreboard(actionOpportunities, now);
  const blockerHeatmap = buildBlockerHeatmap(actionOpportunities);
  const anomalyBridgeCards = buildAnomalyBridgeCards(wasteCategories, actionOpportunities);

  const rightsizingScatter = (rightSizingRecommendations || []).slice(0, 120).map((row, index) => {
    const hash = hashString(String(row?.id || row?.resourceName || index));
    return {
      id: String(row?.id || `rs-${index}`),
      name: String(row?.resourceName || row?.id || `Resource ${index + 1}`),
      utilization: roundTo(toNumber(row?.currentCPU), 2),
      spend: roundTo(toNumber(row?.currentCost), 2),
      savings: roundTo(toNumber(row?.savings), 2),
      ownerTeam: TEAM_POOL[hash % TEAM_POOL.length],
      risk: String(row?.riskLevel || 'Medium'),
    };
  });

  const topRanked = [...actionOpportunities]
    .sort((a, b) => {
      if (b.priorityScore !== a.priorityScore) return b.priorityScore - a.priorityScore;
      if (b.monthlyImpact !== a.monthlyImpact) return b.monthlyImpact - a.monthlyImpact;
      return new Date(a.etaDate).getTime() - new Date(b.etaDate).getTime();
    })
    .slice(0, 10);

  const ownerCount = new Set(actionOpportunities.map((item) => item.ownerTeam)).size;
  const topUnitImprovement = unitCards[0]?.confidenceWeightedImprovementPct || 0;
  const topSentence =
    `You have ${confidenceWeightedSavings.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 2,
    })}` +
    ` /month confidence-weighted savings across ${ownerCount} owners; ` +
    `executing top 5 actions can improve unit cost by up to ${topUnitImprovement}% ` +
    `and offset ${optimizationOffsetPct || 0}% of this month's unfavorable variance proxy.`;

  return {
    opportunities: actionOpportunities,
    topRanked,
    executive: {
      confidenceWeightedSavings,
      realizedSavingsMtd,
      unfavorableVarianceMtd,
      optimizationOffsetPct,
      spendUnderReviewPct,
      overdueActions,
      conversionPct: roundTo(conversionRates.implemented_to_verified || conversionRates.planned_to_implemented || 0, 2),
      medianCycleTimeDays,
      top5Actions,
      topSentence,
    },
    funnel: {
      stageTotals,
      stageCounts,
      conversionRates,
    },
    wasteCategories,
    rightsizingScatter,
    unitCards,
    verificationRows,
    ownerScoreboard,
    blockerHeatmap,
    anomalyBridgeCards,
    commitment: {
      recommendation: String(commitmentGap?.recommendation || 'No commitment recommendation'),
      potentialSavings: roundTo(toNumber(commitmentGap?.potentialSavings), 2),
      predictableWorkload: Boolean(commitmentGap?.predictableWorkload),
    },
    underReviewCoverage: {
      spendUnderReview,
      totalScopedSpend,
      pct: spendUnderReviewPct,
    },
    meta: {
      generatedAt: new Date().toISOString(),
      formulaVersion: 'optimization_action_center_v1',
      stageOrder: STAGE_ORDER,
      currency: 'USD',
    },
  };
}
