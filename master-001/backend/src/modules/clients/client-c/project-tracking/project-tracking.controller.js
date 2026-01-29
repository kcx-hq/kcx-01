import { getProjectsOverview, getProjectBurnRate, compareProjectBudget } from './project-tracking.service.js';

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
    const filters = { provider: req.query.provider || 'All' };
    const data = await getProjectsOverview({ uploadIds, filters });
    res.json({ success: true, data });
  } catch (error) {
    console.error('Projects Overview Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getBurnRate = async (req, res) => {
  try {
    const uploadIds = extractUploadIds(req);
    const project = req.query.project || 'All';
    const data = await getProjectBurnRate({ uploadIds, project });
    res.json({ success: true, data });
  } catch (error) {
    console.error('Burn Rate Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const compareBudget = async (req, res) => {
  try {
    const uploadIds = extractUploadIds(req);
    const project = req.query.project || req.body?.project;
    const budget = parseFloat(req.query.budget || req.body?.budget || 0);
    const data = await compareProjectBudget({ uploadIds, project, budget });
    res.json({ success: true, data });
  } catch (error) {
    console.error('Compare Budget Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};
