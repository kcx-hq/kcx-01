import { clientDCostDriversService } from './cost-drivers.service.js';
import { extractUploadIds } from '../../helpers/extractUploadId.js';



/**
 * GET /api/client-d/drivers/analysis
 * Extended cost drivers (adds SKU + commitment attribution summaries)
 */
export const getClientDCostDrivers = async (req, res) => {
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
          dynamics: { newSpend: 0, expansion: 0, deleted: 0, optimization: 0 },
          periods: { current: null, prev: null, max: null },
          availableServices: [],
          skuDrivers: [],
          commitmentAttribution: { byType: [], totals: {} },
          message: 'No upload selected. Please select a billing upload to analyze cost drivers.'
        }
      });
    }

    const data = await clientDCostDriversService.getCostDrivers({
      filters,
      period,
      dimension,
      minChange,
      activeServiceFilter,
      uploadIds
    });

    return res.json({ success: true, data });
  } catch (error) {
    console.error('ClientD getCostDrivers Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to analyze Client-D cost drivers',
      message: error.message
    });
  }
};

/**
 * POST /api/client-d/drivers/details
 * Extended drilldown: includes SKU + commitment breakdown inside details
 */
export const getClientDDriverDetails = async (req, res) => {
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

    const uploadIds = extractUploadIds(req);
    if (uploadIds.length === 0) {
      return res.status(400).json({ success: false, error: 'uploadid is required' });
    }

    const data = await clientDCostDriversService.getDriverDetails({
      driver,
      period,
      uploadIds
    });

    return res.json({ success: true, data });
  } catch (error) {
    console.error('ClientD getDriverDetails Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get Client-D driver details',
      message: error.message
    });
  }
};
