import { getDepartmentOverview, getDepartmentTrend, getDepartmentDrilldown } from './department-cost.service.js';
import AppError from "../../../../errors/AppError.js";
import logger from "../../../../lib/logger.js";

function extractUploadIds(req) {
  const raw = req.query.uploadIds ?? req.query.uploadId ?? req.body?.uploadIds;
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.filter(Boolean);
  if (typeof raw === 'string') return raw.split(',').map(v => v.trim()).filter(Boolean);
  return [];
}

export const getOverview = async (req, res, next) => {
  try {
    const uploadIds = extractUploadIds(req);
    const filters = {
      provider: req.query.provider || 'All',
      service: req.query.service || 'All',
    };
    const data = await getDepartmentOverview({ filters, uploadIds });
    return res.ok(data);
  } catch (error) {
    logger.error({ err: error, requestId: req.requestId }, 'Department Overview Error');
    return next(new AppError(500, "INTERNAL", "Internal server error", { cause: error }));
  }
};

export const getTrend = async (req, res, next) => {
  try {
    const uploadIds = extractUploadIds(req);
    const department = req.query.department || 'All';
    const data = await getDepartmentTrend({ uploadIds, department });
    return res.ok(data);
  } catch (error) {
    logger.error({ err: error, requestId: req.requestId }, 'Department Trend Error');
    return next(new AppError(500, "INTERNAL", "Internal server error", { cause: error }));
  }
};

export const getDrilldown = async (req, res, next) => {
  try {
    const uploadIds = extractUploadIds(req);
    const department = req.query.department || 'All';
    const data = await getDepartmentDrilldown({ uploadIds, department });
    return res.ok(data);
  } catch (error) {
    logger.error({ err: error, requestId: req.requestId }, 'Department Drilldown Error');
    return next(new AppError(500, "INTERNAL", "Internal server error", { cause: error }));
  }
};
