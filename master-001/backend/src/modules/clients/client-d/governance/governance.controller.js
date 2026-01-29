/**
 * Client-D Governance Controller (Reduced)
 * Only exposes Tag Compliance % and Untagged Cost
 */

import { clientDGovernanceService } from './governance.service.js';
import { extractUploadIds } from '../helpers/extractUploadId.js';


/**
 * GET /api/client-d/governance/compliance
 * Returns:
 * - taggedCost, untaggedCost
 * - taggedPercent, untaggedPercent
 */
export const getClientDCompliance = async (req, res) => {
  try {
    const filters = {
      provider: req.query.provider || 'All',
      service: req.query.service || 'All',
      region: req.query.region || 'All'
    };

    const period = req.query.period ? String(req.query.period).trim() : null;
    const uploadIds = extractUploadIds(req);

    if (uploadIds.length === 0) {
      return res.json({
        success: true,
        data: {
          taggedCost: 0,
          untaggedCost: 0,
          taggedPercent: 0,
          untaggedPercent: 0
        },
        message: 'No upload selected. Please select a billing upload to view compliance data.'
      });
    }

    const data = await clientDGovernanceService.getCompliance({
      filters,
      period,
      uploadIds
    });

    return res.json({
      success: true,
      data: data || {
        taggedCost: 0,
        untaggedCost: 0,
        taggedPercent: 0,
        untaggedPercent: 0
      }
    });
  } catch (error) {
    console.error('Client-D Governance Compliance Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch Client-D compliance data',
      message: error.message
    });
  }
};
