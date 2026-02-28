import { KcxAdmin } from "../../../models/index.js";
import AppError from "../../../errors/AppError.js";
import logger from "../../../lib/logger.js";

export const requireAdmin = async (req, res, next) => {
  try {
    if (!req.user?.admin_id) {
      return next(new AppError(401, "UNAUTHENTICATED", "Authentication required"));
    }

    const admin = await KcxAdmin.findByPk(req.user.admin_id, {
      attributes: ["id", "is_active"],
    });

    if (!admin || !admin.is_active) {
      return next(new AppError(403, "UNAUTHORIZED", "You do not have permission to perform this action"));
    }

    return next();
  } catch (error) {
    logger.error({ err: error, requestId: req.requestId }, "requireAdmin failed");
    return next(new AppError(500, "INTERNAL", "Internal server error", { cause: error }));
  }
};
