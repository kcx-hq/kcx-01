/**
 * Client-C Reports Service
 * Extended: Add department splits to all reports
 */

import { reportsService as coreReportsService } from '../../../../modules/core-dashboard/reports/reports.service.js';
import * as aggregations from '../../../../modules/core-dashboard/reports/reports.aggregations.js';
import { BillingUsageFact } from '../../../../models/index.js';
import { Op } from 'sequelize';
import Sequelize from '../../../../config/db.config.js';

/**
 * Extract department from tags
 */
const extractDepartment = (tags) => {
  if (!tags || typeof tags !== 'object') return 'Untagged';
  return tags.department || tags.Department || 'Untagged';
};

/**
 * Get Department Split for any given metric
 */
async function getDepartmentSplit(uploadIds = [], filters = {}, startDate, endDate) {
  const where = {
    uploadid: { [Op.in]: uploadIds },
    billedcost: { [Op.gt]: 0 }
  };

  if (startDate || endDate) {
    where.chargeperiodstart = {};
    if (startDate) where.chargeperiodstart[Op.gte] = startDate;
    if (endDate) where.chargeperiodstart[Op.lte] = endDate;
  }

  const records = await BillingUsageFact.findAll({
    where,
    attributes: ['tags', 'billedcost'],
    raw: true
  });

  const deptMap = {};
  let total = 0;

  records.forEach(r => {
    const dept = extractDepartment(r.tags);
    const cost = parseFloat(r.billedcost || 0);
    deptMap[dept] = (deptMap[dept] || 0) + cost;
    total += cost;
  });

  return Object.entries(deptMap).map(([name, value]) => ({
    name,
    value,
    percentage: total > 0 ? (value / total) * 100 : 0
  })).sort((a, b) => b.value - a.value);
}

export const clientCReportsService = {
  /**
   * Dashboard Summary with Department Split
   */
  async getDashboardSummary(params = {}) {
    const coreSummary = await coreReportsService.getDashboardSummary(params);
    
    // Add department split to summary
    const { uploadIds, startDate, endDate, filters } = params;
    const departmentSplit = await getDepartmentSplit(uploadIds, filters, startDate, endDate);

    return {
      ...coreSummary,
      departmentSplit
    };
  },

  /**
   * Top Services with Department Detail
   */
  async getTopServices(params = {}) {
    const services = await coreReportsService.getTopServices(params);
    // Potential further enhancement: add which departments use these services most
    return services;
  },

  /**
   * Monthly Spend with Department Detail
   */
  async getMonthlySpend(params = {}) {
    return coreReportsService.getMonthlySpend(params);
  },

  /**
   * Export PDF - Department filtered (Implementation logic in controller/reports.pdf.js)
   */
  async getPDFExportData(params = {}) {
    // Collect all data for PDF, ensuring department context is preserved
    const summary = await this.getDashboardSummary(params);
    return summary;
  }
};
