import { v4 as uuidv4 } from "uuid";
import { BillingUpload } from "../../../models/index.js";
import { ingestBillingCsv } from "./billingIngest.service.js";
import { getUserById } from "../user/user.service.js";
import fs from "fs/promises";
import { ingestS3File } from "./ingestS3File.js";

export async function uploadBillingCsv(req, res) {
  const file = req.file;

  if (!file) {
    return res.status(400).json({ message: "CSV file required" });
  }

  // Check if user has already uploaded (free tier: one upload only)
  const existingUpload = await BillingUpload.findOne({
    where: { uploadedby: req.user.id },
  });

  // if (existingUpload) {
  //   return res.status(403).json({
  //     message: "Free tier allows only one upload",
  //   });
  // }

  // 1️⃣ Create upload record
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
  });

  await BillingUpload.sync();
  if (!req.file || !req.file.path) {
    return res.status(400).json({ error: "CSV file missing" });
  }

  await ingestBillingCsv({
    uploadId: upload.uploadid,
    filePath: req.file.path,
    clientid: req.client_id,
  });

  try {
    await fs.unlink(req.file.path);
  } catch (err) {
    console.error("Failed to delete file:", err);
  }

  res.status(200).json({
    message: "Billing CSV processed",
    uploadId: upload.uploadid,
  });
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

export async function s3Ingest(req, res) {
  console.log("Ingesting billing CSV from S3");

  console.log(req.body);

  try {
    const s3Key = req.body.detail.object.key;
    const size = req.body.detail.object.size;
    const account = req.body.account;
    const bucket = req.body.detail.bucket.name;
    const clientid = "d15d543d-c51d-4829-bab1-c3bd4e67cba1";
    const region = req.body.region

    // BASIC "fingerprint"
    const tempChecksum = req.body.detail.object.etag + req.body.detail.object.sequencer;

    // dedupe: same key + same lastModified + same size
    const exists = await BillingUpload.findOne({
      where: {
        clientid,
        filename: s3Key,
        filesize: size,
        checksum: tempChecksum,
      },
      attributes: ["uploadid"],
    });

    if (exists) return;
    // create upload row (uploadid becomes your uploadId)
    const upload = await BillingUpload.create({
      clientid,
      uploadedby : "00000000-0000-0000-0000-000000000001", // system user id
      filename: s3Key,
      filesize: size,
      checksum: tempChecksum, // placeholder for now
      billingperiodstart: new Date().toISOString().slice(0, 10), // temp
      billingperiodend: new Date().toISOString().slice(0, 10), // temp
      uploadedat: new Date(), // IMPORTANT: use S3 last modified
    });

    await ingestS3File({
      region, 
      s3Key: s3Key,
      clientid,
      uploadId: upload.uploadid,
      Bucket: bucket,
    });
  } catch (e) {
    console.log(e);
  }
  return res.json("completed");
}
