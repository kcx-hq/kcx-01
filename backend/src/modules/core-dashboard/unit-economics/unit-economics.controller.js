import { unitEconomicsService } from "./unit-economics.service.js";

const normalizeUploadIds = (v) =>
  Array.isArray(v)
    ? v
    : typeof v === "string"
    ? v.split(",").map(x => x.trim()).filter(Boolean)
    : [];

export const getUnitEconomicsSummary = async (req, res) => {
  try {
    const uploadIds = normalizeUploadIds(
      req.query.uploadIds ?? req.body?.uploadIds ?? req.query?.uploadId ?? req.body?.uploadId
    );

    if (!uploadIds.length) {
      return res.json({ success: true, data: {} });
    }

    const filters = {
      provider: req.query.provider || "All",
      service: req.query.service || "All",
      region: req.query.region || "All",
    };

    const data = await unitEconomicsService.getSummary({
      filters,
      period: req.query.period || null,
      compareTo: req.query.compareTo || "previous_period",
      costBasis: req.query.costBasis || "actual",
      uploadIds
    });

    res.json({ success: true, data });
  } catch (e) {
    console.error("Unit Economics Error", e);
    res.status(500).json({ success: false, error: e.message });
  }
};
