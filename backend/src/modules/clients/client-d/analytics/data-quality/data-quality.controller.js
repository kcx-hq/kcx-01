/**
 * Client-D Quality Controller
 * Reduced/Modified Data Quality API
 */

import { clientDDataQualityService } from './data-quality.service.js';
import { extractUploadIds } from '../../helpers/extractUploadId.js';
import AppError from "../../../../../errors/AppError.js";
import logger from "../../../../../lib/logger.js";



/**
 * GET /api/client-d/quality/analysis
 */
export const getClientDQualityAnalysis = async (req, res, next) => {
  try {
    const filters = {
      provider: req.query.provider || req.body?.provider || 'All',
      service: req.query.service || req.body?.service || 'All',
      region: req.query.region || req.body?.region || 'All'
    };

    const startDate = req.query.startDate || req.body?.startDate || null;
    const endDate = req.query.endDate || req.body?.endDate || null;

    const uploadIds = extractUploadIds(req);

    const data = await clientDDataQualityService.analyzeDataQuality({
      filters,
      startDate,
      endDate,
      uploadIds
    });

    return res.ok(data);
  } catch (error) {
    logger.error({ err: error, requestId: req.requestId }, 'Client-D getQualityAnalysis Error');
    return next(new AppError(500, "INTERNAL", "Internal server error", { cause: error }));
  }
};
