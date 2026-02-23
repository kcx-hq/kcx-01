/**
 * Quality Service
 * Business Logic for Data Quality & Governance Engine
 * All analysis, scoring, bucketing, anomaly detection, and compliance logic
 */

import { dataQualityRepository } from './data-quality.repository.js';
import { costSharePercentage, roundTo } from '../../../../common/utils/cost.calculations.js';

/**
 * Format currency helper
 */
const formatCurrency = (val) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(val);

/**
 * Quality Service Object
 * Exports all service functions
 */
export const dataQualityService = {
  /**
   * Analyze data quality and return fully computed, UI-ready data
   */
  async analyzeDataQuality(options = {}) {
    const { filters = {}, startDate, endDate, uploadIds = [] } = options;

    // Fetch raw billing facts
    const rawData = await dataQualityRepository.getBillingFactsForQuality({
      filters,
      startDate,
      endDate,
      uploadIds,
    });

    if (!rawData || rawData.length === 0) {
      return {
        score: 100,
        totalRows: 0,
        costAtRisk: 0,
        buckets: {
          untagged: [],
          missingMeta: [],
          anomalies: [],
          all: [],
        },
        compliance: [],
        trendData: [],
        topOffenders: [],
      };
    }

    // Initialize analysis structures
    const totalRows = rawData.length;
    let totalSpend = 0;

    const buckets = {
      untagged: [],
      missingMeta: [],
      anomalies: [],
      all: [],
    };

    const serviceOffenders = {};
    const tagKeyCounts = {};
    const dailyScores = {};

    // Process each row
    rawData.forEach((row) => {
      // Parse cost
      let rawCost = row.BilledCost;
      if (typeof rawCost === 'string') {
        rawCost = rawCost.replace(/[$,]/g, '');
      }
      const cost = parseFloat(rawCost) || 0;
      totalSpend += cost;

      // Extract date
      // ✅ normalize ISO format: "2024-09-01T00:00:00.000Z" -> "2024-09-01"
      const date = row.ChargePeriodStart
        ? String(row.ChargePeriodStart).split('T')[0].split(' ')[0]
        : 'Unknown';

      // A. Check Tags
      let isUntagged = false;
      let tagsObj = {};

      try {
        if (row.Tags && row.Tags !== '{}') {
          const clean = String(row.Tags).replace(/""/g, '"').replace(/^"|"$/g, '');
          tagsObj = JSON.parse(clean);
          Object.keys(tagsObj).forEach((k) => {
            tagKeyCounts[k] = (tagKeyCounts[k] || 0) + 1;
          });
        }
      } catch (e) {
        // Invalid JSON, treat as untagged
        tagsObj = {};
      }

      if (!row.Tags || Object.keys(tagsObj).length === 0) {
        isUntagged = true;
      }

      // B. Check Metadata
      const missingId = !row.ResourceId && !row.ResourceName;
      const missingService = !row.ServiceName;
      const missingRegion = !row.RegionName;

      const issuesFound = [];
      if (isUntagged) issuesFound.push('Untagged');
      if (missingId) issuesFound.push('Missing ID');
      if (missingService) issuesFound.push('Missing Service');
      if (cost <= 0) issuesFound.push('Zero Cost');

      // Enrich row with computed fields
      const enriched = {
        ...row,
        _parsedCost: cost,
        _issues: issuesFound,
      };

      // Bucket the row
      buckets.all.push(enriched);
      if (isUntagged) buckets.untagged.push(enriched);
      if (missingId || missingService || missingRegion) buckets.missingMeta.push(enriched);
      if (cost <= 0) buckets.anomalies.push(enriched);

      // C. Daily Scoring
      if (!dailyScores[date]) {
        dailyScores[date] = { total: 0, bad: 0 };
      }
      dailyScores[date].total++;
      if (isUntagged || missingId) {
        dailyScores[date].bad++;
      }

      // D. Service Offenders (for untagged resources with cost > 0)
      if (isUntagged && cost > 0) {
        const svc = row.ServiceName || 'Unknown';
        if (!serviceOffenders[svc]) {
          serviceOffenders[svc] = { count: 0, cost: 0 };
        }
        serviceOffenders[svc].count++;
        serviceOffenders[svc].cost += cost;
      }
    });

    // Calculate Quality Score
    let score = 100;
    const untaggedSpend = buckets.untagged.reduce((a, b) => a + (b._parsedCost || 0), 0);
    const untaggedPctPercent = costSharePercentage(untaggedSpend, totalSpend);

    // Score penalties
    if (untaggedPctPercent > 1) {
      score -= Math.min(40, Math.ceil(untaggedPctPercent * 0.5));
    }
    if (totalRows > 0 && buckets.missingMeta.length / totalRows > 0.05) {
      score -= 30;
    }
    if (buckets.anomalies.length > 0) {
      score -= 10;
    }

    score = Math.max(0, score);

    // Tag Compliance Analysis
    const compliance = Object.entries(tagKeyCounts)
      .map(([key, count]) => ({
        key,
        count,
        pct: costSharePercentage(count, totalRows),
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Trend Data (daily scores)
    const trendData = Object.keys(dailyScores)
      .sort()
      .map((d) => {
        const day = dailyScores[d];
        const dailyBadPercent = costSharePercentage(day.bad, day.total);
        const dailyScore = Math.max(0, 100 - Math.round(dailyBadPercent));
        return { date: d, score: dailyScore };
      });

    // Top Offenders
    const topOffenders = Object.entries(serviceOffenders)
      .map(([name, val]) => ({
        name,
        count: val.count,
        cost: roundTo(val.cost, 2),
      }))
      .sort((a, b) => b.cost - a.cost)
      .slice(0, 5);

    // Return fully computed, UI-ready data
    return {
      score,
      totalRows,
      costAtRisk: roundTo(untaggedSpend, 2),
      buckets: {
        untagged: buckets.untagged,
        missingMeta: buckets.missingMeta,
        anomalies: buckets.anomalies,
        all: buckets.all,
      },
      compliance,
      trendData,
      topOffenders,
    };
  },
};
