import {
  S3Client,
  ListObjectsV2Command,
  HeadObjectCommand,
} from "@aws-sdk/client-s3";
import { BillingUpload } from "../../../models/index.js";
import { ingestS3File } from "./ingestS3File.js";
import assumeRole from "../../../aws/assumeRole.js";

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
      Bucket: Bucket,
      Prefix: prefix, // must be capital P
    }),
  );

  console.log(res);

  const objects = res.Contents ?? [];

  console.log(objects);

    for (const o of objects) {
      if (!o.Key || o.Key.endsWith("/")) continue;

      // optional head (more accurate size)
      const head = await s3.send(new HeadObjectCommand({ Bucket: Bucket, Key: o.Key }));
      const size = head.ContentLength ?? o.Size ?? 0;
      const lastModified = head.LastModified ?? o.LastModified;
      if (!lastModified) continue;

      // BASIC "fingerprint"
      const tempChecksum = `${o.Key}:${size}:${new Date(lastModified).toISOString()}`;

      // dedupe: same key + same lastModified + same size
      const exists = await BillingUpload.findOne({
        where: {
          clientid,
          filename: o.Key,
          filesize: size,
          uploadedat: lastModified,
        },
        attributes: ["uploadid"],
      });

      if (exists) continue;

      // create upload row (uploadid becomes your uploadId)
      const upload = await BillingUpload.create({
        clientid,
        uploadedby, // system user id
        filename: o.Key,
        filesize: size,
        checksum: tempChecksum, // placeholder for now
        billingperiodstart: new Date().toISOString().slice(0, 10), // temp
        billingperiodend: new Date().toISOString().slice(0, 10),   // temp
        uploadedat: lastModified, // IMPORTANT: use S3 last modified
      });

      await ingestS3File({
        clientid,
        uploadId: upload.uploadid,
        Bucket,
        s3Key: o.Key, // key: o.Key,
      });
    }
}
