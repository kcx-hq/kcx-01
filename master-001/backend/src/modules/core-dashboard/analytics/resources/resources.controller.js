import { costAnalysisRepository } from '../cost-analysis/cost-analysis.repository.js';
import { buildResourceInventory } from './resources.service.js';

/**
 * Normalize upload IDs (query/body)
 * Supports:
 *  - uploadid=uuid
 *  - uploadid[]=uuid1&uploadid[]=uuid2
 *  - uploadid="uuid1,uuid2"
 *  - uploadId / uploadIds too (optional)
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
 * Extract uploadIds from query OR body to avoid client mismatch bugs
 */
function extractUploadIds(req) {
  return normalizeUploadIds(
    req.query.uploadid ??
      req.query.uploadId ??
      req.query.uploadids ??
      req.query.uploadIds ??
      req.body?.uploadid ??
      req.body?.uploadId ??
      req.body?.uploadIds
  );
}

/**
 * GET /api/resources
 * Get resource inventory
 * NOTE: Same approach as cost-analysis/drivers: upload selection must come from request.
 */
export const getResources = async (req, res) => {
  try {
    const filters = {
      provider: req.query.provider || 'All',
      service: req.query.service || 'All',
      region: req.query.region || 'All'
    };

    const uploadIds = extractUploadIds(req);

    // Return consistent shape with buildResourceInventory()
    if (uploadIds.length === 0) {
      return res.json({
        success: true,
        data: {
          inventory: [],
          stats: {
            total: 0,
            totalCost: 0,
            zombieCount: 0,
            zombieCost: 0,
            untaggedCount: 0,
            untaggedCost: 0,
            spikingCount: 0,
            spikingCost: 0
          }
        },
        message: 'No upload selected. Please select a billing upload to view resources.'
      });
    }

    const repoFilters = { ...filters, uploadIds };

    // 1) Fetch raw facts with joins (resource/service/region/account + tags)
    const rawData = await costAnalysisRepository.getResourceData(repoFilters);

    // 2) Transform to inventory + stats
    const inventoryData = buildResourceInventory(rawData);

    return res.json({
      success: true,
      data: inventoryData
    });
  } catch (error) {
    console.error('Resource Controller Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to load resources',
      error: error.message
    });
  }
};
