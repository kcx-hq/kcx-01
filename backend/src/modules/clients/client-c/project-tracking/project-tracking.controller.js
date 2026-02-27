import { getProjectsOverview, getProjectBurnRate, compareProjectBudget } from './project-tracking.service.js';
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
    const filters = { provider: req.query.provider || 'All' };
    const data = await getProjectsOverview({ uploadIds, filters });
    return res.ok(data);
  } catch (error) {
    logger.error({ err: error, requestId: req.requestId }, 'Projects Overview Error');
    return next(new AppError(500, "INTERNAL", "Internal server error", { cause: error }));
  }
};

export const getBurnRate = async (req, res, next) => {
  try {
    const uploadIds = extractUploadIds(req);
    const project = req.query.project || 'All';
    const data = await getProjectBurnRate({ uploadIds, project });
    return res.ok(data);
  } catch (error) {
    logger.error({ err: error, requestId: req.requestId }, 'Burn Rate Error');
    return next(new AppError(500, "INTERNAL", "Internal server error", { cause: error }));
  }
};

export const compareBudget = async (req, res, next) => {
  try {
    const uploadIds = extractUploadIds(req);
    const project = req.query.project || req.body?.project;
    const budget = parseFloat(req.query.budget || req.body?.budget || 0);
    const data = await compareProjectBudget({ uploadIds, project, budget });
    return res.ok(data);
  } catch (error) {
    logger.error({ err: error, requestId: req.requestId }, 'Compare Budget Error');
    return next(new AppError(500, "INTERNAL", "Internal server error", { cause: error }));
  }
};
