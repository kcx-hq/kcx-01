/**
 * Client-C Reports Controller
 */

import { clientCReportsService } from './reports.service.js';

function extractUploadIds(req) {
  const raw = req.query.uploadIds ?? req.query.uploadId ?? req.body?.uploadIds ?? req.body?.uploadId;
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.map(String);
  if (typeof raw === 'string') return raw.split(',').map(v => v.trim()).filter(Boolean);
  return [];
}

export const getSummary = async (req, res) => {
  try {
    const uploadIds = extractUploadIds(req);
    const { period, provider, service, region } = req.query;
    
    const data = await clientCReportsService.getDashboardSummary({
      filters: { provider, service, region },
      period,
      uploadIds
    });
    
    res.json({ success: true, data });
  } catch (error) {
    console.error('Client-C Reports Summary Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getTopServices = async (req, res) => {
  try {
    const uploadIds = extractUploadIds(req);
    const { period, limit } = req.query;
    const data = await clientCReportsService.getTopServices({ period, limit: parseInt(limit), uploadIds });
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getMonthlySpend = async (req, res) => {
  try {
    const uploadIds = extractUploadIds(req);
    const data = await clientCReportsService.getMonthlySpend({ uploadIds });
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
