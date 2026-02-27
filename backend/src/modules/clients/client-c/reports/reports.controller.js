/**
 * Client-C Reports Controller
 */

import { clientCReportsService } from './reports.service.js';
import AppError from "../../../../errors/AppError.js";
import logger from "../../../../lib/logger.js";

function extractUploadIds(req) {
  const raw = req.query.uploadIds ?? req.query.uploadId ?? req.body?.uploadIds ?? req.body?.uploadId;
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.map(String);
  if (typeof raw === 'string') return raw.split(',').map(v => v.trim()).filter(Boolean);
  return [];
}

export const getSummary = async (req, res, next) => {
  try {
    const uploadIds = extractUploadIds(req);
    const { period, provider, service, region } = req.query;
    
    const data = await clientCReportsService.getDashboardSummary({
      filters: { provider, service, region },
      period,
      uploadIds
    });
    
    return res.ok(data);
  } catch (error) {
    logger.error({ err: error, requestId: req.requestId }, 'Client-C Reports Summary Error');
    return next(new AppError(500, "INTERNAL", "Internal server error", { cause: error }));
  }
};

export const getTopServices = async (req, res, next) => {
  try {
    const uploadIds = extractUploadIds(req);
    const { period, limit } = req.query;
    const data = await clientCReportsService.getTopServices({ period, limit: parseInt(limit), uploadIds });
    return res.ok(data);
  } catch (error) {
    logger.error({ err: error, requestId: req.requestId }, 'Client-C Top Services Error');
    return next(new AppError(500, "INTERNAL", "Internal server error", { cause: error }));
  }
};

export const getMonthlySpend = async (req, res, next) => {
  try {
    const uploadIds = extractUploadIds(req);
    const data = await clientCReportsService.getMonthlySpend({ uploadIds });
    return res.ok(data);
  } catch (error) {
    logger.error({ err: error, requestId: req.requestId }, 'Client-C Monthly Spend Error');
    return next(new AppError(500, "INTERNAL", "Internal server error", { cause: error }));
  }
};
