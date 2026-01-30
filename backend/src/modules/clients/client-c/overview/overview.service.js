/**
 * Client-C Overview Service
 * Extended version of Core Overview with department breakdown
 */

import { dashboardService as coreOverviewService } from '../../../../modules/core-dashboard/overviews/overview.service.js';
import { BillingUsageFact, Service, Region, CloudAccount } from '../../../../models/index.js';
import Sequelize from '../../../../config/db.config.js';
import { Op } from 'sequelize';

/**
 * Helper: Apply upload isolation
 */
function applyUploadIsolation(whereClause = {}, uploadId, uploadIds = []) {
  if (uploadId && Array.isArray(uploadIds) && uploadIds.includes(uploadId)) {
    whereClause.uploadid = uploadId;
    return whereClause;
  }
  if (Array.isArray(uploadIds) && uploadIds.length > 0) {
    whereClause.uploadid = { [Op.in]: uploadIds };
    return whereClause;
  }
  return whereClause;
}

/**
 * Extract department from tags
 * Expected tag format: { department: "Engineering", ... }
 */
function extractDepartment(tags) {
  if (!tags || typeof tags !== 'object') return 'Untagged';
  return tags.department || tags.Department || 'Untagged';
}

/**
 * Get department breakdown aggregation
 */
async function getDepartmentBreakdown(filters = {}, uploadIds = []) {
  const { provider, service, region, uploadId } = filters;

  if (!uploadIds || uploadIds.length === 0) return [];

  const whereClause = applyUploadIsolation({}, uploadId, uploadIds);

  const filterInclude = [
    {
      model: CloudAccount,
      as: 'cloudAccount',
      required: !!(provider && provider !== 'All'),
      attributes: [],
      ...(provider && provider !== 'All' ? { where: { providername: provider } } : {}),
    },
    {
      model: Service,
      as: 'service',
      required: !!(service && service !== 'All'),
      attributes: [],
      ...(service && service !== 'All' ? { where: { servicename: service } } : {}),
    },
    {
      model: Region,
      as: 'region',
      required: !!(region && region !== 'All'),
      attributes: [],
      ...(region && region !== 'All' ? { where: { regionname: region } } : {}),
    },
  ];

  // Fetch all records to extract department from tags
  const records = await BillingUsageFact.findAll({
    where: whereClause,
    include: filterInclude,
    attributes: ['tags', 'billedcost'],
    raw: true,
  });

  // Group by department
  const departmentMap = {};
  let totalCost = 0;

  records.forEach(record => {
    const department = extractDepartment(record.tags);
    const cost = parseFloat(record.billedcost || 0);
    
    if (!departmentMap[department]) {
      departmentMap[department] = 0;
    }
    departmentMap[department] += cost;
    totalCost += cost;
  });

  // Convert to array and calculate percentages
  const departmentBreakdown = Object.entries(departmentMap)
    .map(([name, value]) => ({
      name,
      value: parseFloat(value.toFixed(2)),
      percentage: totalCost > 0 ? parseFloat(((value / totalCost) * 100).toFixed(2)) : 0,
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10); // Top 10 departments

  return departmentBreakdown;
}

/**
 * Get department trend comparison (current vs previous period)
 */
async function getDepartmentTrends(filters = {}, uploadIds = []) {
  const { provider, service, region, uploadId } = filters;

  if (!uploadIds || uploadIds.length === 0) return [];

  const whereClause = applyUploadIsolation({}, uploadId, uploadIds);

  const filterInclude = [
    {
      model: CloudAccount,
      as: 'cloudAccount',
      required: !!(provider && provider !== 'All'),
      attributes: [],
      ...(provider && provider !== 'All' ? { where: { providername: provider } } : {}),
    },
    {
      model: Service,
      as: 'service',
      required: !!(service && service !== 'All'),
      attributes: [],
      ...(service && service !== 'All' ? { where: { servicename: service } } : {}),
    },
    {
      model: Region,
      as: 'region',
      required: !!(region && region !== 'All'),
      attributes: [],
      ...(region && region !== 'All' ? { where: { regionname: region } } : {}),
    },
  ];

  const records = await BillingUsageFact.findAll({
    where: whereClause,
    include: filterInclude,
    attributes: ['tags', 'billedcost', 'chargeperiodstart'],
    raw: true,
  });

  if (records.length === 0) return [];

  // Find date range
  const dates = records.map(r => new Date(r.chargeperiodstart)).filter(d => !isNaN(d));
  if (dates.length === 0) return [];

  const maxDate = new Date(Math.max(...dates));
  const minDate = new Date(Math.min(...dates));
  
  const totalDays = Math.ceil((maxDate - minDate) / (1000 * 60 * 60 * 24));
  const midDate = new Date(minDate.getTime() + (totalDays / 2) * 24 * 60 * 60 * 1000);

  // Split into current and previous period
  const currentPeriod = {};
  const previousPeriod = {};

  records.forEach(record => {
    const department = extractDepartment(record.tags);
    const cost = parseFloat(record.billedcost || 0);
    const date = new Date(record.chargeperiodstart);

    if (date >= midDate) {
      currentPeriod[department] = (currentPeriod[department] || 0) + cost;
    } else {
      previousPeriod[department] = (previousPeriod[department] || 0) + cost;
    }
  });

  // Calculate trends
  const allDepartments = new Set([...Object.keys(currentPeriod), ...Object.keys(previousPeriod)]);
  const trends = [];

  allDepartments.forEach(dept => {
    const current = currentPeriod[dept] || 0;
    const previous = previousPeriod[dept] || 0;
    const change = previous > 0 ? ((current - previous) / previous) * 100 : 0;

    trends.push({
      department: dept,
      currentCost: parseFloat(current.toFixed(2)),
      previousCost: parseFloat(previous.toFixed(2)),
      changePercent: parseFloat(change.toFixed(2)),
    });
  });

  return trends.sort((a, b) => b.currentCost - a.currentCost).slice(0, 10);
}

/**
 * Client-C Overview Service
 * Extends core overview with department-specific features
 */
export const clientCOverviewService = {
  /**
   * Get extended overview metrics with department breakdown
   */
  async getOverviewMetrics(filters, uploadIds = []) {
    // Get core overview data
    const coreData = await coreOverviewService.getOverviewMetrics(filters, uploadIds);

    // Get department-specific data
    const [departmentBreakdown, departmentTrends] = await Promise.all([
      getDepartmentBreakdown(filters, uploadIds),
      getDepartmentTrends(filters, uploadIds),
    ]);

    return {
      ...coreData,
      // Client-C Extensions
      departmentBreakdown,
      departmentTrends,
    };
  },

  /**
   * Reuse core filters
   */
  async getFilters(uploadIds) {
    return coreOverviewService.getFilters(uploadIds);
  },

  /**
   * Reuse core anomalies
   */
  async getAnomalies(filters, uploadIds) {
    return coreOverviewService.getAnomalies(filters, uploadIds);
  },


};
