/**
 * Client-C Optimization Controller
 */

import { clientCOptimizationService } from './optimization.service.js';

function extractUploadIds(req) {
  const raw = req.query.uploadIds ?? req.query.uploadId ?? req.body?.uploadIds ?? req.body?.uploadId;
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.map(String);
  if (typeof raw === 'string') return raw.split(',').map(v => v.trim()).filter(Boolean);
  return [];
}

export const getRecommendations = async (req, res) => {
  try {
    const uploadIds = extractUploadIds(req);
    const data = await clientCOptimizationService.getRecommendations({ ...req.query, uploadIds });
    res.json({ success: true, data });
  } catch (error) {
    console.error('Client-C Optimization Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getOpportunities = async (req, res) => {
  try {
    const uploadIds = extractUploadIds(req);
    const data = await clientCOptimizationService.getOpportunities({ ...req.query, uploadIds });
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
