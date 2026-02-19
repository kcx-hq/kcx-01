import { v4 as uuidv4 } from "uuid";
import { BillingUpload } from "../../../models/index.js";
import { ingestBillingCsv } from "./billingIngest.service.js";
import { getUserById } from "../user/user.service.js";
import fs from "fs/promises";

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