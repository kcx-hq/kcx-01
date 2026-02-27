/**
 * Client-D Optimization Controller
 */
import { clientDOptimizationService } from './optimization.service.js';
import { extractUploadIds } from '../helpers/extractUploadId.js';
import AppError from "../../../../errors/AppError.js";
import logger from "../../../../lib/logger.js";





export const getClientDRecommendations = async (req, res, next) => {
  try {
    const filters = {
      provider: req.query.provider || 'All',
      service: req.query.service || 'All',
      region: req.query.region || 'All',
    };

    // keep same as core optimization default
    const period = req.query.period || 'last90days';

    const uploadIds = extractUploadIds(req);

    if (uploadIds.length === 0) {
      return res.ok({
        summary: {
          totalPotentialSavings: 0,
          recommendationCount: 0,
          highPriorityCount: 0,
          mediumPriorityCount: 0,
          lowPriorityCount: 0,
        },
        recommendations: [],
        byCategory: {},
      });
    }

    const data = await clientDOptimizationService.getRecommendations({
      filters,
      period,
      uploadIds,
    });

    return res.ok(data);
  } catch (error) {
    logger.error({ err: error, requestId: req.requestId }, 'ClientD getRecommendations Error');
    return next(new AppError(500, "INTERNAL", "Internal server error", { cause: error }));
  }
}

export const getClientDIdleResources = async (req, res, next) => {
  try {
    const filters = {
      provider: req.query.provider || 'All',
      service: req.query.service || 'All',
      region: req.query.region || 'All'
    };

    const period = req.query.period || null;

    let uploadIds = extractUploadIds(req);
    if (uploadIds.length === 0) uploadIds = await getUserUploadIds(req.user?.id);

    if (uploadIds.length === 0) {
      return res.ok({ idleResources: [], summary: { totalIdleResources: 0, totalMonthlyCost: 0, totalPotentialSavings: 0, byType: {} } });
    }

    const data = await clientDOptimizationService.getIdleResources({ filters, period, uploadIds });
    return res.ok(data);
  } catch (error) {
    logger.error({ err: error, requestId: req.requestId }, 'ClientD getIdleResources Error');
    return next(new AppError(500, "INTERNAL", "Internal server error", { cause: error }));
  }
};

export const getClientDRightSizing = async (req, res, next) => {
  try {
    const filters = {
      provider: req.query.provider || 'All',
      service: req.query.service || 'All',
      region: req.query.region || 'All'
    };

    const period = req.query.period || null;

    let uploadIds = extractUploadIds(req);

    if (uploadIds.length === 0) {
      return res.ok({ recommendations: [], summary: { totalAnalyzed: 0, downsizeRecommendations: 0, appropriatelySized: 0, upsizeRecommendations: 0, totalPotentialSavings: 0 } });
    }

    const data = await clientDOptimizationService.getRightSizingRecommendations({ filters, period, uploadIds });
    return res.ok(data);
  } catch (error) {
    logger.error({ err: error, requestId: req.requestId }, 'ClientD getRightSizing Error');
    return next(new AppError(500, "INTERNAL", "Internal server error", { cause: error }));
  }
};

export const getClientDCommitmentGaps = async (req, res, next) => {
  try {
    const filters = {
      provider: req.query.provider || 'All',
      service: req.query.service || 'All',
      region: req.query.region || 'All'
    };

    const period = req.query.period || null;

    let uploadIds = extractUploadIds(req);

    if (uploadIds.length === 0) {
      return res.ok({ gaps: [], summary: { totalOnDemandSpend: 0, coveragePercent: 0, potentialSavings: 0, recommendedCommitmentSpend: 0 } });
    }

    const data = await clientDOptimizationService.getCommitmentGapsPricingAware({ filters, period, uploadIds });
    return res.ok(data);
  } catch (error) {
    logger.error({ err: error, requestId: req.requestId }, 'ClientD getCommitmentGaps Error');
    return next(new AppError(500, "INTERNAL", "Internal server error", { cause: error }));
  }
};
