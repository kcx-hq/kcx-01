/**
 * Client-C Cost Drivers Controller
 */

import { clientCCostDriversService } from './costDrivers.service.js';
import { costDriversService as coreCostDriversService } from '../../../../modules/core-dashboard/analytics/cost-drivers/cost-drivers.service.js';

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
export const getCostDrivers = async (req, res) => {
  try {
    const uploadIds = getUploadIdsFromRequest(req);

    if (uploadIds.length === 0) {
      return res.json({
        success: true,
        data: {
          increases: [],
          decreases: [],
          overallStats: {},
          periods: {},
          availableServices: [],
          message: 'No upload selected. Please select a billing upload.'
        }
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

    res.json({ success: true, data });
  } catch (error) {
    console.error('Client-C Cost Drivers Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * POST /api/client-c/cost-drivers/department
 */
export const getDepartmentDrivers = async (req, res) => {
  try {
    const uploadIds = getUploadIdsFromRequest(req);
    const { driver, period = 30, filters = {} } = req.body || {};

    if (!driver || uploadIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'driver and uploadId are required'
      });
    }

    const data = await clientCCostDriversService.getDepartmentDrivers({
      filters,
      uploadIds,
      period: Number(period || 30),
      dimension: 'department'
    });

    res.json({ success: true, data });
  } catch (error) {
    console.error('Client-C Department Drivers Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * POST /api/client-c/cost-drivers/details
 * Detailed analysis for a single driver
 */
export const getDriverDetails = async (req, res) => {
  try {
    const uploadIds = getUploadIdsFromRequest(req);
    if (uploadIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'uploadId is required'
      });
    }

    const { driver, period = 30 } = req.body || {};
    if (!driver) {
      return res.status(400).json({
        success: false,
        error: 'driver is required'
      });
    }

    // Use core service for driver details since client-c doesn't modify this logic
    const data = await coreCostDriversService.getDriverDetails({
      driver,
      period: Number(period || 30),
      uploadIds
    });

    res.json({ success: true, data });
  } catch (error) {
    console.error('Client-C Driver Details Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};
