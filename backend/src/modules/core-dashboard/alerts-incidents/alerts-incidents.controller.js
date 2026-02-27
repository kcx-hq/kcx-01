import AppError from "../../../errors/AppError.js";
import logger from "../../../lib/logger.js";
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

export const getAlertsIncidentsSummary = async (req, res, next) => {
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

    return res.ok(data);
  } catch (error) {
    logger.error({ err: error, requestId: req.requestId }, "Alerts & Incidents Summary Error");
    return next(new AppError(500, "INTERNAL", "Internal server error", { cause: error }));
  }
};
