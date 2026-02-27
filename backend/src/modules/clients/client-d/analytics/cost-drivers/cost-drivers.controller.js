import { clientDCostDriversService } from './cost-drivers.service.js';
import { extractUploadIds } from '../../helpers/extractUploadId.js';
import AppError from "../../../../../errors/AppError.js";
import logger from "../../../../../lib/logger.js";



/**
 * GET /api/client-d/drivers/analysis
 * Extended cost drivers (adds SKU + commitment attribution summaries)
 */
export const getClientDCostDrivers = async (req, res, next) => {
  try {
    if (!req.user?.id) {
      return next(new AppError(401, "UNAUTHENTICATED", "Authentication required"));
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
      return res.ok({
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

    return res.ok(data);
  } catch (error) {
    logger.error({ err: error, requestId: req.requestId }, 'ClientD getCostDrivers Error');
    return next(new AppError(500, "INTERNAL", "Internal server error", { cause: error }));
  }
};

/**
 * POST /api/client-d/drivers/details
 * Extended drilldown: includes SKU + commitment breakdown inside details
 */
export const getClientDDriverDetails = async (req, res, next) => {
  try {
    if (!req.user?.id) {
      return next(new AppError(401, "UNAUTHENTICATED", "Authentication required"));
    }

    const { driver } = req.body;
    const period = Number.isFinite(+req.body.period)
      ? parseInt(req.body.period, 10)
      : 30;

    if (!driver) {
      return next(new AppError(400, "VALIDATION_ERROR", "Invalid request"));
    }

    const uploadIds = extractUploadIds(req);
    if (uploadIds.length === 0) {
      return next(new AppError(400, "VALIDATION_ERROR", "Invalid request"));
    }

    const data = await clientDCostDriversService.getDriverDetails({
      driver,
      period,
      uploadIds
    });

    return res.ok(data);
  } catch (error) {
    logger.error({ err: error, requestId: req.requestId }, 'ClientD getDriverDetails Error');
    return next(new AppError(500, "INTERNAL", "Internal server error", { cause: error }));
  }
};
