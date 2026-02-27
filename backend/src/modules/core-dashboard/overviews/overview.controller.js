import { dashboardService } from './overview.service.js';
import AppError from "../../../errors/AppError.js";
import logger from "../../../lib/logger.js";
import { assertUploadScope } from "../utils/uploadScope.service.js";

/**
 * Helper: normalize uploadIds from request
 * Supports:
 *  - uploadid=uuid
 *  - uploadid[]=uuid1&uploadid[]=uuid2
 *  - uploadid="uuid1,uuid2"
 * Works for both query + body (same as cost-analysis approach)
 */
function normalizeUploadIds(uploadid) {
  if (!uploadid) return [];

  if (Array.isArray(uploadid)) return uploadid.filter(Boolean);

  if (typeof uploadid === 'string') {
    const s = uploadid.trim();
    if (!s) return [];
    return s.includes(',')
      ? s.split(',').map((id) => id.trim()).filter(Boolean)
      : [s];
  }

  return [];
}

/**
 * Helper: read uploadid from query OR body
 * Accepts:
 *  - req.query.uploadid / req.query.uploadId
 *  - req.body.uploadid / req.body.uploadId
 */
function getUploadIdsFromRequest(req) {
  // Prefer explicit uploadid/uploadId from query/body (same pattern everywhere)
  const fromQuery = req.query?.uploadId ?? req.query?.uploadIds;
  const fromBody = req.body?.uploadId ?? req.body?.uploadIds;

  // If query has it, prefer query (REST-friendly)
  const raw = fromQuery ?? fromBody;
  return normalizeUploadIds(raw);
}

export const getOverview = async (req, res, next) => {
  try {
    const parsedBudget = Number(req.query.budget || req.body?.budget || 0);
    const filters = {
      provider: req.query.provider || 'All',
      service: req.query.service || 'All',
      region: req.query.region || 'All',
      budget: Number.isFinite(parsedBudget) && parsedBudget > 0 ? parsedBudget : 0,
    };

    // ✅ same approach as cost-analysis: uploadid from request
    const uploadIds = await assertUploadScope({
      uploadIds: getUploadIdsFromRequest(req),
      clientId: req.client_id,
    });

    // If you want to force explicit selection like cost-analysis, keep this:
    if (uploadIds.length === 0) {
      return res.ok({
        kpis: {
          totalSpend: 0,
          avgDaily: 0,
          peakUsage: 0,
          peakDate: null,
          trend: 0,
          predictabilityScore: 100,
          forecastTotal: 0,
          atRiskSpend: 0
        },
        chartData: [],
        breakdown: [],
        message: 'No upload selected. Please select a billing upload.'
      });
    }

    const data = await dashboardService.getOverviewMetrics(filters, uploadIds);
    return res.ok(data);
  } catch (error) {
    if (error instanceof AppError) {
      return next(error);
    }
    logger.error({ err: error, requestId: req.requestId }, 'Overview Error');
    return next(new AppError(500, "INTERNAL", "Internal server error", { cause: error }));
  }
};

export const getAnomalies = async (req, res, next) => {
  try {
    const filters = {
      provider: req.query.provider || 'All',
      service: req.query.service || 'All',
      region: req.query.region || 'All'
    };

    // ✅ same approach as cost-analysis: uploadid from request
    const uploadIds = await assertUploadScope({
      uploadIds: getUploadIdsFromRequest(req),
      clientId: req.client_id,
    });

    if (uploadIds.length === 0) {
      return res.ok({
        anomalies: [],
        message: 'No upload selected. Please select a billing upload.'
      });
    }

    const data = await dashboardService.getAnomalies(filters, uploadIds);
    return res.ok(data);
  } catch (error) {
    if (error instanceof AppError) {
      return next(error);
    }
    logger.error({ err: error, requestId: req.requestId }, 'Anomaly Error');
    return next(new AppError(500, "INTERNAL", "Internal server error", { cause: error }));
  }
};

