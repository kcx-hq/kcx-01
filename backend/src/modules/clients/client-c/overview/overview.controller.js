/**
 * Client-C Overview Controller
 * Extended version with department features
 */

import { clientCOverviewService } from './overview.service.js';
import AppError from "../../../../errors/AppError.js";
import logger from "../../../../lib/logger.js";

/**
 * Helper: normalize uploadIds from request
 */
function normalizeUploadIds(uploadid) {
  if (!uploadid) return [];
  if (Array.isArray(uploadid)) return uploadid.filter(Boolean);
  if (typeof uploadid === 'string') {
    const s = uploadid.trim();
    if (!s) return [];
    return s.includes(',')
      ? s.split(',').map((id) => id.trim()).filter(Boolean)
      : [s];
  }
  return [];
}

/**
 * Helper: read uploadid from query OR body
 */
function getUploadIdsFromRequest(req) {
  const fromQuery = req.query?.uploadId ?? req.query?.uploadIds;
  const fromBody = req.body?.uploadId ?? req.body?.uploadIds;
  const raw = fromQuery ?? fromBody;
  return normalizeUploadIds(raw);
}

/**
 * GET /api/client-c/overview
 * Extended overview with department breakdown
 */
export const getOverview = async (req, res, next) => {
  try {
    const filters = {
      provider: req.query.provider || 'All',
      service: req.query.service || 'All',
      region: req.query.region || 'All'
    };

    const uploadIds = getUploadIdsFromRequest(req);

    if (uploadIds.length === 0) {
      return res.ok({
        totalSpend: 0,
        dailyData: [],
        groupedData: [],
        allRegionData: [],
        topRegion: { name: 'N/A', value: 0 },
        topService: { name: 'N/A', value: 0 },
        departmentBreakdown: [],
        departmentTrends: [],
        message: 'No upload selected. Please select a billing upload.'
      });
    }

    const data = await clientCOverviewService.getOverviewMetrics(filters, uploadIds);
    return res.ok(data);
  } catch (error) {
    logger.error({ err: error, requestId: req.requestId }, 'Client-C Overview Error');
    return next(new AppError(500, "INTERNAL", "Internal server error", { cause: error }));
  }
};

/**
 * GET /api/client-c/overview/anomalies
 */
export const getAnomalies = async (req, res, next) => {
  try {
    const filters = {
      provider: req.query.provider || 'All',
      service: req.query.service || 'All',
      region: req.query.region || 'All'
    };

    const uploadIds = getUploadIdsFromRequest(req);

    if (uploadIds.length === 0) {
      return res.ok({ anomalies: [], message: 'No upload selected.' });
    }

    const data = await clientCOverviewService.getAnomalies(filters, uploadIds);
    return res.ok(data);
  } catch (error) {
    logger.error({ err: error, requestId: req.requestId }, 'Anomaly Error');
    return next(new AppError(500, "INTERNAL", "Internal server error", { cause: error }));
  }
};

/**
 * GET /api/client-c/overview/filters
 */
export const getFilters = async (req, res, next) => {
  try {
    const uploadIds = getUploadIdsFromRequest(req);
    if (uploadIds.length === 0) {
      return res.ok({ providers: ['All'], services: ['All'], regions: ['All'] });
    }
    const data = await clientCOverviewService.getFilters(uploadIds);
    return res.ok(data);
  } catch (error) {
    logger.error({ err: error, requestId: req.requestId }, 'Client-C Overview Filters Error');
    return next(new AppError(500, "INTERNAL", "Internal server error", { cause: error }));
  }
};

