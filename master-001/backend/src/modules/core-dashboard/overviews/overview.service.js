import { BillingUsageFact, Service, Region, CloudAccount, Resource } from '../../../models/index.js';
import Sequelize from '../../../config/db.config.js';
import { Op } from 'sequelize';

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

  const empty = {
    totalSpend: 0,
    dailyData: [],
    groupedData: [],
    allRegionData: [],
    topRegion: { name: "N/A", value: 0 },
    topService: { name: "N/A", value: 0 },
    spendChangePercent: 0,
    topProvider: { name: "N/A", value: 0 },
    untaggedCost: 0,
    missingMetadataCost: 0,
    billingPeriod: null,
    topRegionPercent: 0,
    topServicePercent: 0,
    avgDailySpend: 0,
  };

  if (!uploadIds || uploadIds.length === 0) return empty;

  // Base WHERE (upload isolation)
  const whereClause = applyUploadIsolation({}, uploadId, uploadIds);

  /**
   * IMPORTANT:
   * For aggregation queries, include models ONLY for filtering,
   * and set attributes: [] so Sequelize doesn't SELECT cloudAccount.id etc.
   */
  const filterInclude = [
    {
      model: CloudAccount,
      as: "cloudAccount",
      required: !!(provider && provider !== "All"),
      attributes: [],
      ...(provider && provider !== "All" ? { where: { providername: provider } } : {}),
    },
    {
      model: Service,
      as: "service",
      required: !!(service && service !== "All"),
      attributes: [],
      ...(service && service !== "All" ? { where: { servicename: service } } : {}),
    },
    {
      model: Region,
      as: "region",
      required: !!(region && region !== "All"),
      attributes: [],
      ...(region && region !== "All" ? { where: { regionname: region } } : {}),
    },
  ];

  // 1) Total spend + daily trend
  const [totalSpend, dailyTrend] = await Promise.all([
    BillingUsageFact.sum("billedcost", { where: whereClause, include: filterInclude }),
    BillingUsageFact.findAll({
      where: whereClause,
      include: filterInclude,
      attributes: [
        [Sequelize.fn("DATE", Sequelize.col("BillingUsageFact.chargeperiodstart")), "date"],
        [Sequelize.fn("SUM", Sequelize.col("BillingUsageFact.billedcost")), "cost"],
      ],
      group: [Sequelize.fn("DATE", Sequelize.col("BillingUsageFact.chargeperiodstart"))],
      order: [[Sequelize.fn("DATE", Sequelize.col("BillingUsageFact.chargeperiodstart")), "ASC"]],
      raw: true,
    }),
  ]);

  const totalSpendNum = parseFloat(totalSpend || 0);

  // 2) Spend by service (Top N)
  const TOP_LIMIT = 15;
  const servicesAgg = await BillingUsageFact.findAll({
    where: whereClause,
    include: [
      ...filterInclude,
      { model: Service, as: "service", required: true, attributes: [] }, // label join
    ],
    attributes: [
      [Sequelize.col("service.servicename"), "name"],
      [Sequelize.fn("SUM", Sequelize.col("BillingUsageFact.billedcost")), "value"],
    ],
    group: [Sequelize.col("service.servicename")],
    order: [[Sequelize.literal("value"), "DESC"]],
    limit: TOP_LIMIT,
    raw: true,
  });

  const groupedData = (servicesAgg || []).map((r) => ({
    name: r.name || "Unknown",
    value: parseFloat(r.value || 0),
  }));

  const topService = groupedData.length ? groupedData[0] : { name: "N/A", value: 0 };

  // 3) Top region, top provider, all regions, untagged, missing meta, billing period
  const [
    topRegionResult,
    topProviderResult,
    allRegionsResult,
    untaggedResult,
    missingMetaResult,
    dateRange,
  ] = await Promise.all([
    // Top region
    BillingUsageFact.findAll({
      where: whereClause,
      include: [
        ...filterInclude,
        { model: Region, as: "region", required: true, attributes: [] },
      ],
      attributes: [
        [Sequelize.col("region.regionname"), "name"],
        [Sequelize.fn("SUM", Sequelize.col("BillingUsageFact.billedcost")), "value"],
      ],
      group: [Sequelize.col("region.regionname")],
      order: [[Sequelize.literal("value"), "DESC"]],
      limit: 1,
      raw: true,
    }),

    // Top provider
    BillingUsageFact.findAll({
      where: whereClause,
      include: [
        ...filterInclude,
        { model: CloudAccount, as: "cloudAccount", required: true, attributes: [] },
      ],
      attributes: [
        [Sequelize.col("cloudAccount.providername"), "name"],
        [Sequelize.fn("SUM", Sequelize.col("BillingUsageFact.billedcost")), "value"],
      ],
      group: [Sequelize.col("cloudAccount.providername")],
      order: [[Sequelize.literal("value"), "DESC"]],
      limit: 1,
      raw: true,
    }),

    // All regions distribution
    BillingUsageFact.findAll({
      where: whereClause,
      include: [
        ...filterInclude,
        { model: Region, as: "region", required: true, attributes: [] },
      ],
      attributes: [
        [Sequelize.col("region.regionname"), "name"],
        [Sequelize.fn("SUM", Sequelize.col("BillingUsageFact.billedcost")), "value"],
      ],
      group: [Sequelize.col("region.regionname")],
      order: [[Sequelize.literal("value"), "DESC"]],
      raw: true,
    }),

    // Untagged
    BillingUsageFact.findAll({
      where: { ...whereClause, tags: { [Op.eq]: {} } },
      include: filterInclude,
      attributes: [[Sequelize.fn("SUM", Sequelize.col("BillingUsageFact.billedcost")), "total"]],
      raw: true,
    }),

    // Missing resource metadata
    BillingUsageFact.findAll({
      where: { ...whereClause, resourceid: { [Op.or]: [{ [Op.is]: null }, { [Op.eq]: "" }] } },
      include: filterInclude,
      attributes: [[Sequelize.fn("SUM", Sequelize.col("BillingUsageFact.billedcost")), "total"]],
      raw: true,
    }),

    // Billing period
    BillingUsageFact.findOne({
      where: whereClause,
      include: filterInclude,
      attributes: [
        [Sequelize.fn("MIN", Sequelize.col("BillingUsageFact.chargeperiodstart")), "start"],
        [Sequelize.fn("MAX", Sequelize.col("BillingUsageFact.chargeperiodstart")), "end"],
      ],
      raw: true,
    }),
  ]);

  const topRegion =
    topRegionResult?.length > 0
      ? { name: topRegionResult[0].name || "Unknown", value: parseFloat(topRegionResult[0].value || 0) }
      : { name: "N/A", value: 0 };

  const topProvider =
    topProviderResult?.length > 0
      ? { name: topProviderResult[0].name || "Unknown", value: parseFloat(topProviderResult[0].value || 0) }
      : { name: "N/A", value: 0 };

  const allRegionData = (allRegionsResult || []).map((r) => ({
    name: r.name || "Unknown",
    value: parseFloat(r.value || 0),
  }));

  const untaggedCost = parseFloat(untaggedResult?.[0]?.total || 0);
  const missingMetadataCost = parseFloat(missingMetaResult?.[0]?.total || 0);

  const billingPeriod = dateRange ? { start: dateRange.start, end: dateRange.end } : null;

  const topServicePercent = totalSpendNum > 0 ? (topService.value / totalSpendNum) * 100 : 0;
  const topRegionPercent = totalSpendNum > 0 ? (topRegion.value / totalSpendNum) * 100 : 0;

  const avgDailySpend =
    dailyTrend?.length > 0
      ? dailyTrend.reduce((sum, d) => sum + parseFloat(d.cost || 0), 0) / dailyTrend.length
      : 0;

  return {
    totalSpend: totalSpendNum,
    dailyData: (dailyTrend || []).map((d) => ({ date: d.date, cost: parseFloat(d.cost || 0) })),
    groupedData,
    allRegionData,
    topRegion,
    topService,
    spendChangePercent: 0,
    topProvider,
    untaggedCost,
    missingMetadataCost,
    billingPeriod,
    topRegionPercent,
    topServicePercent,
    avgDailySpend,
  };
}
,

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

      const threshold = avg + 2 * stdDev;

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
          threshold: parseFloat(threshold.toFixed(2)),
        })),
        count: anomalies.length,
      };
    } catch (error) {
      console.error('Anomaly Calculation Error:', error);
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
        .map(g => ({ ...g, percent: grand ? (g.totalCost / grand) * 100 : 0 }))
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

    const cleanData = billingFacts.map(fact => {
      const cost = parseFloat(fact.billedcost || 0);
      const date = fact.chargeperiodstart ? new Date(fact.chargeperiodstart).toISOString().split('T')[0] : 'Unknown';

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
    groupTotals.Others = othersTotal;

    const avgDaily = grandTotal / (chartData.length || 1);

    const maxDayObj = [...chartData].sort((a, b) => b.total - a.total)[0];
    const maxDaily = maxDayObj?.total || 0;
    const peakDay = maxDayObj?.date || null;

    const mid = Math.floor(chartData.length / 2);
    const prevHalf = mid > 0 ? chartData.slice(0, mid).reduce((a, b) => a + b.total, 0) : 0;
    const currHalf = chartData.slice(mid).reduce((a, b) => a + b.total, 0);
    const trend = prevHalf ? ((currHalf - prevHalf) / prevHalf) * 100 : 0;

    const dailyData = chartData.map(d => ({ date: d.date, cost: d.total }));
    const groupedData = sortedKeys.slice(0, 10).map(name => ({ name, value: groupTotals[name] || 0 }));

    return {
      chartData,
      activeKeys: [...topKeys, 'Others'],
      totalSpend: grandTotal,
      avgDaily,
      trend,
      categoryTotals: groupTotals,
      maxDaily,
      peakDay,
      dailyData,
      groupedData,
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
