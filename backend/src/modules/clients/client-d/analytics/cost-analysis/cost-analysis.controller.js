import { clientDCostAnalysisService } from './cost-analysis.service.js';
import { extractUploadIds} from '../../helpers/extractUploadId.js';

// Security whitelist (same as core)
const ALLOWED_GROUPS = ['ServiceName', 'RegionName', 'ProviderName'];



export const getClientDCostAnalysis = async (req, res) => {
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
      return res.json({
        success: true,
        data: {
          kpis: { totalSpend: 0, avgDaily: 0 },
          dailyTrends: [],
          monthlyTrends: [],
          breakdown: [],
          groupBy,
          message: 'No upload selected. Please select a billing upload to analyze cost.'
        }
      });
    }

    const data = await clientDCostAnalysisService.getCostAnalysis({ filters, uploadIds }, groupBy);
    return res.json({ success: true, data });
  } catch (error) {
    console.error('ClientD Cost Analysis Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to generate Client-D cost analysis',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
