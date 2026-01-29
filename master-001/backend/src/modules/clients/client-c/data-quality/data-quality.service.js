/**
 * Client-C Data Quality Service
 * Modified: Focus on tag completeness per department, removed duplicate detection
 */

import { dataQualityService as coreDataQualityService } from '../../../../modules/core-dashboard/analytics/data-quality/data-quality.service.js';

export const clientCDataQualityService = {
  /**
   * Analyze Data Quality - Extended with Department Tag completeness
   */
  async analyzeDataQuality(options = {}) {
    const result = await coreDataQualityService.analyzeDataQuality(options);

    if (!result) return result;

    // 1. Filter out duplicate detection if core had it (core doesn't seem to have explicit one)
    // 2. Enhance compliance with Department focus
    const { buckets } = result;
    
    // Calculate department-specific compliance
    const departmentCompliance = {};
    buckets.all.forEach(row => {
      const tags = row.Tags || {};
      const dept = tags.department || tags.Department || 'Untagged';
      
      if (!departmentCompliance[dept]) {
        departmentCompliance[dept] = { total: 0, missingTags: 0 };
      }
      
      departmentCompliance[dept].total++;
      if (!row.Tags || Object.keys(row.Tags).length === 0) {
        departmentCompliance[dept].missingTags++;
      }
    });

    const deptComplianceStats = Object.entries(departmentCompliance).map(([name, stats]) => ({
      name,
      score: Math.round(((stats.total - stats.missingTags) / stats.total) * 100),
      totalRows: stats.total,
      missingTags: stats.missingTags
    }));

    return {
      ...result,
      departmentCompliance: deptComplianceStats,
      // Remove or modify buckets as needed for Client-C
      buckets: {
        ...result.buckets,
        // Client-C doesn't care about anomalies/duplicates as much as tagging
        anomalies: result.buckets.anomalies.filter(a => a._issues.includes('Untagged'))
      }
    };
  }
};
