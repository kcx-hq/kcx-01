import { getActiveAlerts, getDepartmentBudgetStatus, createAlertRule } from './cost-alerts.service.js';

function extractUploadIds(req) {
  const raw = req.query.uploadIds ?? req.query.uploadId ?? req.body?.uploadIds;
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.filter(Boolean);
  if (typeof raw === 'string') return raw.split(',').map(v => v.trim()).filter(Boolean);
  return [];
}

export const getAlerts = async (req, res) => {
  try {
    const uploadIds = extractUploadIds(req);
    const thresholds = req.body?.thresholds || req.query.thresholds ? JSON.parse(req.query.thresholds) : {};
    const data = await getActiveAlerts({ uploadIds, thresholds });
    res.json({ success: true, data });
  } catch (error) {
    console.error('Alerts Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getBudgetStatus = async (req, res) => {
  try {
    const uploadIds = extractUploadIds(req);
    const budgets = req.body?.budgets || req.query.budgets ? JSON.parse(req.query.budgets) : {};
    const data = await getDepartmentBudgetStatus({ uploadIds, budgets });
    res.json({ success: true, data });
  } catch (error) {
    console.error('Budget Status Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const createRule = async (req, res) => {
  try {
    const { department, threshold, type } = req.body || {};
    
    if (!department || !threshold || !type) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields: department, threshold, and type are all required.' 
      });
    }

    const data = await createAlertRule({ department, threshold, type });
    res.json({ success: true, data });
  } catch (error) {
    console.error('Create Rule Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};
