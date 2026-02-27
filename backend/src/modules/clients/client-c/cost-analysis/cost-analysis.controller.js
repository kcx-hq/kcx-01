/**
 * Client-C Cost Analysis Controller
 */

import { generateClientCCostAnalysis, getClientCFilterDropdowns } from './cost-analysis.service.js';
import AppError from "../../../../errors/AppError.js";
import logger from "../../../../lib/logger.js";

const ALLOWED_GROUPS = ['ServiceName', 'RegionName', 'ProviderName', 'Department'];

/**
 * Extract upload IDs from request
 */
function extractUploadIds(req) {
  const bodyValue = req.body?.uploadIds || req.body?.uploadId;
  const queryValue = req.query?.uploadIds || req.query?.uploadId;

  const source = bodyValue ?? queryValue;
  if (!source) return [];

  if (Array.isArray(source)) return source;

  if (typeof source === 'string') {
    return source
      .split(',')
      .map((id) => id.trim())
      .filter(Boolean);
  }

  return [source];
}

/**
 * GET /api/client-c/cost-analysis
 */
export const getCostAnalysis = async (req, res, next) => {
  try {
    const uploadIds = extractUploadIds(req);
    logger.info('📊 Cost Analysis Request - uploadIds:', uploadIds);

    const filters = {
      provider: req.body?.provider || req.query?.provider || 'All',
      service: req.body?.service || req.query?.service || 'All',
      region: req.body?.region || req.query?.region || 'All',
    };

    let groupBy = req.body?.groupBy || req.query?.groupBy || 'ServiceName';
    if (!ALLOWED_GROUPS.includes(groupBy)) {
      groupBy = 'ServiceName';
    }

    logger.info('🎯 Cost Analysis Filters:', { filters, groupBy, uploadIds });

    const data = await generateClientCCostAnalysis(
      {
        filters,
        uploadIds,
      },
      groupBy
    );

    logger.info('✅ Cost Analysis Generated:', {
      totalSpend: data?.kpis?.totalSpend,
      chartDataLength: data?.chartData?.length,
      breakdownLength: data?.breakdown?.length
    });

    return res.ok(data);
  } catch (error) {
    logger.error({ err: error, requestId: req.requestId }, 'Client-C Cost Analysis Error');
    return next(new AppError(500, "INTERNAL", "Internal server error", { cause: error }));
  }
};

/**
 * GET /api/client-c/cost-analysis/filters
 */
export const getFilterOptions = async (req, res, next) => {
  try {
    const data = await getClientCFilterDropdowns();
    return res.ok(data);
  } catch (error) {
    logger.error({ err: error, requestId: req.requestId }, 'Filter Error');
    return next(new AppError(500, "INTERNAL", "Internal server error", { cause: error }));
  }
};
