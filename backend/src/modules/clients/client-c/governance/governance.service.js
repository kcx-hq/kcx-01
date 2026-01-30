/**
 * Client-C Governance Service
 * Extended: Department-level compliance and attribution
 */

import { governanceService as coreGovernanceService } from '../../../../modules/core-dashboard/governance/governance.service.js';
import { BillingUsageFact, CloudAccount, Service, Region } from '../../../../models/index.js';
import { Op } from 'sequelize';
import Sequelize from '../../../../config/db.config.js';

/**
 * Extract department from tags
 */
function extractDepartment(tags) {
  if (!tags || typeof tags !== 'object') return 'Untagged';
  return tags.department || tags.Department || 'Untagged';
}

/**
 * Get department-level tag compliance
 */
async function getDepartmentTagCompliance(params = {}) {
  const { filters = {}, uploadIds = [] } = params;
  
  if (uploadIds.length === 0) {
    return {
      overall: { taggedCost: 0, untaggedCost: 0, taggedPercent: 0 },
      byDepartment: [],
    };
  }

  const whereClause = {
    uploadid: { [Op.in]: uploadIds },
  };

  const include = [
    {
      model: CloudAccount,
      as: 'cloudAccount',
      required: filters.provider && filters.provider !== 'All',
      attributes: [],
      ...(filters.provider && filters.provider !== 'All' ? { where: { providername: filters.provider } } : {}),
    },
    {
      model: Service,
      as: 'service',
      required: filters.service && filters.service !== 'All',
      attributes: [],
      ...(filters.service && filters.service !== 'All' ? { where: { servicename: filters.service } } : {}),
    },
    {
      model: Region,
      as: 'region',
      required: filters.region && filters.region !== 'All',
      attributes: [],
      ...(filters.region && filters.region !== 'All' ? { where: { regionname: filters.region } } : {}),
    },
  ];

  const records = await BillingUsageFact.findAll({
    where: whereClause,
    include,
    attributes: ['tags', 'billedcost'],
    raw: true,
  });

  const departmentStats = {};
  let totalTagged = 0;
  let totalUntagged = 0;

  records.forEach(record => {
    const department = extractDepartment(record.tags);
    const cost = parseFloat(record.billedcost || 0);
    const hasRequiredTags = record.tags && 
                           Object.keys(record.tags).length > 0 && 
                           (record.tags.department || record.tags.Department);

    if (!departmentStats[department]) {
      departmentStats[department] = { taggedCost: 0, untaggedCost: 0, totalCost: 0 };
    }

    if (hasRequiredTags) {
      departmentStats[department].taggedCost += cost;
      totalTagged += cost;
    } else {
      departmentStats[department].untaggedCost += cost;
      totalUntagged += cost;
    }
    departmentStats[department].totalCost += cost;
  });

  const byDepartment = Object.entries(departmentStats).map(([dept, stats]) => ({
    department: dept,
    taggedCost: parseFloat(stats.taggedCost.toFixed(2)),
    untaggedCost: parseFloat(stats.untaggedCost.toFixed(2)),
    totalCost: parseFloat(stats.totalCost.toFixed(2)),
    compliancePercent: stats.totalCost > 0 
      ? parseFloat(((stats.taggedCost / stats.totalCost) * 100).toFixed(2))
      : 0,
  })).sort((a, b) => b.totalCost - a.totalCost);

  const totalCost = totalTagged + totalUntagged;

  return {
    overall: {
      taggedCost: parseFloat(totalTagged.toFixed(2)),
      untaggedCost: parseFloat(totalUntagged.toFixed(2)),
      taggedPercent: totalCost > 0 ? parseFloat(((totalTagged / totalCost) * 100).toFixed(2)) : 0,
    },
    byDepartment,
  };
}

/**
 * Get department attribution violations
 */
async function getDepartmentAttributionViolations(params = {}) {
  const { filters = {}, uploadIds = [] } = params;
  
  if (uploadIds.length === 0) return [];

  const whereClause = {
    uploadid: { [Op.in]: uploadIds },
  };

  const include = [
    {
      model: CloudAccount,
      as: 'cloudAccount',
      required: false,
      attributes: ['providername', 'billingaccountname'],
    },
    {
      model: Service,
      as: 'service',
      required: false,
      attributes: ['servicename'],
    },
  ];

  const records = await BillingUsageFact.findAll({
    where: whereClause,
    include,
    attributes: ['id', 'tags', 'billedcost', 'resourceid', 'chargeperiodstart'],
    limit: 100,
    raw: false,
  });

  const violations = [];

  records.forEach(record => {
    const tags = record.tags || {};
    const hasDepartment = tags.department || tags.Department;
    
    if (!hasDepartment && parseFloat(record.billedcost || 0) > 0) {
      violations.push({
        id: record.id,
        resourceId: record.resourceid || 'N/A',
        serviceName: record.service?.servicename || 'Unknown',
        accountName: record.cloudAccount?.billingaccountname || 'Unknown',
        cost: parseFloat(record.billedcost || 0),
        date: record.chargeperiodstart,
        violation: 'Missing Department Tag',
        severity: parseFloat(record.billedcost || 0) > 100 ? 'high' : 'medium',
      });
    }
  });

  return violations.sort((a, b) => b.cost - a.cost).slice(0, 50);
}

export const clientCGovernanceService = {
  /**
   * Get extended governance summary with department metrics
   */
  async getGovernanceSummary(params = {}) {
    const coreSummary = await coreGovernanceService.getGovernanceSummary(params);
    const departmentCompliance = await getDepartmentTagCompliance(params);
    const attributionViolations = await getDepartmentAttributionViolations(params);

    return {
      ...coreSummary,
      departmentCompliance,
      attributionViolations,
    };
  },

  /**
   * Get tag compliance with department breakdown
   */
  async getTagCompliance(params = {}) {
    return getDepartmentTagCompliance(params);
  },

  /**
   * Reuse core methods
   */
  async getOwnershipGaps(params = {}) {
    return coreGovernanceService.getOwnershipGaps(params);
  },

  async getAccountsWithOwnership(params = {}) {
    return coreGovernanceService.getAccountsWithOwnership(params);
  },

  async updateAccountOwner(accountId, owner, uploadIds = []) {
    return coreGovernanceService.updateAccountOwner(accountId, owner, uploadIds);
  },
};
