import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { createGunzip } from "zlib";
import csv from "csv-parser";
import assumeRole from "./assumeRole.js";
import RawAwsBillingRow from "../models/RawAwsBillingRow.js";
import sequelize from "../config/db.config.js";
import logger from "../lib/logger.js";

async function ingest() {
  try {
    const s3Key = process.argv[2];

    if (!s3Key) {
      logger.error("❌ Please provide S3 key as argument.");
      logger.info(
        "Usage: node src/aws/ingest.js demo/kcx-msu/data/.../file.csv.gz"
      );
      process.exit(1);
    }

    logger.info("🔐 Assuming role...");
    const creds = await assumeRole();

    const s3 = new S3Client({
      region: "ap-south-1",
      credentials: {
        accessKeyId: creds.accessKeyId,
        secretAccessKey: creds.secretAccessKey,
        sessionToken: creds.sessionToken,
      },
    });

    const Bucket = "kcx-msu-billing";

    logger.info("📥 Fetching object:", s3Key);

    const response = await s3.send(
      new GetObjectCommand({
        Bucket,
        Key: s3Key,
      })
    );
    const isGzip = s3Key.toLowerCase().endsWith(".gz");
    const inputStream = isGzip
      ? response.Body.pipe(createGunzip())
      : response.Body;
    const stream = inputStream.pipe(csv());

    let insertCount = 0;

    for await (const row of stream) {
      await RawAwsBillingRow.create({
        source_s3_key: s3Key,
        row_data: row,
      });

      insertCount++;
    }

    logger.info(`✅ Ingestion complete. Inserted ${insertCount} rows.`);

    await sequelize.close();
    process.exit(0);
  } catch (err) {
    logger.error("❌ Ingestion failed:");
    logger.error(err);

    await sequelize.close();
    process.exit(1);
  }
}

ingest();


