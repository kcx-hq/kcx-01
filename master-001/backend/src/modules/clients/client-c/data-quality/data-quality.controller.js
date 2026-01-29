/**
 * Client-C Data Quality Controller
 */

import { clientCDataQualityService } from './data-quality.service.js';

function extractUploadIds(req) {
  const raw = req.query.uploadIds ?? req.query.uploadId ?? req.body?.uploadIds ?? req.body?.uploadId;
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.map(String);
  if (typeof raw === 'string') return raw.split(',').map(v => v.trim()).filter(Boolean);
  return [];
}

export const analyzeDataQuality = async (req, res) => {
  try {
    const uploadIds = extractUploadIds(req);
    const { provider, service, region, startDate, endDate } = req.query;

    const options = {
      filters: { provider, service, region },
      startDate,
      endDate,
      uploadIds
    };

    const data = await clientCDataQualityService.analyzeDataQuality(options);
    res.json({ success: true, data });
  } catch (error) {
    console.error('Client-C Data Quality Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};
