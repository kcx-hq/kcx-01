import { S3Client, ListObjectsV2Command } from "@aws-sdk/client-s3";
import assumeRole from "../../../aws/assumeRole.js";

function parseBucketPrefix(bucketPrefixRaw) {
  const raw = String(bucketPrefixRaw || "").trim();
  if (!raw) throw new Error("Bucket (prefix) is required");

  const normalized = raw.replace(/^s3:\/\//i, "").replace(/^\/+/, "");
  const [bucket, ...rest] = normalized.split("/");
  const prefix = rest.join("/").replace(/^\/+/, "");

  if (!bucket) throw new Error("Invalid bucket/prefix format");
  return { bucket, prefix };
}

function buildRoleArn(accountId, roleName) {
  return `arn:aws:iam::${accountId}:role/${roleName}`;
}

export async function verifyAwsConnection({
  accountId,
  roleName,
  bucketPrefix,
  region: inputRegion,
}) {
  const inputAccountId = String(accountId || "").trim();
  const inputRoleName = String(roleName || "").trim();

  if (!inputAccountId) throw new Error("Account ID is required");
  if (!inputRoleName) throw new Error("RoleName is required");
  if (!/^\d{12}$/.test(inputAccountId)) {
    throw new Error("Account ID must be a 12-digit number");
  }

  const roleArn = buildRoleArn(inputAccountId, inputRoleName);
  const { bucket, prefix } = parseBucketPrefix(bucketPrefix);
  const region =
    String(inputRegion || "").trim() ||
    process.env.AWS_BILLING_REGION ||
    process.env.AWS_REGION ||
    "ap-south-1";

  const creds = await assumeRole({
    roleArn,
    sessionName: `kcx-ui-${Date.now()}`,
    region,
  });

  const s3 = new S3Client({
    region,
    credentials: {
      accessKeyId: creds.accessKeyId,
      secretAccessKey: creds.secretAccessKey,
      sessionToken: creds.sessionToken,
    },
  });

  const list = await s3.send(
    new ListObjectsV2Command({
      Bucket: bucket,
      Prefix: prefix || undefined,
      MaxKeys: 5,
    }),
  );

  const sampleKeys = (list.Contents || [])
    .map((obj) => obj.Key)
    .filter(Boolean);

  return {
    ok: true,
    provider: "aws",
    region,
    accountId: inputAccountId,
    bucket,
    prefix,
    objectsFound: sampleKeys.length,
    sampleKeys,
    assumedRoleArn: creds.assumedRoleArn,
    expiresAt: creds.expiration,
  };
}
