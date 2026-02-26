import { alertsIncidentsService } from "./alerts-incidents.service.js";

const normalizeUploadIds = (value) => {
  if (Array.isArray(value)) return value.filter(Boolean).map(String);
  if (typeof value === "string") {
    return value
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean);
  }
  return [];
};

export const getAlertsIncidentsSummary = async (req, res) => {
  try {
    const uploadIds = normalizeUploadIds(
      req.query.uploadIds ??
        req.body?.uploadIds ??
        req.query.uploadId ??
        req.body?.uploadId,
    );

    const filters = {
      provider: req.query.provider || "All",
      service: req.query.service || "All",
      region: req.query.region || "All",
    };

    const data = await alertsIncidentsService.getSummary({
      filters,
      uploadIds,
      period: req.query.period || req.body?.period || "mtd",
      costBasis: req.query.costBasis || req.body?.costBasis || "actual",
      severity: req.query.severity || req.body?.severity || null,
      type: req.query.type || req.body?.type || null,
      status: req.query.status || req.body?.status || null,
      view: req.query.view || req.body?.view || "full",
    });

    res.json({ success: true, data });
  } catch (error) {
    console.error("Alerts & Incidents Summary Error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to build Alerts & Incidents summary",
      message: error.message,
    });
  }
};
