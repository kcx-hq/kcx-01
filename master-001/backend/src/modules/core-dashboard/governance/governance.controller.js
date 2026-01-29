/**
 * Governance Controller
 * HTTP request handlers for governance and compliance
 */

import { governanceService } from './governance.service.js';

/**
 * Normalize upload IDs
 * Supports:
 *  - uploadid=uuid
 *  - uploadid[]=uuid1&uploadid[]=uuid2
 *  - uploadid="uuid1,uuid2"
 *  - uploadId / uploadIds / uploadids (camelCase + plural)
 */
function normalizeUploadIds(input) {
  if (!input) return [];

  if (Array.isArray(input)) {
    return input.map(String).map(v => v.trim()).filter(Boolean);
  }

  if (typeof input === 'string') {
    return input
      .split(',')
      .map(v => v.trim())
      .filter(Boolean);
  }

  return [];
}

/**
 * Extract uploadIds from query OR body (query wins)
 * Accepts multiple keys to avoid frontend mismatch bugs.
 */
function extractUploadIds(req) {
  return normalizeUploadIds(
    req.query.uploadid ??
      req.query.uploadId ??
      req.query.uploadids ??
      req.query.uploadIds ??
      req.query['uploadid[]'] ??
      req.query['uploadIds[]'] ??
      req.body?.uploadid ??
      req.body?.uploadId ??
      req.body?.uploadIds ??
      req.body?.uploadids
  );
}

/**
 * GET /api/governance/summary
 * Get complete governance summary
 */
export const getSummary = async (req, res) => {
  try {
    const filters = {
      provider: req.query.provider || 'All',
      service: req.query.service || 'All',
      region: req.query.region || 'All'
    };

    const period = req.query.period || null;
    const uploadIds = extractUploadIds(req);

    if (uploadIds.length === 0) {
      return res.json({
        success: true,
        data: { summary: null },
        message: 'No upload selected. Please select a billing upload to view governance summary.'
      });
    }

    const data = await governanceService.getGovernanceSummary({
      filters,
      period,
      uploadIds
    });

    return res.json({ success: true, data });
  } catch (error) {
    console.error('Error in getSummary:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to generate governance summary',
      message: error.message
    });
  }
};

/**
 * GET /api/governance/compliance
 * Get tag compliance report
 */
export const getCompliance = async (req, res) => {
  try {
    const filters = {
      provider: req.query.provider || 'All',
      service: req.query.service || 'All',
      region: req.query.region || 'All'
    };

    const period = req.query.period ? String(req.query.period).trim() : null;

    // Extract uploadIds (query/body). Make sure it's always a clean array.
    const uploadIds = (extractUploadIds(req) || [])
      .map(String)
      .map(v => v.trim())
      .filter(Boolean);

    if (uploadIds.length === 0) {
      return res.json({
        success: true,
        data: {
          taggedCost: 0,
          untaggedCost: 0,
          taggedPercent: 0,
          untaggedPercent: 0
        },
        message: 'No upload selected. Please select a billing upload to view compliance data.'
      });
    }

    const data =
      (await governanceService.getTagCompliance({
        filters,
        period,
        uploadIds
      })) || {
        taggedCost: 0,
        untaggedCost: 0,
        taggedPercent: 0,
        untaggedPercent: 0
      };

    return res.json({ success: true, data });
  } catch (error) {
    console.error('Error in getCompliance:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch compliance data',
      message: error.message
    });
  }
};


/**
 * GET /api/governance/accounts
 * Get accounts with ownership data
 */
export const getAccounts = async (req, res) => {
  try {
    const filters = {
      provider: req.query.provider || 'All',
      service: req.query.service || 'All',
      region: req.query.region || 'All',
      ownershipStatus: req.query.ownershipStatus || 'All'
    };

    const period = req.query.period || null;
    const search = req.query.search || '';
    const sortBy = req.query.sortBy || 'cost';
    const sortOrder = req.query.sortOrder || 'desc';

    const uploadIds = extractUploadIds(req);

    if (uploadIds.length === 0) {
      return res.json({
        success: true,
        data: [],
        message: 'No upload selected. Please select a billing upload to view accounts.'
      });
    }

    const data = await governanceService.getAccountsWithOwnership({
      filters,
      period,
      uploadIds,
      search,
      sortBy,
      sortOrder
    });

    return res.json({ success: true, data });
  } catch (error) {
    console.error('Error in getAccounts:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch accounts data',
      message: error.message
    });
  }
};

/**
 * PUT /api/governance/accounts/:accountId/owner
 * Update account owner
 *
 * Body:
 * - owner: string
 * - uploadid / uploadIds / uploadId: string | string[]
 */
export const updateAccountOwner = async (req, res) => {
  try {
    const { accountId } = req.params;
    const owner = (req.body?.owner || '').trim();

    if (!owner) {
      return res.status(400).json({
        success: false,
        error: 'Owner is required'
      });
    }

    // For PUT, upload IDs should come from body (but accept query too just in case)
    const uploadIds = normalizeUploadIds(
      req.body?.uploadid ?? req.body?.uploadId ?? req.body?.uploadIds ?? req.query?.uploadid
    );

    if (uploadIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'uploadid is required'
      });
    }

    const data = await governanceService.updateAccountOwner(accountId, owner, uploadIds);

    return res.json({ success: true, data });
  } catch (error) {
    console.error('Error in updateAccountOwner:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to update account owner',
      message: error.message
    });
  }
};
