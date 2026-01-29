import { getDepartmentOverview, getDepartmentTrend, getDepartmentDrilldown } from './department-cost.service.js';

function extractUploadIds(req) {
  const raw = req.query.uploadIds ?? req.query.uploadId ?? req.body?.uploadIds;
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.filter(Boolean);
  if (typeof raw === 'string') return raw.split(',').map(v => v.trim()).filter(Boolean);
  return [];
}

export const getOverview = async (req, res) => {
  try {
    const uploadIds = extractUploadIds(req);
    const filters = {
      provider: req.query.provider || 'All',
      service: req.query.service || 'All',
    };
    const data = await getDepartmentOverview({ filters, uploadIds });
    res.json({ success: true, data });
  } catch (error) {
    console.error('Department Overview Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getTrend = async (req, res) => {
  try {
    const uploadIds = extractUploadIds(req);
    const department = req.query.department || 'All';
    const data = await getDepartmentTrend({ uploadIds, department });
    res.json({ success: true, data });
  } catch (error) {
    console.error('Department Trend Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getDrilldown = async (req, res) => {
  try {
    const uploadIds = extractUploadIds(req);
    const department = req.query.department || 'All';
    const data = await getDepartmentDrilldown({ uploadIds, department });
    res.json({ success: true, data });
  } catch (error) {
    console.error('Department Drilldown Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};
