import {
  HeadObjectCommand,
  ListObjectsV2Command,
  S3Client,
} from "@aws-sdk/client-s3";
import assumeRole from "../../../aws/assumeRole.js";

function ensureTrailingSlash(value) {
  if (!value) return "";
  return value.endsWith("/") ? value : `${value}/`;
}

function normalizeS3Path(value) {
  return String(value || "")
    .replace(/^s3:\/\//i, "")
    .replace(/\\/g, "/")
    .replace(/^\/+/, "")
    .replace(/\/{2,}/g, "/")
    .trim();
}

function parseBucketPrefix(bucketPrefixRaw) {
  const normalized = normalizeS3Path(bucketPrefixRaw);
  if (!normalized) throw new Error("Bucket (prefix) is required");

  const [bucket, ...rest] = normalized.split("/");
  if (!bucket) throw new Error("Invalid bucket/prefix format");

  const prefix = rest.join("/").replace(/^\/+/, "");
  return { bucket, prefix };
}

function extractDataRootPrefix(prefixRaw) {
  const normalizedPrefix = normalizeS3Path(prefixRaw);
  const segments = normalizedPrefix.split("/").filter(Boolean);
  const dataIndex = segments.findIndex(
    (segment) => segment.toLowerCase() === "data",
  );

  if (dataIndex < 0) {
    throw new Error("Bucket prefix must include /data as sandbox root");
  }

  return ensureTrailingSlash(segments.slice(0, dataIndex + 1).join("/"));
}

function normalizeRelativePath(pathRaw) {
  let decoded;
  try {
    decoded = decodeURIComponent(String(pathRaw || "").trim());
  } catch {
    throw new Error("Path is not valid");
  }

  decoded = decoded.replace(/\\/g, "/").replace(/\/{2,}/g, "/");

  if (!decoded) return "";
  if (decoded.startsWith("/")) throw new Error("Path must be relative to /data");
  if (decoded.includes("..")) throw new Error("Path traversal is not allowed");
  if (decoded === ".") return "";

  return decoded.replace(/^\.\/+/, "");
}

function buildRoleArn(accountId, roleName) {
  return `arn:aws:iam::${accountId}:role/${roleName}`;
}

async function getScopedS3Client({ accountId, roleName, region }) {
  const creds = await assumeRole({
    roleArn: buildRoleArn(accountId, roleName),
    sessionName: `kcx-cloud-${Date.now()}`,
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

  return { s3, creds };
}

function buildDirectoryPrefix(rootPrefix, relativePath) {
  const safePath = normalizeRelativePath(relativePath);
  if (!safePath) return { safePath: "", fullPrefix: rootPrefix };

  const directoryPath = ensureTrailingSlash(safePath);
  const fullPrefix = `${rootPrefix}${directoryPath}`.replace(/\/{2,}/g, "/");
  if (!fullPrefix.startsWith(rootPrefix)) {
    throw new Error("Invalid path outside sandbox root");
  }

  return { safePath: directoryPath, fullPrefix };
}

function mapRelativeKey(rootPrefix, fullKey) {
  if (!fullKey.startsWith(rootPrefix)) return null;
  return fullKey.slice(rootPrefix.length);
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

  const { bucket, prefix } = parseBucketPrefix(bucketPrefix);
  const rootPrefix = extractDataRootPrefix(prefix);
  const region =
    String(inputRegion || "").trim() ||
    process.env.AWS_BILLING_REGION ||
    process.env.AWS_REGION ||
    "ap-south-1";

  const { s3, creds } = await getScopedS3Client({
    accountId: inputAccountId,
    roleName: inputRoleName,
    region,
  });

  const objects = [];
  let continuationToken;

  do {
    const list = await s3.send(
      new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: rootPrefix,
        MaxKeys: 1000,
        ContinuationToken: continuationToken,
      }),
    );

    const pageObjects = (list.Contents || []).filter(
      (obj) => obj?.Key && !String(obj.Key).endsWith("/"),
    );
    objects.push(...pageObjects);
    continuationToken = list.IsTruncated ? list.NextContinuationToken : undefined;
  } while (continuationToken);

  objects.sort(
    (a, b) =>
      new Date(b?.LastModified || 0).getTime() -
      new Date(a?.LastModified || 0).getTime(),
  );

  const latestObject = objects[0] || null;
  const latestFile = latestObject
    ? {
        key: latestObject.Key,
        path: mapRelativeKey(rootPrefix, latestObject.Key),
        lastModified: latestObject.LastModified || null,
        size: latestObject.Size ?? null,
      }
    : null;

  return {
    ok: true,
    provider: "aws",
    region,
    accountId: inputAccountId,
    roleName: inputRoleName,
    bucket,
    prefix: rootPrefix,
    virtualRoot: "/data",
    objectsFound: objects.length,
    latestFile,
    assumedRoleArn: creds.assumedRoleArn,
    expiresAt: creds.expiration,
  };
}

export async function connectAwsCloud({
  accountId,
  roleName,
  bucketPrefix,
  region,
}) {
  const verification = await verifyAwsConnection({
    accountId,
    roleName,
    bucketPrefix,
    region,
  });

  return {
    ok: true,
    context: {
      accountId: verification.accountId,
      roleName: verification.roleName,
      bucketPrefix: `${verification.bucket}/${verification.prefix}`,
      region: verification.region,
    },
    provider: "aws",
    bucket: verification.bucket,
    rootPrefix: verification.prefix,
    virtualRootLabel: "/data",
    latestFile: verification.latestFile,
  };
}

function resolveCloudContext({ accountId, roleName, bucketPrefix, region }) {
  const inputAccountId = String(accountId || "").trim();
  const inputRoleName = String(roleName || "").trim();
  const { bucket, prefix } = parseBucketPrefix(bucketPrefix);
  const rootPrefix = extractDataRootPrefix(prefix);
  const resolvedRegion =
    String(region || "").trim() ||
    process.env.AWS_BILLING_REGION ||
    process.env.AWS_REGION ||
    "ap-south-1";

  if (!inputAccountId) throw new Error("Account ID is required");
  if (!/^\d{12}$/.test(inputAccountId)) {
    throw new Error("Account ID must be a 12-digit number");
  }
  if (!inputRoleName) throw new Error("RoleName is required");

  return {
    accountId: inputAccountId,
    roleName: inputRoleName,
    bucket,
    rootPrefix,
    region: resolvedRegion,
  };
}

export async function listCloudFiles({
  accountId,
  roleName,
  bucketPrefix,
  region,
  path,
}) {
  const context = resolveCloudContext({
    accountId,
    roleName,
    bucketPrefix,
    region,
  });
  const rootPrefix = ensureTrailingSlash(context.rootPrefix);
  const { safePath, fullPrefix } = buildDirectoryPrefix(rootPrefix, path);

  const { s3 } = await getScopedS3Client({
    accountId: context.accountId,
    roleName: context.roleName,
    region: context.region,
  });

  const out = await s3.send(
    new ListObjectsV2Command({
      Bucket: context.bucket,
      Prefix: fullPrefix,
      Delimiter: "/",
      MaxKeys: 1000,
    }),
  );

  const folders = (out.CommonPrefixes || [])
    .map((entry) => entry?.Prefix)
    .filter(Boolean)
    .map((full) => {
      const relative = mapRelativeKey(rootPrefix, full);
      const normalized = ensureTrailingSlash(relative || "");
      const folderName = normalized.replace(/\/$/, "").split("/").pop();
      return { type: "folder", name: folderName, path: normalized };
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  const files = (out.Contents || [])
    .filter((entry) => entry?.Key)
    .filter((entry) => entry.Key !== fullPrefix && !entry.Key.endsWith("/"))
    .map((entry) => {
      const relative = mapRelativeKey(rootPrefix, entry.Key);
      const fileName = (relative || "").split("/").pop();
      return {
        type: "file",
        name: fileName,
        path: relative,
        size: entry.Size ?? 0,
        lastModified: entry.LastModified
          ? new Date(entry.LastModified).toISOString()
          : null,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  return {
    ok: true,
    virtualRoot: "/data",
    bucket: context.bucket,
    path: safePath,
    folders,
    files,
  };
}

export async function selectCloudFileForIngestion({
  accountId,
  roleName,
  bucketPrefix,
  region,
  filePath,
}) {
  const context = resolveCloudContext({
    accountId,
    roleName,
    bucketPrefix,
    region,
  });
  const rootPrefix = ensureTrailingSlash(context.rootPrefix);
  const safeRelativePath = normalizeRelativePath(filePath);

  if (!safeRelativePath) throw new Error("filePath is required");
  if (safeRelativePath.endsWith("/")) {
    throw new Error("Folders cannot be selected for ingestion");
  }

  const objectKey = `${rootPrefix}${safeRelativePath}`.replace(/\/{2,}/g, "/");
  if (!objectKey.startsWith(rootPrefix)) {
    throw new Error("Invalid file path outside sandbox root");
  }

  const { s3 } = await getScopedS3Client({
    accountId: context.accountId,
    roleName: context.roleName,
    region: context.region,
  });

  const head = await s3.send(
    new HeadObjectCommand({
      Bucket: context.bucket,
      Key: objectKey,
    }),
  );

  return {
    ok: true,
    message: "File selected for ingestion",
    file: {
      name: safeRelativePath.split("/").pop(),
      path: safeRelativePath,
      size: head.ContentLength ?? 0,
      lastModified: head.LastModified ? head.LastModified.toISOString() : null,
    },
  };
}
