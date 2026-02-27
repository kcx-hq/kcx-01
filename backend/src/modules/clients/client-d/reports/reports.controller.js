/**
 * Client-D Reports Controller
 * Reduced vs Core:
 * - Keep: summary, top-services, top-regions
 * - Remove: monthly-spend (long-term trends)
 * - Remove: PDF export
 */

import { clientDReportsService } from "./reports.service.js";
import { extractUploadIds } from '../helpers/extractUploadId.js';
import AppError from "../../../../errors/AppError.js";
import logger from "../../../../lib/logger.js";


/**
 * Build standard filters (BODY first, QUERY fallback)
 */
function extractFilters(req) {
  return {
    provider: req.body?.provider || req.query?.provider || "All",
    service: req.body?.service || req.query?.service || "All",
    region: req.body?.region || req.query?.region || "All",
  };
}

/**
 * GET /api/client-d/reports/summary
 */
export const getClientDSummary = async (req, res, next) => {
  try {
    const uploadIds = extractUploadIds(req);
    const filters = extractFilters(req);
    const period = req.body?.period || req.query?.period || null;

    if (uploadIds.length === 0) {
      return res.ok(clientDReportsService.emptySummary());
    }

    const data = await clientDReportsService.getDashboardSummary({
      filters,
      period,
      uploadIds,
    });

    return res.ok(data);
  } catch (error) {
    logger.error({ err: error, requestId: req.requestId }, "Client-D Reports Summary Error");
    return next(new AppError(500, "INTERNAL", "Internal server error", { cause: error }));
  }
};

/**
 * GET /api/client-d/reports/top-services
 */
export const getClientDTopServices = async (req, res, next) => {
  try {
    const uploadIds = extractUploadIds(req);
    const filters = extractFilters(req);

    const period = req.body?.period || req.query?.period || null;
    const limitRaw = req.body?.limit ?? req.query?.limit ?? 10;
    const limit = Number.isFinite(Number(limitRaw)) ? parseInt(limitRaw, 10) : 10;

    if (uploadIds.length === 0) {
      return res.ok([]);
    }

    const data = await clientDReportsService.getTopServices({
      filters,
      period,
      limit,
      uploadIds,
    });

    return res.ok(data);
  } catch (error) {
    logger.error({ err: error, requestId: req.requestId }, "Client-D Top Services Error");
    return next(new AppError(500, "INTERNAL", "Internal server error", { cause: error }));
  }
};

/**
 * GET /api/client-d/reports/top-regions
 */
export const getClientDTopRegions = async (req, res, next) => {
  try {
    const uploadIds = extractUploadIds(req);
    const filters = extractFilters(req);

    const period = req.body?.period || req.query?.period || null;
    const limitRaw = req.body?.limit ?? req.query?.limit ?? 10;
    const limit = Number.isFinite(Number(limitRaw)) ? parseInt(limitRaw, 10) : 10;

    if (uploadIds.length === 0) {
      return res.ok([]);
    }

    const data = await clientDReportsService.getTopRegions({
      filters,
      period,
      limit,
      uploadIds,
    });

    return res.ok(data);
  } catch (error) {
    logger.error({ err: error, requestId: req.requestId }, "Client-D Top Regions Error");
    return next(new AppError(500, "INTERNAL", "Internal server error", { cause: error }));
  }
};
