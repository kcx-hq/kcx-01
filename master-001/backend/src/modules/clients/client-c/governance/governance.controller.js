/**
 * Client-C Governance Controller
 */

import { clientCGovernanceService } from './governance.service.js';

function extractUploadIds(req) {
  const raw = req.query.uploadid ?? req.query.uploadId ?? req.query.uploadIds ?? req.body?.uploadId ?? req.body?.uploadIds;
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.filter(Boolean);
  if (typeof raw === 'string') return raw.split(',').map(v => v.trim()).filter(Boolean);
  return [];
}

export const getSummary = async (req, res) => {
  try {
    const filters = {
      provider: req.query.provider || 'All',
      service: req.query.service || 'All',
      region: req.query.region || 'All'
    };
    const period = req.query.period || 'month';
    const uploadIds = extractUploadIds(req);

    if (uploadIds.length === 0) {
      return res.json({ success: true, data: { summary: null }, message: 'No upload selected.' });
    }

    const data = await clientCGovernanceService.getGovernanceSummary({ filters, period, uploadIds });
    return res.json({ success: true, data });
  } catch (error) {
    console.error('Error in getSummary:', error);
    return res.status(500).json({ success: false, error: 'Failed to generate governance summary', message: error.message });
  }
};

export const getCompliance = async (req, res) => {
  try {
    const filters = {
      provider: req.query.provider || 'All',
      service: req.query.service || 'All',
      region: req.query.region || 'All'
    };
    const uploadIds = extractUploadIds(req);

    if (uploadIds.length === 0) {
      return res.json({ success: true, data: { overall: { taggedCost: 0, untaggedCost: 0, taggedPercent: 0 }, byDepartment: [] } });
    }

    const data = await clientCGovernanceService.getTagCompliance({ filters, uploadIds });
    return res.json({ success: true, data });
  } catch (error) {
    console.error('Error in getCompliance:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch compliance data', message: error.message });
  }
};

export const getAccounts = async (req, res) => {
  try {
    const filters = {
      provider: req.query.provider || 'All',
      service: req.query.service || 'All',
      region: req.query.region || 'All',
      ownershipStatus: req.query.ownershipStatus || 'All'
    };
    const uploadIds = extractUploadIds(req);

    if (uploadIds.length === 0) {
      return res.json({ success: true, data: [] });
    }

    const data = await clientCGovernanceService.getAccountsWithOwnership({ filters, uploadIds });
    return res.json({ success: true, data });
  } catch (error) {
    console.error('Error in getAccounts:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch accounts data', message: error.message });
  }
};

export const updateAccountOwner = async (req, res) => {
  try {
    const { accountId } = req.params;
    const owner = (req.body?.owner || '').trim();
    const uploadIds = extractUploadIds(req);

    if (!owner || uploadIds.length === 0) {
      return res.status(400).json({ success: false, error: 'Owner and uploadId are required' });
    }

    const data = await clientCGovernanceService.updateAccountOwner(accountId, owner, uploadIds);
    return res.json({ success: true, data });
  } catch (error) {
    console.error('Error in updateAccountOwner:', error);
    return res.status(500).json({ success: false, error: 'Failed to update account owner', message: error.message });
  }
};
