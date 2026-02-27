/**
 * Client-C Cost Drivers Controller
 */

import { clientCCostDriversService } from './costDrivers.service.js';
import { costDriversService as coreCostDriversService } from '../../../../modules/core-dashboard/analytics/cost-drivers/cost-drivers.service.js';
import AppError from "../../../../errors/AppError.js";
import logger from "../../../../lib/logger.js";

/**
 * Normalize uploadIds
 */
function normalizeUploadIds(uploadid) {
  if (!uploadid) return [];
  if (Array.isArray(uploadid)) return uploadid.filter(Boolean);
  if (typeof uploadid === 'string') {
    return uploadid.includes(',')
      ? uploadid.split(',').map(v => v.trim()).filter(Boolean)
      : [uploadid.trim()];
  }
  return [];
}

/**
 * Read uploadId from query or body
 */
function getUploadIdsFromRequest(req) {
  return normalizeUploadIds(
    req.query?.uploadId ??
    req.query?.uploadIds ??
    req.body?.uploadId ??
    req.body?.uploadIds
  );
}

/**
 * GET /api/client-c/cost-drivers
 */
export const getCostDrivers = async (req, res, next) => {
  try {
    const uploadIds = getUploadIdsFromRequest(req);

    if (uploadIds.length === 0) {
      return res.ok({
        increases: [],
        decreases: [],
        overallStats: {},
        periods: {},
        availableServices: [],
        message: 'No upload selected. Please select a billing upload.'
      });
    }

    const filters = {
      provider: req.query.provider || 'All',
      service: req.query.service || 'All',
      region: req.query.region || 'All'
    };

    const data = await clientCCostDriversService.getCostDrivers({
      filters,
      uploadIds,
      period: Number(req.query.period || 30),
      dimension: req.query.dimension || 'ServiceName'
    });

    return res.ok(data);
  } catch (error) {
    logger.error({ err: error, requestId: req.requestId }, 'Client-C Cost Drivers Error');
    return next(new AppError(500, "INTERNAL", "Internal server error", { cause: error }));
  }
};

/**
 * POST /api/client-c/cost-drivers/department
 */
export const getDepartmentDrivers = async (req, res, next) => {
  try {
    const uploadIds = getUploadIdsFromRequest(req);
    const { driver, period = 30, filters = {} } = req.body || {};

    if (!driver || uploadIds.length === 0) {
      return next(new AppError(400, "VALIDATION_ERROR", "Invalid request"));
    }

    const data = await clientCCostDriversService.getDepartmentDrivers({
      filters,
      uploadIds,
      period: Number(period || 30),
      dimension: 'department'
    });

    return res.ok(data);
  } catch (error) {
    logger.error({ err: error, requestId: req.requestId }, 'Client-C Department Drivers Error');
    return next(new AppError(500, "INTERNAL", "Internal server error", { cause: error }));
  }
};

/**
 * POST /api/client-c/cost-drivers/details
 * Detailed analysis for a single driver
 */
export const getDriverDetails = async (req, res, next) => {
  try {
    const uploadIds = getUploadIdsFromRequest(req);
    if (uploadIds.length === 0) {
      return next(new AppError(400, "VALIDATION_ERROR", "Invalid request"));
    }

    const { driver, period = 30 } = req.body || {};
    if (!driver) {
      return next(new AppError(400, "VALIDATION_ERROR", "Invalid request"));
    }

    // Use core service for driver details since client-c doesn't modify this logic
    const data = await coreCostDriversService.getDriverDetails({
      driver,
      period: Number(period || 30),
      uploadIds
    });

    return res.ok(data);
  } catch (error) {
    logger.error({ err: error, requestId: req.requestId }, 'Client-C Driver Details Error');
    return next(new AppError(500, "INTERNAL", "Internal server error", { cause: error }));
  }
};
