import { costAnalysisRepository } from '../cost-analysis/cost-analysis.repository.js';
import { buildResourceInventory } from './resources.service.js';
import AppError from "../../../../errors/AppError.js";
import logger from "../../../../lib/logger.js";
import { extractUploadIdsFromRequest } from "../../utils/uploadIds.utils.js";
import { assertUploadScope } from "../../utils/uploadScope.service.js";

/**
 * GET /api/resources
 * Get resource inventory
 * NOTE: Same approach as cost-analysis/drivers: upload selection must come from request.
 */
export const getResources = async (req, res, next) => {
  try {
    const filters = {
      provider: req.query.provider || 'All',
      service: req.query.service || 'All',
      region: req.query.region || 'All'
    };

    const uploadIds = await assertUploadScope({
      uploadIds: extractUploadIdsFromRequest(req),
      clientId: req.client_id,
    });

    // Return consistent shape with buildResourceInventory()
    if (uploadIds.length === 0) {
      return res.ok({
        inventory: [],
        stats: {
          total: 0,
          totalCost: 0,
          zombieCount: 0,
          zombieCost: 0,
          untaggedCount: 0,
          untaggedCost: 0,
          spikingCount: 0,
          spikingCost: 0
        },
      });
    }

    const repoFilters = { ...filters, uploadIds };

    // 1) Fetch raw facts with joins (resource/service/region/account + tags)
    const rawData = await costAnalysisRepository.getResourceData(repoFilters);

    // 2) Transform to inventory + stats
    const inventoryData = buildResourceInventory(rawData);

    return res.ok(inventoryData);
  } catch (error) {
    if (error instanceof AppError) {
      return next(error);
    }
    logger.error({ err: error, requestId: req.requestId }, "Resource Controller Error");
    return next(new AppError(500, "INTERNAL", "Internal server error", { cause: error }));
  }
};
