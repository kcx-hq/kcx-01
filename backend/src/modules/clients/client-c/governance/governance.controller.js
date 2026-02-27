/**
 * Client-C Governance Controller
 */

import { clientCGovernanceService } from './governance.service.js';
import AppError from "../../../../errors/AppError.js";
import logger from "../../../../lib/logger.js";

function extractUploadIds(req) {
  const raw = req.query.uploadid ?? req.query.uploadId ?? req.query.uploadIds ?? req.body?.uploadId ?? req.body?.uploadIds;
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.filter(Boolean);
  if (typeof raw === 'string') return raw.split(',').map(v => v.trim()).filter(Boolean);
  return [];
}

export const getSummary = async (req, res, next) => {
  try {
    const filters = {
      provider: req.query.provider || 'All',
      service: req.query.service || 'All',
      region: req.query.region || 'All'
    };
    const period = req.query.period || 'month';
    const uploadIds = extractUploadIds(req);

    if (uploadIds.length === 0) {
      return res.ok({ summary: null });
    }

    const data = await clientCGovernanceService.getGovernanceSummary({ filters, period, uploadIds });
    return res.ok(data);
  } catch (error) {
    logger.error({ err: error, requestId: req.requestId }, 'Error in getSummary');
    return next(new AppError(500, "INTERNAL", "Internal server error", { cause: error }));
  }
};

export const getCompliance = async (req, res, next) => {
  try {
    const filters = {
      provider: req.query.provider || 'All',
      service: req.query.service || 'All',
      region: req.query.region || 'All'
    };
    const uploadIds = extractUploadIds(req);

    if (uploadIds.length === 0) {
      return res.ok({ overall: { taggedCost: 0, untaggedCost: 0, taggedPercent: 0 }, byDepartment: [] });
    }

    const data = await clientCGovernanceService.getTagCompliance({ filters, uploadIds });
    return res.ok(data);
  } catch (error) {
    logger.error({ err: error, requestId: req.requestId }, 'Error in getCompliance');
    return next(new AppError(500, "INTERNAL", "Internal server error", { cause: error }));
  }
};

export const getAccounts = async (req, res, next) => {
  try {
    const filters = {
      provider: req.query.provider || 'All',
      service: req.query.service || 'All',
      region: req.query.region || 'All',
      ownershipStatus: req.query.ownershipStatus || 'All'
    };
    const uploadIds = extractUploadIds(req);

    if (uploadIds.length === 0) {
      return res.ok([]);
    }

    const data = await clientCGovernanceService.getAccountsWithOwnership({ filters, uploadIds });
    return res.ok(data);
  } catch (error) {
    logger.error({ err: error, requestId: req.requestId }, 'Error in getAccounts');
    return next(new AppError(500, "INTERNAL", "Internal server error", { cause: error }));
  }
};

export const updateAccountOwner = async (req, res, next) => {
  try {
    const { accountId } = req.params;
    const owner = (req.body?.owner || '').trim();
    const uploadIds = extractUploadIds(req);

    if (!owner || uploadIds.length === 0) {
      return next(new AppError(400, "VALIDATION_ERROR", "Invalid request"));
    }

    const data = await clientCGovernanceService.updateAccountOwner(accountId, owner, uploadIds);
    return res.ok(data);
  } catch (error) {
    logger.error({ err: error, requestId: req.requestId }, 'Error in updateAccountOwner');
    return next(new AppError(500, "INTERNAL", "Internal server error", { cause: error }));
  }
};
