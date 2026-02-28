import { getCachedOverviewSnapshot } from "./overview.service.js";
import AppError from "../../../errors/AppError.js";
import logger from "../../../lib/logger.js";

export const getOverview = async (req, res, next) => {
  try {
    const data = await getCachedOverviewSnapshot({
      recentDays: req.query.recentDays,
      activityLimit: req.query.activityLimit,
      force: req.query.force === "true",
    });
    return res.ok(data);
  } catch (error) {
    logger.error({ err: error, requestId: req.requestId }, "getOverview failed");
    return next(new AppError(500, "INTERNAL", "Internal server error", { cause: error }));
  }
};
