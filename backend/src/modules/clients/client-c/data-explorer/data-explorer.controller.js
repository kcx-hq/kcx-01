/**
 * Client-C Data Explorer Controller
 * Extended version with department features
 */

import { clientCDataExplorerService } from './data-explorer.service.js';
import AppError from "../../../../errors/AppError.js";
import logger from "../../../../lib/logger.js";

/**
 * Helper: normalize uploadIds from request
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
 */
function getUploadIdsFromRequest(req) {
  const fromQuery = req.query?.uploadId ?? req.query?.uploadIds;
  const fromBody = req.body?.uploadId ?? req.body?.uploadIds;
  const raw = fromQuery ?? fromBody;
  return normalizeUploadIds(raw);
}


/**
 * GET /api/client-c/data-explorer
 */
export const getDataExplorer = async (req, res, next) => {
  try {
    const filters = {
      provider: req.query.provider || 'All',
      service: req.query.service || 'All',
      region: req.query.region || 'All',
      department: req.query.department || 'All'
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

    const uploadIds = getUploadIdsFromRequest(req);

    if (uploadIds.length === 0) {
      return res.ok({
        data: [],
        total: 0,
        page: pagination.page,
        limit: pagination.limit,
        allColumns: [],
        summaryData: {},
        columnMaxValues: {},
        departmentBreakdown: [],
        availableDepartments: ['All'],
        message: 'No upload selected.'
      });
    }

    const result = await clientCDataExplorerService.getDataExplorerData(filters, pagination, uploadIds);
    
    // Format the response to match frontend expectations
    const formattedResult = {
      data: result.data || [],
      total: result.total || result.totalCount || 0,
      page: pagination.page,
      limit: pagination.limit,
      allColumns: result.allColumns || [],
      summaryData: result.summaryData || {},
      columnMaxValues: result.columnMaxValues || {},
      departmentBreakdown: result.departmentBreakdown || [],
      availableDepartments: result.availableDepartments || ['All'],
      quickStats: result.quickStats || {}
    };
    
    return res.ok(formattedResult);
  } catch (error) {
    logger.error({ err: error, requestId: req.requestId }, 'DataExplorer Error');
    return next(new AppError(500, "INTERNAL", "Internal server error", { cause: error }));
  }
};

/**
 * GET /api/client-c/data-explorer/export-csv
 */
export const exportDataExplorerCSV = async (req, res, next) => {
  try {
    const filters = {
      provider: req.query.provider || 'All',
      service: req.query.service || 'All',
      region: req.query.region || 'All',
      department: req.query.department || 'All'
    };

    const pagination = {
      page: parseInt(req.query.page, 10) || 1,
      limit: parseInt(req.query.limit, 10) || 10000,
      sortBy: req.query.sortBy || null,
      sortOrder: req.query.sortOrder || 'asc',
      search: req.query.search || '',
      columnFilters: req.query.columnFilters ? JSON.parse(req.query.columnFilters) : {},
      groupByCol: req.query.groupByCol || null,
      viewMode: req.query.viewMode || 'table'
    };

    const selectedIndices = req.query.selectedIndices ? JSON.parse(req.query.selectedIndices) : null;
    const visibleColumns = req.query.visibleColumns ? JSON.parse(req.query.visibleColumns) : null;

    const uploadIds = getUploadIdsFromRequest(req);

    if (uploadIds.length === 0) {
      return next(new AppError(400, "VALIDATION_ERROR", "Invalid request"));
    }

    const csvData = await clientCDataExplorerService.exportDataExplorerToCSV(
      filters,
      pagination,
      uploadIds,
      selectedIndices,
      visibleColumns
    );

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="ClientC_DataExplorer_Export_${new Date().toISOString().slice(0, 10)}.csv"`
    );

    res.send(csvData);
  } catch (error) {
    logger.error({ err: error, requestId: req.requestId }, 'CSV Export Error');
    return next(new AppError(500, "INTERNAL", "Internal server error", { cause: error }));
  }
};

/**
 * GET /api/client-c/data-explorer/departments
 */
export const getAvailableDepartments = async (req, res, next) => {
  try {
    const filters = {
      provider: req.query.provider || 'All',
      service: req.query.service || 'All',
      region: req.query.region || 'All'
    };

    const uploadIds = getUploadIdsFromRequest(req);

    if (uploadIds.length === 0) {
      return res.ok(['All']);
    }

    const departments = await clientCDataExplorerService.getAvailableDepartments(filters, uploadIds);
    return res.ok(departments);
  } catch (error) {
    logger.error({ err: error, requestId: req.requestId }, 'Departments Error');
    return next(new AppError(500, "INTERNAL", "Internal server error", { cause: error }));
  }
};
