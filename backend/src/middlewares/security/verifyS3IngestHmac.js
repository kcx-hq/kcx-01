import crypto from "crypto";
import AppError from "../../errors/AppError.js";

const DEFAULT_REPLAY_WINDOW_SECONDS = 300;
const nonceCache = new Map();

function getReplayWindowSeconds() {
  const parsed = Number(process.env.S3_INGEST_HMAC_WINDOW_SECONDS);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return DEFAULT_REPLAY_WINDOW_SECONDS;
  }
  return Math.floor(parsed);
}

function cleanupExpiredNonces(nowMs) {
  for (const [nonce, expiresAt] of nonceCache.entries()) {
    if (expiresAt <= nowMs) {
      nonceCache.delete(nonce);
    }
  }
}

function decodeSignature(signatureHeader) {
  const input = String(signatureHeader || "").trim();
  if (!input) return null;

  if (/^[a-f0-9]+$/i.test(input) && input.length % 2 === 0) {
    try {
      return Buffer.from(input, "hex");
    } catch {
      return null;
    }
  }

  try {
    const decoded = Buffer.from(input, "base64");
    if (decoded.length === 0) return null;
    return decoded;
  } catch {
    return null;
  }
}

function computeExpectedSignature(rawBody, timestamp, nonce, secret) {
  return crypto
    .createHmac("sha256", secret)
    .update(String(timestamp))
    .update(".")
    .update(String(nonce))
    .update(".")
    .update(rawBody)
    .digest();
}

export function verifyS3IngestHmac(req, res, next) {
  const secret = process.env.S3_INGEST_HMAC_SECRET;
  if (!secret) {
    return next(
      new AppError(500, "INTERNAL", "Internal server error")
    );
  }

  const signatureHeader = req.get("X-Signature");
  const timestampHeader = req.get("X-Timestamp");
  const nonceHeader = req.get("X-Nonce");

  if (!signatureHeader || !timestampHeader || !nonceHeader) {
    return next(
      new AppError(401, "UNAUTHENTICATED", "Authentication required")
    );
  }

  const timestamp = Number(timestampHeader);
  if (!Number.isFinite(timestamp) || !Number.isInteger(timestamp)) {
    return next(
      new AppError(401, "UNAUTHENTICATED", "Authentication required")
    );
  }

  const replayWindowSeconds = getReplayWindowSeconds();
  const nowSeconds = Math.floor(Date.now() / 1000);
  if (Math.abs(nowSeconds - timestamp) > replayWindowSeconds) {
    return next(
      new AppError(401, "UNAUTHENTICATED", "Authentication required")
    );
  }

  const nowMs = Date.now();
  cleanupExpiredNonces(nowMs);
  if (nonceCache.has(nonceHeader)) {
    return next(
      new AppError(401, "UNAUTHENTICATED", "Authentication required")
    );
  }

  const providedSignature = decodeSignature(signatureHeader);
  if (!providedSignature) {
    return next(
      new AppError(401, "UNAUTHENTICATED", "Authentication required")
    );
  }

  const rawBody = Buffer.isBuffer(req.rawBody)
    ? req.rawBody
    : Buffer.from(JSON.stringify(req.body || {}));
  const expectedSignature = computeExpectedSignature(
    rawBody,
    timestampHeader,
    nonceHeader,
    secret
  );

  if (providedSignature.length !== expectedSignature.length) {
    return next(
      new AppError(401, "UNAUTHENTICATED", "Authentication required")
    );
  }

  const validSignature = crypto.timingSafeEqual(
    providedSignature,
    expectedSignature
  );
  if (!validSignature) {
    return next(
      new AppError(401, "UNAUTHENTICATED", "Authentication required")
    );
  }

  nonceCache.set(nonceHeader, nowMs + replayWindowSeconds * 1000);
  req.s3IngestSignatureVerified = true;
  return next();
}

export function __clearS3IngestNonceCacheForTests() {
  if (process.env.NODE_ENV === "test") {
    nonceCache.clear();
  }
}
