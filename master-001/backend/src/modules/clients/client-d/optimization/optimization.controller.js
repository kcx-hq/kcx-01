/**
 * Client-D Optimization Controller
 */
import { clientDOptimizationService } from './optimization.service.js';
import { extractUploadIds } from '../helpers/extractUploadId.js';





export const getClientDRecommendations = async (req, res) => {
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
      return res.json({
        success: true,
        data: {
          summary: {
            totalPotentialSavings: 0,
            recommendationCount: 0,
            highPriorityCount: 0,
            mediumPriorityCount: 0,
            lowPriorityCount: 0,
          },
          recommendations: [],
          byCategory: {},
        },
        message: 'No upload selected. Please select a billing upload.',
      });
    }

    const data = await clientDOptimizationService.getRecommendations({
      filters,
      period,
      uploadIds,
    });

    return res.json({ success: true, data });
  } catch (error) {
    console.error('ClientD getRecommendations Error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}

export const getClientDIdleResources = async (req, res) => {
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
      return res.json({
        success: true,
        data: { idleResources: [], summary: { totalIdleResources: 0, totalMonthlyCost: 0, totalPotentialSavings: 0, byType: {} } },
        message: 'No upload selected. Please select a billing upload.'
      });
    }

    const data = await clientDOptimizationService.getIdleResources({ filters, period, uploadIds });
    return res.json({ success: true, data });
  } catch (error) {
    console.error('ClientD getIdleResources Error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

export const getClientDRightSizing = async (req, res) => {
  try {
    const filters = {
      provider: req.query.provider || 'All',
      service: req.query.service || 'All',
      region: req.query.region || 'All'
    };

    const period = req.query.period || null;

    let uploadIds = extractUploadIds(req);

    if (uploadIds.length === 0) {
      return res.json({
        success: true,
        data: { recommendations: [], summary: { totalAnalyzed: 0, downsizeRecommendations: 0, appropriatelySized: 0, upsizeRecommendations: 0, totalPotentialSavings: 0 } },
        message: 'No upload selected. Please select a billing upload.'
      });
    }

    const data = await clientDOptimizationService.getRightSizingRecommendations({ filters, period, uploadIds });
    return res.json({ success: true, data });
  } catch (error) {
    console.error('ClientD getRightSizing Error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

export const getClientDCommitmentGaps = async (req, res) => {
  try {
    const filters = {
      provider: req.query.provider || 'All',
      service: req.query.service || 'All',
      region: req.query.region || 'All'
    };

    const period = req.query.period || null;

    let uploadIds = extractUploadIds(req);

    if (uploadIds.length === 0) {
      return res.json({
        success: true,
        data: { gaps: [], summary: { totalOnDemandSpend: 0, coveragePercent: 0, potentialSavings: 0, recommendedCommitmentSpend: 0 } },
        message: 'No upload selected. Please select a billing upload.'
      });
    }

    const data = await clientDOptimizationService.getCommitmentGapsPricingAware({ filters, period, uploadIds });
    return res.json({ success: true, data });
  } catch (error) {
    console.error('ClientD getCommitmentGaps Error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};
