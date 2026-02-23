import {
  exportClientJDataExplorerCsv,
  getClientJAllocationChargeback,
  getClientJCommitmentsRates,
  getClientJDataExplorer,
  getClientJExecutiveOverview,
  getClientJFilters,
  getClientJForecastingBudgets,
  getClientJGovernanceDataHealth,
  getClientJOptimizationResources,
  getClientJReports,
  getClientJSpendIntelligence,
  getClientJUnitEconomics,
} from "./services/index.js";
import {
  getCommonFilters,
  getDateRangeFromRequest,
  getNumericParam,
  getPagination,
  getUploadIdsFromRequest,
  parseJsonParam,
} from "../helpers/request.js";

function getBaseParams(req) {
  const { startDate, endDate } = getDateRangeFromRequest(req);
  return {
    clientId: req.client_id,
    requestedUploadIds: getUploadIdsFromRequest(req),
    filters: getCommonFilters(req),
    startDate,
    endDate,
  };
}

function errorResponse(res, error, message) {
  console.error(message, error);
  return res.status(500).json({
    success: false,
    error: error?.message || "Unexpected error",
    message,
  });
}

export const getHealth = async (_req, res) => {
  return res.json({
    success: true,
    message: "Client-J dashboard API is available",
    version: "1.0.0",
  });
};

export const getFilters = async (req, res) => {
  try {
    const params = {
      clientId: req.client_id,
      requestedUploadIds: getUploadIdsFromRequest(req),
    };
    const data = await getClientJFilters(params);
    return res.json({ success: true, data });
  } catch (error) {
    return errorResponse(res, error, "Failed to load Client-J filters");
  }
};

export const getExecutiveOverview = async (req, res) => {
  try {
    const data = await getClientJExecutiveOverview({
      ...getBaseParams(req),
      budget: getNumericParam(req, "budget", 0),
    });
    return res.json({ success: true, data });
  } catch (error) {
    return errorResponse(res, error, "Failed to load executive overview");
  }
};

export const getDataExplorer = async (req, res) => {
  try {
    const pagination = getPagination(req, { page: 1, limit: 50, maxLimit: 500 });
    const data = await getClientJDataExplorer({
      ...getBaseParams(req),
      ...pagination,
      groupBy: req.query.groupBy || "service",
      search: req.query.search || "",
      columnFilters: parseJsonParam(req.query.columnFilters, {}),
      selectedRowIds: parseJsonParam(req.query.selectedRowIds, []),
    });

    return res.json({ success: true, data });
  } catch (error) {
    return errorResponse(res, error, "Failed to load data explorer");
  }
};

export const exportDataExplorerCsv = async (req, res) => {
  try {
    const csv = await exportClientJDataExplorerCsv({
      ...getBaseParams(req),
      search: req.query.search || "",
      columnFilters: parseJsonParam(req.query.columnFilters, {}),
      visibleColumns: parseJsonParam(req.query.visibleColumns, []),
      selectedRowIds: parseJsonParam(req.query.selectedRowIds, []),
    });

    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="client-j-data-explorer-${new Date().toISOString().slice(0, 10)}.csv"`
    );

    return res.send(csv);
  } catch (error) {
    return errorResponse(res, error, "Failed to export data explorer CSV");
  }
};

export const getSpendIntelligence = async (req, res) => {
  try {
    const data = await getClientJSpendIntelligence(getBaseParams(req));
    return res.json({ success: true, data });
  } catch (error) {
    return errorResponse(res, error, "Failed to load spend intelligence");
  }
};

export const getAllocationChargeback = async (req, res) => {
  try {
    const pagination = getPagination(req, { page: 1, limit: 50, maxLimit: 500 });
    const data = await getClientJAllocationChargeback({
      ...getBaseParams(req),
      page: pagination.page,
      limit: pagination.limit,
    });
    return res.json({ success: true, data });
  } catch (error) {
    return errorResponse(res, error, "Failed to load allocation and chargeback");
  }
};

export const getOptimizationResources = async (req, res) => {
  try {
    const data = await getClientJOptimizationResources(getBaseParams(req));
    return res.json({ success: true, data });
  } catch (error) {
    return errorResponse(res, error, "Failed to load optimization and resources");
  }
};

export const getCommitmentsRates = async (req, res) => {
  try {
    const data = await getClientJCommitmentsRates(getBaseParams(req));
    return res.json({ success: true, data });
  } catch (error) {
    return errorResponse(res, error, "Failed to load commitments and rates");
  }
};

export const getForecastingBudgets = async (req, res) => {
  try {
    const scenarioMultipliers = parseJsonParam(req.query.scenarioMultipliers, {});
    const data = await getClientJForecastingBudgets({
      ...getBaseParams(req),
      budget: getNumericParam(req, "budget", 0),
      scenarioMultipliers,
    });
    return res.json({ success: true, data });
  } catch (error) {
    return errorResponse(res, error, "Failed to load forecasting and budgets");
  }
};

export const getUnitEconomics = async (req, res) => {
  try {
    const data = await getClientJUnitEconomics({
      ...getBaseParams(req),
      unitKey: req.query.unitKey || "requests",
      targetUnitCost: getNumericParam(req, "targetUnitCost", 0),
      revenue: getNumericParam(req, "revenue", 0),
    });
    return res.json({ success: true, data });
  } catch (error) {
    return errorResponse(res, error, "Failed to load unit economics");
  }
};

export const getGovernanceDataHealth = async (req, res) => {
  try {
    const data = await getClientJGovernanceDataHealth({
      ...getBaseParams(req),
      freshnessSlaHours: getNumericParam(req, "freshnessSlaHours", 24),
    });
    return res.json({ success: true, data });
  } catch (error) {
    return errorResponse(res, error, "Failed to load governance and data health");
  }
};

export const getReports = async (req, res) => {
  try {
    const data = await getClientJReports(getBaseParams(req));
    return res.json({ success: true, data });
  } catch (error) {
    return errorResponse(res, error, "Failed to load reports");
  }
};
