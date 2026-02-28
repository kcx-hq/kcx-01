import { v4 as uuidv4 } from "uuid";
import { BillingUpload } from "../../../models/index.js";
import { ingestBillingCsv } from "./billingIngest.service.js";
import fs from "fs/promises";
import { ingestS3File } from "./ingestS3File.js";
import { CloudAccountCredentials, ClientS3Integrations } from "../../../models/index.js";
import AppError from "../../../errors/AppError.js";
import logger from "../../../lib/logger.js";
import { buildS3IngestFingerprint, parseAndValidateS3IngestPayload } from "./lib/s3Ingest.utils.js";
import { transitionUploadStatus } from "./uploadStatus.service.js";

export async function uploadBillingCsv(req, res, next) {
  const file = req.file;
  let upload = null;

  if (!file) {
    return next(new AppError(400, "VALIDATION_ERROR", "Invalid request"));
  }

  try {
    // 1️⃣ Create upload record with PENDING
    upload = await BillingUpload.create({
    upload = await BillingUpload.create({
      uploadid: uuidv4(),
      clientid: req.client_id,
      uploadedby: req.user.id,
      filename: file.originalname,
      filesize: file.size,
      billingperiodstart: new Date(),
      billingperiodend: new Date(),
      checksum: "TODO",
      uploadedat: new Date(),
      status: "PENDING",
    });

    if (!req.file || !req.file.path) {
      return next(new AppError(400, "VALIDATION_ERROR", "Invalid request"));
    }

    // 2️⃣ Update to PROCESSING before ETL
    await transitionUploadStatus({
      uploadId: upload.uploadid,
      toStatus: "PROCESSING",
    });

    // 3️⃣ Run ETL
    const ingestResult = await ingestBillingCsv({
      uploadId: upload.uploadid,
      filePath: req.file.path,
      clientid: req.client_id,
    });

    if (!ingestResult?.attempted) {
      await upload.update({ status: "FAILED" });
      return res.status(422).json({
        message: "Upload failed: no records ingested",
        uploadId: upload.uploadid,
        status: "FAILED",
      });
    }

    // 4️⃣ Mark COMPLETED
    await transitionUploadStatus({
      uploadId: upload.uploadid,
      toStatus: "COMPLETED",
    });

    try {
      await fs.unlink(req.file.path);
    } catch (err) {
      logger.error({ err, requestId: req.requestId }, "Failed to delete file");
    }

    return res.ok({
      message: "Billing CSV processed",
      uploadId: upload.uploadid,
      status: "COMPLETED",
    });

  } catch (err) {
    logger.error({ err, requestId: req.requestId }, "Upload failed");

    // 5️⃣ Mark FAILED (if upload was created)
    if (upload?.uploadid) {
      await transitionUploadStatus({
        uploadId: upload.uploadid,
        toStatus: "FAILED",
      });
    }

    return next(new AppError(500, "INTERNAL", "Internal server error"));
  }
}


export async function getAllBillingUploads(req, res, next) {
  const uploads = await BillingUpload.findAll({
    where: { clientid: req.client_id },
  });
  return res.ok(uploads);
}

export async function getUploadById(req, res, next) {
  const upload = await BillingUpload.findOne({
    where: { clientid: req.client_id, uploadid: req.params.uploadId },
  });
  return res.ok(upload);
}

function toSafeString(value) {
  return String(value || "").trim();
}

export async function s3Ingest(req, res, next) {
  try {
    if (!req.user?.id || !req.client_id) {
      return next(new AppError(401, "UNAUTHENTICATED", "Authentication required"));
    }

    const {
      account,
      region,
      bucket,
      s3Key,
      size,
      etag,
      sequencer,
    } = parseAndValidateS3IngestPayload(req.body);

    const integration = await ClientS3Integrations.findOne({
      where: {
        clientid: req.client_id,
        bucket,
      },
      attributes: ["prefix"],
    });

    const configuredPrefix = toSafeString(integration?.prefix);
    if (configuredPrefix) {
      const normalizedPrefix = configuredPrefix.endsWith("/")
        ? configuredPrefix
        : `${configuredPrefix}/`;
      if (!s3Key.startsWith(normalizedPrefix)) {
        return next(new AppError(403, "UNAUTHORIZED", "You do not have permission to perform this action"));
      }
    }

    // Fetch credentials row
    const credentials = await CloudAccountCredentials.findOne({
      where: {
        clientId: req.client_id,
        accountId: account,
      },
    });

    if (!credentials) {
      return next(new AppError(403, "UNAUTHORIZED", "You do not have permission to perform this action"));
    }

    const clientid = credentials.clientId;

    // Decrypt keys (DO NOT LOG)
    const accessKeyId =
      typeof credentials.getDecryptedAccessKey === "function"
        ? credentials.getDecryptedAccessKey()
        : null;

    const secretAccessKey =
      typeof credentials.getDecryptedSecretAccessKey === "function"
        ? credentials.getDecryptedSecretAccessKey()
        : null;

    if (!accessKeyId || !secretAccessKey) {
      return next(new AppError(500, "INTERNAL", "Internal server error"));
    }

    // fingerprint for dedupe
    const tempChecksum = buildS3IngestFingerprint(etag, sequencer);

    // dedupe
    const exists = await BillingUpload.findOne({
      where: {
        clientid,
        filename: s3Key,
        filesize: size,
        checksum: tempChecksum,
      },
      attributes: ["uploadid", "status"],
    });

    if (exists) {
      return res.ok({
        status: "duplicate_ignored",
        uploadId: exists.uploadid,
        uploadStatus: exists.status,
      });
    }

    const today = new Date().toISOString().slice(0, 10);

    const upload = await BillingUpload.create({
      clientid,
      uploadedby: "00000000-0000-0000-0000-000000000001",
      filename: s3Key,
      filesize: size,
      checksum: tempChecksum,
      billingperiodstart: today,
      billingperiodend: today,
      uploadedat: new Date(),
      status: "PENDING",
    });

    // ✅ Respond immediately (202 Accepted)
    res.accepted({
      status: "accepted",
      uploadId: upload.uploadid,
      message: "ETL started in background",
    });

    // ✅ Background ETL (do NOT await)
    setImmediate(async () => {
      try {

        logger.info("Background ETL started");
        await transitionUploadStatus({
          uploadId: upload.uploadid,
          toStatus: "PROCESSING",
        });

        const ingestResult = await ingestS3File({
          region,
          Bucket: bucket,
          s3Key,
          clientid,
          uploadId: upload.uploadid,
          clientcreds: { accessKeyId, secretAccessKey },
        });

        await transitionUploadStatus({
          uploadId: upload.uploadid,
          toStatus: "COMPLETED",
        });

        logger.info("Background ETL completed");
      } catch (err) {
        logger.error({ err, requestId: req.requestId }, "Background ETL failed");

        try {
          await transitionUploadStatus({
            uploadId: upload.uploadid,
            toStatus: "FAILED",
          });
        } catch {
          // no-op: keep response lifecycle isolated from background failures
        }
      }
    });

    // IMPORTANT: we already responded above
    return;
  } catch (e) {
    if (e?.message?.startsWith("Invalid") || e?.message?.includes("required")) {
      return next(new AppError(400, "VALIDATION_ERROR", "Invalid request"));
    }
    logger.error({ err: e, requestId: req.requestId }, "s3Ingest error");
    return next(new AppError(500, "INTERNAL", "Internal server error"));
  }
}
