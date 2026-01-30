/**
 * Client-C Overview Controller
 * Extended version with department features
 */

import { clientCOverviewService } from './overview.service.js';

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
export const getOverview = async (req, res) => {
  try {
    const filters = {
      provider: req.query.provider || 'All',
      service: req.query.service || 'All',
      region: req.query.region || 'All'
    };

    const uploadIds = getUploadIdsFromRequest(req);

    if (uploadIds.length === 0) {
      return res.json({
        success: true,
        data: {
          totalSpend: 0,
          dailyData: [],
          groupedData: [],
          allRegionData: [],
          topRegion: { name: 'N/A', value: 0 },
          topService: { name: 'N/A', value: 0 },
          departmentBreakdown: [],
          departmentTrends: [],
          message: 'No upload selected. Please select a billing upload.'
        }
      });
    }

    const data = await clientCOverviewService.getOverviewMetrics(filters, uploadIds);
    res.json({ success: true, data });
  } catch (error) {
    console.error('Client-C Overview Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * GET /api/client-c/overview/anomalies
 */
export const getAnomalies = async (req, res) => {
  try {
    const filters = {
      provider: req.query.provider || 'All',
      service: req.query.service || 'All',
      region: req.query.region || 'All'
    };

    const uploadIds = getUploadIdsFromRequest(req);

    if (uploadIds.length === 0) {
      return res.json({
        success: true,
        data: { anomalies: [], message: 'No upload selected.' }
      });
    }

    const data = await clientCOverviewService.getAnomalies(filters, uploadIds);
    res.json({ success: true, data });
  } catch (error) {
    console.error('Anomaly Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * GET /api/client-c/overview/filters
 */
export const getFilters = async (req, res) => {
  try {
    const uploadIds = getUploadIdsFromRequest(req);
    if (uploadIds.length === 0) {
      return res.json({
        success: true,
        data: { providers: ['All'], services: ['All'], regions: ['All'] }
      });
    }
    const data = await clientCOverviewService.getFilters(uploadIds);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

