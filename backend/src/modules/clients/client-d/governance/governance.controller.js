/**
 * Client-D Governance Controller (Reduced)
 * Only exposes Tag Compliance % and Untagged Cost
 */

import { clientDGovernanceService } from './governance.service.js';
import { extractUploadIds } from '../helpers/extractUploadId.js';
import AppError from "../../../../errors/AppError.js";
import logger from "../../../../lib/logger.js";


/**
 * GET /api/client-d/governance/compliance
 * Returns:
 * - taggedCost, untaggedCost
 * - taggedPercent, untaggedPercent
 */
export const getClientDCompliance = async (req, res, next) => {
  try {
    const filters = {
      provider: req.query.provider || 'All',
      service: req.query.service || 'All',
      region: req.query.region || 'All'
    };

    const period = req.query.period ? String(req.query.period).trim() : null;
    const uploadIds = extractUploadIds(req);

    if (uploadIds.length === 0) {
      return res.ok({
        taggedCost: 0,
        untaggedCost: 0,
        taggedPercent: 0,
        untaggedPercent: 0
      });
    }

    const data = await clientDGovernanceService.getCompliance({
      filters,
      period,
      uploadIds
    });

    return res.ok(
      data || {
        taggedCost: 0,
        untaggedCost: 0,
        taggedPercent: 0,
        untaggedPercent: 0
      }
    );
  } catch (error) {
    logger.error({ err: error, requestId: req.requestId }, 'Client-D Governance Compliance Error');
    return next(new AppError(500, "INTERNAL", "Internal server error", { cause: error }));
  }
};
