/**
 * Client-C Data Quality Controller
 */

import { clientCDataQualityService } from './data-quality.service.js';
import AppError from "../../../../errors/AppError.js";
import logger from "../../../../lib/logger.js";

function extractUploadIds(req) {
  const raw = req.query.uploadIds ?? req.query.uploadId ?? req.body?.uploadIds ?? req.body?.uploadId;
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.map(String);
  if (typeof raw === 'string') return raw.split(',').map(v => v.trim()).filter(Boolean);
  return [];
}

export const analyzeDataQuality = async (req, res, next) => {
  try {
    const uploadIds = extractUploadIds(req);
    const { provider, service, region, startDate, endDate } = req.query;

    const options = {
      filters: { provider, service, region },
      startDate,
      endDate,
      uploadIds
    };

    const data = await clientCDataQualityService.analyzeDataQuality(options);
    return res.ok(data);
  } catch (error) {
    logger.error({ err: error, requestId: req.requestId }, 'Client-C Data Quality Error');
    return next(new AppError(500, "INTERNAL", "Internal server error", { cause: error }));
  }
};
