import { dashboardService } from "./overview.service.js";
import AppError from "../../../errors/AppError.js";
import logger from "../../../lib/logger.js";
import { assertUploadScope } from "../utils/uploadScope.service.js";

/**
 * Helper: normalize uploadIds from request
 * Supports:
 *  - uploadid=uuid
 *  - uploadid[]=uuid1&uploadid[]=uuid2
 *  - uploadid="uuid1,uuid2"
 */
function normalizeUploadIds(uploadid) {
  if (!uploadid) return [];

  if (Array.isArray(uploadid)) {
    return uploadid
      .flatMap((entry) => String(entry).split(","))
      .map((entry) => entry.trim())
      .filter(Boolean);
  }

  if (typeof uploadid === "string") {
    const raw = uploadid.trim();
    if (!raw) return [];
    return raw
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean);
  }

  return [];
}

/**
 * Helper: read upload id(s) from query OR body
 * Accepts: uploadid/uploadId/uploadids/uploadIds
 */
function getUploadIdsFromRequest(req) {
  const fromQuery =
    req.query?.uploadid ??
    req.query?.uploadId ??
    req.query?.uploadids ??
    req.query?.uploadIds;
  const fromBody =
    req.body?.uploadid ??
    req.body?.uploadId ??
    req.body?.uploadids ??
    req.body?.uploadIds;

  const raw = fromQuery ?? fromBody;
  return normalizeUploadIds(raw);
}

function parseJsonQueryParam(value, fallback, { expect = "any" } = {}) {
  if (value === undefined || value === null || value === "") return fallback;
  if (typeof value === "object") return value;

  try {
    const parsed = JSON.parse(String(value));
    if (
      expect === "object" &&
      (parsed === null || Array.isArray(parsed) || typeof parsed !== "object")
    ) {
      throw new Error("Invalid JSON object");
    }
    if (expect === "array" && !Array.isArray(parsed)) {
      throw new Error("Invalid JSON array");
    }
    return parsed;
  } catch (_error) {
    throw new AppError(400, "VALIDATION_ERROR", "Invalid request");
  }
}

function parsePositiveInt(value, fallback, { min = 1, max = Number.MAX_SAFE_INTEGER } = {}) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || Number.isNaN(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}

export const getOverview = async (req, res, next) => {
  try {
    const parsedBudget = Number(req.query.budget || 0);
    const filters = {
      provider: req.query.provider || "All",
      service: req.query.service || "All",
      region: req.query.region || "All",
      budget: Number.isFinite(parsedBudget) && parsedBudget > 0 ? parsedBudget : 0,
    };

    const uploadIds = await assertUploadScope({
      uploadIds: getUploadIdsFromRequest(req),
      clientId: req.client_id,
    });

    if (uploadIds.length === 0) {
      return res.ok({
        kpis: {
          totalSpend: 0,
          avgDaily: 0,
          peakUsage: 0,
          peakDate: null,
          trend: 0,
          predictabilityScore: 0,
          forecastTotal: 0,
          atRiskSpend: 0,
        },
        chartData: [],
        breakdown: [],
        message: "No upload selected. Please select a billing upload.",
      });
    }

    const data = await dashboardService.getOverviewMetrics(filters, uploadIds);
    return res.ok(data);
  } catch (error) {
    if (error instanceof AppError) {
      return next(error);
    }
    logger.error({ err: error, requestId: req.requestId }, "Overview Error");
    return next(new AppError(500, "INTERNAL", "Internal server error", { cause: error }));
  }
};

export const getAnomalies = async (req, res, next) => {
  try {
    const filters = {
      provider: req.query.provider || "All",
      service: req.query.service || "All",
      region: req.query.region || "All",
    };

    const uploadIds = await assertUploadScope({
      uploadIds: getUploadIdsFromRequest(req),
      clientId: req.client_id,
    });

    if (uploadIds.length === 0) {
      return res.ok({
        anomalies: [],
        message: "No upload selected. Please select a billing upload.",
      });
    }

    const data = await dashboardService.getAnomalies(filters, uploadIds);
    return res.ok(data);
  } catch (error) {
    if (error instanceof AppError) {
      return next(error);
    }
    logger.error({ err: error, requestId: req.requestId }, "Anomaly Error");
    return next(new AppError(500, "INTERNAL", "Internal server error", { cause: error }));
  }
};

