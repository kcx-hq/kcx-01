/**
 * Optimization Controller
 * HTTP request handlers for optimization recommendations
 */

import { optimizationService } from './optimization.service.js';
import { BillingUpload } from '../../../models/index.js';
import AppError from "../../../errors/AppError.js";
import logger from "../../../lib/logger.js";

/**
 * Helper: normalize uploadIds from request
 * Supports:
 *  - uploadid=uuid
 *  - uploadid[]=uuid1&uploadid[]=uuid2
 *  - uploadid="uuid1,uuid2"
 */
function normalizeUploadIds(uploadid) {
  if (!uploadid) return [];

  if (Array.isArray(uploadid)) return uploadid.filter(Boolean);

  if (typeof uploadid === 'string') {
    const s = uploadid.trim();
    if (!s) return [];
    return s.includes(',')
      ? s.split(',').map(id => id.trim()).filter(Boolean)
      : [s];
  }

  return [];
}

/**
 * Helper: Get user's upload IDs
 * Returns array of uploadids for the authenticated user
 */
async function getUserUploadIds(userId) {
  if (!userId) return [];

  const uploads = await BillingUpload.findAll({
    where: { uploadedby: userId }, // ✅ align with your schema used elsewhere
    attributes: ['uploadid'],
    order: [['uploadedat', 'DESC']], // Most recent first
  });

  return uploads.map((u) => u.uploadid);
}

/**
 * Helper: read uploadIds from query OR body (single/multiple)
 */
function getUploadIdsFromReq(req) {
  // prefer query first (GET endpoints), but support body too
  const q = normalizeUploadIds(req.query?.uploadid || req.query?.uploadId || req.query?.uploadIds);
  if (q.length) return q;

  const b = normalizeUploadIds(req.body?.uploadid || req.body?.uploadId || req.body?.uploadIds);
  return b;
}

/**
 * GET /api/optimization/recommendations
 * Get all optimization recommendations
 */
export const getRecommendations = async (req, res, next) => {
  try {
    const filters = {
      provider: req.query.provider || 'All',
      service: req.query.service || 'All',
      region: req.query.region || 'All',
    };

    const period = req.query.period || 'last90days';

    // ✅ SAME APPROACH: take uploadids from request; fallback to user's uploads
    let uploadIds = getUploadIdsFromReq(req);
    if (uploadIds.length === 0) {
      uploadIds = await getUserUploadIds(req.user?.id);
    }

    const data = await optimizationService.getRecommendations({
      filters,
      period,
      uploadIds,
    });

    return res.ok(data);
  } catch (error) {
    logger.error({ err: error, requestId: req.requestId }, 'Error in getRecommendations');
    return next(new AppError(500, "INTERNAL", "Internal server error"));
  }
};

/**
 * GET /api/optimization/idle-resources
 * Get idle resource recommendations
 */
export const getIdleResources = async (req, res, next) => {
  try {
    const filters = {
      provider: req.query.provider || 'All',
      service: req.query.service || 'All',
      region: req.query.region || 'All',
    };

    const period = req.query.period || 'last90days';

    let uploadIds = getUploadIdsFromReq(req);
    if (uploadIds.length === 0) {
      uploadIds = await getUserUploadIds(req.user?.id);
    }

    const data = await optimizationService.getIdleResources({
      filters,
      period,
      uploadIds,
    });

    return res.ok(data);
  } catch (error) {
    logger.error({ err: error, requestId: req.requestId }, 'Error in getIdleResources');
    return next(new AppError(500, "INTERNAL", "Internal server error"));
  }
};

/**
 * GET /api/optimization/opportunities
 * Get aggregated optimization opportunities
 */
