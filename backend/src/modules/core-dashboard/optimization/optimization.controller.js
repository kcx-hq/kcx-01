/**
 * Optimization Controller
 * HTTP request handlers for optimization recommendations
 */

import { optimizationService } from './optimization.service.js';
import { BillingUpload } from '../../../models/index.js';

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
export const getRecommendations = async (req, res) => {
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

    res.json({ success: true, data });
  } catch (error) {
    console.error('Error in getRecommendations:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate optimization recommendations',
      message: error.message,
    });
  }
};

/**
 * GET /api/optimization/idle-resources
 * Get idle resource recommendations
 */
export const getIdleResources = async (req, res) => {
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

    res.json({ success: true, data });
  } catch (error) {
    console.error('Error in getIdleResources:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to detect idle resources',
      message: error.message,
    });
  }
};

/**
 * GET /api/optimization/opportunities
 * Get aggregated optimization opportunities
 */
export const getOpportunities = async (req, res) => {
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

    res.json({ success: true, data });
  } catch (error) {
    console.error('Error in getOpportunities:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate opportunities',
      message: error.message,
    });
  }
};

/**
 * GET /api/optimization/commitments
 * Get commitment coverage gaps
 */
export const getCommitmentGaps = async (req, res) => {
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

    res.json({ success: true, data });
  } catch (error) {
    console.error('Error in getCommitmentGaps:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to analyze commitment gaps',
      message: error.message,
    });
  }
};

/**
 * GET /api/optimization/tracker
 * Get optimization tracker items
 */
export const getTrackerItems = async (req, res) => {
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

    res.json({ success: true, data });
  } catch (error) {
    console.error('Error in getTrackerItems:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch tracker items',
      message: error.message,
    });
  }
};

/**
 * GET /api/optimization/action-center
 * Get precomputed action center model for optimization overview
 */
export const getActionCenter = async (req, res) => {
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

    res.json({ success: true, data });
  } catch (error) {
    console.error('Error in getActionCenter:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to build optimization action center',
      message: error.message,
    });
  }
};

/**
 * GET /api/optimization/right-sizing
 * Get right-sizing recommendations
 */
export const getRightSizing = async (req, res) => {
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

    res.json({ success: true, data });
  } catch (error) {
    console.error('Error in getRightSizing:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate right-sizing recommendations',
      message: error.message,
    });
  }
};
