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
import AppError from "../../../../errors/AppError.js";
import logger from "../../../../lib/logger.js";

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

function forwardControllerError(req, next, error, message) {
  logger.error({ err: error, requestId: req.requestId }, message);
  return next(new AppError(500, "INTERNAL", "Internal server error", { cause: error }));
}

export const getHealth = async (_req, res) => {
  return res.ok({
    message: "Client-J dashboard API is available",
    version: "1.0.0",
  });
};

export const getFilters = async (req, res, next) => {
  try {
    const params = {
      clientId: req.client_id,
      requestedUploadIds: getUploadIdsFromRequest(req),
    };
    const data = await getClientJFilters(params);
    return res.ok(data);
  } catch (error) {
    return forwardControllerError(req, next, error, "Failed to load Client-J filters");
  }
};

export const getExecutiveOverview = async (req, res, next) => {
  try {
    const data = await getClientJExecutiveOverview({
      ...getBaseParams(req),
      budget: getNumericParam(req, "budget", 0),
    });
    return res.ok(data);
  } catch (error) {
    return forwardControllerError(req, next, error, "Failed to load executive overview");
  }
};

export const getDataExplorer = async (req, res, next) => {
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

    return res.ok(data);
  } catch (error) {
    return forwardControllerError(req, next, error, "Failed to load data explorer");
  }
};

export const exportDataExplorerCsv = async (req, res, next) => {
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
    return forwardControllerError(req, next, error, "Failed to export data explorer CSV");
  }
};

export const getSpendIntelligence = async (req, res, next) => {
  try {
    const data = await getClientJSpendIntelligence(getBaseParams(req));
    return res.ok(data);
  } catch (error) {
    return forwardControllerError(req, next, error, "Failed to load spend intelligence");
  }
};

export const getAllocationChargeback = async (req, res, next) => {
  try {
    const pagination = getPagination(req, { page: 1, limit: 50, maxLimit: 500 });
    const data = await getClientJAllocationChargeback({
      ...getBaseParams(req),
      page: pagination.page,
      limit: pagination.limit,
    });
    return res.ok(data);
  } catch (error) {
    return forwardControllerError(req, next, error, "Failed to load allocation and chargeback");
  }
};

export const getOptimizationResources = async (req, res, next) => {
  try {
    const data = await getClientJOptimizationResources(getBaseParams(req));
    return res.ok(data);
  } catch (error) {
    return forwardControllerError(req, next, error, "Failed to load optimization and resources");
  }
};

export const getCommitmentsRates = async (req, res, next) => {
  try {
    const data = await getClientJCommitmentsRates(getBaseParams(req));
    return res.ok(data);
  } catch (error) {
    return forwardControllerError(req, next, error, "Failed to load commitments and rates");
  }
};

export const getForecastingBudgets = async (req, res, next) => {
  try {
    const scenarioMultipliers = parseJsonParam(req.query.scenarioMultipliers, {});
    const data = await getClientJForecastingBudgets({
      ...getBaseParams(req),
      budget: getNumericParam(req, "budget", 0),
      scenarioMultipliers,
    });
    return res.ok(data);
  } catch (error) {
    return forwardControllerError(req, next, error, "Failed to load forecasting and budgets");
  }
};

export const getUnitEconomics = async (req, res, next) => {
  try {
    const data = await getClientJUnitEconomics({
      ...getBaseParams(req),
      unitKey: req.query.unitKey || "requests",
      targetUnitCost: getNumericParam(req, "targetUnitCost", 0),
      revenue: getNumericParam(req, "revenue", 0),
    });
    return res.ok(data);
  } catch (error) {
    return forwardControllerError(req, next, error, "Failed to load unit economics");
  }
};

export const getGovernanceDataHealth = async (req, res, next) => {
  try {
    const data = await getClientJGovernanceDataHealth({
      ...getBaseParams(req),
      freshnessSlaHours: getNumericParam(req, "freshnessSlaHours", 24),
    });
    return res.ok(data);
  } catch (error) {
    return forwardControllerError(req, next, error, "Failed to load governance and data health");
  }
};

export const getReports = async (req, res, next) => {
  try {
    const data = await getClientJReports(getBaseParams(req));
    return res.ok(data);
  } catch (error) {
    return forwardControllerError(req, next, error, "Failed to load reports");
  }
};
