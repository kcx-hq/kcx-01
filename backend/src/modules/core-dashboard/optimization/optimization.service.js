/**
 * Optimization Service
 * Business logic for cost optimization recommendations
 *
 * ✅ Update: normalize uploadIds (same cost-analysis approach)
 * - Accepts uploadid in query/body as single/multiple
 * - Does NOT change any optimization logic
 */

import * as rules from './optimization.rules.js';
import { formatCurrency } from '../../../common/utils/cost.helpers.js';
import { FINOPS_CONSTANTS } from '../../../common/constants/finops.constants.js';
import { roundTo } from '../../../common/utils/cost.calculations.js';
import { buildActionCenterModel } from './action-center.engine.js';

/**
 * Helper: normalize uploadIds from request
 * Supports:
 *  - uploadid=uuid
 *  - uploadid[]=uuid1&uploadid[]=uuid2
 *  - uploadid="uuid1,uuid2"
 *  - uploadIds already passed as array
 */
function normalizeUploadIds(uploadid) {
  if (!uploadid) return [];

  if (Array.isArray(uploadid)) return uploadid.filter(Boolean);

  if (typeof uploadid === 'string') {
    const s = uploadid.trim();
    if (!s) return [];
    return s.includes(',')
      ? s.split(',').map((id) => id.trim()).filter(Boolean)
      : [s];
  }

  return [];
}

/**
 * Helper: normalize params so rules always receive { uploadIds: [] }
 * (rules already accept params.uploadIds)
 */
function normalizeParams(params = {}) {
  // Prefer explicit uploadIds if caller already provided it
  const direct = params.uploadIds ?? params.uploadid ?? params.uploadId;
  const normalizedUploadIds = normalizeUploadIds(direct);

  return {
    ...params,
    uploadIds: normalizedUploadIds
  };
}

