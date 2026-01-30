/**
 * Drivers Service
 * Business Logic for Cost Drivers Analysis
 * All calculation, comparison, grouping, and insight logic
 */

import { costDriversRepository } from './cost-drivers.repository.js';

/**
 * Calculate cost drivers from time series data
 * This is a lightweight version that works with already-fetched time series data
 * @param {Array} timeSeriesResult - Array of { date, cost, groupId } objects
 * @param {Object} nameMap - Map of groupId to display names
 * @returns {Object} Driver analysis data
 */
export function calculateCostDrivers(timeSeriesResult, nameMap) {
  if (!timeSeriesResult || timeSeriesResult.length === 0) {
    return {
      overallStats: {
        totalCurr: 0,
        totalPrev: 0,
        diff: 0,
        pct: 0,
        totalIncreases: 0,
        totalDecreases: 0
      },
      dynamics: {
        newSpend: 0,
        expansion: 0,
        deleted: 0,
        optimization: 0
      },
      increases: [],
      decreases: []
    };
  }

  // Group by groupId and calculate current vs previous period
  const groups = {};
  const dates = [...new Set(timeSeriesResult.map(r => r.date))].sort();

  if (dates.length === 0) {
    return {
      overallStats: {},
      dynamics: {},
      increases: [],
      decreases: []
    };
  }

  // Split into current and previous periods (roughly half)
  const midPoint = Math.floor(dates.length / 2);
  const prevDates = new Set(dates.slice(0, midPoint));
  const currDates = new Set(dates.slice(midPoint));

  timeSeriesResult.forEach(row => {
    const groupId = String(row.groupId || 'unknown');
    const cost = parseFloat(row.cost || 0);
    const date = row.date;

    if (!groups[groupId]) {
      groups[groupId] = {
        id: groupId,
        name: nameMap[groupId] || `Unknown (${groupId})`,
        curr: 0,
        prev: 0,
        rows: []
      };
    }

    if (currDates.has(date)) {
      groups[groupId].curr += cost;
    } else if (prevDates.has(date)) {
      groups[groupId].prev += cost;
    }

    groups[groupId].rows.push({ ...row, cost });
  });

  // Calculate differences
  const allResults = Object.values(groups).map(group => ({
    name: group.name,
    id: group.id,
    curr: group.curr,
    prev: group.prev,
    diff: group.curr - group.prev,
    pct:
      group.prev === 0
        ? (group.curr > 0 ? Infinity : 0)
        : ((group.curr - group.prev) / group.prev) * 100,
    isNew: group.prev === 0 && group.curr > 0,
    isDeleted: group.curr === 0 && group.prev > 0,
    rows: group.rows
  }));

  // Separate increases and decreases
  const increases = allResults
    .filter(r => r.diff > 0)
    .sort((a, b) => b.diff - a.diff)
    .slice(0, 10);

  const decreases = allResults
    .filter(r => r.diff < 0)
    .sort((a, b) => a.diff - b.diff)
    .slice(0, 10);

  // Calculate totals
  const totalCurr = allResults.reduce((sum, r) => sum + r.curr, 0);
  const totalPrev = allResults.reduce((sum, r) => sum + r.prev, 0);
  const totalDiff = totalCurr - totalPrev;

  // Calculate dynamics
  const dynamics = {
    newSpend: allResults.filter(r => r.isNew).reduce((sum, r) => sum + r.diff, 0),
    expansion: allResults.filter(r => !r.isNew && r.diff > 0).reduce((sum, r) => sum + r.diff, 0),
    deleted: allResults.filter(r => r.isDeleted).reduce((sum, r) => sum + Math.abs(r.diff), 0),
    optimization: allResults.filter(r => !r.isDeleted && r.diff < 0).reduce((sum, r) => sum + Math.abs(r.diff), 0)
  };

  return {
    overallStats: {
      totalCurr,
      totalPrev,
      diff: totalDiff,
      pct: totalPrev === 0 ? 0 : (totalDiff / totalPrev) * 100,
      totalIncreases: increases.reduce((sum, r) => sum + r.diff, 0),
      totalDecreases: Math.abs(decreases.reduce((sum, r) => sum + r.diff, 0))
    },
    dynamics,
    increases,
    decreases
  };
}

/**
 * Smart Insight Engine
 * Generates contextual insights based on service and operations
 */
