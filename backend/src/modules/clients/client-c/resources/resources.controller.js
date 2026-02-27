import { costAnalysisRepository } from '../../../../modules/core-dashboard/analytics/cost-analysis/cost-analysis.repository.js';
import { buildClientCResourceInventory } from './resources.service.js';
import AppError from "../../../../errors/AppError.js";
import logger from "../../../../lib/logger.js";

/**
 * Extract uploadIds safely (same pattern everywhere)
 */
function normalizeUploadIds(input) {
  if (!input) return [];
  if (Array.isArray(input)) return input.map(String);
  if (typeof input === 'string')
    return input.split(',').map((v) => v.trim()).filter(Boolean);
  return [];
}

function extractUploadIds(req) {
  return normalizeUploadIds(
    req.query.uploadIds ??
    req.query.uploadId ??
    req.body?.uploadIds ??
    req.body?.uploadId
  );
}

/**
 * GET /api/client-c/resources/inventory
 */
export const getClientCResources = async (req, res, next) => {
  try {
    const uploadIds = extractUploadIds(req);

    if (!uploadIds.length) {
      return res.ok({
        inventory: [],
        stats: {}
      });
    }

    const filters = {
      uploadIds,
      provider: req.query.provider || 'All',
      service: req.query.service || 'All',
      region: req.query.region || 'All'
    };

    // Reuse core repository
    const rawData =
      await costAnalysisRepository.getResourceData(filters);

    const data = buildClientCResourceInventory(rawData, {
      departmentTagKey: 'department'
    });

    return res.ok(data);
  } catch (error) {
    logger.error({ err: error, requestId: req.requestId }, 'Client-C Resources Error');
    return next(new AppError(500, "INTERNAL", "Internal server error", { cause: error }));
  }
};
