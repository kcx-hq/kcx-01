import {
  S3Client,
  ListObjectsV2Command,
  HeadObjectCommand,
} from "@aws-sdk/client-s3";
import { BillingUpload } from "../../../models/index.js";
import { ingestS3File } from "./ingestS3File.js";
import assumeRole from "../../../aws/assumeRole.js";
import logger from "../../../lib/logger.js";

export async function pollClient({ clientid, Bucket, prefix, uploadedby }) {
  const creds = await assumeRole();
  const s3 = new S3Client({
    region: "ap-south-1",
    credentials: {
      accessKeyId: creds.accessKeyId,
      secretAccessKey: creds.secretAccessKey,
      sessionToken: creds.sessionToken,
    },
  });

  const res = await s3.send(
    new ListObjectsV2Command({
      Bucket,
      Prefix: prefix,
    })
  );

  const objects = res.Contents ?? [];
  logger.info({ clientid, bucket: Bucket, objectCount: objects.length }, "fetched objects");

  for (const o of objects) {
    if (!o.Key || o.Key.endsWith("/")) {
      continue;
    }

    const head = await s3.send(new HeadObjectCommand({ Bucket, Key: o.Key }));
    const size = head.ContentLength ?? o.Size ?? 0;
    const lastModified = head.LastModified ?? o.LastModified;
    if (!lastModified) {
      continue;
    }

    const tempChecksum = `${o.Key}:${size}:${new Date(lastModified).toISOString()}`;

    const exists = await BillingUpload.findOne({
      where: {
        clientid,
        filename: o.Key,
        filesize: size,
        uploadedat: lastModified,
      },
      attributes: ["uploadid"],
    });

    if (exists) {
      continue;
    }

    const upload = await BillingUpload.create({
      clientid,
      uploadedby,
      filename: o.Key,
      filesize: size,
      checksum: tempChecksum,
      billingperiodstart: new Date().toISOString().slice(0, 10),
      billingperiodend: new Date().toISOString().slice(0, 10),
      uploadedat: lastModified,
    });

    await ingestS3File({
      clientid,
      uploadId: upload.uploadid,
      Bucket,
      s3Key: o.Key,
    });
  }
}
