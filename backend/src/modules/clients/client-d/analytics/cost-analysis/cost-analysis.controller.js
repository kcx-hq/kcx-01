import { clientDCostAnalysisService } from './cost-analysis.service.js';
import { extractUploadIds} from '../../helpers/extractUploadId.js';
import AppError from "../../../../../errors/AppError.js";
import logger from "../../../../../lib/logger.js";

// Security whitelist (same as core)
const ALLOWED_GROUPS = ['ServiceName', 'RegionName', 'ProviderName'];



export const getClientDCostAnalysis = async (req, res, next) => {
  try {
    const uploadIds = extractUploadIds(req);

    const filters = {
      provider: req.body?.provider || req.query?.provider || 'All',
      service: req.body?.service || req.query?.service || 'All',
      region: req.body?.region || req.query?.region || 'All'
    };

    let groupBy = req.body?.groupBy || req.query?.groupBy || 'ServiceName';
    if (!ALLOWED_GROUPS.includes(groupBy)) groupBy = 'ServiceName';

    if (!uploadIds.length) {
      return res.ok({
        kpis: { totalSpend: 0, avgDaily: 0 },
        dailyTrends: [],
        monthlyTrends: [],
        breakdown: [],
        groupBy,
        message: 'No upload selected. Please select a billing upload to analyze cost.'
      });
    }

    const data = await clientDCostAnalysisService.getCostAnalysis({ filters, uploadIds }, groupBy);
    return res.ok(data);
  } catch (error) {
    logger.error({ err: error, requestId: req.requestId }, 'ClientD Cost Analysis Error');
    return next(new AppError(500, "INTERNAL", "Internal server error", { cause: error }));
  }
};
