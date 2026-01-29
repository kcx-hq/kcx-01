import { costDriversService } from './cost-drivers.service.js';

/**
 * Normalize upload IDs
 * Supports:
 *  - uploadid=uuid
 *  - uploadid[]=uuid1&uploadid[]=uuid2
 *  - uploadid="uuid1,uuid2"
 *  - uploadId / uploadIds (camelCase)
 */
function normalizeUploadIds(input) {
  if (!input) return [];

  if (Array.isArray(input)) {
    return input.map(String).map(v => v.trim()).filter(Boolean);
  }

  if (typeof input === 'string') {
    return input
      .split(',')
      .map(v => v.trim())
      .filter(Boolean);
  }

  return [];
}

/**
 * Read uploadIds from QUERY or BODY (GET / POST safe)
 */
function extractUploadIds(req) {
  return normalizeUploadIds(
    req.query.uploadid ??
      req.query.uploadId ??
      req.query.uploadids ??
      req.query.uploadIds ??
      req.body?.uploadid ??
      req.body?.uploadId ??
      req.body?.uploadIds
  );
}

/**
 * GET /api/drivers/analysis
 * Cost Drivers Summary
 */
export const getCostDrivers = async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        message: 'Please log in to view cost drivers'
      });
    }

    const filters = {
      provider: req.query.provider || 'All',
      service: req.query.service || 'All',
      region: req.query.region || 'All'
    };

    const period = Number.isFinite(+req.query.period)
      ? parseInt(req.query.period, 10)
      : 30;

    const dimension = req.query.dimension || 'ServiceName';
    const minChange = Number.isFinite(+req.query.minChange)
      ? parseFloat(req.query.minChange)
      : 0;

    const activeServiceFilter = req.query.activeServiceFilter || 'All';

    // ✅ Upload IDs from query OR body
    const uploadIds = extractUploadIds(req);

    if (uploadIds.length === 0) {
      return res.json({
        success: true,
        data: {
          increases: [],
          decreases: [],
          overallStats: {
            totalCurr: 0,
            totalPrev: 0,
            diff: 0,
            pct: 0,
            totalIncreases: 0,
            totalDecreases: 0
          },
          dynamics: {
            newSpend: 0,
            expansion: 0,
            deleted: 0,
            optimization: 0
          },
          periods: {
            current: null,
            prev: null,
            max: null
          },
          availableServices: [],
          message: 'No upload selected. Please select a billing upload to analyze cost drivers.'
        }
      });
    }

    const data = await costDriversService.getCostDrivers({
      filters,
      period,
      dimension,
      minChange,
      activeServiceFilter,
      uploadIds
    });

    const safeData = data || {
      increases: [],
      decreases: [],
      overallStats: {
        totalCurr: 0,
        totalPrev: 0,
        diff: 0,
        pct: 0,
        totalIncreases: 0,
        totalDecreases: 0
      },
      dynamics: { newSpend: 0, expansion: 0, deleted: 0, optimization: 0 },
      periods: { current: null, prev: null, max: null },
      availableServices: []
    };

    if (
      safeData.increases.length === 0 &&
      safeData.decreases.length === 0
    ) {
      safeData.message =
        'No cost changes detected in the selected period. Try adjusting the time period or filters.';
    }

    return res.json({
      success: true,
      data: safeData
    });
  } catch (error) {
    console.error('Error in getCostDrivers:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to analyze cost drivers',
      message: error.message
    });
  }
};

/**
 * POST /api/drivers/details
 * Detailed analysis for a single driver
 */
export const getDriverDetails = async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const { driver } = req.body;
    const period = Number.isFinite(+req.body.period)
      ? parseInt(req.body.period, 10)
      : 30;

    if (!driver) {
      return res.status(400).json({
        success: false,
        error: 'Driver data is required'
      });
    }

    // ✅ Upload IDs from body OR query
    const uploadIds = extractUploadIds(req);

    if (uploadIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'uploadid is required'
      });
    }

    const data = await costDriversService.getDriverDetails({
      driver,
      period,
      uploadIds
    });

    return res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Error in getDriverDetails:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get driver details',
      message: error.message
    });
  }
};
