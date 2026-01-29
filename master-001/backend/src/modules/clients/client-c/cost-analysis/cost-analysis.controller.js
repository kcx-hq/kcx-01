/**
 * Client-C Cost Analysis Controller
 */

import { generateClientCCostAnalysis, getClientCFilterDropdowns } from './cost-analysis.service.js';

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
export const getCostAnalysis = async (req, res) => {
  try {
    const uploadIds = extractUploadIds(req);
    console.log('📊 Cost Analysis Request - uploadIds:', uploadIds);

    const filters = {
      provider: req.body?.provider || req.query?.provider || 'All',
      service: req.body?.service || req.query?.service || 'All',
      region: req.body?.region || req.query?.region || 'All',
    };

    let groupBy = req.body?.groupBy || req.query?.groupBy || 'ServiceName';
    if (!ALLOWED_GROUPS.includes(groupBy)) {
      groupBy = 'ServiceName';
    }

    console.log('🎯 Cost Analysis Filters:', { filters, groupBy, uploadIds });

    const data = await generateClientCCostAnalysis(
      {
        filters,
        uploadIds,
      },
      groupBy
    );

    console.log('✅ Cost Analysis Generated:', {
      totalSpend: data?.kpis?.totalSpend,
      chartDataLength: data?.chartData?.length,
      breakdownLength: data?.breakdown?.length
    });

    res.json({ success: true, data });
  } catch (error) {
    console.error('Client-C Cost Analysis Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate cost analysis',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * GET /api/client-c/cost-analysis/filters
 */
export const getFilterOptions = async (req, res) => {
  try {
    const data = await getClientCFilterDropdowns();
    res.json({ success: true, data });
  } catch (error) {
    console.error('Filter Error:', error);
    res.status(500).json({ success: false, error: 'Failed to load filters' });
  }
};
