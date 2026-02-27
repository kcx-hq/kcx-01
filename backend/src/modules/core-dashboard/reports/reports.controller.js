/**
 * Reports Controller
 * HTTP request handlers for FinOps reports
 *
 * Style: SAME AS cost-analysis controller
 * - uploadIds from BODY first, QUERY fallback
 * - filters from BODY first, QUERY fallback
 */

import { reportsService } from "./reports.service.js";
import { generatePDFReport } from "./reports.pdf.js";
import AppError from "../../../errors/AppError.js";
import logger from "../../../lib/logger.js";

/**
 * Normalize uploadIds from body or query
 * Supports:
 * - uploadIds: ["a","b"]
 * - uploadIds: "a,b"
 * - uploadId: "a"
 */
function extractUploadIds(req) {
  const bodyValue = req.body?.uploadIds || req.body?.uploadId;
  const queryValue = req.query?.uploadIds || req.query?.uploadId;

  const source = bodyValue ?? queryValue;
  if (!source) return [];

  if (Array.isArray(source)) return source;

  if (typeof source === "string") {
    return source
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean);
  }

  return [source];
}

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
 * GET /api/reports/summary
 */
export const getSummary = async (req, res, next) => {
  try {
    const uploadIds = extractUploadIds(req);
    const filters = extractFilters(req);
    const period = req.body?.period || req.query?.period || null;

    const data = await reportsService.getDashboardSummary({
      filters,
      period,
      uploadIds,
    });

    return res.ok(data);
  } catch (error) {
    logger.error({ err: error, requestId: req.requestId }, "Error in getSummary");
    return next(new AppError(500, "INTERNAL", "Internal server error", { cause: error }));
  }
};

/**
 * GET /api/reports/top-services
 */
export const getTopServices = async (req, res, next) => {
  try {
    const uploadIds = extractUploadIds(req);
    const filters = extractFilters(req);

    const period = req.body?.period || req.query?.period || null;
    const limitRaw = req.body?.limit ?? req.query?.limit ?? 10;
    const limit = Number.isFinite(Number(limitRaw)) ? parseInt(limitRaw, 10) : 10;

    const data = await reportsService.getTopServices({
      filters,
      period,
      limit,
      uploadIds,
    });

    return res.ok(data);
  } catch (error) {
    logger.error({ err: error, requestId: req.requestId }, "Error in getTopServices");
    return next(new AppError(500, "INTERNAL", "Internal server error", { cause: error }));
  }
};

/**
 * GET /api/reports/top-regions
 */
export const getTopRegions = async (req, res, next) => {
  try {
    const uploadIds = extractUploadIds(req);
    const filters = extractFilters(req);

    const period = req.body?.period || req.query?.period || null;
    const limitRaw = req.body?.limit ?? req.query?.limit;
    const limit = Number.isFinite(Number(limitRaw)) ? parseInt(limitRaw, 10) : 10;

    const data = await reportsService.getTopRegions({
      filters,
      period,
      limit,
      uploadIds,
    });

    return res.ok(data);
  } catch (error) {
    logger.error({ err: error, requestId: req.requestId }, "Error in getTopRegions");
    return next(new AppError(500, "INTERNAL", "Internal server error", { cause: error }));
  }
};

/**
 * GET /api/reports/monthly-spend
 */
export const getMonthlySpend = async (req, res, next) => {
  try {
    const uploadIds = extractUploadIds(req);
    const filters = extractFilters(req);

    const startDateRaw = req.body?.startDate || req.query?.startDate || null;
    const endDateRaw = req.body?.endDate || req.query?.endDate || null;

    const startDate = startDateRaw ? new Date(startDateRaw) : null;
    const endDate = endDateRaw ? new Date(endDateRaw) : null;

    const data = await reportsService.getMonthlySpend({
      filters,
      startDate,
      endDate,
      uploadIds,
    });

    return res.ok(data);
  } catch (error) {
    logger.error({ err: error, requestId: req.requestId }, "Error in getMonthlySpend");
    return next(new AppError(500, "INTERNAL", "Internal server error", { cause: error }));
  }
};

/**
 * GET /api/reports/tag-compliance
 */
export const getTagCompliance = async (req, res, next) => {
  try {
    const uploadIds = extractUploadIds(req);
    const filters = extractFilters(req);

    const period = req.body?.period || req.query?.period || null;

    const data = await reportsService.getTagCompliance({
      filters,
      period,
      uploadIds,
    });

    return res.ok(data);
  } catch (error) {
    logger.error({ err: error, requestId: req.requestId }, "Error in getTagCompliance");
    return next(new AppError(500, "INTERNAL", "Internal server error", { cause: error }));
  }
};

/**
 * GET /api/reports/environment-breakdown
 */
export const getEnvironmentBreakdown = async (req, res, next) => {
  try {
    const uploadIds = extractUploadIds(req);
    const filters = extractFilters(req);

    const period = req.body?.period || req.query?.period || null;

    const data = await reportsService.getEnvironmentBreakdown({
      filters,
      period,
      uploadIds,
    });

    return res.ok(data);
  } catch (error) {
    logger.error({ err: error, requestId: req.requestId }, "Error in getEnvironmentBreakdown");
    return next(new AppError(500, "INTERNAL", "Internal server error", { cause: error }));
  }
};

/**
 * POST /api/reports/download
 */
export const downloadPDF = async (req, res, next) => {
  try {
    const reportData = req.body;

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="Cloud_Cost_Optimization_Report.pdf"'
    );

    const doc = generatePDFReport(reportData);
    doc.pipe(res);

    doc.on("error", (error) => {
      logger.error({ err: error, requestId: req.requestId }, "PDF generation error");
      if (!res.headersSent) {
        return next(new AppError(500, "INTERNAL", "Internal server error"));
      }
    });

    doc.end();
  } catch (error) {
    logger.error({ err: error, requestId: req.requestId }, "Error in downloadPDF");
    if (!res.headersSent) {
      return next(new AppError(500, "INTERNAL", "Internal server error", { cause: error }));
    }
  }
};
