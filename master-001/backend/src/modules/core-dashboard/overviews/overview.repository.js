import { BillingUsageFact, CloudAccount, Service, Region } from '../../../models/index.js';
import { Op } from 'sequelize';

export const dashboardRepository = {
  /**
   * Fetch Raw Data for In-Memory Aggregation
   * ✅ Updated to match "cost-analysis" uploadid approach:
   *  - supports uploadIds (array)
   *  - supports uploadId (single)
   *  - keeps the rest of the logic the same
   */
  async getOverviewRawData(filters = {}) {
    const { provider, service, region, uploadId, uploadIds } = filters;

    const whereClause = {};

    // 1. Upload ID(s) (Crucial for filtering by file)
    // ✅ support both uploadIds array and single uploadId
    if (uploadIds && Array.isArray(uploadIds) && uploadIds.length > 0) {
      whereClause.uploadid = { [Op.in]: uploadIds };
    } else if (uploadId) {
      whereClause.uploadid = uploadId;
    }

    // 2. Filter out zero costs to speed up processing
    whereClause.billedcost = { [Op.ne]: 0 };

    // 3. Dynamic Includes based on filters
    const include = [];

    // Provider Filter
    if (provider && provider !== 'All') {
      include.push({
        model: CloudAccount,
        as: 'cloudAccount',
        where: { providername: provider },
        required: true
      });
    } else {
      include.push({ model: CloudAccount, as: 'cloudAccount', required: false });
    }

    // Service Filter
    if (service && service !== 'All') {
      include.push({
        model: Service,
        as: 'service',
        where: { servicename: service },
        required: true
      });
    } else {
      include.push({ model: Service, as: 'service', required: false });
    }

    // Region Filter
    if (region && region !== 'All') {
      include.push({
        model: Region,
        as: 'region',
        where: { regionname: region },
        required: true
      });
    } else {
      include.push({ model: Region, as: 'region', required: false });
    }

    // 4. Fetch Data
    // We fetch associations so we can group by names in the Service layer
    return await BillingUsageFact.findAll({
      where: whereClause,
      include,
      attributes: ['billedcost', 'chargeperiodstart'],
      raw: false // We need the associated objects
    });
  }
};