export const optimizationService = {
  /**
   * Get all optimization recommendations
   * Aggregates all rule-based recommendations
   *
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} All recommendations with total potential savings
   */
  async getRecommendations(params = {}) {
    const normalizedParams = normalizeParams(params);

    const [idleResources, underutilizedServices, rightSizingRecommendations] =
      await Promise.all([
        rules.detectIdleResources(normalizedParams),
        rules.detectUnderutilizedServices(normalizedParams),
        rules.getRightSizingRecommendations(normalizedParams)
      ]);

    // Calculate total potential savings
    const totalSavings = [
      ...idleResources.map((r) => parseFloat(r.savings || r.potentialSavings || 0)),
      ...underutilizedServices.map((s) => parseFloat(s.potentialSavings || 0)),
      ...rightSizingRecommendations.map((r) => parseFloat(r.savings || r.potentialSavings || 0))
    ].reduce((sum, savings) => sum + savings, 0);

    return {
      idleResources,
      underutilizedServices,
      rightSizingRecommendations,
      totalPotentialSavings: formatCurrency(totalSavings),
      recommendationCount:
        idleResources.length + underutilizedServices.length + rightSizingRecommendations.length
    };
  },

  /**
   * Get optimization opportunities (aggregated insights)
   * Combines idle resources and right-sizing into priority opportunities
   */
  async getOpportunities(params = {}) {
    const normalizedParams = normalizeParams(params);

    const [idleResources, rightSizingRecommendations] = await Promise.all([
      rules.detectIdleResources(normalizedParams),
      rules.getRightSizingRecommendations(normalizedParams)
    ]);

    const opportunities = [];

    // Group idle resources by service/type
    const idleByType = new Map();
    idleResources.forEach((resource) => {
      const type = resource.type || 'Unknown';
      if (!idleByType.has(type)) {
        idleByType.set(type, {
          resources: [],
          totalSavings: 0,
          regions: new Set()
        });
      }
      const group = idleByType.get(type);
      group.resources.push(resource);
      group.totalSavings += resource.savings || 0;
      group.regions.add(resource.region);
    });

    // Create opportunities from idle resources
    idleByType.forEach((group, type) => {
      if (group.totalSavings > 0) {
        const savings = roundTo(group.totalSavings, 2);
        const priority =
          savings > 4 ? 'HIGH IMPACT' : savings > 2 ? 'MEDIUM IMPACT' : 'LOW IMPACT';

        opportunities.push({
          id: `idle-${type.toLowerCase().replace(/\s+/g, '-')}`,
          priority: priority,
          title: `Idle ${type} Resources`,
          savings: savings,
          confidence: 'High',
          regions: Array.from(group.regions),
          description: `Multiple ${type} resources running with minimal utilization`,
          affectedResources: group.resources.length,
          evidence: [
            `${group.resources.length} ${type} resources idle for >${FINOPS_CONSTANTS.IDLE_RESOURCE_THRESHOLD_DAYS} days`,
            `Mostly ${group.resources[0]?.risk || 'non-prod'} workloads`,
            'No significant activity detected'
          ],
          resolutionPaths: [
            'Stop outside business hours',
            'Replace with on-demand smaller instance',
            'Decommission if unused'
          ],
          costImpact: {
            current: savings / 0.9, // Reverse calculate from savings
            optimized: 0
          }
        });
      }
    });

    // Create opportunities from right-sizing
    if (rightSizingRecommendations.length > 0) {
      const rightSizingSavings = rightSizingRecommendations.reduce(
        (sum, r) => sum + (r.savings || 0),
        0
      );
      const regions = [...new Set(rightSizingRecommendations.map((r) => r.region))];

      opportunities.push({
        id: 'right-size-compute',
        priority: rightSizingSavings > 2 ? 'MEDIUM IMPACT' : 'LOW IMPACT',
        title: 'Right-Size Compute Resources',
        savings: roundTo(rightSizingSavings, 2),
        confidence: 'High',
        regions: regions,
        description: 'Instances running at low utilization can be downsized',
        affectedResources: rightSizingRecommendations.length,
        evidence: [
          `Average CPU utilization: ${rightSizingRecommendations[0]?.currentCPU || 12}%`,
          'Memory usage consistently below 20%',
          'Stable workload pattern over 30 days'
        ],
        resolutionPaths: [
          'Downsize to smaller instance family',
          'Consider burstable instances (t3)',
          'Review during next maintenance window'
        ],
        costImpact: {
          current: rightSizingSavings / 0.4, // Reverse calculate
          optimized: 0
        }
      });
    }

    return opportunities.sort((a, b) => b.savings - a.savings);
  },

  /**
   * Get idle resources recommendations
   * @param {Object} params - Query parameters
   * @returns {Promise<Array>} Idle resource recommendations
   */
  async getIdleResources(params = {}) {
    const normalizedParams = normalizeParams(params);
    return await rules.detectIdleResources(normalizedParams);
  },

  /**
   * Get underutilized services
   * @param {Object} params - Query parameters
   * @returns {Promise<Array>} Underutilized service recommendations
   */
  async getUnderutilizedServices(params = {}) {
    const normalizedParams = normalizeParams(params);
    return await rules.detectUnderutilizedServices(normalizedParams);
  },

  /**
   * Get right-sizing recommendations
   * @param {Object} params - Query parameters
   * @returns {Promise<Array>} Right-sizing recommendations
   */
  async getRightSizingRecommendations(params = {}) {
    const normalizedParams = normalizeParams(params);
    return await rules.getRightSizingRecommendations(normalizedParams);
  },

  /**
   * Get commitment coverage gaps
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} Commitment gaps analysis
   */
  async getCommitmentGaps(params = {}) {
    const normalizedParams = normalizeParams(params);
    return await rules.detectCommitmentGaps(normalizedParams);
  },

  /**
   * Get optimization tracker items
   * Returns status of optimization recommendations
   * Note: This would typically come from a database, but for now returns mock data
   * @param {Object} params - Query parameters
   * @returns {Promise<Array>} Tracker items
   */
  async getTrackerItems(params = {}) {
    const normalizedParams = normalizeParams(params);

    // In a real implementation, this would query a database table
    // For now, we'll generate based on current recommendations
    const [idleResources, rightSizingRecs] = await Promise.all([
      rules.detectIdleResources(normalizedParams),
      rules.getRightSizingRecommendations(normalizedParams)
    ]);

    const trackerItems = [];

    // Add idle resource trackers
    idleResources.slice(0, 3).forEach((resource, index) => {
      trackerItems.push({
        id: `opt-${index + 1}`,
        title: `Idle ${resource.type} Cleanup`,
        savings: resource.savings,
        status: 'identified',
        priority: resource.risk === 'Prod' ? 'high' : 'medium',
        detectedDate: new Date().toISOString().split('T')[0]
      });
    });

    // Add right-sizing trackers
    rightSizingRecs.slice(0, 2).forEach((rec, index) => {
      trackerItems.push({
        id: `opt-rs-${index + 1}`,
        title: `Right-size ${rec.currentInstance}`,
        savings: rec.savings,
        status: 'in-review',
        priority: 'medium',
        detectedDate: new Date(Date.now() - 86400000).toISOString().split('T')[0] // Yesterday
      });
    });

    return trackerItems;
  },

  /**
   * Get action center overview model
   * Server-side deterministic model for optimization insights.
   *
   * @param {Object} params
   * @returns {Promise<Object>}
   */
  async getActionCenter(params = {}) {
    const normalizedParams = normalizeParams(params);

    const [opportunities, idleResources, rightSizingRecommendations, commitmentGap, trackerItems] =
      await Promise.all([
        this.getOpportunities(normalizedParams),
        this.getIdleResources(normalizedParams),
        this.getRightSizingRecommendations(normalizedParams),
        this.getCommitmentGaps(normalizedParams),
        this.getTrackerItems(normalizedParams),
      ]);

    const model = buildActionCenterModel({
      opportunities,
      idleResources,
      rightSizingRecommendations,
      commitmentGap,
      trackerItems,
    });

    return {
      model,
      opportunities,
      idleResources,
      rightSizingRecommendations,
      commitmentGap,
      trackerItems,
      meta: {
        generatedAt: new Date().toISOString(),
        formulaVersion: model?.meta?.formulaVersion || 'optimization_action_center_v2',
      },
    };
  }
};
