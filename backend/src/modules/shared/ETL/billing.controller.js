import { v4 as uuidv4 } from "uuid";
import { BillingUpload } from "../../../models/index.js";
import { ingestBillingCsv } from "./billingIngest.service.js";
import { getUserById } from "../user/user.service.js";
import fs from "fs/promises";
import { ingestS3File } from "./ingestS3File.js";
import { CloudAccountCredentials } from "../../../models/index.js";

export async function uploadBillingCsv(req, res) {
  const file = req.file;

  if (!file) {
    return res.status(400).json({ message: "CSV file required" });
  }

  try {
    // Check if user has already uploaded (free tier logic optional)
    const existingUpload = await BillingUpload.findOne({
      where: { uploadedby: req.user.id },
    });

    // 1️⃣ Create upload record with PENDING
    const upload = await BillingUpload.create({
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
      return res.status(400).json({ error: "CSV file missing" });
    }

    // 2️⃣ Update to PROCESSING before ETL
    await upload.update({ status: "PROCESSING" });

    // 3️⃣ Run ETL
    await ingestBillingCsv({
      uploadId: upload.uploadid,
      filePath: req.file.path,
      clientid: req.client_id,
    });

    // 4️⃣ Mark COMPLETED
    await upload.update({ status: "COMPLETED" });

    try {
      await fs.unlink(req.file.path);
    } catch (err) {
      console.error("Failed to delete file:", err);
    }

    return res.status(200).json({
      message: "Billing CSV processed",
      uploadId: upload.uploadid,
      status: "COMPLETED",
    });

  } catch (err) {
    console.error("Upload failed:", err);

    // 5️⃣ Mark FAILED (if upload was created)
    if (upload?.uploadid) {
      await BillingUpload.update(
        { status: "FAILED" },
        { where: { uploadid: upload.uploadid } }
      );
    }

    return res.status(500).json({
      message: "Upload failed",
      error: err?.message,
    });
  }
}


export async function getAllBillingUploads(req, res) {
  const uploads = await BillingUpload.findAll({
    where: { clientid: req.client_id },
  });
  res.json(uploads);
}

export async function getUploadById(req, res) {
  const upload = await BillingUpload.findOne({
    where: { clientid: req.client_id, uploadid: req.params.uploadId },
  });
  res.json(upload);
}

// controllers/s3Ingest.js
// controllers/s3Ingest.js
// Assumes your CloudAccountCredentials model has:
// - accessKey (encrypted at rest)
// - secretAccessKey (encrypted at rest)
// - instance methods (from earlier): getDecryptedAccessKey(), getDecryptedSecretAccessKey()

export async function s3Ingest(req, res) {
  try {
    console.log("Ingesting billing CSV from S3");

    const body = req.body;

    const s3Detail = body?.detail;
    const rawKey = s3Detail?.object?.key;
    const size = s3Detail?.object?.size;
    const bucket = s3Detail?.bucket?.name;

    const account = body?.account;
    const region = body?.region;

    if (!account || !region || !bucket || !rawKey || typeof size !== "number") {
      return res.status(400).json({
        error:
          "Invalid payload. Required: account, region, detail.bucket.name, detail.object.key, detail.object.size",
      });
    }

    const s3Key = decodeURIComponent(String(rawKey).replace(/\+/g, " "));

    // Fetch credentials row
    const credentials = await CloudAccountCredentials.findOne({
      where: { accountid: account },
    });

    if (!credentials) {
      return res.status(404).json({ error: `No credentials found for account=${account}` });
    }

    const clientid = credentials.clientid;

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
      return res.status(500).json({
        error: "Credentials missing or decryption helpers not available",
      });
    }

    // fingerprint for dedupe
    const etag = s3Detail?.object?.etag ? String(s3Detail.object.etag).replace(/"/g, "") : "";
    const sequencer = s3Detail?.object?.sequencer ? String(s3Detail.object.sequencer) : "";
    const tempChecksum = `${etag}:${sequencer}`;

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
      return res.status(200).json({
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
    res.status(202).json({
      status: "accepted",
      uploadId: upload.uploadid,
      message: "ETL started in background",
    });

    // ✅ Background ETL (do NOT await)
    setImmediate(async () => {
      try {

        console.log("Background ETL started");
        await BillingUpload.update(
          { status: "PROCESSING" },
          { where: { uploadid: upload.uploadid } }
        );

        await ingestS3File({
          region,
          Bucket: bucket,
          s3Key,
          clientid,
          uploadId: upload.uploadid,
          clientcreds: { accessKeyId, secretAccessKey },
        });

        await BillingUpload.update(
          { status: "COMPLETED" },
          { where: { uploadid: upload.uploadid } }
        );

        console.log("Background ETL completed");
      } catch (err) {
        console.error("Background ETL failed:", err);

        await BillingUpload.update(
          { status: "FAILED" },
          { where: { uploadid: upload.uploadid } }
        );
      }
    });

    // IMPORTANT: we already responded above
    return;
  } catch (e) {
    console.error("s3Ingest error:", e);
    return res.status(500).json({ error: "Internal error", message: e?.message });
  }
}




