import AppError from "../../../../../errors/AppError.js";
import logger from "../../../../../lib/logger.js";

export function sendSuccess(res, data, statusCode = 200) {
  if (statusCode === 201) return res.created(data);
  if (statusCode === 202) return res.accepted(data);
  if (statusCode === 204) return res.noContent();
  return res.ok(data);
}

export function handleControllerError(req, next, error, message = "Request failed") {
  logger.error({ err: error, requestId: req.requestId }, message);
  return next(new AppError(500, "INTERNAL", "Internal server error", { cause: error }));
}

