import { costAnalysisRepository } from '../../../../core-dashboard/analytics/cost-analysis/cost-analysis.repository.js';
import { buildClientDResourceInventory } from './resources.service.js';
import { extractUploadIds } from '../../helpers/extractUploadId.js';
import AppError from "../../../../../errors/AppError.js";
import logger from "../../../../../lib/logger.js";

/**
 * Extract uploadIds from query OR body
 */


/**
 * GET /api/client-d/resources
 * Modified inventory (no zombie/spiking, adds availability zone)
 */
export const getClientDResources = async (req, res, next) => {
  try {
    const filters = {
      provider: req.query.provider || 'All',
      service: req.query.service || 'All',
      region: req.query.region || 'All'
    };

    const uploadIds = extractUploadIds(req);

    if (uploadIds.length === 0) {
      return res.ok({
        inventory: [],
        stats: {
          total: 0,
          totalCost: 0,
          untaggedCount: 0,
          untaggedCost: 0
        }
      });
    }

    const repoFilters = { ...filters, uploadIds };

    // Reuse core repository fetch (must include AZ if available in fact data)
    const rawData = await costAnalysisRepository.getResourceData(repoFilters);

    const inventoryData = buildClientDResourceInventory(rawData);

    return res.ok(inventoryData);
  } catch (error) {
    logger.error({ err: error, requestId: req.requestId }, 'Client-D Resource Controller Error');
    return next(new AppError(500, "INTERNAL", "Internal server error", { cause: error }));
  }
};
