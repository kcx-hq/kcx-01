/**
 * Drivers Repository
 * Data Access Layer for Cost Drivers Analysis
 */

import {
  BillingUsageFact,
  Service,
  Region,
  CloudAccount,
  Resource,
  SubAccount
} from '../../../../models/index.js';
import { Op } from 'sequelize';

export const costDriversRepository = {
  /**
   * Get billing facts for cost drivers analysis
   * Fetches data for current and previous periods
   */
  async getBillingFactsForDrivers(options = {}) {
    const { filters = {}, uploadIds = [] } = options;

    /**
     * 🔐 HARD GUARD
     * Same approach as Cost Analysis
     * uploadIds MUST come from request
     */
    if (!uploadIds || uploadIds.length === 0) {
      return [];
    }

    /**
     * WHERE CLAUSE
     */
    const whereClause = {
      uploadid: { [Op.in]: uploadIds }
    };

    /**
     * INCLUDES (unchanged logic)
     */
    const includes = [];

    if (filters.provider && filters.provider !== 'All') {
      includes.push({
        model: CloudAccount,
        as: 'cloudAccount',
        where: { providername: filters.provider },
        required: true
      });
    } else {
      includes.push({
        model: CloudAccount,
        as: 'cloudAccount',
        required: false
      });
    }

    if (filters.service && filters.service !== 'All') {
      includes.push({
        model: Service,
        as: 'service',
        where: { servicename: filters.service },
        required: true
      });
    } else {
      includes.push({
        model: Service,
        as: 'service',
        required: false
      });
    }

    if (filters.region && filters.region !== 'All') {
      includes.push({
        model: Region,
        as: 'region',
        where: { regionname: filters.region },
        required: true
      });
    } else {
      includes.push({
        model: Region,
        as: 'region',
        required: false
      });
    }

    /**
     * QUERY (unchanged)
     */
    const facts = await BillingUsageFact.findAll({
      where: whereClause,
      include: [
        ...includes,
        { model: Resource, as: 'resource', required: false },
        { model: SubAccount, as: 'subAccount', required: false }
      ],
      raw: false,
      order: [['chargeperiodstart', 'ASC']]
    });

    /**
     * TRANSFORM (unchanged)
     */
    return facts.map(fact => {
      const row = fact.toJSON();
      return {
        BilledCost: row.billedcost || 0,
        ChargePeriodStart: row.chargeperiodstart
          ? new Date(row.chargeperiodstart).toISOString()
          : null,
        ServiceName: row.service?.servicename || null,
        RegionName: row.region?.regionname || null,
        ProviderName: row.cloudAccount?.providername || null,
        ResourceId: row.resourceid || null,
        ResourceName: row.resource?.resourcename || row.resourceid || null,
        UsageType: row.chargecategory || null,
        Operation: row.chargeclass || row.chargedescription || null,
        ItemDescription: row.chargedescription || null,
        SubAccountName:
          row.subAccount?.sub_account_name || row.subaccountid || null,

        // Keep raw fields for service-layer logic
        ...row
      };
    });
  }
};
