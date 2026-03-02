import { getUploadById, listUploads } from "./operations.service.js";
import AppError from "../../../errors/AppError.js";
import logger from "../../../lib/logger.js";

export const getUploads = async (req, res, next) => {
  try {
    const result = await listUploads(req.query);
    return res.ok(result);
  } catch (error) {
    logger.error({ err: error, requestId: req.requestId }, "getUploads failed");
    return next(new AppError(500, "INTERNAL", "Internal server error", { cause: error }));
  }
};

export const getUpload = async (req, res, next) => {
  try {
    const upload = await getUploadById(req.params.id);
    if (!upload) return next(new AppError(404, "NOT_FOUND", "Not found"));
    return res.ok(upload);
  } catch (error) {
    logger.error({ err: error, requestId: req.requestId }, "getUpload failed");
    return next(new AppError(500, "INTERNAL", "Internal server error", { cause: error }));
  }
};
