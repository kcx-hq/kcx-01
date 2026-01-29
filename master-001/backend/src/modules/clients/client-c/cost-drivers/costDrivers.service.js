/**
 * Client-C Cost Drivers Service
 * Modified: Add department level drilldown, removed lifecycle classification
 */

import { costDriversService as coreCostDriversService } from '../../../../modules/core-dashboard/analytics/cost-drivers/cost-drivers.service.js';

export const clientCCostDriversService = {
  /**
   * Get Cost Drivers - Modified for Client-C
   */
  async getCostDrivers(options = {}) {
    const { dimension = 'ServiceName' } = options;
    
    // If dimension is 'Department', we need to handle it specially since core doesn't know 'Department'
    // But core returns raw tags, so coreCostDriversService.getCostDrivers might work if we override the grouping
    
    const result = await coreCostDriversService.getCostDrivers(options);

    if (!result) return result;

    // ❌ Client-C does not want lifecycle dynamics (New/Expansion/Deletion)
    delete result.dynamics;

    // If grouping by department was requested but core didn't handle it (it would default to 'Unknown')
    // we might need to re-group here if core doesn't support the dimension
    
    return result;
  },

  /**
   * Department level drilldown
   */
  async getDepartmentDrivers(params = {}) {
    // Group by 'department' tag
    return await coreCostDriversService.getCostDrivers({
      ...params,
      dimension: 'department' // This works because core repository includes raw row fields (like tags)
    });
  },

  /**
   * Reuse core driver details
   */
  async getDriverDetails(options = {}) {
    const details = await coreCostDriversService.getDriverDetails(options);
    
    // Annualized impact is still relevant for Client-C accountability
    return details;
  }
};