// keep getFilters and getDataExplorer as they were (only update uploadIds wiring)
export const getFilters = async (req, res, next) => {
  try {
     const uploadIds = await assertUploadScope({
      uploadIds: getUploadIdsFromRequest(req),
      clientId: req.client_id,
    });
     if (uploadIds.length === 0) {
      return res.ok({
        anomalies: [],
        message: 'No upload selected. Please select a billing upload.'
      });
    }
    const data = await dashboardService.getFilters(uploadIds);
    return res.ok(data);
  } catch (error) {
    if (error instanceof AppError) {
      return next(error);
    }
    return next(new AppError(500, "INTERNAL", "Internal server error"));
  }
};

export const getDataExplorer = async (req, res, next) => {
  try {
    const filters = {
      provider: req.query.provider || 'All',
      service: req.query.service || 'All',
      region: req.query.region || 'All'
    };

    const pagination = {
      page: parseInt(req.query.page, 10) || 1,
      limit: parseInt(req.query.limit, 10) || 100,
      sortBy: req.query.sortBy || null,
      sortOrder: req.query.sortOrder || 'asc',
      search: req.query.search || '',
      columnFilters: req.query.columnFilters ? JSON.parse(req.query.columnFilters) : {},
      groupByCol: req.query.groupByCol || null,
      viewMode: req.query.viewMode || 'table'
    };

    // ✅ same approach as cost-analysis: uploadid from request
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
        message: 'No upload selected. Please select a billing upload.'
      });
    }

    const data = await dashboardService.getDataExplorerData(filters, pagination, uploadIds);
    return res.ok(data);
  } catch (error) {
    if (error instanceof AppError) {
      return next(error);
    }
    logger.error({ err: error, requestId: req.requestId }, 'DataExplorer Error');
    return next(new AppError(500, "INTERNAL", "Internal server error", { cause: error }));
  }
};

/**
 * Export Data Explorer to CSV
 * All CSV generation logic is in backend - frontend just triggers download
 */
export const exportDataExplorerCSV = async (req, res, next) => {
  try {
    const filters = {
      provider: req.query.provider || 'All',
      service: req.query.service || 'All',
      region: req.query.region || 'All'
    };

    const pagination = {
      page: parseInt(req.query.page, 10) || 1,
      limit: parseInt(req.query.limit, 10) || 10000, // Export all data (large limit)
      sortBy: req.query.sortBy || null,
      sortOrder: req.query.sortOrder || 'asc',
      search: req.query.search || '',
      columnFilters: req.query.columnFilters ? JSON.parse(req.query.columnFilters) : {},
      groupByCol: req.query.groupByCol || null,
      viewMode: req.query.viewMode || 'table'
    };

    const selectedIndices = req.query.selectedIndices ? JSON.parse(req.query.selectedIndices) : null;
    const visibleColumns = req.query.visibleColumns ? JSON.parse(req.query.visibleColumns) : null;

    // ✅ same approach as cost-analysis: uploadid from request
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

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="FinOps_Export_${new Date().toISOString().slice(0, 10)}.csv"`
    );

    res.send(csvData);
  } catch (error) {
    if (error instanceof AppError) {
      return next(error);
    }
    logger.error('CSV Export Error:', error);
    return next(new AppError(500, "INTERNAL", "Internal server error"));
  }
};

export const getCostAnalysis = async (req, res, next) => {
  try {
    const filters = {
      provider: req.query.provider || 'All',
      service: req.query.service || 'All',
      region: req.query.region || 'All'
    };

    const groupBy = req.query.groupBy || 'ServiceName';

    // ✅ same approach as cost-analysis: uploadid from request
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
          predictabilityScore: 100,
          forecastTotal: 0,
          atRiskSpend: 0
        },
        chartData: [],
        predictabilityChartData: [],
        anomalies: [],
        activeKeys: [],
        drivers: [],
        riskData: [],
        breakdown: [],
        message: 'No upload selected. Please select a billing upload to analyze cost.'
      });
    }

    // Pass uploadIds along (dashboardService should forward to cost analysis service/repo filters)
    const data = await dashboardService.getCostAnalysisData(filters, groupBy, uploadIds);
    return res.ok(data);
  } catch (error) {
    if (error instanceof AppError) {
      return next(error);
    }
    logger.error({ err: error, requestId: req.requestId }, 'CostAnalysis Error');
    return next(new AppError(500, "INTERNAL", "Internal server error", { cause: error }));
  }
};
