import {
  BillingUsageFact,
  Service,
  Region,
  CloudAccount,
  Resource,
  BillingUpload,
} from '../../../models/index.js';
import Sequelize from '../../../config/db.config.js';
import { Op } from 'sequelize';
import {
  anomalyThreshold,
  averageDailyFromPeriod,
  budgetUtilizationPercentage,
  budgetVariance,
  costSharePercentage,
  dailyAverageSpend,
  forecastedMonthlySpend,
  monthOverMonthPercentage,
  roundTo,
  splitPeriodTrendPercentage,
} from '../../../common/utils/cost.calculations.js';
import { optimizationService } from '../optimization/optimization.service.js';
import { costDriversService } from '../analytics/cost-drivers/cost-drivers.service.js';
import {
  checkOwnershipGaps,
  checkTagCompliance,
} from '../governance/governance.policies.js';

/**
 * Resolve filter names to IDs for WHERE clause filtering
 * This avoids unnecessary JOINs for filtering, improving performance
 * @param {Object} filters - Filter object
 * @returns {Promise<Object|null>} WHERE clause with IDs, or null if filter value not found
 */
async function resolveFiltersToIds(filters = {}) {
  const where = {};
  const { provider, service, region } = filters;

  // 1. Resolve Provider (CloudAccount)
  if (provider && provider !== 'All') {
    const accounts = await CloudAccount.findAll({
      where: { providername: provider },
      attributes: ['id'],
      raw: true,
    });
    if (!accounts.length) return null;
    where.cloudaccountid = { [Op.in]: accounts.map(a => a.id) };
  }

  // 2. Resolve Service
  if (service && service !== 'All') {
    const services = await Service.findAll({
      where: { servicename: service },
      attributes: ['serviceid'],
      raw: true,
    });
    if (!services.length) return null;
    where.serviceid = { [Op.in]: services.map(s => s.serviceid) };
  }

  // 3. Resolve Region
  if (region && region !== 'All') {
    const regions = await Region.findAll({
      where: { regionname: region },
      attributes: ['id'],
      raw: true,
    });
    if (!regions.length) return null;
    where.regionid = { [Op.in]: regions.map(r => r.id) };
  }

  return where;
}

