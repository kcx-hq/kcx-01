import { costAnalysisRepository } from '../../../../core-dashboard/analytics/cost-analysis/cost-analysis.repository.js';
import { buildClientDResourceInventory } from './resources.service.js';
import { extractUploadIds } from '../../helpers/extractUploadId.js';

/**
 * Extract uploadIds from query OR body
 */


/**
 * GET /api/client-d/resources
 * Modified inventory (no zombie/spiking, adds availability zone)
 */
export const getClientDResources = async (req, res) => {
  try {
    const filters = {
      provider: req.query.provider || 'All',
      service: req.query.service || 'All',
      region: req.query.region || 'All'
    };

    const uploadIds = extractUploadIds(req);

    if (uploadIds.length === 0) {
      return res.json({
        success: true,
        data: {
          inventory: [],
          stats: {
            total: 0,
            totalCost: 0,
            untaggedCount: 0,
            untaggedCost: 0
          }
        },
        message: 'No upload selected. Please select a billing upload to view resources.'
      });
    }

    const repoFilters = { ...filters, uploadIds };

    // Reuse core repository fetch (must include AZ if available in fact data)
    const rawData = await costAnalysisRepository.getResourceData(repoFilters);

    const inventoryData = buildClientDResourceInventory(rawData);

    return res.json({
      success: true,
      data: inventoryData
    });
  } catch (error) {
    console.error('Client-D Resource Controller Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to load Client-D resources',
      error: error.message
    });
  }
};
