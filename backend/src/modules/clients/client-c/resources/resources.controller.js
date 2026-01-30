import { costAnalysisRepository } from '../../../../modules/core-dashboard/analytics/cost-analysis/cost-analysis.repository.js';
import { buildClientCResourceInventory } from './resources.service.js';

/**
 * Extract uploadIds safely (same pattern everywhere)
 */
function normalizeUploadIds(input) {
  if (!input) return [];
  if (Array.isArray(input)) return input.map(String);
  if (typeof input === 'string')
    return input.split(',').map((v) => v.trim()).filter(Boolean);
  return [];
}

function extractUploadIds(req) {
  return normalizeUploadIds(
    req.query.uploadIds ??
    req.query.uploadId ??
    req.body?.uploadIds ??
    req.body?.uploadId
  );
}

/**
 * GET /api/client-c/resources/inventory
 */
export const getClientCResources = async (req, res) => {
  try {
    const uploadIds = extractUploadIds(req);

    if (!uploadIds.length) {
      return res.json({
        success: true,
        data: {
          inventory: [],
          stats: {}
        },
        message: 'Please select at least one upload'
      });
    }

    const filters = {
      uploadIds,
      provider: req.query.provider || 'All',
      service: req.query.service || 'All',
      region: req.query.region || 'All'
    };

    // Reuse core repository
    const rawData =
      await costAnalysisRepository.getResourceData(filters);

    const data = buildClientCResourceInventory(rawData, {
      departmentTagKey: 'department'
    });

    return res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Client-C Resources Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to load Client-C resources',
      error: error.message
    });
  }
};
