import { v4 as uuidv4 } from "uuid";
import { BillingUpload , User} from "../../../models/index.js";
import { ingestBillingCsv } from "./billingIngest.service.js";
import { getUserById } from "../user/user.service.js";
import fs from "fs/promises";
import sequelize from "../../../config/db.config.js";
import { msSince } from "../../../utils/test/timer.js";

export async function uploadBillingCsv(req, res) {
  const t0 = process.hrtime.bigint();
  const marks = {};
  const mark = (name) => (marks[name] = msSince(t0));

  const file = req.file;

  if (!file || !file.path) {
    return res.status(400).json({ message: "CSV file required" });
  }

  try {
    /* 1) Fast flag check */
    const hasUploadedFlag = req.user?.has_uploaded;
    mark("after read has_uploaded flag");

    if (hasUploadedFlag === true) {
      return res
        .status(403)
        .json({ message: "Free tier allows only one upload" });
    }

    const uploadId = uuidv4();
    mark("after generate uploadId");

    /* 2) Transaction: create upload + update user flag */
    await sequelize.transaction(async (t) => {
      // Fallback DB check (only if flag missing)
      if (hasUploadedFlag === undefined) {
        const userRow = await User.findByPk(req.user.id, {
          attributes: ["has_uploaded"],
          transaction: t,
          lock: t.LOCK.UPDATE,
        });

        if (!userRow) throw new Error("User not found");

        if (userRow.has_uploaded) {
          const err = new Error("Free tier allows only one upload");
          err.statusCode = 403;
          throw err;
        }
      }
      mark("after fallback user check");

      // 2.1 Create upload record
      await BillingUpload.create(
        {
          uploadid: uploadId,
          clientid: req.client_id,
          uploadedby: req.user.id,
          filename: file.originalname,
          filesize: file.size,
          billingperiodstart: new Date(),
          billingperiodend: new Date(),
          checksum: "TODO",
          uploadedat: new Date(),
        },
        { transaction: t }
      );
      mark("after create billing upload");

      // 2.2 Update user flag
      await User.update(
        { has_uploaded: true },
        {
          where: { id: req.user.id, has_uploaded: false },
          transaction: t,
        }
      );
      mark("after update user has_uploaded");
    });

    /* 3) Long-running ETL (outside transaction) */
    await ingestBillingCsv({
      uploadId,
      filePath: file.path,
      clientid: req.client_id,
    });
    mark("after ingest billing csv");

    /* 4) Log breakdown */
    console.log(
      JSON.stringify({
        type: "uploadBillingCsv_breakdown",
        requestId: req.requestId,
        marks,
        total_ms: msSince(t0),
      })
    );

    return res.status(200).json({
      message: "Billing CSV processed",
      uploadId,
    });
  } catch (err) {
    console.error("Upload billing CSV error:", err);

    console.log(
      JSON.stringify({
        type: "uploadBillingCsv_breakdown_error",
        requestId: req.requestId,
        marks,
        total_ms: msSince(t0),
        error: err.message,
      })
    );

    const status = err.statusCode || 500;
    return res
      .status(status)
      .json({ message: err.message || "Internal server error" });
  } finally {
    /* 5) Always cleanup temp file */
    try {
      if (file?.path) await fs.unlink(file.path);
    } catch (e) {
      console.error("Failed to delete file:", e.message);
    }
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