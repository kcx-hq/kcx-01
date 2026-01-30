/**
 * Quality Repository
 * Data Access Layer for Data Quality & Governance
 */

import { BillingUsageFact, Service, Region, CloudAccount } from '../../../../models/index.js';
import { Op } from 'sequelize';

export const dataQualityRepository = {
  /**
   * Get billing facts for quality analysis
   * Includes related models for service, region, and account names
   */
  async getBillingFactsForQuality(options = {}) {
    const { filters = {}, startDate, endDate, uploadIds = [] } = options;

    // Build where clause
    const whereClause = {};

    // ✅ UploadId filter for user isolation
    // Same safety approach as drivers repo: if uploadIds not provided, return []
    // (prevents querying whole table accidentally)
    if (!uploadIds || uploadIds.length === 0) {
      return [];
    }
    whereClause.uploadid = { [Op.in]: uploadIds };

    // Date range filter
    if (startDate || endDate) {
      whereClause.chargeperiodstart = {};
      if (startDate) whereClause.chargeperiodstart[Op.gte] = startDate;
      if (endDate) whereClause.chargeperiodstart[Op.lte] = endDate;
    }

    // Build includes for filters
    const includes = [];

    if (filters.provider && filters.provider !== 'All') {
      includes.push({
        model: CloudAccount,
        as: 'cloudAccount',
        where: { providername: filters.provider },
        required: true,
      });
    } else {
      includes.push({
        model: CloudAccount,
        as: 'cloudAccount',
        required: false,
      });
    }

    if (filters.service && filters.service !== 'All') {
      includes.push({
        model: Service,
        as: 'service',
        where: { servicename: filters.service },
        required: true,
      });
    } else {
      includes.push({
        model: Service,
        as: 'service',
        required: false,
      });
    }

    if (filters.region && filters.region !== 'All') {
      includes.push({
        model: Region,
        as: 'region',
        where: { regionname: filters.region },
        required: true,
      });
    } else {
      includes.push({
        model: Region,
        as: 'region',
        required: false,
      });
    }

    const facts = await BillingUsageFact.findAll({
      where: whereClause,
      include: includes,
      raw: false,
    });

    // Transform to flat structure for frontend
    return facts.map((fact) => {
      const row = fact.toJSON();

      // Tags is JSONB, so it's already an object. Convert to string for compatibility with frontend expectations
      let tagsString = '{}';
      if (row.tags) {
        if (typeof row.tags === 'object' && Object.keys(row.tags).length > 0) {
          tagsString = JSON.stringify(row.tags);
        } else if (typeof row.tags === 'string' && row.tags !== '{}') {
          tagsString = row.tags;
        }
      }

      return {
        BilledCost: row.billedcost || 0,
        ChargePeriodStart: row.chargeperiodstart ? new Date(row.chargeperiodstart).toISOString() : null,
        Tags: tagsString,
        ResourceId: row.resourceid || null,
        ResourceName: row.resourceid || null, // Can be enhanced with Resource lookup if needed
        ServiceName: row.service?.servicename || null,
        RegionName: row.region?.regionname || null,

        // ✅ align with your BillingUsageFact schema style used elsewhere
        UsageType: row.chargecategory || null,
        Operation: row.chargeclass || row.chargedescription || null,

        ChargeDescription: row.chargedescription || null,

        // Include all other fields that might be needed
        ...row,
      };
    });
  },
};