/**
 * Helper: Apply uploadId / uploadIds isolation into WHERE clause
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
  // if user has no uploads, caller should return empty
  return whereClause;
}

const moneyToNumber = (value) => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (typeof value === 'string') {
    const n = Number(value.replace(/[^0-9.-]/g, ''));
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
};

const toSafeDate = (value) => {
  const d = value ? new Date(value) : null;
  return d && !Number.isNaN(d.getTime()) ? d : null;
};

const isoDate = (value) => {
  const d = toSafeDate(value);
  return d ? d.toISOString().split('T')[0] : null;
};

const getMonthProgress = (referenceDate) => {
  const safeRef = toSafeDate(referenceDate) || new Date();
  const y = safeRef.getFullYear();
  const m = safeRef.getMonth();
  const daysInMonth = new Date(y, m + 1, 0).getDate();
  const daysElapsed = Math.min(daysInMonth, Math.max(1, safeRef.getDate()));

  return {
    referenceDate: safeRef,
    daysInMonth,
    daysElapsed,
    monthElapsedPercent: costSharePercentage(daysElapsed, daysInMonth),
  };
};

const inferAnomalyCause = (serviceName = '') => {
  const s = String(serviceName || '').toLowerCase();
  if (s.includes('data') || s.includes('transfer') || s.includes('network')) {
    return 'Network or data-transfer surge';
  }
  if (s.includes('storage') || s.includes('s3') || s.includes('blob')) {
    return 'Storage growth or retention drift';
  }
  if (s.includes('compute') || s.includes('ec2') || s.includes('vm') || s.includes('instance')) {
    return 'Compute utilization spike';
  }
  return 'Usage spike above expected baseline';
};

const mapActionStatus = (status) => {
  const s = String(status || '').toLowerCase();
  if (s === 'identified') return 'New';
  if (s === 'in-review' || s === 'in_progress' || s === 'inprogress') return 'In progress';
  if (s === 'done' || s === 'completed') return 'Done';
  if (s === 'verified') return 'Verified';
  return 'New';
};

const etaDaysFromPriority = (priority = 'medium') => {
  const p = String(priority || '').toLowerCase();
  if (p === 'high') return 3;
  if (p === 'low') return 14;
  return 7;
};

const buildEmptyExecutiveOverview = () => ({
  kpiHeader: {
    mtdSpend: 0,
    mtdSpendDeltaPercent: 0,
    eomForecast: 0,
    budget: 0,
    budgetVarianceValue: 0,
    budgetVariancePercent: 0,
    realizedSavingsMtd: 0,
    pipelineSavings: 0,
    unallocatedSpendValue: 0,
    unallocatedSpendPercent: 0,
  },
  outcomeAndRisk: {
    budgetBurn: {
      status: 'Watch',
      budgetConsumedPercent: 0,
      monthElapsedPercent: 0,
      varianceToPacePercent: 0,
      burnRatePerDay: 0,
    },
    riskFlags: [],
  },
  topMovers: {
    drivers: [],
    providerMix: [],
    concentration: {
      topRegion: { name: 'N/A', sharePercent: 0 },
      topService: { name: 'N/A', sharePercent: 0 },
    },
    spendAnalyticsLink: '/dashboard/cost-analysis',
    driversLink: '/dashboard/cost-drivers',
  },
  actionCenter: {
    actions: [],
    optimizationLink: '/dashboard/optimization',
  },
  anomalySpotlight: {
    anomalies: [],
    spendAnalyticsLink: '/dashboard/cost-analysis',
  },
  dataTrust: {
    lastDataRefreshAt: null,
    freshnessHours: null,
    ownerCoveragePercent: 0,
    ownerCoverageValue: 0,
    tagCompliancePercent: 0,
    tagComplianceHeadline: 'Tag compliance unavailable',
    governanceLink: '/dashboard/data-quality',
  },
});

export const dashboardService = {
  /**
   * Helper: Maps display column names to database field names (BillingUsageFact table only)
   */
  mapColumnToField(columnName) {
    const mapping = {
      Id: 'id',
      BilledCost: 'billedcost',
      ChargePeriodStart: 'chargeperiodstart',
      ChargePeriodEnd: 'chargeperiodend',
      BillingPeriodStart: 'billingperiodstart',
      BillingPeriodEnd: 'billingperiodend',
      ChargeDescription: 'chargedescription',
      ChargeCategory: 'chargecategory',
      ChargeClass: 'chargeclass',
      ConsumedQuantity: 'consumedquantity',
      ConsumedUnit: 'consumedunit',
      PricingQuantity: 'pricingquantity',
      PricingUnit: 'pricingunit',
      ListUnitPrice: 'listunitprice',
      ContractedUnitPrice: 'contractedunitprice',
      ListCost: 'listcost',
      ContractedCost: 'contractedcost',
      EffectiveCost: 'effectivecost',
      Tags: 'tags',
    };
    return mapping[columnName] || null;
  },

  /**
   * 1) GET FILTER OPTIONS
   * IMPORTANT: scoped by user uploadIds (data isolation)
   */
  async getFilters( uploadIds = []) {
    // If you want global filters (across all uploads), remove the early return + upload filter below.
    if (!uploadIds || uploadIds.length === 0) {
      return { providers: ['All'], services: ['All'], regions: ['All'] };
    }

    const whereFact = { uploadid: { [Op.in]: uploadIds } };

    const [providers, services, regions] = await Promise.all([
      BillingUsageFact.findAll({
        where: whereFact,
        include: [{ model: CloudAccount, as: 'cloudAccount', attributes: [], required: true }],
        attributes: [[Sequelize.fn('DISTINCT', Sequelize.col('cloudAccount.providername')), 'value']],
        raw: true,
      }),
      BillingUsageFact.findAll({
        where: whereFact,
        include: [{ model: Service, as: 'service', attributes: [], required: true }],
        attributes: [[Sequelize.fn('DISTINCT', Sequelize.col('service.servicename')), 'value']],
        order: [[Sequelize.col('value'), 'ASC']],
        raw: true,
      }),
      BillingUsageFact.findAll({
        where: whereFact,
        include: [{ model: Region, as: 'region', attributes: [], required: true }],
        attributes: [[Sequelize.fn('DISTINCT', Sequelize.col('region.regionname')), 'value']],
        order: [[Sequelize.col('value'), 'ASC']],
        raw: true,
      }),
    ]);

    return {
      providers: ['All', ...providers.map(p => p.value).filter(Boolean)],
      services: ['All', ...services.map(s => s.value).filter(Boolean)],
      regions: ['All', ...regions.map(r => r.value).filter(Boolean)],
    };
  },

  /**
   * 2) GET OVERVIEW METRICS
   * Bar chart always "Spend by Service"
   */
  async getOverviewMetrics(filters, uploadIds = []) {
    const { provider, service, region, uploadId } = filters || {};
    const budgetInput = moneyToNumber(filters?.budget);

    const empty = {
      totalSpend: 0,
      dailyData: [],
      groupedData: [],
      allRegionData: [],
      topRegion: { name: 'N/A', value: 0 },
      topService: { name: 'N/A', value: 0 },
      spendChangePercent: 0,
      topProvider: { name: 'N/A', value: 0 },
      untaggedCost: 0,
      missingMetadataCost: 0,
      billingPeriod: null,
      topRegionPercent: 0,
      topServicePercent: 0,
      avgDailySpend: 0,
      executiveOverview: buildEmptyExecutiveOverview(),
    };

    if (!uploadIds || uploadIds.length === 0) return empty;

    const resolved = await resolveFiltersToIds({ provider, service, region });
    if (resolved === null) return empty;

    const whereClause = applyUploadIsolation({ ...resolved }, uploadId, uploadIds);
    const monthExpr = Sequelize.literal(`DATE_TRUNC('month', "BillingUsageFact"."chargeperiodstart")`);

    const [
      totalSpend,
      dailyTrend,
      servicesAgg,
      topRegionResult,
      topProviderResult,
      allRegionsResult,
      untaggedResult,
      missingMetaResult,
      periodRange,
      monthlySpend,
      providerMixResult,
      realizedSavingsResult,
      latestUpload,
    ] = await Promise.all([
      BillingUsageFact.sum('billedcost', { where: whereClause }),
      BillingUsageFact.findAll({
        where: whereClause,
        attributes: [
          [Sequelize.fn('DATE', Sequelize.col('BillingUsageFact.chargeperiodstart')), 'date'],
          [Sequelize.fn('SUM', Sequelize.col('BillingUsageFact.billedcost')), 'cost'],
        ],
        group: [Sequelize.fn('DATE', Sequelize.col('BillingUsageFact.chargeperiodstart'))],
        order: [[Sequelize.fn('DATE', Sequelize.col('BillingUsageFact.chargeperiodstart')), 'ASC']],
        raw: true,
      }),
      BillingUsageFact.findAll({
        where: whereClause,
        include: [{ model: Service, as: 'service', required: true, attributes: [] }],
        attributes: [
          [Sequelize.col('service.servicename'), 'name'],
          [Sequelize.fn('SUM', Sequelize.col('BillingUsageFact.billedcost')), 'value'],
        ],
        group: [Sequelize.col('service.servicename')],
        order: [[Sequelize.literal('value'), 'DESC']],
        limit: 15,
        raw: true,
      }),
      BillingUsageFact.findAll({
        where: whereClause,
        include: [{ model: Region, as: 'region', required: true, attributes: [] }],
        attributes: [
          [Sequelize.col('region.regionname'), 'name'],
          [Sequelize.fn('SUM', Sequelize.col('BillingUsageFact.billedcost')), 'value'],
        ],
        group: [Sequelize.col('region.regionname')],
        order: [[Sequelize.literal('value'), 'DESC']],
        limit: 1,
        raw: true,
      }),
      BillingUsageFact.findAll({
        where: whereClause,
        include: [{ model: CloudAccount, as: 'cloudAccount', required: true, attributes: [] }],
        attributes: [
          [Sequelize.col('cloudAccount.providername'), 'name'],
          [Sequelize.fn('SUM', Sequelize.col('BillingUsageFact.billedcost')), 'value'],
        ],
        group: [Sequelize.col('cloudAccount.providername')],
        order: [[Sequelize.literal('value'), 'DESC']],
        limit: 1,
        raw: true,
      }),
      BillingUsageFact.findAll({
        where: whereClause,
        include: [{ model: Region, as: 'region', required: true, attributes: [] }],
        attributes: [
          [Sequelize.col('region.regionname'), 'name'],
          [Sequelize.fn('SUM', Sequelize.col('BillingUsageFact.billedcost')), 'value'],
        ],
        group: [Sequelize.col('region.regionname')],
        order: [[Sequelize.literal('value'), 'DESC']],
        raw: true,
      }),
      BillingUsageFact.findOne({
        where: {
          ...whereClause,
          [Op.or]: [{ tags: { [Op.is]: null } }, { tags: { [Op.eq]: {} } }],
        },
        attributes: [[Sequelize.fn('SUM', Sequelize.col('BillingUsageFact.billedcost')), 'total']],
        raw: true,
      }),
      BillingUsageFact.findOne({
        where: { ...whereClause, resourceid: { [Op.or]: [{ [Op.is]: null }, { [Op.eq]: '' }] } },
        attributes: [[Sequelize.fn('SUM', Sequelize.col('BillingUsageFact.billedcost')), 'total']],
        raw: true,
      }),
      BillingUsageFact.findOne({
        where: whereClause,
        attributes: [
          [Sequelize.fn('MIN', Sequelize.col('BillingUsageFact.billingperiodstart')), 'billingStart'],
          [Sequelize.fn('MAX', Sequelize.col('BillingUsageFact.billingperiodend')), 'billingEnd'],
          [Sequelize.fn('MIN', Sequelize.col('BillingUsageFact.chargeperiodstart')), 'chargeStart'],
          [Sequelize.fn('MAX', Sequelize.col('BillingUsageFact.chargeperiodend')), 'chargeEnd'],
        ],
        raw: true,
      }),
      BillingUsageFact.findAll({
        where: whereClause,
        attributes: [
          [monthExpr, 'month'],
          [Sequelize.fn('SUM', Sequelize.col('BillingUsageFact.billedcost')), 'value'],
        ],
        group: [monthExpr],
        order: [[monthExpr, 'DESC']],
        limit: 2,
        raw: true,
      }),
      BillingUsageFact.findAll({
        where: whereClause,
        include: [{ model: CloudAccount, as: 'cloudAccount', required: true, attributes: [] }],
        attributes: [
          [Sequelize.col('cloudAccount.providername'), 'provider'],
          [Sequelize.fn('SUM', Sequelize.col('BillingUsageFact.billedcost')), 'value'],
        ],
        group: [Sequelize.col('cloudAccount.providername')],
        order: [[Sequelize.literal('value'), 'DESC']],
        raw: true,
      }),
      BillingUsageFact.findOne({
        where: whereClause,
        attributes: [
          [
            Sequelize.literal(
              'SUM(GREATEST(COALESCE("BillingUsageFact"."listcost",0) - COALESCE("BillingUsageFact"."effectivecost",0), 0))'
            ),
            'value',
          ],
        ],
        raw: true,
      }),
      BillingUpload.findOne({
        where: { uploadid: { [Op.in]: uploadIds } },
        attributes: ['uploadid', 'uploadedat'],
        order: [['uploadedat', 'DESC']],
        raw: true,
      }),
    ]);

    const totalSpendNum = Number(totalSpend || 0);
    const groupedData = (servicesAgg || []).map((r) => ({
      name: r.name || 'Unknown',
      value: Number(r.value || 0),
    }));
    const topService = groupedData.length ? groupedData[0] : { name: 'N/A', value: 0 };

    const topRegion =
      topRegionResult?.length > 0
        ? { name: topRegionResult[0].name || 'Unknown', value: Number(topRegionResult[0].value || 0) }
        : { name: 'N/A', value: 0 };

    const topProvider =
      topProviderResult?.length > 0
        ? { name: topProviderResult[0].name || 'Unknown', value: Number(topProviderResult[0].value || 0) }
        : { name: 'N/A', value: 0 };

    const allRegionData = (allRegionsResult || []).map((r) => ({
      name: r.name || 'Unknown',
      value: Number(r.value || 0),
    }));

    const untaggedCost = Number(untaggedResult?.total || 0);
    const missingMetadataCost = Number(missingMetaResult?.total || 0);

    const billingStart = periodRange?.billingStart || periodRange?.chargeStart || null;
    const billingEnd = periodRange?.billingEnd || periodRange?.chargeEnd || null;
    const billingPeriod = billingStart || billingEnd ? { start: billingStart, end: billingEnd } : null;

    const currentMonthSpend = Number(monthlySpend?.[0]?.value || 0);
    const previousMonthSpend = Number(monthlySpend?.[1]?.value || 0);
    const spendChangePercent = monthOverMonthPercentage(currentMonthSpend, previousMonthSpend);

    const topServicePercent = costSharePercentage(topService.value, totalSpendNum);
    const topRegionPercent = costSharePercentage(topRegion.value, totalSpendNum);
    const avgDailySpend = averageDailyFromPeriod(
      totalSpendNum,
      billingPeriod?.start,
      billingPeriod?.end,
      dailyTrend.length || 1
    );

    const latestChargeDate =
      toSafeDate(periodRange?.chargeEnd) ||
      toSafeDate(dailyTrend?.[dailyTrend.length - 1]?.date) ||
      new Date();
    const monthProgress = getMonthProgress(latestChargeDate);

    const mtdSpend = roundTo(currentMonthSpend > 0 ? currentMonthSpend : totalSpendNum, 2);
    const eomForecast = roundTo(
      forecastedMonthlySpend(
        dailyAverageSpend(mtdSpend, monthProgress.daysElapsed),
        monthProgress.daysInMonth
      ),
      2
    );

    const resolvedBudget = roundTo(
      budgetInput > 0
        ? budgetInput
        : (previousMonthSpend > 0 ? previousMonthSpend * 1.05 : eomForecast * 1.05),
      2
    );
    const budgetVarianceValue = roundTo(budgetVariance(eomForecast, resolvedBudget), 2);
    const budgetVariancePercent =
      resolvedBudget > 0 ? roundTo((budgetVarianceValue / resolvedBudget) * 100, 2) : 0;
    const budgetConsumedPercent = roundTo(
      budgetUtilizationPercentage(mtdSpend, resolvedBudget),
      2
    );
    const monthElapsedPercent = roundTo(monthProgress.monthElapsedPercent, 2);
    const varianceToPacePercent = roundTo(budgetConsumedPercent - monthElapsedPercent, 2);

    let burnStatus = 'On track';
    if (
      budgetConsumedPercent > monthElapsedPercent + 10 ||
      (resolvedBudget > 0 && eomForecast > resolvedBudget * 1.08)
    ) {
      burnStatus = 'Over budget';
    } else if (
      budgetConsumedPercent > monthElapsedPercent + 3 ||
      (resolvedBudget > 0 && eomForecast > resolvedBudget)
    ) {
      burnStatus = 'Watch';
    }

    const [
      anomaliesData,
      ownershipGaps,
      tagCompliance,
      commitmentGaps,
      optimizationRecs,
      optimizationTracker,
      costDriversPreview,
    ] = await Promise.all([
      this.getAnomalies(filters, uploadIds).catch(() => ({ list: [], count: 0 })),
      checkOwnershipGaps({
        filters: { provider, service, region },
        uploadIds,
      }).catch(() => ({ ownedCostValue: 0, unownedCostValue: 0 })),
      checkTagCompliance({
        filters: { provider, service, region },
        uploadIds,
      }).catch(() => ({ taggedPercent: 0 })),
      optimizationService.getCommitmentGaps({
        filters: { provider, service, region },
        uploadIds,
      }).catch(() => ({ onDemandPercentage: 0, potentialSavings: 0 })),
      optimizationService.getRecommendations({
        filters: { provider, service, region },
        uploadIds,
      }).catch(() => ({
        idleResources: [],
        underutilizedServices: [],
        rightSizingRecommendations: [],
      })),
      optimizationService.getTrackerItems({
        filters: { provider, service, region },
        uploadIds,
      }).catch(() => []),
      costDriversService.getCostDrivers({
        filters: { provider, service, region },
        uploadIds,
        period: 30,
        dimension: 'ServiceName',
        minChange: 0,
      }).catch(() => ({ increases: [], decreases: [] })),
    ]);

    const anomalyList = Array.isArray(anomaliesData?.list) ? anomaliesData.list : [];
    const anomalyImpactValue = roundTo(
      anomalyList.reduce((sum, item) => {
        const cost = moneyToNumber(item?.cost);
        const threshold = moneyToNumber(item?.threshold);
        return sum + Math.max(0, cost - threshold);
      }, 0),
      2
    );

    const ownedSpendValue = moneyToNumber(ownershipGaps?.ownedCostValue);
    const unallocatedSpendValue = roundTo(
      moneyToNumber(ownershipGaps?.unownedCostValue),
      2
    );
    const ownershipSpendTotal = Math.max(ownedSpendValue + unallocatedSpendValue, totalSpendNum, 0);
    const unallocatedSpendPercent = roundTo(
      costSharePercentage(unallocatedSpendValue, ownershipSpendTotal || 1),
      2
    );
    const ownerCoveragePercent = roundTo(
      costSharePercentage(ownedSpendValue, ownershipSpendTotal || 1),
      2
    );

    const pipelineSavings = roundTo(
      [
        ...(optimizationRecs?.idleResources || []).map((r) => moneyToNumber(r?.savings)),
        ...(optimizationRecs?.rightSizingRecommendations || []).map((r) => moneyToNumber(r?.savings)),
        ...(optimizationRecs?.underutilizedServices || []).map((r) => moneyToNumber(r?.potentialSavings)),
      ].reduce((sum, value) => sum + value, 0),
      2
    );

    const providerMix = (providerMixResult || []).map((row) => {
      const value = moneyToNumber(row?.value);
      return {
        provider: row?.provider || 'Unknown',
        value: roundTo(value, 2),
        percent: roundTo(costSharePercentage(value, totalSpendNum || 1), 2),
      };
    });

    const driverCandidates = [
      ...(costDriversPreview?.increases || []).map((d) => ({
        name: d?.name || 'Unknown',
        deltaValue: roundTo(moneyToNumber(d?.diff), 2),
        direction: 'increase',
      })),
      ...(costDriversPreview?.decreases || []).map((d) => ({
        name: d?.name || 'Unknown',
        deltaValue: roundTo(moneyToNumber(d?.diff), 2),
        direction: 'decrease',
      })),
    ]
      .sort((a, b) => Math.abs(b.deltaValue) - Math.abs(a.deltaValue))
      .slice(0, 5)
      .map((d) => ({ ...d, deepLink: '/dashboard/cost-drivers' }));

    const trackerByTitle = new Map(
      (optimizationTracker || []).map((item) => [
        String(item?.title || '').toLowerCase(),
        mapActionStatus(item?.status),
      ])
    );
    const resolveActionStatus = (title, fallback = 'New') => {
      const normalized = String(title || '').toLowerCase();
      for (const [key, value] of trackerByTitle.entries()) {
        if (key && normalized.includes(key)) return value;
      }
      return fallback;
    };

    const idleActions = (optimizationRecs?.idleResources || []).slice(0, 8).map((resource) => {
      const title = `Decommission idle ${resource?.type || 'resource'} ${resource?.name || ''}`.trim();
      const expectedSavings = roundTo(moneyToNumber(resource?.savings), 2);
      const priority = String(resource?.risk || '').toLowerCase().includes('prod') ? 'high' : 'medium';
      return {
        id: `idle-${resource?.id || resource?.resourceId || title}`,
        title,
        owner: resource?.owner || 'Unassigned',
        status: resolveActionStatus(title, 'New'),
        expectedSavings,
        confidence: resource?.confidence || 'Medium',
        etaDays: etaDaysFromPriority(priority),
        etaLabel: `${etaDaysFromPriority(priority)}d`,
        deepLink: '/dashboard/optimization',
      };
    });

    const rightSizeActions = (optimizationRecs?.rightSizingRecommendations || [])
      .slice(0, 8)
      .map((rec) => {
        const title = `Rightsize ${rec?.currentInstance || 'instance'} -> ${rec?.recommendedInstance || 'optimized size'}`;
        const expectedSavings = roundTo(moneyToNumber(rec?.savings), 2);
        const confidence =
          rec?.confidence || (String(rec?.riskLevel || '').toLowerCase() === 'low' ? 'High' : 'Medium');
        return {
          id: `rightsize-${rec?.id || rec?.resourceId || title}`,
          title,
          owner: 'FinOps / Platform',
          status: resolveActionStatus(title, 'In progress'),
          expectedSavings,
          confidence,
          etaDays: etaDaysFromPriority('medium'),
          etaLabel: `${etaDaysFromPriority('medium')}d`,
          deepLink: '/dashboard/optimization',
        };
      });

    const topActions = [...idleActions, ...rightSizeActions]
      .sort((a, b) => b.expectedSavings - a.expectedSavings)
      .slice(0, 5);

    const latestUploadAt = latestUpload?.uploadedat ? new Date(latestUpload.uploadedat) : null;
    const freshnessHours =
      latestUploadAt && !Number.isNaN(latestUploadAt.getTime())
        ? roundTo((Date.now() - latestUploadAt.getTime()) / (1000 * 60 * 60), 2)
        : null;

    const onDemandPercentage = roundTo(moneyToNumber(commitmentGaps?.onDemandPercentage), 2);
    const commitmentWasteRisk = roundTo(moneyToNumber(commitmentGaps?.potentialSavings), 2);
    const concentrationShare = roundTo(Math.max(topServicePercent, topRegionPercent), 2);

    const riskFlags = [
      {
        key: 'anomalies',
        label: 'Anomalies active',
        active: (anomaliesData?.count || 0) > 0,
        severity: (anomaliesData?.count || 0) > 5 ? 'high' : ((anomaliesData?.count || 0) > 0 ? 'medium' : 'low'),
        count: anomaliesData?.count || 0,
        impactValue: anomalyImpactValue,
        ctaLink: '/dashboard/cost-analysis',
      },
      {
        key: 'unallocated',
        label: 'High unallocated spend',
        active: unallocatedSpendPercent >= 10,
        severity: unallocatedSpendPercent >= 15 ? 'high' : (unallocatedSpendPercent >= 10 ? 'medium' : 'low'),
        count: null,
        impactValue: unallocatedSpendValue,
        metricPercent: unallocatedSpendPercent,
        ctaLink: '/dashboard/allocation-unit-economics',
      },
      {
        key: 'commitment',
        label: 'Low commitment utilization',
        active: onDemandPercentage >= 60,
        severity: onDemandPercentage >= 75 ? 'high' : (onDemandPercentage >= 60 ? 'medium' : 'low'),
        count: null,
        impactValue: commitmentWasteRisk,
        metricPercent: onDemandPercentage,
        ctaLink: '/dashboard/optimization',
      },
      {
        key: 'freshness',
        label: 'Data freshness issue',
        active: freshnessHours != null && freshnessHours > 24,
        severity: freshnessHours != null && freshnessHours > 48 ? 'high' : ((freshnessHours != null && freshnessHours > 24) ? 'medium' : 'low'),
        count: null,
        impactValue: 0,
        metricHours: freshnessHours,
        ctaLink: '/dashboard/data-quality',
      },
      {
        key: 'concentration',
        label: 'Top concentration risk',
        active: concentrationShare >= 45,
        severity: concentrationShare >= 60 ? 'high' : (concentrationShare >= 45 ? 'medium' : 'low'),
        count: null,
        impactValue: 0,
        metricPercent: concentrationShare,
        ctaLink: '/dashboard/cost-analysis',
      },
    ];

    const tagCompliancePercent = roundTo(moneyToNumber(tagCompliance?.taggedPercent), 2);
    const tagComplianceHeadline =
      tagCompliancePercent >= 90
        ? 'Tag compliance strong'
        : tagCompliancePercent >= 75
          ? 'Tag compliance improving'
          : 'Tag compliance needs attention';

    const executiveOverview = {
      kpiHeader: {
        mtdSpend: roundTo(mtdSpend, 2),
        mtdSpendDeltaPercent: roundTo(spendChangePercent, 2),
        eomForecast: roundTo(eomForecast, 2),
        budget: roundTo(resolvedBudget, 2),
        budgetVarianceValue: roundTo(budgetVarianceValue, 2),
        budgetVariancePercent: roundTo(budgetVariancePercent, 2),
        realizedSavingsMtd: roundTo(moneyToNumber(realizedSavingsResult?.value), 2),
        pipelineSavings: roundTo(pipelineSavings, 2),
        unallocatedSpendValue: roundTo(unallocatedSpendValue, 2),
        unallocatedSpendPercent: roundTo(unallocatedSpendPercent, 2),
      },
      outcomeAndRisk: {
        budgetBurn: {
          status: burnStatus,
          budgetConsumedPercent: roundTo(budgetConsumedPercent, 2),
          monthElapsedPercent: roundTo(monthElapsedPercent, 2),
          varianceToPacePercent: roundTo(varianceToPacePercent, 2),
          burnRatePerDay: roundTo(dailyAverageSpend(mtdSpend, monthProgress.daysElapsed), 2),
        },
        riskFlags,
      },
      topMovers: {
        drivers: driverCandidates,
        providerMix,
        concentration: {
          topRegion: { name: topRegion?.name || 'N/A', sharePercent: roundTo(topRegionPercent, 2) },
          topService: { name: topService?.name || 'N/A', sharePercent: roundTo(topServicePercent, 2) },
        },
        spendAnalyticsLink: '/dashboard/cost-analysis',
        driversLink: '/dashboard/cost-drivers',
      },
      actionCenter: {
        actions: topActions,
        optimizationLink: '/dashboard/optimization',
      },
      anomalySpotlight: {
        anomalies: anomalyList.slice(0, 3).map((a) => ({
          id: a?.id,
          serviceName: a?.ServiceName || 'Unknown Service',
          providerName: a?.ProviderName || 'N/A',
          regionName: a?.RegionName || 'N/A',
          impactPerDay: roundTo(Math.max(0, moneyToNumber(a?.cost) - moneyToNumber(a?.threshold)), 2),
          suspectedCause: inferAnomalyCause(a?.ServiceName),
          firstDetectedDate: isoDate(a?.ChargePeriodStart),
          cost: roundTo(moneyToNumber(a?.cost), 2),
          deepLink: '/dashboard/cost-analysis',
        })),
        spendAnalyticsLink: '/dashboard/cost-analysis',
      },
      dataTrust: {
        lastDataRefreshAt: latestUploadAt ? latestUploadAt.toISOString() : null,
        freshnessHours,
        ownerCoveragePercent: roundTo(ownerCoveragePercent, 2),
        ownerCoverageValue: roundTo(ownedSpendValue, 2),
        tagCompliancePercent,
        tagComplianceHeadline,
        governanceLink: '/dashboard/data-quality',
      },
    };

    return {
      totalSpend: roundTo(totalSpendNum, 2),
      dailyData: (dailyTrend || []).map((d) => ({ date: d.date, cost: roundTo(d.cost || 0, 2) })),
      groupedData: groupedData.map((d) => ({ ...d, value: roundTo(d.value, 2) })),
      allRegionData: allRegionData.map((d) => ({ ...d, value: roundTo(d.value, 2) })),
      topRegion: { ...topRegion, value: roundTo(topRegion.value, 2) },
      topService: { ...topService, value: roundTo(topService.value, 2) },
      spendChangePercent: roundTo(spendChangePercent, 2),
      topProvider: { ...topProvider, value: roundTo(topProvider.value, 2) },
      untaggedCost: roundTo(untaggedCost, 2),
      missingMetadataCost: roundTo(missingMetadataCost, 2),
      billingPeriod,
      topRegionPercent: roundTo(topRegionPercent, 2),
      topServicePercent: roundTo(topServicePercent, 2),
      avgDailySpend: roundTo(avgDailySpend, 2),
      executiveOverview,
    };
  },

  /**
   * 3) GET ANOMALIES (DB-side avg + stddev)
   */
  async getAnomalies(filters, uploadIds = []) {
    try {
      const { provider, service, region, uploadId } = filters || {};

      if (!uploadIds || uploadIds.length === 0) return { list: [], count: 0 };

      // Resolve name filters to IDs (fast WHERE without JOINs)
      const baseResolved = await resolveFiltersToIds({ provider, service, region });
      if (baseResolved === null) return { list: [], count: 0 };

      const statsWhereClause = applyUploadIsolation({ ...baseResolved }, uploadId, uploadIds);
      statsWhereClause.billedcost = { [Op.gt]: 0 };

      // Stats without JOINs
      const stats = await BillingUsageFact.findOne({
        where: statsWhereClause,
        include: [],
        attributes: [
          [Sequelize.fn('AVG', Sequelize.col('billedcost')), 'avgCost'],
          [Sequelize.fn('STDDEV', Sequelize.col('billedcost')), 'stdDev'],
        ],
        raw: true,
      });

      const avg = stats?.avgCost ? parseFloat(stats.avgCost) : 0;
      const stdDev = stats?.stdDev ? parseFloat(stats.stdDev) : 0;

      if (!stats || stdDev < 0.01) return { list: [], count: 0 };

      const threshold = anomalyThreshold(avg, stdDev, 2);

      // Display includes (optional, but used for output labels)
      const include = [
        { model: CloudAccount, as: 'cloudAccount', required: false },
        { model: Service, as: 'service', required: false },
        { model: Region, as: 'region', required: false },
        { model: Resource, as: 'resource', required: false },
      ];

      const anomalies = await BillingUsageFact.findAll({
        where: { ...statsWhereClause, billedcost: { [Op.gt]: threshold } },
        include,
        order: [['billedcost', 'DESC']],
        limit: 10,
      });

      return {
        list: anomalies.map(a => ({
          id: a.id,
          ServiceName: a.service?.servicename || 'Unknown Service',
          ProviderName: a.cloudAccount?.providername || 'N/A',
          RegionName: a.region?.regionname || 'N/A',
          ResourceId: a.resourceid || a.resource?.resourceid || null,
          cost: parseFloat(a.billedcost || 0),
          ChargePeriodStart: a.chargeperiodstart
            ? new Date(a.chargeperiodstart).toISOString().split('T')[0]
            : null,
          threshold: roundTo(threshold, 2),
        })),
        count: anomalies.length,
      };
    } catch (error) {
      logger.error('Anomaly Calculation Error:', error);
      return { list: [], count: 0 };
    }
  },

  /**
   * 4) GET DATA EXPLORER DATA (Paginated, Filtered, Sorted)
   */
  async getDataExplorerData(filters = {}, pagination = {}, uploadIds = []) {
    const { provider, service, region, uploadId } = filters;
    const {
      page = 1,
      limit = 100,
      sortBy = null,
      sortOrder = 'asc',
      columnFilters = {},
      groupByCol = null,
      viewMode = 'table',
    } = pagination;

    const standardColumns = [
      'Id',
      'BilledCost',
      'ChargePeriodStart',
      'ChargePeriodEnd',
      'BillingPeriodStart',
      'BillingPeriodEnd',
      'ChargeDescription',
      'ChargeCategory',
      'ChargeClass',
      'ConsumedQuantity',
      'ConsumedUnit',
      'PricingQuantity',
      'PricingUnit',
      'ListUnitPrice',
      'ContractedUnitPrice',
      'ListCost',
      'ContractedCost',
      'EffectiveCost',
      'Tags',
      'ProviderName',
      'BillingAccountId',
      'BillingAccountName',
      'ServiceName',
      'ServiceCategory',
      'RegionName',
      'AvailabilityZone',
      'ResourceId',
      'ResourceName',
    ];

    const getEmptyResult = () => {
      const emptySummaryData = {};
      standardColumns.forEach(col => {
        const lower = col.toLowerCase();
        const isNumeric =
          lower.includes('cost') ||
          lower.includes('price') ||
          lower.includes('amount') ||
          lower.includes('quantity') ||
          lower.includes('usage') ||
          lower.includes('rate');
        const isId = lower.includes('id') && !lower.includes('price');
        emptySummaryData[col] = isNumeric && !isId ? 0 : null;
      });

      return {
        data: [],
        allColumns: standardColumns,
        quickStats: { totalCost: 0, avgCost: 0, maxCost: 0 },
        summaryData: emptySummaryData,
        columnMaxValues: {},
        groupedData: [],
        pagination: { page: parseInt(page), limit: parseInt(limit), total: 0, totalPages: 0 },
      };
    };

    if (!uploadIds || uploadIds.length === 0) return getEmptyResult();

    const resolved = await resolveFiltersToIds({ provider, service, region });
    if (resolved === null) return getEmptyResult();

    const whereClause = applyUploadIsolation({ ...resolved }, uploadId, uploadIds);

    // display includes (LEFT joins)
    const include = [
      {
        model: CloudAccount,
        as: 'cloudAccount',
        required: false,
        attributes: ['providername', 'billingaccountid', 'billingaccountname'],
      },
      {
        model: Service,
        as: 'service',
        required: false,
        attributes: ['servicename', 'servicecategory'],
      },
      {
        model: Region,
        as: 'region',
        required: false,
        attributes: ['regionname', 'availabilityzone'],
      },
      {
        model: Resource,
        as: 'resource',
        required: false,
        attributes: ['resourceid', 'resourcename'],
      },
    ];

    // column filters for dimension columns
    const columnFilterMap = {
      ProviderName: { model: CloudAccount, field: 'providername', as: 'cloudAccount' },
      BillingAccountId: { model: CloudAccount, field: 'billingaccountid', as: 'cloudAccount' },
      BillingAccountName: { model: CloudAccount, field: 'billingaccountname', as: 'cloudAccount' },
      ServiceName: { model: Service, field: 'servicename', as: 'service' },
      ServiceCategory: { model: Service, field: 'servicecategory', as: 'service' },
      RegionName: { model: Region, field: 'regionname', as: 'region' },
      AvailabilityZone: { model: Region, field: 'availabilityzone', as: 'region' },
      ResourceId: { model: Resource, field: 'resourceid', as: 'resource' },
      ResourceName: { model: Resource, field: 'resourcename', as: 'resource' },
    };

    const isDateField = dbField =>
      ['chargeperiodstart', 'chargeperiodend', 'billingperiodstart', 'billingperiodend'].includes(
        String(dbField).toLowerCase()
      );

    const isNumericField = dbField =>
      [
        'id',
        'billedcost',
        'consumedquantity',
        'pricingquantity',
        'listunitprice',
        'contractedunitprice',
        'listcost',
        'contractedcost',
        'effectivecost',
      ].includes(String(dbField).toLowerCase());

    // Collect WHERE conditions (to avoid weird merging later)
    const andConditions = [];

    // base where (resolved IDs + upload isolation)
    Object.entries(whereClause).forEach(([k, v]) => andConditions.push({ [k]: v }));

    // apply column filters
    if (columnFilters && Object.keys(columnFilters).length > 0) {
      for (const [columnName, filterValue] of Object.entries(columnFilters)) {
        if (!filterValue || filterValue === '__EMPTY__') continue;

        const dim = columnFilterMap[columnName];

        if (dim) {
          const idx = include.findIndex(inc => inc.model === dim.model && inc.as === dim.as);
          if (idx >= 0) {
            include[idx].where = { ...(include[idx].where || {}), [dim.field]: { [Op.iLike]: `%${filterValue}%` } };
            include[idx].required = true;
          } else {
            include.push({
              model: dim.model,
              as: dim.as,
              where: { [dim.field]: { [Op.iLike]: `%${filterValue}%` } },
              required: true,
            });
          }
          continue;
        }

        const dbField = this.mapColumnToField(columnName);
        if (!dbField) continue;

        if (dbField === 'tags') {
          andConditions.push(
            Sequelize.where(Sequelize.cast(Sequelize.col('BillingUsageFact.tags'), 'TEXT'), {
              [Op.iLike]: `%${filterValue}%`,
            })
          );
        } else if (isDateField(dbField) || isNumericField(dbField)) {
          andConditions.push(
            Sequelize.where(Sequelize.cast(Sequelize.col(`BillingUsageFact.${dbField}`), 'TEXT'), {
              [Op.iLike]: `%${filterValue}%`,
            })
          );
        } else {
          andConditions.push({ [dbField]: { [Op.iLike]: `%${filterValue}%` } });
        }
      }
    }

    const finalWhere = andConditions.length ? { [Op.and]: andConditions } : {};

    // Sorting (BillingUsageFact fields only)
    let order = [['chargeperiodstart', 'DESC']];
    if (sortBy) {
      const dbField = this.mapColumnToField(sortBy);
      if (dbField) order = [[dbField, String(sortOrder).toUpperCase()]];
    }

    // Count (only include required joins to count correctly)
    const requiredIncludes = include.filter(inc => inc.required === true);
    const countOptions = {
      where: finalWhere,
      distinct: true,
      col: 'id',
      ...(requiredIncludes.length ? { include: requiredIncludes } : {}),
    };

    const totalCount = await BillingUsageFact.count(countOptions);

    // Try to build allColumns from a sample record (fallback to standard columns)
    let allColumns = standardColumns;
    try {
      const sample = await BillingUsageFact.findOne({
        where: finalWhere,
        include,
        attributes: [
          'id',
          'billedcost',
          'chargeperiodstart',
          'chargeperiodend',
          'billingperiodstart',
          'billingperiodend',
          'chargedescription',
          'chargecategory',
          'chargeclass',
          'consumedquantity',
          'consumedunit',
          'pricingquantity',
          'pricingunit',
          'listunitprice',
          'contractedunitprice',
          'listcost',
          'contractedcost',
          'effectivecost',
          'tags',
        ],
        raw: false,
      });

      if (sample) {
        const sampleData = {
          Id: sample.id,
          BilledCost: parseFloat(sample.billedcost || 0),
          ChargePeriodStart: sample.chargeperiodstart,
          ChargePeriodEnd: sample.chargeperiodend,
          BillingPeriodStart: sample.billingperiodstart,
          BillingPeriodEnd: sample.billingperiodend,
          ChargeDescription: sample.chargedescription || '',
          ChargeCategory: sample.chargecategory || '',
          ChargeClass: sample.chargeclass || '',
          ConsumedQuantity: parseFloat(sample.consumedquantity || 0),
          ConsumedUnit: sample.consumedunit || '',
          PricingQuantity: parseFloat(sample.pricingquantity || 0),
          PricingUnit: sample.pricingunit || '',
          ListUnitPrice: parseFloat(sample.listunitprice || 0),
          ContractedUnitPrice: parseFloat(sample.contractedunitprice || 0),
          ListCost: parseFloat(sample.listcost || 0),
          ContractedCost: parseFloat(sample.contractedcost || 0),
          EffectiveCost: parseFloat(sample.effectivecost || 0),
          Tags: sample.tags || {},
          ProviderName: sample.cloudAccount?.providername || '',
          BillingAccountId: sample.cloudAccount?.billingaccountid || '',
          BillingAccountName: sample.cloudAccount?.billingaccountname || '',
          ServiceName: sample.service?.servicename || '',
          ServiceCategory: sample.service?.servicecategory || '',
          RegionName: sample.region?.regionname || '',
          AvailabilityZone: sample.region?.availabilityzone || '',
          ResourceId: sample.resource?.resourceid || '',
          ResourceName: sample.resource?.resourcename || '',
        };
        allColumns = Object.keys(sampleData);
      }
    } catch (e) {
      allColumns = standardColumns;
    }

    // Aggregates from FULL filtered dataset (avoid selecting joined attributes)
    const statsIncludes = requiredIncludes.map(inc => ({ ...inc, attributes: [] }));
    const statsResult = await BillingUsageFact.findOne({
      where: finalWhere,
      include: statsIncludes.length ? statsIncludes : [],
      attributes: [
        [Sequelize.fn('SUM', Sequelize.col('BillingUsageFact.billedcost')), 'totalCost'],
        [Sequelize.fn('AVG', Sequelize.col('BillingUsageFact.billedcost')), 'avgCost'],
        [Sequelize.fn('MAX', Sequelize.col('BillingUsageFact.billedcost')), 'maxCost'],
      ],
      raw: true,
    });

    const quickStats = {
      totalCost: parseFloat(statsResult?.totalCost || 0),
      avgCost: parseFloat(statsResult?.avgCost || 0),
      maxCost: parseFloat(statsResult?.maxCost || 0),
    };

    // Summary sums/max per numeric column (BillingUsageFact fields only)
    const numericColumns = allColumns.filter(col => {
      const lower = col.toLowerCase();
      const isNumeric =
        lower.includes('cost') ||
        lower.includes('price') ||
        lower.includes('amount') ||
        lower.includes('quantity') ||
        lower.includes('usage') ||
        lower.includes('rate');
      const isId = lower.includes('id') && !lower.includes('price');
      return isNumeric && !isId;
    });

    const summaryData = {};
    const columnMaxValues = {};

    const sumMaxPromises = numericColumns.map(async col => {
      const dbField = this.mapColumnToField(col);
      if (!dbField) return { col, sum: 0, max: 1 };

      const [sumRow, maxRow] = await Promise.all([
        BillingUsageFact.findOne({
          where: finalWhere,
          include: statsIncludes.length ? statsIncludes : [],
          attributes: [[Sequelize.fn('SUM', Sequelize.col(`BillingUsageFact.${dbField}`)), 'sum']],
          raw: true,
        }),
        BillingUsageFact.findOne({
          where: finalWhere,
          include: statsIncludes.length ? statsIncludes : [],
          attributes: [[Sequelize.fn('MAX', Sequelize.col(`BillingUsageFact.${dbField}`)), 'max']],
          raw: true,
        }),
      ]);

      return {
        col,
        sum: parseFloat(sumRow?.sum || 0),
        max: Math.max(parseFloat(maxRow?.max || 0), 1),
      };
    });

    const sumMaxResults = await Promise.all(sumMaxPromises);
    sumMaxResults.forEach(r => {
      summaryData[r.col] = r.sum;
      columnMaxValues[r.col] = r.max;
    });

    // null for non-numeric columns in summary
    allColumns.forEach(col => {
      if (!Object.prototype.hasOwnProperty.call(summaryData, col)) summaryData[col] = null;
    });

    // Fetch paginated records for display
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const records = await BillingUsageFact.findAll({
      where: finalWhere,
      include,
      attributes: [
        'id',
        'billedcost',
        'chargeperiodstart',
        'chargeperiodend',
        'billingperiodstart',
        'billingperiodend',
        'chargedescription',
        'chargecategory',
        'chargeclass',
        'consumedquantity',
        'consumedunit',
        'pricingquantity',
        'pricingunit',
        'listunitprice',
        'contractedunitprice',
        'listcost',
        'contractedcost',
        'effectivecost',
        'tags',
      ],
      order,
      limit: parseInt(limit),
      offset: parseInt(offset),
      raw: false,
    });

    const formattedData = records.map(r => ({
      Id: r.id,
      BilledCost: parseFloat(r.billedcost || 0),
      ChargePeriodStart: r.chargeperiodstart,
      ChargePeriodEnd: r.chargeperiodend,
      BillingPeriodStart: r.billingperiodstart,
      BillingPeriodEnd: r.billingperiodend,
      ChargeDescription: r.chargedescription || '',
      ChargeCategory: r.chargecategory || '',
      ChargeClass: r.chargeclass || '',
      ConsumedQuantity: parseFloat(r.consumedquantity || 0),
      ConsumedUnit: r.consumedunit || '',
      PricingQuantity: parseFloat(r.pricingquantity || 0),
      PricingUnit: r.pricingunit || '',
      ListUnitPrice: parseFloat(r.listunitprice || 0),
      ContractedUnitPrice: parseFloat(r.contractedunitprice || 0),
      ListCost: parseFloat(r.listcost || 0),
      ContractedCost: parseFloat(r.contractedcost || 0),
      EffectiveCost: parseFloat(r.effectivecost || 0),
      Tags: r.tags || {},
      ProviderName: r.cloudAccount?.providername || '',
      BillingAccountId: r.cloudAccount?.billingaccountid || '',
      BillingAccountName: r.cloudAccount?.billingaccountname || '',
      ServiceName: r.service?.servicename || '',
      ServiceCategory: r.service?.servicecategory || '',
      RegionName: r.region?.regionname || '',
      AvailabilityZone: r.region?.availabilityzone || '',
      ResourceId: r.resource?.resourceid || '',
      ResourceName: r.resource?.resourcename || '',
    }));

    // Pivot grouping (fallback based on current page)
    let groupedData = [];
    if (groupByCol && viewMode === 'pivot' && formattedData.length > 0) {
      const costCol =
        allColumns.find(c => c.toLowerCase().includes('cost') && !c.toLowerCase().includes('unit')) || 'BilledCost';

      const groups = {};
      let grand = 0;

      for (const row of formattedData) {
        const rawKey = row[groupByCol];
        const key = rawKey || '(Empty)';
        if (!groups[key]) groups[key] = { name: key, rawValue: rawKey, count: 0, totalCost: 0 };

        const cost = parseFloat(row[costCol] || 0);
        groups[key].count += 1;
        groups[key].totalCost += isNaN(cost) ? 0 : cost;
        grand += isNaN(cost) ? 0 : cost;
      }

      groupedData = Object.values(groups)
        .map(g => ({ ...g, percent: roundTo(costSharePercentage(g.totalCost, grand), 2) }))
        .sort((a, b) => b.totalCost - a.totalCost);
    }

    return {
      data: formattedData,
      allColumns,
      quickStats,
      summaryData,
      columnMaxValues,
      groupedData,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalCount,
        totalPages: Math.ceil(totalCount / parseInt(limit)),
      },
    };
  },

  /**
   * 5) GET COST ANALYSIS DATA
   * UPDATED: now takes uploadIds for data isolation.
   */
  async getCostAnalysisData(filters = {}, groupBy = 'ServiceName', uploadIds = []) {
    const { provider, service, region, uploadId } = filters || {};

    if (!uploadIds || uploadIds.length === 0) {
      return {
        chartData: [],
        activeKeys: [],
        totalSpend: 0,
        avgDaily: 0,
        trend: 0,
        categoryTotals: {},
        maxDaily: 0,
        peakDay: null,
        dailyData: [],
        groupedData: [],
      };
    }

    // use resolved IDs + upload isolation (fast)
    const resolved = await resolveFiltersToIds({ provider, service, region });
    if (resolved === null) {
      return {
        chartData: [],
        activeKeys: [],
        totalSpend: 0,
        avgDaily: 0,
        trend: 0,
        categoryTotals: {},
        maxDaily: 0,
        peakDay: null,
        dailyData: [],
        groupedData: [],
      };
    }

    const whereClause = applyUploadIsolation({ ...resolved }, uploadId, uploadIds);

    // include for reading names (display), not for filtering
    const include = [
      { model: CloudAccount, as: 'cloudAccount', required: false, attributes: ['providername'] },
      { model: Service, as: 'service', required: false, attributes: ['servicename'] },
      { model: Region, as: 'region', required: false, attributes: ['regionname'] },
    ];

    const billingFacts = await BillingUsageFact.findAll({
      where: whereClause,
      include,
      attributes: ['billedcost', 'chargeperiodstart', 'chargeperiodend'],
      raw: false,
    });

    if (!billingFacts || billingFacts.length === 0) {
      return {
        chartData: [],
        activeKeys: [],
        totalSpend: 0,
        avgDaily: 0,
        trend: 0,
        categoryTotals: {},
        maxDaily: 0,
        peakDay: null,
        dailyData: [],
        groupedData: [],
      };
    }

    const TOP_N_LIMIT = 5;

    const toLocalDateKey = (value) => {
      if (!value) return 'Unknown';
      const d = new Date(value);
      if (Number.isNaN(d.getTime())) return 'Unknown';
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    };

    const cleanData = billingFacts.map(fact => {
      const cost = Number(fact.billedcost || 0);
      const date = toLocalDateKey(fact.chargeperiodstart);

      let groupValue = 'Unknown';
      if (groupBy === 'ServiceName') groupValue = fact.service?.servicename || 'Unknown';
      else if (groupBy === 'RegionName') groupValue = fact.region?.regionname || 'Unknown';
      else if (groupBy === 'ProviderName') groupValue = fact.cloudAccount?.providername || 'Unknown';

      return { cost, date, group: groupValue };
    });

    const groupTotals = {};
    cleanData.forEach(d => {
      groupTotals[d.group] = (groupTotals[d.group] || 0) + d.cost;
    });

    const sortedKeys = Object.entries(groupTotals)
      .sort((a, b) => b[1] - a[1])
      .map(([k]) => k);

    const topKeys = sortedKeys.slice(0, TOP_N_LIMIT);
    const topSet = new Set(topKeys);

    const dailyMap = {};
    let grandTotal = 0;

    for (const row of cleanData) {
      if (!dailyMap[row.date]) {
        dailyMap[row.date] = { date: row.date, total: 0, Others: 0 };
        for (const k of topKeys) dailyMap[row.date][k] = 0;
      }

      const key = topSet.has(row.group) ? row.group : 'Others';
      dailyMap[row.date][key] = (dailyMap[row.date][key] || 0) + row.cost;
      dailyMap[row.date].total += row.cost;
      grandTotal += row.cost;
    }

    const chartData = Object.values(dailyMap).sort((a, b) => a.date.localeCompare(b.date));

    // Others total
    let othersTotal = 0;
    Object.entries(groupTotals).forEach(([k, v]) => {
      if (!topSet.has(k)) othersTotal += v;
    });
    if (othersTotal > 0) {
      groupTotals.Others = othersTotal;
    }

    const avgDaily = dailyAverageSpend(grandTotal, chartData.length || 1);

    const maxDayObj = [...chartData].sort((a, b) => b.total - a.total)[0];
    const maxDaily = maxDayObj?.total || 0;
    const peakDay = maxDayObj?.date || null;

    const trend = splitPeriodTrendPercentage(chartData.map((d) => Number(d.total || 0)));

    const dailyData = chartData.map(d => ({ date: d.date, cost: d.total }));
    const groupedData = sortedKeys.slice(0, 10).map(name => ({ name, value: groupTotals[name] || 0 }));

    return {
      chartData,
      activeKeys: othersTotal > 0 ? [...topKeys, 'Others'] : [...topKeys],
      totalSpend: roundTo(grandTotal, 2),
      avgDaily: roundTo(avgDaily, 2),
      trend: roundTo(trend, 2),
      categoryTotals: Object.fromEntries(
        Object.entries(groupTotals).map(([k, v]) => [k, roundTo(v, 2)])
      ),
      maxDaily: roundTo(maxDaily, 2),
      peakDay,
      dailyData: dailyData.map((d) => ({ date: d.date, cost: roundTo(d.cost, 2) })),
      groupedData: groupedData.map((d) => ({ name: d.name, value: roundTo(d.value, 2) })),
    };
  },

  /**
   * 6) EXPORT DATA EXPLORER TO CSV
   */
  async exportDataExplorerToCSV(filters = {}, pagination = {}, uploadIds = [], selectedIndices = null, visibleColumns = null) {
    const allData = await this.getDataExplorerData(filters, { ...pagination, limit: 100000 }, uploadIds);

    let dataToExport = allData.data || [];
    if (selectedIndices && selectedIndices.length > 0) {
      dataToExport = dataToExport.filter((_, idx) => selectedIndices.includes(idx));
    }

    const columnsToExport =
      visibleColumns && visibleColumns.length > 0 ? visibleColumns : allData.allColumns || [];

    const headers = columnsToExport.map(col => `"${String(col).replace(/"/g, '""')}"`).join(',');

    const rows = dataToExport.map(row =>
      columnsToExport
        .map(col => {
          const value = row[col];
          if (value === null || value === undefined) return '""';
          if (typeof value === 'object') return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
          return `"${String(value).replace(/"/g, '""')}"`;
        })
        .join(',')
    );

    return headers + '\n' + rows.join('\n');
  },
};
