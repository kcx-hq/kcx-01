/**
 * Client-D Quality Service (Modified)
 * - Keeps: missing field detection + tagging completeness
 * - Removes: invalid value detection + duplicates detection
 * - Adds: per-tag-dimension completeness summary
 */

import { dataQualityRepository } from '../../../../core-dashboard/analytics/data-quality/data-quality.repository.js';

/**
 * Safe JSON parse for Tags
 */
function parseTags(tags) {
  if (!tags || tags === '{}' || tags === 'null') return {};
  try {
    const clean = String(tags).replace(/""/g, '"').replace(/^"|"$/g, '');
    const obj = JSON.parse(clean);
    return obj && typeof obj === 'object' ? obj : {};
  } catch {
    return {};
  }
}

export const clientDDataQualityService = {
  async analyzeDataQuality(options = {}) {
    const { filters = {}, startDate, endDate, uploadIds = [] } = options;

    const rawData = await dataQualityRepository.getBillingFactsForQuality({
      filters,
      startDate,
      endDate,
      uploadIds
    });

    if (!rawData || rawData.length === 0) {
      return {
        score: 100,
        totalRows: 0,
        costAtRisk: 0,
        buckets: {
          untagged: [],
          missingMeta: [],
          all: []
        },
        tagDimensions: {}, // NEW
        trendData: [],
        topOffenders: []
      };
    }

    const totalRows = rawData.length;
    let totalSpend = 0;

    const buckets = {
      untagged: [],
      missingMeta: [],
      all: []
    };

    const serviceOffenders = {};
    const dailyScores = {};

    // NEW: tag dimension completeness + cost
    // { [tagKey]: { presentCount, missingCount, presentCost, missingCost, pctPresent } }
    const tagDimensions = {};

    // Track union of tag keys we see (for dimensions)
    const allTagKeys = new Set();

    // First pass: parse costs, tags, and record all tag keys
    const parsedRows = rawData.map((row) => {
      let rawCost = row.BilledCost;
      if (typeof rawCost === 'string') rawCost = rawCost.replace(/[$,]/g, '');
      const cost = parseFloat(rawCost) || 0;

      const date = row.ChargePeriodStart
        ? String(row.ChargePeriodStart).split('T')[0].split(' ')[0]
        : 'Unknown';

      const tagsObj = parseTags(row.Tags);
      Object.keys(tagsObj).forEach((k) => allTagKeys.add(k));

      return { row, cost, date, tagsObj };
    });

    // Initialize tagDimensions for every observed key
    for (const key of allTagKeys) {
      tagDimensions[key] = {
        presentCount: 0,
        missingCount: 0,
        presentCost: 0,
        missingCost: 0,
        pctPresent: 0
      };
    }

    // Second pass: bucket + scoring + per-dimension completeness
    for (const item of parsedRows) {
      const { row, cost, date, tagsObj } = item;
      totalSpend += cost;

      const isUntagged = !row.Tags || Object.keys(tagsObj).length === 0;

      const missingId = !row.ResourceId && !row.ResourceName;
      const missingService = !row.ServiceName;
      const missingRegion = !row.RegionName;

      // ✅ Client-D: NO invalid value detection
      // So we do NOT add "Zero Cost" issue, and we do NOT create anomalies bucket.
      const issuesFound = [];
      if (isUntagged) issuesFound.push('Untagged');
      if (missingId) issuesFound.push('Missing ID');
      if (missingService) issuesFound.push('Missing Service');
      if (missingRegion) issuesFound.push('Missing Region');

      const enriched = {
        ...row,
        _parsedCost: cost,
        _issues: issuesFound
      };

      buckets.all.push(enriched);
      if (isUntagged) buckets.untagged.push(enriched);
      if (missingId || missingService || missingRegion) buckets.missingMeta.push(enriched);

      // Trend scoring (same idea as core: untagged OR missingId counts as bad)
      if (!dailyScores[date]) dailyScores[date] = { total: 0, bad: 0 };
      dailyScores[date].total++;
      if (isUntagged || missingId) dailyScores[date].bad++;

      // Service offenders (untagged with cost > 0)
      if (isUntagged && cost > 0) {
        const svc = row.ServiceName || 'Unknown';
        if (!serviceOffenders[svc]) serviceOffenders[svc] = { count: 0, cost: 0 };
        serviceOffenders[svc].count++;
        serviceOffenders[svc].cost += cost;
      }

      // NEW: per tag dimension completeness
      for (const key of allTagKeys) {
        const hasValue =
          tagsObj &&
          Object.prototype.hasOwnProperty.call(tagsObj, key) &&
          String(tagsObj[key]).trim() !== '';

        if (hasValue) {
          tagDimensions[key].presentCount++;
          tagDimensions[key].presentCost += cost;
        } else {
          tagDimensions[key].missingCount++;
          tagDimensions[key].missingCost += cost;
        }
      }
    }

    // Score logic (modified: remove anomalies/invalid penalties)
    let score = 100;

    const untaggedSpend = buckets.untagged.reduce((a, b) => a + (b._parsedCost || 0), 0);
    const untaggedPct = totalSpend > 0 ? untaggedSpend / totalSpend : 0;

    if (untaggedPct > 0.01) {
      score -= Math.min(40, Math.ceil(untaggedPct * 100 * 0.5));
    }

    if (totalRows > 0 && buckets.missingMeta.length / totalRows > 0.05) {
      score -= 30;
    }

    score = Math.max(0, score);

    // finalize tagDimensions pct
    for (const key of Object.keys(tagDimensions)) {
      const dim = tagDimensions[key];
      dim.pctPresent = totalRows > 0 ? (dim.presentCount / totalRows) * 100 : 0;

      // optional rounding
      dim.presentCost = Number(dim.presentCost.toFixed(2));
      dim.missingCost = Number(dim.missingCost.toFixed(2));
      dim.pctPresent = Number(dim.pctPresent.toFixed(2));
    }

    // Trend data
    const trendData = Object.keys(dailyScores)
      .sort()
      .map((d) => {
        const day = dailyScores[d];
        const dailyScore = Math.max(0, 100 - Math.round((day.bad / day.total) * 100));
        return { date: d, score: dailyScore };
      });

    // Top offenders
    const topOffenders = Object.entries(serviceOffenders)
      .map(([name, val]) => ({ name, count: val.count, cost: val.cost }))
      .sort((a, b) => b.cost - a.cost)
      .slice(0, 5);

    return {
      score,
      totalRows,
      costAtRisk: untaggedSpend,
      buckets: {
        untagged: buckets.untagged,
        missingMeta: buckets.missingMeta,
        all: buckets.all
      },
      // ✅ Client-D: per tag dimension completeness
      tagDimensions,
      trendData,
      topOffenders
    };
  }
};