function getSmartInsight(serviceName, operations) {
  const topOp = operations[0]?.name || '';
  const service = (serviceName || '').toLowerCase();

  if (service.includes('ec2')) {
    if (topOp.includes('DataTransfer') || topOp.includes('Out')) {
      return '⚠️ High Network Traffic: Spike driven by Data Transfer. Check cross-region replication.';
    }
    if (topOp.includes('BoxUsage') || topOp.includes('RunInstances')) {
      return '💻 Compute Scale-Up: Costs rose due to more active instance hours.';
    }
    if (topOp.includes('EBS')) {
      return '💾 Disk Attachment: Increase due to EBS Volumes. Check for orphan volumes.';
    }
  }
  if (service.includes('s3')) {
    if (topOp.includes('TimedStorage')) {
      return '📦 Storage Growth: You are storing significantly more data.';
    }
    if (topOp.includes('Requests')) {
      return '🔄 API Intensity: High Request counts (GET/PUT). Application might be looping.';
    }
  }
  if (service.includes('rds')) {
    if (topOp.includes('InstanceUsage')) {
      return '🗄️ Database Compute: Higher active DB instance hours.';
    }
    if (topOp.includes('Backup')) {
      return '💿 Backup Storage: Snapshot costs are rising.';
    }
  }
  return `Review the "${topOp}" operation usage. This represents the largest portion of the cost change.`;
}

/**
 * Analyze cost drivers and return fully computed, UI-ready data
 */
