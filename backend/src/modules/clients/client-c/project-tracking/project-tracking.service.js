/**
 * Project Spend Tracking Service (Client-C Specific - NEW MODULE)
 * Project-level cost tracking with burn rate monitoring
 */

import { BillingUsageFact, Service, CloudAccount } from '../../../../models/index.js';
import { Op } from 'sequelize';
import Sequelize from '../../../../config/db.config.js';

function extractProject(tags) {
  if (!tags || typeof tags !== 'object') return 'Untagged';
  return tags.project || tags.Project || tags.projectName || 'Untagged';
}

/**
 * Get all projects overview
 */
export async function getProjectsOverview(params = {}) {
  const { uploadIds = [], filters = {} } = params;

  if (uploadIds.length === 0) {
    return { projects: [], totalCost: 0 };
  }

  const whereClause = { uploadid: { [Op.in]: uploadIds } };

  const records = await BillingUsageFact.findAll({
    where: whereClause,
    attributes: ['tags', 'billedcost', 'chargeperiodstart'],
    raw: true,
  });

  const projectStats = {};
  let totalCost = 0;

  records.forEach(record => {
    const project = extractProject(record.tags);
    const cost = parseFloat(record.billedcost || 0);
    const date = record.chargeperiodstart ? new Date(record.chargeperiodstart) : null;

    if (!projectStats[project]) {
      projectStats[project] = { totalCost: 0, dates: [] };
    }
    projectStats[project].totalCost += cost;
    if (date) projectStats[project].dates.push(date);
    totalCost += cost;
  });

  const projects = Object.entries(projectStats).map(([name, stats]) => {
    const sortedDates = stats.dates.sort((a, b) => a - b);
    const daysActive = sortedDates.length > 0 
      ? Math.ceil((sortedDates[sortedDates.length - 1] - sortedDates[0]) / (1000 * 60 * 60 * 24)) + 1
      : 0;
    
    return {
      name,
      totalCost: parseFloat(stats.totalCost.toFixed(2)),
      percentage: totalCost > 0 ? parseFloat(((stats.totalCost / totalCost) * 100).toFixed(2)) : 0,
      daysActive,
      avgDailyCost: daysActive > 0 ? parseFloat((stats.totalCost / daysActive).toFixed(2)) : 0,
      startDate: sortedDates[0] || null,
      endDate: sortedDates[sortedDates.length - 1] || null,
    };
  }).sort((a, b) => b.totalCost - a.totalCost);

  return { projects, totalCost: parseFloat(totalCost.toFixed(2)) };
}

/**
 * Get project burn rate analysis
 */
export async function getProjectBurnRate(params = {}) {
  const { uploadIds = [], project } = params;

  if (uploadIds.length === 0 || !project) {
    return { daily: [], burnRate: 0, projectedTotal: 0 };
  }

  const whereClause = { uploadid: { [Op.in]: uploadIds } };

  const records = await BillingUsageFact.findAll({
    where: whereClause,
    attributes: ['tags', 'billedcost', 'chargeperiodstart'],
    order: [['chargeperiodstart', 'ASC']],
    raw: true,
  });

  const dailyMap = {};

  records.forEach(record => {
    const proj = extractProject(record.tags);
    if (proj !== project && project !== 'All') return;

    const cost = parseFloat(record.billedcost || 0);
    const date = record.chargeperiodstart ? new Date(record.chargeperiodstart).toISOString().split('T')[0] : 'Unknown';

    dailyMap[date] = (dailyMap[date] || 0) + cost;
  });

  const daily = Object.entries(dailyMap)
    .map(([date, cost]) => ({ date, cost: parseFloat(cost.toFixed(2)) }))
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  // Calculate burn rate (average daily cost)
  const totalCost = daily.reduce((sum, d) => sum + d.cost, 0);
  const burnRate = daily.length > 0 ? totalCost / daily.length : 0;

  // Project 30 days forward
  const projectedTotal = totalCost + (burnRate * 30);

  return {
    daily,
    burnRate: parseFloat(burnRate.toFixed(2)),
    projectedTotal: parseFloat(projectedTotal.toFixed(2)),
    totalCost: parseFloat(totalCost.toFixed(2)),
  };
}

/**
 * Compare project vs budget
 */
export async function compareProjectBudget(params = {}) {
  const { uploadIds = [], project, budget = 0 } = params;

  if (uploadIds.length === 0 || !project || !budget) {
    return { status: 'unknown', utilizationPercent: 0, remaining: 0 };
  }

  const whereClause = { uploadid: { [Op.in]: uploadIds } };

  const records = await BillingUsageFact.findAll({
    where: whereClause,
    attributes: ['tags', 'billedcost'],
    raw: true,
  });

  let actualSpend = 0;

  records.forEach(record => {
    const proj = extractProject(record.tags);
    if (proj === project) {
      actualSpend += parseFloat(record.billedcost || 0);
    }
  });

  const utilizationPercent = (actualSpend / budget) * 100;
  const remaining = budget - actualSpend;

  let status = 'on_track';
  if (utilizationPercent >= 100) status = 'exceeded';
  else if (utilizationPercent >= 90) status = 'at_risk';
  else if (utilizationPercent >= 75) status = 'warning';

  return {
    project,
    budget,
    actualSpend: parseFloat(actualSpend.toFixed(2)),
    remaining: parseFloat(remaining.toFixed(2)),
    utilizationPercent: parseFloat(utilizationPercent.toFixed(2)),
    status,
  };
}
