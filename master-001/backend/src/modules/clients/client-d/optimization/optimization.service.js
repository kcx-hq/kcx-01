import * as rules from '../../../core-dashboard/optimization/optimization.rules.js';
import { formatCurrency } from '../../../../common/utils/cost.helpers.js';

/** -------------------------
 *  Helpers (Client-D limits)
 *  ------------------------- */
function limitIdle(list = []) {
  // "Limited" = example: keep top 10 by savings
  return Array.isArray(list)
    ? list
        .slice()
        .sort((a, b) => Number(b.potentialSavings || b.savings || 0) - Number(a.potentialSavings || a.savings || 0))
        .slice(0, 10)
    : [];
}

function limitRightSizing(list = []) {
  // "Limited" = example: keep top 10 by savings
  return Array.isArray(list)
    ? list
        .slice()
        .sort((a, b) => Number(b.potentialSavings || b.savings || 0) - Number(a.potentialSavings || a.savings || 0))
        .slice(0, 10)
    : [];
}

/**
 * Convert detectCommitmentGaps() output into a pricing-aware recommendation object
 * (since detectCommitmentGaps returns ONE object)
 */
function enrichCommitmentGapPricingAware(gap = {}) {
  const totalComputeSpend = Number(gap.totalComputeSpend || 0);
  const onDemandPercentage = Number(gap.onDemandPercentage || 0);
  const potentialSavings = Number(gap.potentialSavings || 0);

  // Estimate on-demand spend from % of compute spend
  const onDemandSpend =
    totalComputeSpend > 0 ? (totalComputeSpend * onDemandPercentage) / 100 : 0;

  const estimatedCommitSpend = Math.max(0, onDemandSpend - potentialSavings);

  return {
    ...gap,
    onDemandSpend: Number(onDemandSpend.toFixed(2)),
    onDemandSpendFormatted: formatCurrency(onDemandSpend),

    estimatedCommitSpend: Number(estimatedCommitSpend.toFixed(2)),
    estimatedCommitSpendFormatted: formatCurrency(estimatedCommitSpend),

    effectiveSavingsRate:
      onDemandSpend > 0
        ? Number(((potentialSavings / onDemandSpend) * 100).toFixed(2))
        : 0,

    potentialSavingsFormatted: formatCurrency(potentialSavings),
  };
}

export const clientDOptimizationService = {
  async getRecommendations(params = {}) {
    const [idleAll, rsAll, commitmentRaw] = await Promise.all([
      rules.detectIdleResources(params),
      rules.getRightSizingRecommendations(params),
      rules.detectCommitmentGaps(params), // returns ONE object
    ]);

    const idleResources = limitIdle(idleAll || []);
    const rightSizing = limitRightSizing(rsAll || []);

    // commitment = ONE pricing-aware object recommendation
    const commitmentGap = enrichCommitmentGapPricingAware(commitmentRaw || {});

    // Build unified recommendations list
    const recommendations = [
      ...idleResources.map((r) => ({ ...r, category: 'idle-resource' })),
      ...rightSizing.map((r) => ({ ...r, category: 'right-sizing' })),
      {
        ...commitmentGap,
        category: 'commitment',
        // normalize savings key for your aggregator
        savings: Number(commitmentGap.potentialSavings || 0),
        potentialSavings: Number(commitmentGap.potentialSavings || 0),
      },
    ];

    const totalSavings = recommendations.reduce(
      (sum, x) => sum + Number(x.potentialSavings || x.savings || 0),
      0
    );

    // Priority heuristic
    const high = recommendations.filter((r) => (r.priority || r.risk) === 'high').length;
    const med = recommendations.filter((r) => (r.priority || r.risk) === 'medium').length;
    const low = recommendations.length - high - med;

    return {
      summary: {
        totalPotentialSavings: Number(totalSavings.toFixed(2)),
        totalPotentialSavingsFormatted: formatCurrency(totalSavings),
        recommendationCount: recommendations.length,
        highPriorityCount: high,
        mediumPriorityCount: med,
        lowPriorityCount: low,
      },
      recommendations,
      byCategory: {
        'idle-resource': { count: idleResources.length },
        'right-sizing': { count: rightSizing.length },
        'commitment': { count: 1 },
      },
    };
  },

  async getIdleResources(params = {}) {
    const idleAll = await rules.detectIdleResources(params);
    const idleResources = limitIdle(idleAll || []);

    const totalMonthlyCost = idleResources.reduce(
      (a, r) => a + Number(r.monthlyCost || 0),
      0
    );

    const totalPotentialSavings = idleResources.reduce(
      (a, r) => a + Number(r.potentialSavings || r.savings || 0),
      0
    );

    return {
      idleResources,
      summary: {
        totalIdleResources: idleResources.length,
        totalMonthlyCost: Number(totalMonthlyCost.toFixed(2)),
        totalPotentialSavings: Number(totalPotentialSavings.toFixed(2)),
        totalPotentialSavingsFormatted: formatCurrency(totalPotentialSavings),
        byType: idleResources.reduce((acc, r) => {
          const t = r.idleType || r.type || 'unknown';
          acc[t] = acc[t] || { count: 0, savings: 0 };
          acc[t].count += 1;
          acc[t].savings += Number(r.potentialSavings || r.savings || 0);
          return acc;
        }, {}),
      },
    };
  },

  async getRightSizingRecommendations(params = {}) {
    const rsAll = await rules.getRightSizingRecommendations(params);
    const recommendations = limitRightSizing(rsAll || []);

    const totalPotentialSavings = recommendations.reduce(
      (a, r) => a + Number(r.potentialSavings || r.savings || 0),
      0
    );

    return {
      recommendations,
      summary: {
        totalAnalyzed: Array.isArray(rsAll) ? rsAll.length : recommendations.length,
        downsizeRecommendations: recommendations.length,
        appropriatelySized: 0,
        upsizeRecommendations: 0,
        totalPotentialSavings: Number(totalPotentialSavings.toFixed(2)),
        totalPotentialSavingsFormatted: formatCurrency(totalPotentialSavings),
      },
    };
  },

  async getCommitmentGapsPricingAware(params = {}) {
    const gapsRaw = await rules.detectCommitmentGaps(params);

    // detectCommitmentGaps returns ONE object, so return ONE object + pricing fields
    const pricingAware = enrichCommitmentGapPricingAware(gapsRaw || {});

    return {
      ...pricingAware,
      pricing: {
        currency: 'USD',
        onDemandSpend: pricingAware.onDemandSpend,
        onDemandSpendFormatted: pricingAware.onDemandSpendFormatted,
        estimatedCommitSpend: pricingAware.estimatedCommitSpend,
        estimatedCommitSpendFormatted: pricingAware.estimatedCommitSpendFormatted,
        effectiveSavingsRate: pricingAware.effectiveSavingsRate,
        potentialSavingsFormatted: pricingAware.potentialSavingsFormatted,
      },
    };
  },
};
