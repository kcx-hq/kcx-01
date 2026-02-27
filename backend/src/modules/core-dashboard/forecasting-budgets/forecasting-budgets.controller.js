import AppError from "../../../errors/AppError.js";
import logger from "../../../lib/logger.js";
import { forecastingBudgetsService } from "./forecasting-budgets.service.js";

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

export const getForecastingBudgetsSummary = async (req, res, next) => {
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

    const data = await forecastingBudgetsService.getSummary({
      filters,
      uploadIds,
      period: req.query.period || req.body?.period || "mtd",
      compareTo: req.query.compareTo || req.body?.compareTo || "previous_period",
      costBasis: req.query.costBasis || req.body?.costBasis || "actual",
    });

    return res.ok(data);
  } catch (error) {
    logger.error({ err: error, requestId: req.requestId }, "Forecasting & Budgets Summary Error");
    return next(new AppError(500, "INTERNAL", "Internal server error", { cause: error }));
  }
};

