/**
 * Cost Alerts Service (Client-C Specific - NEW MODULE)
 * Budget threshold alerts and department-based notifications
 */

import { BillingUsageFact, Service, CloudAccount } from '../../../../models/index.js';
import { Op } from 'sequelize';
import Sequelize from '../../../../config/db.config.js';

function extractDepartment(tags) {
  if (!tags || typeof tags !== 'object') return 'Untagged';
  return tags.department || tags.Department || 'Untagged';
}

/**
 * Get active cost alerts
 */
export async function getActiveAlerts(params = {}) {
  const { uploadIds = [], thresholds = {} } = params;

  if (uploadIds.length === 0) {
    return { alerts: [], summary: { total: 0, critical: 0, warning: 0 } };
  }

  const whereClause = { uploadid: { [Op.in]: uploadIds } };

  // Get daily costs
  const dailyCosts = await BillingUsageFact.findAll({
    where: whereClause,
    attributes: [
      [Sequelize.fn('DATE', Sequelize.col('chargeperiodstart')), 'date'],
      [Sequelize.fn('SUM', Sequelize.col('billedcost')), 'cost'],
      'tags',
    ],
    group: [Sequelize.fn('DATE', Sequelize.col('chargeperiodstart')), 'tags'],
    raw: true,
  });

  const alerts = [];
  const departmentDailyCosts = {};

  // Calculate daily spend by department
  dailyCosts.forEach(record => {
    const dept = extractDepartment(record.tags);
    const date = record.date;
    const cost = parseFloat(record.cost || 0);

    const key = `${dept}-${date}`;
    departmentDailyCosts[key] = (departmentDailyCosts[key] || 0) + cost;
  });

  // Check thresholds
  const dailyThreshold = thresholds.dailyLimit || 1000;
  const criticalThreshold = dailyThreshold * 1.5;

  Object.entries(departmentDailyCosts).forEach(([key, cost]) => {
    const [dept, date] = key.split('-');
    
    if (cost > criticalThreshold) {
      alerts.push({
        id: `alert-${key}`,
        type: 'daily_spike',
        severity: 'critical',
        department: dept,
        date,
        amount: parseFloat(cost.toFixed(2)),
        threshold: criticalThreshold,
        message: `Critical: ${dept} exceeded ${criticalThreshold} on ${date}`,
      });
    } else if (cost > dailyThreshold) {
      alerts.push({
        id: `alert-${key}`,
        type: 'daily_spike',
        severity: 'warning',
        department: dept,
        date,
        amount: parseFloat(cost.toFixed(2)),
        threshold: dailyThreshold,
        message: `Warning: ${dept} exceeded ${dailyThreshold} on ${date}`,
      });
    }
  });

  const summary = {
    total: alerts.length,
    critical: alerts.filter(a => a.severity === 'critical').length,
    warning: alerts.filter(a => a.severity === 'warning').length,
  };

  return {
    alerts: alerts.sort((a, b) => b.amount - a.amount).slice(0, 50),
    summary,
  };
}

/**
 * Get department budget status
 */
export async function getDepartmentBudgetStatus(params = {}) {
  const { uploadIds = [], budgets = {} } = params;

  if (uploadIds.length === 0) {
    return { departments: [] };
  }

  const whereClause = { uploadid: { [Op.in]: uploadIds } };

  const records = await BillingUsageFact.findAll({
    where: whereClause,
    attributes: ['tags', 'billedcost'],
    raw: true,
  });

  const deptCosts = {};

  records.forEach(record => {
    const dept = extractDepartment(record.tags);
    const cost = parseFloat(record.billedcost || 0);
    deptCosts[dept] = (deptCosts[dept] || 0) + cost;
  });

  const departments = Object.entries(deptCosts).map(([name, actualSpend]) => {
    const budget = budgets[name] || 10000; // Default budget
    const utilizationPercent = (actualSpend / budget) * 100;
    
    let status = 'on_track';
    if (utilizationPercent >= 100) status = 'exceeded';
    else if (utilizationPercent >= 90) status = 'at_risk';
    else if (utilizationPercent >= 75) status = 'warning';

    return {
      department: name,
      budget: budget,
      actualSpend: parseFloat(actualSpend.toFixed(2)),
      remaining: parseFloat((budget - actualSpend).toFixed(2)),
      utilizationPercent: parseFloat(utilizationPercent.toFixed(2)),
      status,
    };
  }).sort((a, b) => b.utilizationPercent - a.utilizationPercent);

  return { departments };
}

/**
 * Create alert rule
 */
export async function createAlertRule(params = {}) {
  const { department, threshold, type } = params;
  
  // Placeholder - In real implementation, this would save to a database
  return {
    id: `rule-${Date.now()}`,
    department,
    threshold,
    type,
    active: true,
    createdAt: new Date(),
  };
}
