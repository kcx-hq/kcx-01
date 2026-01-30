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
export const getSummary = async (req, res) => {
  try {
    const uploadIds = extractUploadIds(req);
    const filters = extractFilters(req);
    const period = req.body?.period || req.query?.period || null;

    const data = await reportsService.getDashboardSummary({
      filters,
      period,
      uploadIds,
    });

    return res.json({ success: true, data });
  } catch (error) {
    console.error("Error in getSummary:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to generate dashboard summary",
      details: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * GET /api/reports/top-services
 */
export const getTopServices = async (req, res) => {
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

    return res.json({ success: true, data });
  } catch (error) {
    console.error("Error in getTopServices:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch top services",
      details: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * GET /api/reports/top-regions
 */
export const getTopRegions = async (req, res) => {
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

    return res.json({ success: true, data });
  } catch (error) {
    console.error("Error in getTopRegions:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch top regions",
      details: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * GET /api/reports/monthly-spend
 */
export const getMonthlySpend = async (req, res) => {
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

    return res.json({ success: true, data });
  } catch (error) {
    console.error("Error in getMonthlySpend:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch monthly spend",
      details: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * GET /api/reports/tag-compliance
 */
export const getTagCompliance = async (req, res) => {
  try {
    const uploadIds = extractUploadIds(req);
    const filters = extractFilters(req);

    const period = req.body?.period || req.query?.period || null;

    const data = await reportsService.getTagCompliance({
      filters,
      period,
      uploadIds,
    });

    return res.json({ success: true, data });
  } catch (error) {
    console.error("Error in getTagCompliance:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch tag compliance",
      details: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * GET /api/reports/environment-breakdown
 */
export const getEnvironmentBreakdown = async (req, res) => {
  try {
    const uploadIds = extractUploadIds(req);
    const filters = extractFilters(req);

    const period = req.body?.period || req.query?.period || null;

    const data = await reportsService.getEnvironmentBreakdown({
      filters,
      period,
      uploadIds,
    });

    return res.json({ success: true, data });
  } catch (error) {
    console.error("Error in getEnvironmentBreakdown:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch environment breakdown",
      details: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * POST /api/reports/download
 */
export const downloadPDF = async (req, res) => {
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
      console.error("PDF generation error:", error);
      if (!res.headersSent) {
        res.status(500).json({ success: false, error: "Failed to generate PDF" });
      }
    });

    doc.end();
  } catch (error) {
    console.error("Error in downloadPDF:", error);
    if (!res.headersSent) {
      return res.status(500).json({
        success: false,
        error: "Failed to generate report",
        details: process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }
};
