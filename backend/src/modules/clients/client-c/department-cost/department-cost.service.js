/**
 * Department Cost View Service (Client-C Specific - NEW MODULE)
 * Provides department-level cost tracking and accountability
 */

import { BillingUsageFact, Service, Region, CloudAccount, Resource } from '../../../../models/index.js';
import { Op } from 'sequelize';
import Sequelize from '../../../../config/db.config.js';

function extractDepartment(tags) {
  if (!tags || typeof tags !== 'object') return 'Untagged';
  return tags.department || tags.Department || 'Untagged';
}

/**
 * Get department cost overview
 */
export async function getDepartmentOverview(params = {}) {
  const { filters = {}, uploadIds = [] } = params;

  if (uploadIds.length === 0) {
    return { departments: [], totalCost: 0 };
  }

  const whereClause = { uploadid: { [Op.in]: uploadIds } };

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
  ];

  const records = await BillingUsageFact.findAll({
    where: whereClause,
    include,
    attributes: ['tags', 'billedcost', 'chargeperiodstart'],
    raw: true,
  });

  const deptStats = {};
  let totalCost = 0;

  records.forEach(record => {
    const dept = extractDepartment(record.tags);
    const cost = parseFloat(record.billedcost || 0);
    const date = record.chargeperiodstart ? new Date(record.chargeperiodstart) : null;

    if (!deptStats[dept]) {
      deptStats[dept] = { totalCost: 0, recordCount: 0, dates: [] };
    }
    deptStats[dept].totalCost += cost;
    deptStats[dept].recordCount += 1;
    if (date) deptStats[dept].dates.push(date);
    totalCost += cost;
  });

  const departments = Object.entries(deptStats).map(([name, stats]) => {
    const sortedDates = stats.dates.sort((a, b) => a - b);
    return {
      name,
      totalCost: parseFloat(stats.totalCost.toFixed(2)),
      percentage: totalCost > 0 ? parseFloat(((stats.totalCost / totalCost) * 100).toFixed(2)) : 0,
      recordCount: stats.recordCount,
      earliestDate: sortedDates[0] || null,
      latestDate: sortedDates[sortedDates.length - 1] || null,
    };
  }).sort((a, b) => b.totalCost - a.totalCost);

  return { departments, totalCost: parseFloat(totalCost.toFixed(2)) };
}

/**
 * Get department trend (daily breakdown)
 */
export async function getDepartmentTrend(params = {}) {
  const { filters = {}, uploadIds = [], department } = params;

  if (uploadIds.length === 0 || !department) {
    return { daily: [], totalCost: 0 };
  }

  const whereClause = { uploadid: { [Op.in]: uploadIds } };
  const include = [];

  const records = await BillingUsageFact.findAll({
    where: whereClause,
    include,
    attributes: ['tags', 'billedcost', 'chargeperiodstart'],
    order: [['chargeperiodstart', 'ASC']],
    raw: true,
  });

  const dailyMap = {};
  let totalCost = 0;

  records.forEach(record => {
    const dept = extractDepartment(record.tags);
    if (dept !== department && department !== 'All') return;

    const cost = parseFloat(record.billedcost || 0);
    const date = record.chargeperiodstart ? new Date(record.chargeperiodstart).toISOString().split('T')[0] : 'Unknown';

    dailyMap[date] = (dailyMap[date] || 0) + cost;
    totalCost += cost;
  });

  const daily = Object.entries(dailyMap)
    .map(([date, cost]) => ({ date, cost: parseFloat(cost.toFixed(2)) }))
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  return { daily, totalCost: parseFloat(totalCost.toFixed(2)) };
}

/**
 * Get department drilldown (service breakdown)
 */
export async function getDepartmentDrilldown(params = {}) {
  const { filters = {}, uploadIds = [], department } = params;

  if (uploadIds.length === 0 || !department) {
    return { services: [], resources: [] };
  }

  const whereClause = { uploadid: { [Op.in]: uploadIds } };

  const records = await BillingUsageFact.findAll({
    where: whereClause,
    include: [
      { model: Service, as: 'service', required: false, attributes: ['servicename'] },
      { model: Resource, as: 'resource', required: false, attributes: ['resourcename', 'resourceid'] },
    ],
    attributes: ['tags', 'billedcost', 'resourceid'],
    raw: false,
  });

  const serviceStats = {};
  const resourceStats = {};

  records.forEach(record => {
    const dept = extractDepartment(record.tags);
    if (dept !== department && department !== 'All') return;

    const cost = parseFloat(record.billedcost || 0);
    const serviceName = record.service?.servicename || 'Unknown';
    const resourceId = record.resource?.resourceid || record.resourceid || 'Unknown';

    serviceStats[serviceName] = (serviceStats[serviceName] || 0) + cost;
    resourceStats[resourceId] = (resourceStats[resourceId] || 0) + cost;
  });

  const services = Object.entries(serviceStats)
    .map(([name, cost]) => ({ name, cost: parseFloat(cost.toFixed(2)) }))
    .sort((a, b) => b.cost - a.cost)
    .slice(0, 10);

  const resources = Object.entries(resourceStats)
    .map(([id, cost]) => ({ resourceId: id, cost: parseFloat(cost.toFixed(2)) }))
    .sort((a, b) => b.cost - a.cost)
    .slice(0, 20);

  return { services, resources };
}
