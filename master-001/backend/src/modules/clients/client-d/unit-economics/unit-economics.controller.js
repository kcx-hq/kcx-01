import { clientDUnitEconomicsService } from "./unit-economics.service.js";
import { extractUploadIds } from '../helpers/extractUploadId.js';

/**
 * GET /api/client-d/unit-economics/summary
 * Client-D Unit Economics Summary (includes skuEfficiency)
 */
export const getClientDUnitEconomicsSummary = async (req, res) => {
  try {
    const filters = {
      provider: req.query.provider || "All",
      service: req.query.service || "All",
      region: req.query.region || "All"
    };

    const period = req.query.period || null;
    const uploadIds = extractUploadIds(req);

    if (uploadIds.length === 0) {
      return res.json({
        success: true,
        data: {
          kpis: {
            totalCost: 0,
            totalQuantity: 0,
            avgUnitPrice: 0,
            unitPriceChangePct: 0,
            driftDetected: false
          },
          trend: [],
          drift: null,
          skuEfficiency: [],
          message: "No upload selected. Please select a billing upload."
        }
      });
    }

    const data = await clientDUnitEconomicsService.getSummary({
      filters,
      period,
      uploadIds
    });

    return res.json({ success: true, data });
  } catch (error) {
    console.error("Client-D Unit Economics Error:", error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
