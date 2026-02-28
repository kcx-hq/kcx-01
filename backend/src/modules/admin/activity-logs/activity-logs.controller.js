import { getFilters, listAdminLogs } from "./activity-logs.service.js";
import AppError from "../../../errors/AppError.js";
import logger from "../../../lib/logger.js";

export const getAdminActivityLogs = async (req, res, next) => {
  try {
    const result = await listAdminLogs(req.query);
    return res.ok(result);
  } catch (error) {
    logger.error({ err: error, requestId: req.requestId }, "getAdminActivityLogs failed");
    return next(new AppError(500, "INTERNAL", "Internal server error", { cause: error }));
  }
};

export const getAdminActivityFilters = async (req, res, next) => {
  try {
    const result = await getFilters();
    return res.ok(result);
  } catch (error) {
    logger.error({ err: error, requestId: req.requestId }, "getAdminActivityFilters failed");
    return next(new AppError(500, "INTERNAL", "Internal server error", { cause: error }));
  }
};
