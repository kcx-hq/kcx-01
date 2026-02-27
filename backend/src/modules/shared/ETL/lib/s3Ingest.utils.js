export function toSafeString(value) {
  return String(value || "").trim();
}

export function validateS3BucketName(bucketName) {
  return /^[a-z0-9][a-z0-9.-]{1,61}[a-z0-9]$/.test(bucketName);
}

export function validateAwsRegion(region) {
  return /^[a-z]{2}-[a-z-]+-\d$/.test(region);
}

export function normalizeS3ObjectKey(rawKey) {
  let decoded;
  try {
    decoded = decodeURIComponent(String(rawKey).replace(/\+/g, " "));
  } catch {
    throw new Error("Invalid S3 object key encoding");
  }

  const key = decoded.trim();
  if (!key) {
    throw new Error("S3 object key is required");
  }
  if (key.length > 1024) {
    throw new Error("S3 object key is too long");
  }
  if (key.includes("\u0000")) {
    throw new Error("S3 object key contains invalid characters");
  }
  if (!/\.csv(\.gz)?$/i.test(key)) {
    throw new Error("Only CSV or CSV.GZ objects are accepted");
  }

  return key;
}

export function parseAndValidateS3IngestPayload(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new Error("Payload body must be a JSON object");
  }

  const account = toSafeString(body.account);
  const region = toSafeString(body.region);
  const bucket = toSafeString(body?.detail?.bucket?.name);
  const rawKey = body?.detail?.object?.key;
  const size = body?.detail?.object?.size;

  if (!/^\d{12}$/.test(account)) {
    throw new Error("Invalid account value");
  }
  if (!validateAwsRegion(region)) {
    throw new Error("Invalid region value");
  }
  if (!bucket || !validateS3BucketName(bucket)) {
    throw new Error("Invalid bucket value");
  }
  if (!Number.isInteger(size) || size < 0 || size > 10 * 1024 * 1024 * 1024) {
    throw new Error("Invalid object size");
  }

  const s3Key = normalizeS3ObjectKey(rawKey);
  const etag = body?.detail?.object?.etag
    ? toSafeString(body.detail.object.etag).replace(/"/g, "")
    : "";
  const sequencer = body?.detail?.object?.sequencer
    ? toSafeString(body.detail.object.sequencer)
    : "";

  return {
    account,
    region,
    bucket,
    s3Key,
    size,
    etag,
    sequencer,
  };
}

export function buildS3IngestFingerprint(etag, sequencer) {
  return `${toSafeString(etag)}:${toSafeString(sequencer)}`;
}
