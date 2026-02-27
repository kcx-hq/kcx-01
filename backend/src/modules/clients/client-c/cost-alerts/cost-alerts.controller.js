import { getActiveAlerts, getDepartmentBudgetStatus, createAlertRule } from './cost-alerts.service.js';
import AppError from "../../../../errors/AppError.js";
import logger from "../../../../lib/logger.js";

function extractUploadIds(req) {
  const raw = req.query.uploadIds ?? req.query.uploadId ?? req.body?.uploadIds;
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.filter(Boolean);
  if (typeof raw === 'string') return raw.split(',').map(v => v.trim()).filter(Boolean);
  return [];
}

export const getAlerts = async (req, res, next) => {
  try {
    const uploadIds = extractUploadIds(req);
    const thresholds = req.body?.thresholds || req.query.thresholds ? JSON.parse(req.query.thresholds) : {};
    const data = await getActiveAlerts({ uploadIds, thresholds });
    return res.ok(data);
  } catch (error) {
    logger.error({ err: error, requestId: req.requestId }, 'Alerts Error');
    return next(new AppError(500, "INTERNAL", "Internal server error", { cause: error }));
  }
};

export const getBudgetStatus = async (req, res, next) => {
  try {
    const uploadIds = extractUploadIds(req);
    const budgets = req.body?.budgets || req.query.budgets ? JSON.parse(req.query.budgets) : {};
    const data = await getDepartmentBudgetStatus({ uploadIds, budgets });
    return res.ok(data);
  } catch (error) {
    logger.error({ err: error, requestId: req.requestId }, 'Budget Status Error');
    return next(new AppError(500, "INTERNAL", "Internal server error", { cause: error }));
  }
};

export const createRule = async (req, res, next) => {
  try {
    const { department, threshold, type } = req.body || {};
    
    if (!department || !threshold || !type) {
      return next(new AppError(400, "VALIDATION_ERROR", "Invalid request"));
    }

    const data = await createAlertRule({ department, threshold, type });
    return res.ok(data);
  } catch (error) {
    logger.error({ err: error, requestId: req.requestId }, 'Create Rule Error');
    return next(new AppError(500, "INTERNAL", "Internal server error", { cause: error }));
  }
};
