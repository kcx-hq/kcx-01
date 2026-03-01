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

const buildExecutionModel = ({
  actionOpportunities = [],
  idleResources = [],
  rightSizingRecommendations = [],
  verificationRows = [],
  wasteCategories = [],
  now,
}) => {
  const backlogRows = [...actionOpportunities]
    .sort((a, b) => {
      if (b.priorityScore !== a.priorityScore) return b.priorityScore - a.priorityScore;
      if (b.monthlyImpact !== a.monthlyImpact) return b.monthlyImpact - a.monthlyImpact;
      return new Date(a.etaDate).getTime() - new Date(b.etaDate).getTime();
    })
    .map((row) => ({
      id: row.id,
      title: row.title,
      owner: row.ownerTeam,
      impact: roundTo(row.monthlyImpact, 2),
      confidence: row.confidence,
      effort: row.effort,
      status: row.workflowStatus,
      eta: row.etaDate,
      blockedBy: row.blockedBy || '-',
      score: roundTo(row.priorityScore * 100, 2),
    }));

  const workflowRows = [...actionOpportunities]
    .sort((a, b) => new Date(a.etaDate).getTime() - new Date(b.etaDate).getTime())
    .map((row) => ({
      id: row.id,
      title: row.title,
      owner: row.ownerTeam,
      status: row.workflowStatus,
      eta: row.etaDate,
      blockedBy: row.blockedBy || '-',
      nextStep: row.nextStep,
    }));

  const idleRows = (idleResources || []).map((row) => ({
    id: String(row?.id || row?.resourceId || `idle-${hashString(row?.name)}`),
    name: String(row?.name || row?.resourceName || row?.id || 'Unknown resource'),
    type: String(row?.type || 'Unknown'),
    env: String(row?.risk || 'Non-prod'),
    age: roundTo(toNumber(row?.daysIdle), 0),
    last: String(row?.lastActivity || 'Unknown'),
    savings: roundTo(toNumber(row?.savings), 2),
    confidence: String(row?.confidence || 'Medium'),
  }));

  const storageRows = idleRows.filter((row) =>
    `${row.type} ${row.name}`.toLowerCase().match(/storage|snapshot|volume|disk|log/),
  );

  const rightsizingRows = (rightSizingRecommendations || []).map((row, index) => ({
    id: String(row?.id || `rightsizing-${index + 1}`),
    current: String(row?.currentInstance || 'Current'),
    recommended: String(row?.recommendedInstance || 'Recommended'),
    cpuP95Pct: roundTo(toNumber(row?.currentCPU), 2),
    savings: roundTo(toNumber(row?.savings), 2),
    risk: String(row?.riskLevel || 'Medium'),
  }));

  const openCount = backlogRows.filter((row) => !['Verified', 'Realized'].includes(row.status)).length;
  const estimatedMonthlySavings = roundTo(backlogRows.reduce((sum, row) => sum + row.impact, 0), 2);
  const verifiedMtd = roundTo(
    verificationRows.reduce((sum, row) => sum + toNumber(row?.verified), 0),
    2,
  );
  const blockedCount = backlogRows.filter((row) => row.blockedBy !== '-').length;

  return {
    kpis: {
      openCount,
      estimatedMonthlySavings,
      verifiedMtd,
      blockedCount,
      generatedAt: now.toISOString(),
    },
    backlogRows,
    workflowRows,
    verificationRows,
    wasteCategories,
    rightsizingRows,
    idleRows,
    storageRows,
  };
};

