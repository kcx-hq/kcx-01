import fs from "fs/promises";
import { v4 as uuidv4 } from "uuid";
import { BillingUpload, CloudAccountCredentials, ClientS3Integrations } from "../../../models/index.js";
import { ingestBillingCsv } from "./billingIngest.service.js";
import { ingestS3File } from "./ingestS3File.js";
import AppError from "../../../errors/AppError.js";
import logger from "../../../lib/logger.js";
import { buildS3IngestFingerprint, parseAndValidateS3IngestPayload } from "./lib/s3Ingest.utils.js";
import { transitionUploadStatus } from "./uploadStatus.service.js";

function toSafeString(value) {
  return String(value || "").trim();
}

export async function uploadBillingCsv(req, res, next) {
  const file = req.file;
  let upload = null;
  const startedAt = Date.now();

  if (!file || !file.path) {
    return next(new AppError(400, "VALIDATION_ERROR", "Invalid request"));
  }

  try {
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

    await transitionUploadStatus({
      uploadId: upload.uploadid,
      toStatus: "PROCESSING",
    });

    await ingestBillingCsv({
      uploadId: upload.uploadid,
      filePath: file.path,
      clientid: req.client_id,
    });

    await transitionUploadStatus({
      uploadId: upload.uploadid,
      toStatus: "COMPLETED",
    });

    logger.info(
      {
        requestId: req.requestId,
        uploadId: upload.uploadid,
        elapsedMs: Date.now() - startedAt,
      },
      "CSV ETL completed",
    );

    return res.ok({
      status: "completed",
      uploadId: upload.uploadid,
      message: "CSV uploaded and ETL completed",
    });
  } catch (err) {
    logger.error(
      {
        err,
        requestId: req.requestId,
        uploadId: upload?.uploadid || null,
        elapsedMs: Date.now() - startedAt,
      },
      "CSV ETL failed",
    );

    if (upload?.uploadid) {
      try {
        await transitionUploadStatus({
          uploadId: upload.uploadid,
          toStatus: "FAILED",
        });
      } catch (statusErr) {
        logger.error({ err: statusErr, requestId: req.requestId }, "Failed to mark upload as FAILED");
      }
    }

    return next(new AppError(500, "INTERNAL", "Internal server error"));
  } finally {
    try {
      await fs.unlink(file.path);
    } catch (unlinkErr) {
      logger.error({ err: unlinkErr, requestId: req.requestId }, "Failed to delete file");
    }
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

export async function s3Ingest(req, res, next) {
  try {
    if (!req.user?.id || !req.client_id) {
      return next(new AppError(401, "UNAUTHENTICATED", "Authentication required"));
    }

    const { account, region, bucket, s3Key, size, etag, sequencer } =
      parseAndValidateS3IngestPayload(req.body);

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

    const tempChecksum = buildS3IngestFingerprint(etag, sequencer);

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

    res.accepted({
      status: "accepted",
      uploadId: upload.uploadid,
      message: "ETL started in background",
    });

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
          // Keep response lifecycle isolated from background failures.
        }
      }
    });

    return;
  } catch (e) {
    if (e?.message?.startsWith("Invalid") || e?.message?.includes("required")) {
      return next(new AppError(400, "VALIDATION_ERROR", "Invalid request"));
    }
    logger.error({ err: e, requestId: req.requestId }, "s3Ingest error");
    return next(new AppError(500, "INTERNAL", "Internal server error"));
  }
}
