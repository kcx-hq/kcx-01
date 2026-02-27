import { unitEconomicsService } from "./unit-economics.service.js";
import AppError from "../../../errors/AppError.js";
import logger from "../../../lib/logger.js";
import { normalizeUploadIds } from "../utils/uploadIds.utils.js";
import { assertUploadScope } from "../utils/uploadScope.service.js";

export const getUnitEconomicsSummary = async (req, res, next) => {
  try {
    const uploadIds = await assertUploadScope({
      uploadIds: normalizeUploadIds(
      req.query.uploadIds ?? req.body?.uploadIds ?? req.query?.uploadId ?? req.body?.uploadId
      ),
      clientId: req.client_id,
    });

    if (!uploadIds.length) {
      return res.ok({});
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

    return res.ok(data);
  } catch (e) {
    if (e instanceof AppError) {
      return next(e);
    }
    logger.error({ err: e, requestId: req.requestId }, "Unit Economics Error");
    return next(new AppError(500, "INTERNAL", "Internal server error", { cause: e }));
  }
};