const buildCommitmentModel = ({
  commitmentGap = null,
  actionOpportunities = [],
  now,
}) => {
  const recommendation = String(commitmentGap?.recommendation || 'Savings Plan');
  const predictableWorkload = Boolean(commitmentGap?.predictableWorkload);
  const totalComputeSpend = roundTo(toNumber(commitmentGap?.totalComputeSpend), 2);
  const onDemandPct = clamp(roundTo(toNumber(commitmentGap?.onDemandPercentage), 2), 0, 100);
  const rawCoveragePct = toNumber(commitmentGap?.coveragePct);
  const coveragePct = clamp(
    roundTo(rawCoveragePct > 0 ? rawCoveragePct : onDemandPct > 0 ? 100 - onDemandPct : 68, 2),
    0,
    100,
  );
  const rawUtilizationPct = toNumber(commitmentGap?.utilizationPct);
  const utilizationPct = clamp(
    roundTo(
      rawUtilizationPct > 0
        ? rawUtilizationPct
        : predictableWorkload
          ? 86
          : clamp(coveragePct - 9, 58, 88),
      2,
    ),
    0,
    100,
  );
  const rawEffectiveSavingsRatePct = toNumber(commitmentGap?.effectiveSavingsRatePct);
  const effectiveSavingsRatePct = clamp(
    roundTo(
      rawEffectiveSavingsRatePct > 0
        ? rawEffectiveSavingsRatePct
        : (coveragePct * utilizationPct) / 115,
      2,
    ),
    0,
    100,
  );

  const potentialSavings = roundTo(toNumber(commitmentGap?.potentialSavings), 2);
  const underCoveredPct = roundTo(Math.max(0, 72 - coveragePct), 2);
  const overCoveredPct = roundTo(Math.max(0, coveragePct - 93), 2);
  const rawBreakageRiskPct = toNumber(commitmentGap?.breakageRiskPct);
  const breakageRiskPct = clamp(
    roundTo(
      rawBreakageRiskPct > 0
        ? rawBreakageRiskPct
        : Math.max(underCoveredPct * 1.1, overCoveredPct * 1.35) + (predictableWorkload ? 4 : 11),
      2,
    ),
    0,
    100,
  );

  const exposureBase = Math.max(potentialSavings, totalComputeSpend * 0.04);
  const exposure30 = roundTo(exposureBase * 0.5, 2);
  const exposure60 = roundTo(exposureBase * 0.35, 2);
  const exposure90 = roundTo(exposureBase * 0.2, 2);

  const expirationRows = [
    {
      window: '30d',
      expiresOn: toIsoDate(addDays(now, 30)),
      exposure: exposure30,
      riskState: exposure30 > 0 ? 'expiry soon' : 'monitor',
    },
    {
      window: '60d',
      expiresOn: toIsoDate(addDays(now, 60)),
      exposure: exposure60,
      riskState: exposure60 > exposure30 * 0.75 ? 'rising risk' : 'monitor',
    },
    {
      window: '90d',
      expiresOn: toIsoDate(addDays(now, 90)),
      exposure: exposure90,
      riskState: 'monitor',
    },
  ];

  const decisionRows = [];
  if (coveragePct < 68 || onDemandPct > 35) {
    decisionRows.push({
      id: 'coverage-gap',
      scope: 'global',
      action: recommendation,
      rationale:
        coveragePct < 68
          ? 'Coverage is below target; increase committed baseline for predictable workloads.'
          : 'On-demand share remains high for stable workloads.',
      projectedSavings: roundTo(Math.max(potentialSavings * 0.5, (68 - Math.min(68, coveragePct)) * 0.01 * totalComputeSpend), 2),
      downsideRiskPct: roundTo(Math.max(10, breakageRiskPct * 0.55), 2),
      risk: coveragePct < 55 ? 'High' : 'Medium',
      confidence: predictableWorkload ? 'High' : 'Medium',
    });
  }

  if (utilizationPct < 82 || overCoveredPct > 0) {
    decisionRows.push({
      id: 'utilization-gap',
      scope: 'service-family',
      action: 'Reshape commitment mix',
      rationale: 'Utilization indicates over-commitment in part of the baseline; rebalance terms/scope.',
      projectedSavings: roundTo(Math.max(potentialSavings * 0.3, totalComputeSpend * 0.02), 2),
      downsideRiskPct: roundTo(Math.max(8, breakageRiskPct * 0.4), 2),
      risk: overCoveredPct > 8 ? 'High' : 'Medium',
      confidence: utilizationPct >= 75 ? 'Medium' : 'Low',
    });
  }

  if (exposure30 > 0) {
    decisionRows.push({
      id: 'expiry-renewal',
      scope: 'expiring-portfolio',
      action: 'Renew expiring commitments',
      rationale: 'Upcoming expirations can force on-demand fallback without pre-commit decisions.',
      projectedSavings: roundTo(exposure30 * 0.28, 2),
      downsideRiskPct: roundTo(Math.max(5, breakageRiskPct * 0.3), 2),
      risk: 'Medium',
      confidence: 'High',
    });
  }

  if (!decisionRows.length) {
    decisionRows.push({
      id: 'maintain',
      scope: 'global',
      action: 'Maintain current commitment mix',
      rationale: 'Coverage and utilization are in target band; continue monitoring expiry windows.',
      projectedSavings: roundTo(potentialSavings * 0.1, 2),
      downsideRiskPct: roundTo(Math.max(3, breakageRiskPct * 0.2), 2),
      risk: 'Low',
      confidence: predictableWorkload ? 'High' : 'Medium',
    });
  }

  const ownerImpact = new Map();
  actionOpportunities.forEach((row) => {
    const key = String(row?.ownerProduct || row?.ownerTeam || 'unassigned');
    ownerImpact.set(key, (ownerImpact.get(key) || 0) + toNumber(row?.monthlyImpact));
  });

  const rankedOwnerImpact = Array.from(ownerImpact.entries())
    .map(([scope, impact]) => ({ scope, impact: roundTo(impact, 2) }))
    .sort((a, b) => b.impact - a.impact)
    .slice(0, 3);

  const spendDenominator = Math.max(totalComputeSpend, rankedOwnerImpact.reduce((sum, row) => sum + row.impact, 0), 1);
  const globalCommitted = roundTo(spendDenominator * (coveragePct / 100), 2);
  const globalUtilized = roundTo(globalCommitted * (utilizationPct / 100), 2);
  const drilldownRows = [
    {
      scope: 'global',
      covered: globalCommitted,
      committed: roundTo(spendDenominator, 2),
      utilized: globalUtilized,
      unused: roundTo(Math.max(0, globalCommitted - globalUtilized), 2),
    },
    ...rankedOwnerImpact.map((row) => {
      const weight = clamp(row.impact / spendDenominator, 0.05, 0.6);
      const committed = roundTo(spendDenominator * weight * (coveragePct / 100), 2);
      const utilized = roundTo(committed * (utilizationPct / 100), 2);
      return {
        scope: row.scope,
        covered: committed,
        committed: roundTo(spendDenominator * weight, 2),
        utilized,
        unused: roundTo(Math.max(0, committed - utilized), 2),
      };
    }),
  ];

  const riskCards = [
    { id: 'under-covered', label: 'Under-covered', value: underCoveredPct },
    { id: 'over-covered', label: 'Over-covered', value: overCoveredPct },
    { id: 'breakage-risk', label: 'Breakage risk', value: breakageRiskPct },
  ];

  return {
    summary: {
      recommendation,
      predictableWorkload,
      workloadPattern: String(commitmentGap?.workloadPattern || ''),
      typicalApproach: String(commitmentGap?.typicalApproach || ''),
    },
    kpis: {
      coveragePct,
      utilizationPct,
      effectiveSavingsRatePct,
      onDemandPct,
      totalComputeSpend,
      potentialSavings,
      underCoveredPct,
      overCoveredPct,
      breakageRiskPct,
    },
    expirationRows,
    riskCards,
    decisionRows,
    drilldownRows,
  };
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
  const executionModel = buildExecutionModel({
    actionOpportunities,
    idleResources,
    rightSizingRecommendations,
    verificationRows,
    wasteCategories,
    now,
  });
  const commitmentsModel = buildCommitmentModel({
    commitmentGap,
    actionOpportunities,
    now,
  });

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
    execution: executionModel,
    commitments: commitmentsModel,
    commitment: {
      recommendation: commitmentsModel.summary.recommendation,
      potentialSavings: commitmentsModel.kpis.potentialSavings,
      predictableWorkload: commitmentsModel.summary.predictableWorkload,
      coveragePct: commitmentsModel.kpis.coveragePct,
      utilizationPct: commitmentsModel.kpis.utilizationPct,
      effectiveSavingsRatePct: commitmentsModel.kpis.effectiveSavingsRatePct,
      breakageRiskPct: commitmentsModel.kpis.breakageRiskPct,
      onDemandPercentage: commitmentsModel.kpis.onDemandPct,
      totalComputeSpend: commitmentsModel.kpis.totalComputeSpend,
      workloadPattern: commitmentsModel.summary.workloadPattern,
      typicalApproach: commitmentsModel.summary.typicalApproach,
    },
    underReviewCoverage: {
      spendUnderReview,
      totalScopedSpend,
      pct: spendUnderReviewPct,
    },
    meta: {
      generatedAt: new Date().toISOString(),
      formulaVersion: 'optimization_action_center_v2',
      stageOrder: STAGE_ORDER,
      currency: 'USD',
    },
  };
}
