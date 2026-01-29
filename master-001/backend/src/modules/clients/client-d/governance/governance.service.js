/**
 * Client-D Governance Service (Reduced)
 * Only exposes Tag Compliance
 */

import * as policies from '../../../core-dashboard/governance/governance.policies.js'; 
// ^ adjust path to wherever governance.policies.js lives in your repo

export const clientDGovernanceService = {
  /**
   * Get tag compliance report (same calculation as core)
   * Returns only what Client-D needs.
   */
  async getCompliance(params = {}) {
    const result = await policies.checkTagCompliance(params);

    // Ensure minimal safe shape
    return {
      taggedCost: result?.taggedCost ?? 0,
      untaggedCost: result?.untaggedCost ?? 0,
      taggedPercent: result?.taggedPercent ?? 0,
      untaggedPercent: result?.untaggedPercent ?? 0,
      missingTags: result?.missingTags ?? [],
    };
  }
};
