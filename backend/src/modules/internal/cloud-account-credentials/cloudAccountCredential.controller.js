import {CloudAccountCredentials} from "../../../models/index.js";
import AppError from "../../../errors/AppError.js";
import logger from "../../../lib/logger.js";

function normalizeString(value) {
  return String(value || "").trim();
}

export async function createCloudAccountCredential(req, res, next) {
  try {
    const clientId = normalizeString(
      req.client_id ?? req.user?.client_id ?? req.user?.clientId
    );
    const accountId = normalizeString(req.body?.accountId);
    const accessKey = normalizeString(req.body?.accessKey);
    const secretAccessKey = normalizeString(req.body?.secretAccessKey);
    const region = normalizeString(req.body?.region);

    if (!clientId) {
      return next(new AppError(403, "UNAUTHORIZED", "You do not have permission to perform this action"));
    }

    // Basic validation
    if (!accountId || !accessKey || !secretAccessKey || !region) {
      return next(new AppError(400, "VALIDATION_ERROR", "Invalid request"));
    }

    if (!/^\d{12}$/.test(accountId)) {
      return next(new AppError(400, "VALIDATION_ERROR", "Invalid request"));
    }

    if (!/^[a-z]{2}-[a-z-]+-\d$/.test(region)) {
      return next(new AppError(400, "VALIDATION_ERROR", "Invalid request"));
    }

    const record = await CloudAccountCredentials.create({
      clientId,
      accountId,
      accessKey,
      secretAccessKey,
      region,
    });

    // NEVER return decrypted secrets
    return res.created({
      message: "Cloud account credentials added successfully",
      data: {
        id: record.id,
        clientId: record.clientId,
        accountId: record.accountId,
        region: record.region,
      },
    });
  } catch (error) {
    logger.error({ err: error, requestId: req.requestId }, "Error creating cloud account credential");

    // Unique constraint error
    if (error.name === "SequelizeUniqueConstraintError") {
      return next(new AppError(409, "CONFLICT", "Conflict"));
    }

    return next(new AppError(500, "INTERNAL", "Internal server error", { cause: error }));
  }
}
