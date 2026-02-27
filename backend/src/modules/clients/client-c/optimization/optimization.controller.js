/**
 * Client-C Optimization Controller
 */

import { clientCOptimizationService } from './optimization.service.js';
import AppError from "../../../../errors/AppError.js";
import logger from "../../../../lib/logger.js";

function extractUploadIds(req) {
  const raw = req.query.uploadIds ?? req.query.uploadId ?? req.body?.uploadIds ?? req.body?.uploadId;
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.map(String);
  if (typeof raw === 'string') return raw.split(',').map(v => v.trim()).filter(Boolean);
  return [];
}

export const getRecommendations = async (req, res, next) => {
  try {
    const uploadIds = extractUploadIds(req);
    const data = await clientCOptimizationService.getRecommendations({ ...req.query, uploadIds });
    return res.ok(data);
  } catch (error) {
    logger.error({ err: error, requestId: req.requestId }, 'Client-C Optimization Error');
    return next(new AppError(500, "INTERNAL", "Internal server error", { cause: error }));
  }
};

export const getOpportunities = async (req, res, next) => {
  try {
    const uploadIds = extractUploadIds(req);
    const data = await clientCOptimizationService.getOpportunities({ ...req.query, uploadIds });
    return res.ok(data);
  } catch (error) {
    logger.error({ err: error, requestId: req.requestId }, 'Client-C Opportunities Error');
    return next(new AppError(500, "INTERNAL", "Internal server error", { cause: error }));
  }
};
