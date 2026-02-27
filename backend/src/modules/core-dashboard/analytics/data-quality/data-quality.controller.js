
/**
 * Quality Controller
 * HTTP request handlers for Data Quality & Governance
 */

import { dataQualityService } from './data-quality.service.js';
import AppError from "../../../../errors/AppError.js";
import logger from "../../../../lib/logger.js";
import { assertUploadScope } from "../../utils/uploadScope.service.js";

/**
 * Helper: Normalize uploadId(s) from query/body into an array
 * Supports:
 * - uploadId: "uuid"
 * - uploadId: ["uuid1","uuid2"]
 * - uploadIds: "uuid1,uuid2"
 * - uploadIds: ["uuid1","uuid2"]
 */
function normalizeUploadIds(req) {
  const fromQuery = req.query?.uploadId ?? req.query?.uploadIds;
  const fromBody = req.body?.uploadId ?? req.body?.uploadIds;
  const raw = fromQuery ?? fromBody;

  if (!raw) return [];

  if (Array.isArray(raw)) {
    return raw.map(String).map((s) => s.trim()).filter(Boolean);
  }

  // allow comma-separated strings
  return String(raw)
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * GET /api/quality/analysis
 * Get data quality analysis with fully computed, UI-ready data
 */
export const getQualityAnalysis = async (req, res, next) => {
  try {
    const filters = {
      provider: req.query.provider || req.body?.provider || 'All',
      service: req.query.service || req.body?.service || 'All',
      region: req.query.region || req.body?.region || 'All',
    };

    // Optional date range (query preferred, fallback to body)
    const startDate = req.query.startDate || req.body?.startDate || null;
    const endDate = req.query.endDate || req.body?.endDate || null;

    // uploadId(s) can be in query or body
    const requestedUploadIds = normalizeUploadIds(req);

    let uploadIds = [];

    if (requestedUploadIds.length > 0) {
      // If user explicitly requested uploadIds, use them
      uploadIds = await assertUploadScope({
        uploadIds: requestedUploadIds,
        clientId: req.client_id,
      });
    } 

    const data = await dataQualityService.analyzeDataQuality({
      filters,
      startDate,
      endDate,
      uploadIds,
    });

    return res.ok(data);
  } catch (error) {
    if (error instanceof AppError) {
      return next(error);
    }
    logger.error({ err: error, requestId: req.requestId }, 'Error in getQualityAnalysis');
    return next(new AppError(500, "INTERNAL", "Internal server error", { cause: error }));
  }
};
