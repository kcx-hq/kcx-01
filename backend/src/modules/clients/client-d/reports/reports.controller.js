/**
 * Client-D Reports Controller
 * Reduced vs Core:
 * - Keep: summary, top-services, top-regions
 * - Remove: monthly-spend (long-term trends)
 * - Remove: PDF export
 */

import { clientDReportsService } from "./reports.service.js";
import { extractUploadIds } from '../helpers/extractUploadId.js';


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
export const getClientDSummary = async (req, res) => {
  try {
    const uploadIds = extractUploadIds(req);
    const filters = extractFilters(req);
    const period = req.body?.period || req.query?.period || null;

    if (uploadIds.length === 0) {
      return res.json({
        success: true,
        data: clientDReportsService.emptySummary(),
        message: "No upload selected. Please select a billing upload.",
      });
    }

    const data = await clientDReportsService.getDashboardSummary({
      filters,
      period,
      uploadIds,
    });

    return res.json({ success: true, data });
  } catch (error) {
    console.error("Client-D Reports Summary Error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to generate Client-D dashboard summary",
      message: error.message,
    });
  }
};

/**
 * GET /api/client-d/reports/top-services
 */
export const getClientDTopServices = async (req, res) => {
  try {
    const uploadIds = extractUploadIds(req);
    const filters = extractFilters(req);

    const period = req.body?.period || req.query?.period || null;
    const limitRaw = req.body?.limit ?? req.query?.limit ?? 10;
    const limit = Number.isFinite(Number(limitRaw)) ? parseInt(limitRaw, 10) : 10;

    if (uploadIds.length === 0) {
      return res.json({
        success: true,
        data: [],
        message: "No upload selected. Please select a billing upload.",
      });
    }

    const data = await clientDReportsService.getTopServices({
      filters,
      period,
      limit,
      uploadIds,
    });

    return res.json({ success: true, data });
  } catch (error) {
    console.error("Client-D Top Services Error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch Client-D top services",
      message: error.message,
    });
  }
};

/**
 * GET /api/client-d/reports/top-regions
 */
export const getClientDTopRegions = async (req, res) => {
  try {
    const uploadIds = extractUploadIds(req);
    const filters = extractFilters(req);

    const period = req.body?.period || req.query?.period || null;
    const limitRaw = req.body?.limit ?? req.query?.limit ?? 10;
    const limit = Number.isFinite(Number(limitRaw)) ? parseInt(limitRaw, 10) : 10;

    if (uploadIds.length === 0) {
      return res.json({
        success: true,
        data: [],
        message: "No upload selected. Please select a billing upload.",
      });
    }

    const data = await clientDReportsService.getTopRegions({
      filters,
      period,
      limit,
      uploadIds,
    });

    return res.json({ success: true, data });
  } catch (error) {
    console.error("Client-D Top Regions Error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch Client-D top regions",
      message: error.message,
    });
  }
};