export const getOpportunities = async (req, res, next) => {
  try {
    const filters = {
      provider: req.query.provider || 'All',
      service: req.query.service || 'All',
      region: req.query.region || 'All',
    };

    const period = req.query.period || 'last90days';

    let uploadIds = getUploadIdsFromReq(req);
    if (uploadIds.length === 0) {
      uploadIds = await getUserUploadIds(req.user?.id);
    }

    const data = await optimizationService.getOpportunities({
      filters,
      period,
      uploadIds,
    });

    return res.ok(data);
  } catch (error) {
    logger.error({ err: error, requestId: req.requestId }, 'Error in getOpportunities');
    return next(new AppError(500, "INTERNAL", "Internal server error"));
  }
};

/**
 * GET /api/optimization/commitments
 * Get commitment coverage gaps
 */
export const getCommitmentGaps = async (req, res, next) => {
  try {
    const filters = {
      provider: req.query.provider || 'All',
      service: req.query.service || 'All',
      region: req.query.region || 'All',
    };

    const period = req.query.period || 'last90days';

    let uploadIds = getUploadIdsFromReq(req);
    if (uploadIds.length === 0) {
      uploadIds = await getUserUploadIds(req.user?.id);
    }

    const data = await optimizationService.getCommitmentGaps({
      filters,
      period,
      uploadIds,
    });

    return res.ok(data);
  } catch (error) {
    logger.error({ err: error, requestId: req.requestId }, 'Error in getCommitmentGaps');
    return next(new AppError(500, "INTERNAL", "Internal server error"));
  }
};

/**
 * GET /api/optimization/tracker
 * Get optimization tracker items
 */
export const getTrackerItems = async (req, res, next) => {
  try {
    const filters = {
      provider: req.query.provider || 'All',
      service: req.query.service || 'All',
      region: req.query.region || 'All',
    };

    const period = req.query.period || 'last90days';

    let uploadIds = getUploadIdsFromReq(req);
    if (uploadIds.length === 0) {
      uploadIds = await getUserUploadIds(req.user?.id);
    }

    const data = await optimizationService.getTrackerItems({
      filters,
      period,
      uploadIds,
    });

    return res.ok(data);
  } catch (error) {
    logger.error({ err: error, requestId: req.requestId }, 'Error in getTrackerItems');
    return next(new AppError(500, "INTERNAL", "Internal server error"));
  }
};

/**
 * GET /api/optimization/action-center
 * Get precomputed action center model for optimization overview
 */
export const getActionCenter = async (req, res, next) => {
  try {
    const filters = {
      provider: req.query.provider || 'All',
      service: req.query.service || 'All',
      region: req.query.region || 'All',
    };

    const period = req.query.period || 'last90days';

    let uploadIds = getUploadIdsFromReq(req);
    if (uploadIds.length === 0) {
      uploadIds = await getUserUploadIds(req.user?.id);
    }

    const data = await optimizationService.getActionCenter({
      filters,
      period,
      uploadIds,
    });

    return res.ok(data);
  } catch (error) {
    logger.error({ err: error, requestId: req.requestId }, 'Error in getActionCenter');
    return next(new AppError(500, "INTERNAL", "Internal server error", { cause: error }));
  }
};

/**
 * GET /api/optimization/action-center
 * Get precomputed action center model for optimization overview
 */


/**
 * GET /api/optimization/right-sizing
 * Get right-sizing recommendations
 */
export const getRightSizing = async (req, res, next) => {
  try {
    const filters = {
      provider: req.query.provider || 'All',
      service: req.query.service || 'All',
      region: req.query.region || 'All',
    };

    const period = req.query.period || 'last90days';

    let uploadIds = getUploadIdsFromReq(req);
    if (uploadIds.length === 0) {
      uploadIds = await getUserUploadIds(req.user?.id);
    }

    const data = await optimizationService.getRightSizingRecommendations({
      filters,
      period,
      uploadIds,
    });

    return res.ok(data);
  } catch (error) {
    logger.error({ err: error, requestId: req.requestId }, 'Error in getRightSizing');
    return next(new AppError(500, "INTERNAL", "Internal server error"));
  }
};
