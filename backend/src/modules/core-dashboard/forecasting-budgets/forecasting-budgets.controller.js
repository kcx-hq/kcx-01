import AppError from "../../../errors/AppError.js";
import logger from "../../../lib/logger.js";
import { forecastingBudgetsService } from "./forecasting-budgets.service.js";
import { normalizeUploadIds } from "../utils/uploadIds.utils.js";
import { assertUploadScope } from "../utils/uploadScope.service.js";

export const getForecastingBudgetsSummary = async (req, res, next) => {
  try {
    if (!req.user?.id) {
      return next(new AppError(401, "UNAUTHENTICATED", "Authentication required"));
    }

    const uploadIds = await assertUploadScope({
      uploadIds: normalizeUploadIds(
        req.query.uploadIds ??
          req.body?.uploadIds ??
          req.query.uploadId ??
          req.body?.uploadId,
      ),
      clientId: req.client_id,
    });

    const filters = {
      provider: req.query.provider || "All",
      service: req.query.service || "All",
      region: req.query.region || "All",
    };

    const data = await forecastingBudgetsService.getSummary({
      clientId: req.client_id,
      filters,
      uploadIds,
      period: req.query.period || req.body?.period || "mtd",
      compareTo: req.query.compareTo || req.body?.compareTo || "previous_period",
      costBasis: req.query.costBasis || req.body?.costBasis || "actual",
      budgetMonth: req.query.budgetMonth || req.body?.budgetMonth || null,
    });

    return res.ok(data);
  } catch (error) {
    if (error instanceof AppError) {
      return next(error);
    }
    logger.error({ err: error, requestId: req.requestId }, "Forecasting & Budgets Summary Error");
    return next(new AppError(500, "INTERNAL", "Internal server error", { cause: error }));
  }
};

export const saveForecastingBudgetTarget = async (req, res, next) => {
  try {
    if (!req.user?.id) {
      return next(new AppError(401, "UNAUTHENTICATED", "Authentication required"));
    }

    const uploadIds = await assertUploadScope({
      uploadIds: normalizeUploadIds(
        req.query.uploadIds ??
          req.body?.uploadIds ??
          req.query.uploadId ??
          req.body?.uploadId,
      ),
      clientId: req.client_id,
    });

    const filters = {
      provider: req.body?.provider || req.query.provider || "All",
      service: req.body?.service || req.query.service || "All",
      region: req.body?.region || req.query.region || "All",
    };

    const result = await forecastingBudgetsService.saveBudgetTarget({
      clientId: req.client_id,
      userId: req.user.id,
      filters,
      uploadIds,
      budgetMonth: req.body?.budgetMonth || req.query.budgetMonth || null,
      budgetTarget: req.body?.budgetTarget,
    });

    return res.ok(result);
  } catch (error) {
    if (error instanceof AppError) {
      return next(error);
    }
    logger.error({ err: error, requestId: req.requestId }, "Save Forecasting Budget Target Error");
    return next(new AppError(500, "INTERNAL", "Internal server error", { cause: error }));
  }
};

