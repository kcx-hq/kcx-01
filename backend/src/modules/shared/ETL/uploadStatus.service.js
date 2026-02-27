import sequelize from "../../../config/db.config.js";
import AppError from "../../../errors/AppError.js";
import { BillingUpload } from "../../../models/index.js";
import { assertBillingUploadTransition } from "./lib/uploadStatus.utils.js";

function requireValue(value) {
  return !(value === null || value === undefined || String(value).trim() === "");
}

export async function transitionUploadStatus({
  uploadId,
  toStatus,
  transaction,
}) {
  if (!requireValue(uploadId) || !requireValue(toStatus)) {
    throw new AppError(400, "VALIDATION_ERROR", "Invalid request");
  }

  const ownsTransaction = !transaction;
  const tx = transaction || (await sequelize.transaction());

  try {
    const upload = await BillingUpload.findByPk(uploadId, {
      transaction: tx,
      lock: tx.LOCK.UPDATE,
    });

    if (!upload) {
      throw new AppError(404, "NOT_FOUND", "Not found");
    }

    assertBillingUploadTransition(upload.status, toStatus);

    const normalizedToStatus = String(toStatus).trim().toUpperCase();
    if (upload.status !== normalizedToStatus) {
      upload.status = normalizedToStatus;
      await upload.save({ transaction: tx });
    }

    if (ownsTransaction) {
      await tx.commit();
    }

    return upload;
  } catch (error) {
    if (ownsTransaction) {
      await tx.rollback();
    }
    throw error;
  }
}