export const costDriversService = {
  /**
   * Get cost drivers analysis
   *
   * ✅ Update: uploadIds is now request-driven (same approach as cost analysis)
   * - If caller passes uploadIds, we use them
   * - Else if caller passes filters.uploadId, we convert to uploadIds=[uploadId]
   * - Logic/calculations remain unchanged
   */
  async getCostDrivers(options = {}) {
    try {
      const {
        filters = {},
        period = 30,
        dimension = 'ServiceName', // Default dimension - can be extended in future
        minChange = 0,
        activeServiceFilter = 'All', // NOTE: This is now client-side only, kept for backward compatibility
        uploadIds = []
      } = options;

      // ✅ same approach as cost analysis: allow a single uploadId to drive isolation
      const effectiveUploadIds =
        uploadIds && uploadIds.length > 0
          ? uploadIds
          : (filters.uploadId ? [filters.uploadId] : []);

      // Fetch raw billing facts
      const rawData = await costDriversRepository.getBillingFactsForDrivers({
        filters,
        period,
        uploadIds: effectiveUploadIds
      });

      if (!rawData || rawData.length === 0) {
        return {
          increases: [],
          decreases: [],
          overallStats: {
            totalCurr: 0,
            totalPrev: 0,
            diff: 0,
            pct: 0,
            totalIncreases: 0,
            totalDecreases: 0
          },
          dynamics: {
            newSpend: 0,
            expansion: 0,
            deleted: 0,
            optimization: 0
          },
          periods: {
            current: null,
            prev: null,
            max: null
          },
          availableServices: []
        };
      }

      // Clean and process data
      const cleanData = rawData
        .map(d => {
          let date = null;
          if (d.ChargePeriodStart) {
            date = new Date(d.ChargePeriodStart);
            // Check if date is valid
            if (isNaN(date.getTime())) {
              date = null;
            }
          }
          return {
            ...d,
            cost: parseFloat(d.BilledCost) || 0,
            date: date
          };
        })
        .filter(d => d.date !== null && !isNaN(d.date.getTime()));

      if (cleanData.length === 0) {
        return {
          increases: [],
          decreases: [],
          overallStats: {},
          dynamics: {},
          periods: {},
          availableServices: []
        };
      }

      // Calculate date ranges - use max date as end of current period
      const maxDate = new Date(Math.max(...cleanData.map(d => d.date.getTime())));
      const cutoffCurrent = new Date(maxDate);
      cutoffCurrent.setDate(cutoffCurrent.getDate() - period);
      const cutoffPrev = new Date(cutoffCurrent);
      cutoffPrev.setDate(cutoffPrev.getDate() - period);

      // Ensure dates are valid
      if (isNaN(cutoffCurrent.getTime()) || isNaN(cutoffPrev.getTime())) {
        console.error('[Cost Drivers] Invalid date calculation');
        return {
          increases: [],
          decreases: [],
          overallStats: {},
          dynamics: {},
          periods: {}
        };
      }

      // Group data by dimension
      const groups = {};
      let totalCurr = 0;
      let totalPrev = 0;

      cleanData.forEach(row => {
        // NOTE: activeServiceFilter is now handled client-side only for instant filtering
        // Server-side filtering removed to improve performance and responsiveness

        // Skip dates outside our period range (older than cutoffPrev)
        if (row.date <= cutoffPrev) return;

        const key = row[dimension] || 'Unknown';
        if (!groups[key]) {
          groups[key] = { curr: 0, prev: 0, rows: [] };
        }

        const dateStr = row.date.toISOString().split('T')[0];

        if (row.date > cutoffCurrent) {
          groups[key].curr += row.cost;
          groups[key].rows.push({
            ...row,
            period: 'curr',
            dateStr: dateStr,
            cost: row.cost
          });
          totalCurr += row.cost;
        } else if (row.date > cutoffPrev) {
          groups[key].prev += row.cost;
          groups[key].rows.push({
            ...row,
            period: 'prev',
            dateStr: dateStr,
            cost: row.cost
          });
          totalPrev += row.cost;
        }
      });

      // Calculate differences and percentages
      const allResults = Object.entries(groups)
        .map(([name, stats]) => ({
          name,
          id: name, // Add id for frontend compatibility
          curr: stats.curr,
          prev: stats.prev,
          rows: stats.rows,
          diff: stats.curr - stats.prev,
          pct:
            stats.prev === 0
              ? (stats.curr > 0 ? Infinity : 0)
              : ((stats.curr - stats.prev) / stats.prev) * 100,
          isNew: stats.prev === 0 && stats.curr > 0,
          isDeleted: stats.curr === 0 && stats.prev > 0
        }))
        .filter(item => Math.abs(item.diff) >= minChange);

      // Separate increases and decreases, sort by absolute difference
      const increases = allResults
        .filter(r => r.diff > 0)
        .sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff));

      const decreases = allResults
        .filter(r => r.diff < 0)
        .sort((a, b) => Math.abs(a.diff) - Math.abs(b.diff));

      // Calculate dynamics
      const dynamics = {
        newSpend: allResults.filter(r => r.isNew).reduce((a, b) => a + b.diff, 0),
        expansion: allResults.filter(r => !r.isNew && r.diff > 0).reduce((a, b) => a + b.diff, 0),
        deleted: allResults.filter(r => r.isDeleted).reduce((a, b) => a + b.diff, 0),
        optimization: allResults.filter(r => !r.isDeleted && r.diff < 0).reduce((a, b) => a + b.diff, 0)
      };

      // Overall stats
      const overallStats = {
        totalCurr,
        totalPrev,
        diff: totalCurr - totalPrev,
        pct: totalPrev ? ((totalCurr - totalPrev) / totalPrev) * 100 : 0,
        totalIncreases: increases.reduce((a, i) => a + i.diff, 0),
        totalDecreases: decreases.reduce((a, i) => a + i.diff, 0)
      };

      // Extract unique services from the data for filter options
      const availableServices = [...new Set(cleanData.map(d => d.ServiceName).filter(Boolean))].sort();

      return {
        increases,
        decreases,
        overallStats,
        dynamics,
        periods: {
          current: cutoffCurrent.toISOString(),
          prev: cutoffPrev.toISOString(),
          max: maxDate.toISOString()
        },
        availableServices // Add available services for frontend filter
      };
    } catch (error) {
      console.error('Error in driversService.getCostDrivers:', error.message);
      throw error;
    }
  },

  /**
   * Get driver details (for detail page)
   */
  async getDriverDetails(options = {}) {
    const { driver, period = 30, uploadIds = [] } = options;

    if (!driver || !driver.rows) {
      return {
        trendData: [],
        subDrivers: [],
        topResources: [],
        annualizedImpact: 0,
        insightText: ''
      };
    }

    // Calculate daily trend
    const dailyTrend = {};
    driver.rows.forEach(r => {
      if (r.dateStr) {
        dailyTrend[r.dateStr] = (dailyTrend[r.dateStr] || 0) + (r.cost || 0);
      }
    });

    const trendData = Object.entries(dailyTrend)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, val]) => ({
        date: date.slice(5), // Remove year for display
        val: parseFloat(val || 0)
      }));

    // Calculate operations breakdown
    const operationsMap = {};
    driver.rows.filter(r => r.period === 'curr').forEach(r => {
      let op = r.UsageType || r.Operation || r.ItemDescription || r.ServiceName || 'General Usage';
      if (op.length > 40) op = op.substring(0, 37) + '...';
      operationsMap[op] = (operationsMap[op] || 0) + (r.cost || 0);
    });

    const subDrivers = Object.entries(operationsMap)
      .map(([name, value]) => ({ name, value: parseFloat(value || 0) }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    // Calculate top resources
    const resourceMap = {};
    driver.rows.filter(r => r.period === 'curr').forEach(r => {
      const uniqueKey = r.ResourceId || r.ResourceName || 'Unknown';
      if (!resourceMap[uniqueKey]) {
        resourceMap[uniqueKey] = {
          id: uniqueKey,
          cost: 0,
          displayName: r.ResourceName || r.ResourceId || r.ItemDescription || 'Unknown Resource'
        };
      }
      resourceMap[uniqueKey].cost += (r.cost || 0);
    });

    const topResources = Object.values(resourceMap)
      .map(r => ({ ...r, cost: parseFloat(r.cost || 0) }))
      .sort((a, b) => b.cost - a.cost)
      .slice(0, 20);

    // Calculate annualized impact based on actual period
    const annualizedImpact = driver.diff * (365 / period);

    // Generate insight
    const insightText = getSmartInsight(driver.name, subDrivers);

    return {
      trendData,
      subDrivers,
      topResources,
      annualizedImpact,
      insightText
    };
  }
};
