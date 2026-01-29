/**
 * Client-D Quality Controller
 * Reduced/Modified Data Quality API
 */

import { clientDDataQualityService } from './data-quality.service.js';
import { extractUploadIds } from '../../helpers/extractUploadId.js';



/**
 * GET /api/client-d/quality/analysis
 */
export const getClientDQualityAnalysis = async (req, res) => {
  try {
    const filters = {
      provider: req.query.provider || req.body?.provider || 'All',
      service: req.query.service || req.body?.service || 'All',
      region: req.query.region || req.body?.region || 'All'
    };

    const startDate = req.query.startDate || req.body?.startDate || null;
    const endDate = req.query.endDate || req.body?.endDate || null;

    const uploadIds = extractUploadIds(req);

    const data = await clientDDataQualityService.analyzeDataQuality({
      filters,
      startDate,
      endDate,
      uploadIds
    });

    return res.json({ success: true, data });
  } catch (error) {
    console.error('Client-D getQualityAnalysis Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to analyze Client-D data quality',
      message: error.message
    });
  }
};
