/**
 * Client-C Optimization Service
 * Modified: Focus on operational savings, department scoped
 */

import { optimizationService as coreOptimizationService } from '../../../../modules/core-dashboard/optimization/optimization.service.js';

export const clientCOptimizationService = {
  /**
   * Get Recommendations - Department Scoped
   */
  async getRecommendations(params = {}) {
    const result = await coreOptimizationService.getRecommendations(params);

    if (!result) return result;

    // Enhance recommendations with department owner info if available
    const enhanceWithDepartment = (items) => {
      return items.map(item => {
        const tags = item.tags || {};
        return {
          ...item,
          department: tags.department || tags.Department || 'Untagged',
          owner: tags.owner || tags.Owner || 'Unassigned'
        };
      });
    };

    return {
      ...result,
      idleResources: enhanceWithDepartment(result.idleResources),
      rightSizingRecommendations: enhanceWithDepartment(result.rightSizingRecommendations),
      // Client-C focuses on operational vs financial engineering
      commitmentRecommendations: [] // Removed or simplified for Client-C
    };
  },

  /**
   * Get Opportunities - Aggregated insights with department focus
   */
  async getOpportunities(params = {}) {
    const opportunities = await coreOptimizationService.getOpportunities(params);
    
    // Sort or filter opportunities based on Client-C preference
    // (Focus on high impact operational changes)
    return opportunities.filter(o => o.confidence === 'High');
  }
};
