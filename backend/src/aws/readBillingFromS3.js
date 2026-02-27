import { S3Client, ListObjectsV2Command, GetObjectCommand } from "@aws-sdk/client-s3";
import assumeRole from "./assumeRole.js";
import logger from "../lib/logger.js";

async function readBilling() {
  try {
    // 1. Get temp creds via STS
    const creds = await assumeRole();

    // 2. IMPORTANT: S3 REGION = ap-south-1 (bucket region)
    const s3 = new S3Client({
      region: "ap-south-1",
      credentials: {
        accessKeyId: creds.accessKeyId,
        secretAccessKey: creds.secretAccessKey,
        sessionToken: creds.sessionToken,
      },
    });

    const Bucket = "kcx-msu-billing";
    const Prefix = "demo/kcx-msu/data/";

    logger.info("Listing objects…");

    // 3. List objects
    const list = await s3.send(
      new ListObjectsV2Command({ Bucket, Prefix })
    );

    if (!list.Contents || list.Contents.length === 0) {
      throw new Error("No files found in prefix");
    }

    const key = list.Contents[0].Key;
    logger.info("Found file:", key);

    // 4. Read object
    const obj = await s3.send(
      new GetObjectCommand({ Bucket, Key: key })
    );

    const body = await streamToString(obj.Body);
    logger.info("FILE CONTENT (first 500 chars):");
    logger.info(body.slice(0, 500));

    logger.info("S3 READ SUCCESS ✅");
  } catch (err) {
    logger.error("S3 READ FAILED ❌");
    logger.error(err);
  }
}

// helper
const streamToString = (stream) =>
  new Promise((resolve, reject) => {
    const chunks = [];
    stream.on("data", (chunk) => chunks.push(chunk));
    stream.on("error", reject);
    stream.on("end", () => resolve(Buffer.concat(chunks).toString("utf-8")));
  });

readBilling();
