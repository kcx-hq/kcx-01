import { getOverview , clientDDataExplorerService} from './overview.service.js';
import { extractUploadIds} from '../helpers/extractUploadId.js';

/**
 * Same normalize helpers (copied from core controller)
 */

/**
 * Client-D Overview
 * Returns ONLY:
 * - kpis: totalSpend, avgDaily, trend
 * - chartData (kept, useful for trends)
 * - serviceBreakdown (NO region breakdown)
 */
export const getClientDOverview = async (req, res) => {
  try {
    const filters = {
      provider: req.query.provider || 'All',
      service: req.query.service || 'All',
      region: req.query.region || 'All'
    };

    const uploadIds = extractUploadIds(req);

    if (uploadIds.length === 0) {
      return res.json({
        success: true,
        data: {
          kpis: {
            totalSpend: 0,
            avgDaily: 0,
            trend: 0
          },
          chartData: [],
          serviceBreakdown: [],
          message: 'No upload selected. Please select a billing upload.'
        }
      });
    }

    const data = await getOverview(filters, uploadIds);
    return res.json({ success: true, data });
  } catch (error) {
    console.error('ClientD Overview Error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};







/** ---------- Client-D: Data Explorer ---------- */
export const getClientDDataExplorer = async (req, res) => {
  try {
    const filters = {
      provider: req.query.provider || 'All',
      service: req.query.service || 'All',
      region: req.query.region || 'All'
    };

    // ✅ Client-D supports pagination + search + column filters
    // ❌ Client-D does NOT support grouped view
    const pagination = {
      page: parseInt(req.query.page, 10) || 1,
      limit: parseInt(req.query.limit, 10) || 100,
      sortBy: req.query.sortBy || null,
      sortOrder: req.query.sortOrder || 'asc',
      search: req.query.search || '',
      columnFilters: req.query.columnFilters ? JSON.parse(req.query.columnFilters) : {},

      // Force table view; ignore grouping params
      groupByCol: null,
      viewMode: 'table'
    };

    const uploadIds = extractUploadIds(req);

    if (uploadIds.length === 0) {
      return res.json({
        success: true,
        data: {
          rows: [],
          total: 0,
          page: pagination.page,
          limit: pagination.limit,
          message: 'No upload selected. Please select a billing upload.'
        }
      });
    }

    const data = await clientDDataExplorerService.getDataExplorer(filters, pagination, uploadIds);
    return res.json({ success: true, data });
  } catch (error) {
    console.error('ClientD DataExplorer Error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

/** ---------- Client-D: CSV Export ---------- */
export const exportClientDDataExplorerCSV = async (req, res) => {
  try {
    const filters = {
      provider: req.query.provider || 'All',
      service: req.query.service || 'All',
      region: req.query.region || 'All'
    };

    const pagination = {
      page: parseInt(req.query.page, 10) || 1,
      limit: parseInt(req.query.limit, 10) || 10000,
      sortBy: req.query.sortBy || null,
      sortOrder: req.query.sortOrder || 'asc',
      search: req.query.search || '',
      columnFilters: req.query.columnFilters ? JSON.parse(req.query.columnFilters) : {},

      // Force table view; ignore grouping params
      groupByCol: null,
      viewMode: 'table'
    };

    const selectedIndices = req.query.selectedIndices ? JSON.parse(req.query.selectedIndices) : null;
    const visibleColumns = req.query.visibleColumns ? JSON.parse(req.query.visibleColumns) : null;

    const uploadIds = extractUploadIds(req);

    if (uploadIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'uploadIds is required',
        message: 'No upload selected. Please select a billing upload to export.'
      });
    }

    const csvData = await clientDDataExplorerService.exportCSV(
      filters,
      pagination,
      uploadIds,
      selectedIndices,
      visibleColumns
    );

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="ClientD_FinOps_Export_${new Date().toISOString().slice(0, 10)}.csv"`
    );

    return res.send(csvData);
  } catch (error) {
    console.error('ClientD CSV Export Error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