export const getFilters = async (req, res, next) => {
  try {
    const uploadIds = await assertUploadScope({
      uploadIds: getUploadIdsFromRequest(req),
      clientId: req.client_id,
    });
    if (uploadIds.length === 0) {
      return res.ok({
        providers: ["All"],
        services: ["All"],
        regions: ["All"],
        message: "No upload selected. Please select a billing upload.",
      });
    }
    const data = await dashboardService.getFilters(uploadIds);
    return res.ok(data);
  } catch (error) {
    if (error instanceof AppError) {
      return next(error);
    }
    logger.error({ err: error, requestId: req.requestId }, "Filters Error");
    return next(new AppError(500, "INTERNAL", "Internal server error", { cause: error }));
  }
};

export const getDataExplorer = async (req, res, next) => {
  try {
    const filters = {
      provider: req.query.provider || "All",
      service: req.query.service || "All",
      region: req.query.region || "All",
    };

    const pagination = {
      page: parsePositiveInt(req.query.page, 1, { min: 1 }),
      limit: parsePositiveInt(req.query.limit, 100, { min: 1, max: 1000 }),
      sortBy: req.query.sortBy || null,
      sortOrder: req.query.sortOrder || "asc",
      search: req.query.search || "",
      columnFilters: parseJsonQueryParam(req.query.columnFilters, {}, { expect: "object" }),
      groupByCol: req.query.groupByCol || null,
      viewMode: req.query.viewMode || "table",
    };

    const uploadIds = await assertUploadScope({
      uploadIds: getUploadIdsFromRequest(req),
      clientId: req.client_id,
    });

    if (uploadIds.length === 0) {
      return res.ok({
        rows: [],
        total: 0,
        page: pagination.page,
        limit: pagination.limit,
        message: "No upload selected. Please select a billing upload.",
      });
    }

    const data = await dashboardService.getDataExplorerData(filters, pagination, uploadIds);
    return res.ok(data);
  } catch (error) {
    if (error instanceof AppError) {
      return next(error);
    }
    logger.error({ err: error, requestId: req.requestId }, "DataExplorer Error");
    return next(new AppError(500, "INTERNAL", "Internal server error", { cause: error }));
  }
};

/**
 * Export Data Explorer to CSV.
 * Note: CSV response is intentionally file-stream style, not JSON envelope.
 */
export const exportDataExplorerCSV = async (req, res, next) => {
  try {
    const filters = {
      provider: req.query.provider || "All",
      service: req.query.service || "All",
      region: req.query.region || "All",
    };

    const pagination = {
      page: parsePositiveInt(req.query.page, 1, { min: 1 }),
      limit: parsePositiveInt(req.query.limit, 10000, { min: 1, max: 100000 }),
      sortBy: req.query.sortBy || null,
      sortOrder: req.query.sortOrder || "asc",
      search: req.query.search || "",
      columnFilters: parseJsonQueryParam(req.query.columnFilters, {}, { expect: "object" }),
      groupByCol: req.query.groupByCol || null,
      viewMode: req.query.viewMode || "table",
    };

    const selectedIndices = parseJsonQueryParam(req.query.selectedIndices, null, { expect: "array" });
    const visibleColumns = parseJsonQueryParam(req.query.visibleColumns, null, { expect: "array" });

    const uploadIds = await assertUploadScope({
      uploadIds: getUploadIdsFromRequest(req),
      clientId: req.client_id,
    });

    if (uploadIds.length === 0) {
      return next(new AppError(400, "VALIDATION_ERROR", "Invalid request"));
    }

    const csvData = await dashboardService.exportDataExplorerToCSV(
      filters,
      pagination,
      uploadIds,
      selectedIndices,
      visibleColumns
    );

    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="FinOps_Export_${new Date().toISOString().slice(0, 10)}.csv"`
    );

    return res.send(csvData);
  } catch (error) {
    if (error instanceof AppError) {
      return next(error);
    }
    logger.error({ err: error, requestId: req.requestId }, "CSV Export Error");
    return next(new AppError(500, "INTERNAL", "Internal server error", { cause: error }));
  }
};
