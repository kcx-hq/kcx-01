import { z } from "zod";
import AppError from "../../errors/AppError.js";

const UUID_SCHEMA = z.string().uuid();
const NON_EMPTY_STRING = z.string().trim().min(1).max(5000);
const SAFE_STRING = z.string().trim().max(5000);
const EMAIL_SCHEMA = z.string().trim().email();
const AWS_REGION_SCHEMA = z.string().trim().regex(/^[a-z]{2}-[a-z-]+-\d$/);
const AWS_ACCOUNT_ID_SCHEMA = z.string().trim().regex(/^\d{12}$/);
const DATE_ONLY_SCHEMA = z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/);

function isPlainObject(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

function normalizeRecordInput(input) {
  if (input === undefined || input === null) return {};
  if (typeof input !== "object" || Array.isArray(input)) return input;

  const normalized = {};
  for (const [key, value] of Object.entries(input)) {
    if (Array.isArray(value)) {
      normalized[key] = value.map((item) => String(item));
      continue;
    }
    if (
      typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "boolean" ||
      value === null
    ) {
      normalized[key] = String(value ?? "");
      continue;
    }
    normalized[key] = value;
  }
  return normalized;
}

function normalizeBodyInput(input) {
  if (input === undefined || input === null) return {};
  return input;
}

const BASE_PARAMS_SCHEMA = z.preprocess(
  normalizeRecordInput,
  z.record(z.string(), z.string().trim().min(1).max(256)).default({})
);

const BASE_QUERY_SCHEMA = z.preprocess(
  normalizeRecordInput,
  z
    .record(
      z.string(),
      z.union([
        z.string().trim().max(2000),
        z.array(z.string().trim().max(2000)).max(100),
      ])
    )
    .default({})
);

const BASE_BODY_SCHEMA = z.preprocess(
  normalizeBodyInput,
  z.custom(
    (value) => isPlainObject(value),
    "Request body must be a JSON object"
  )
);

const S3_INGEST_SCHEMA = z.object({
  account: AWS_ACCOUNT_ID_SCHEMA,
  region: AWS_REGION_SCHEMA,
  detail: z.object({
    bucket: z.object({
      name: z.string().trim().min(3).max(63),
    }),
    object: z.object({
      key: z.string().trim().min(1).max(1024),
      size: z.coerce.number().int().min(0).max(10 * 1024 * 1024 * 1024),
      etag: z.string().trim().optional(),
      sequencer: z.string().trim().optional(),
    }),
  }),
});

const REQUEST_RULES = [
  {
    method: "POST",
    pattern: /^\/api(?:\/v1)?\/auth\/(login|signin)\/?$/i,
    body: z.object({
      email: EMAIL_SCHEMA,
      password: NON_EMPTY_STRING,
    }).strict(),
  },
  {
    method: "POST",
    pattern: /^\/api(?:\/v1)?\/auth\/signup\/?$/i,
    body: z.object({
      email: EMAIL_SCHEMA,
      password: NON_EMPTY_STRING,
      full_name: NON_EMPTY_STRING,
      role: NON_EMPTY_STRING,
      client_name: SAFE_STRING.optional(),
      client_email: EMAIL_SCHEMA.optional(),
    }).strict(),
  },
  {
    method: "POST",
    pattern: /^\/api(?:\/v1)?\/auth\/(verify|verify-email)\/?$/i,
    body: z.object({
      email: EMAIL_SCHEMA,
      otp: NON_EMPTY_STRING,
    }).strict(),
  },
  {
    method: "POST",
    pattern: /^\/api(?:\/v1)?\/auth\/(reset|forgot-password)\/?$/i,
    body: z.object({
      email: EMAIL_SCHEMA.optional(),
    }).strict(),
  },
  {
    method: "POST",
    pattern:
      /^\/api(?:\/v1)?\/auth\/(reset|reset-password)\/(?<token>[^/]+)\/?$/i,
    params: z.object({
      token: NON_EMPTY_STRING,
    }).strict(),
    body: z.object({
      password: NON_EMPTY_STRING,
      confirmPassword: NON_EMPTY_STRING,
    }).strict(),
  },
  {
    method: "PUT",
    pattern: /^\/api(?:\/v1)?\/auth\/profile\/?$/i,
    body: z.object({
      full_name: NON_EMPTY_STRING,
    }).strict(),
  },
  {
    method: "POST",
    pattern: /^\/api(?:\/v1)?\/inquiry\/submit\/?$/i,
    body: z.object({
      name: NON_EMPTY_STRING,
      email: EMAIL_SCHEMA,
      message: NON_EMPTY_STRING,
      preferred_datetime: NON_EMPTY_STRING,
      timezone: NON_EMPTY_STRING,
    }).strict(),
  },
  {
    method: "GET",
    pattern: /^\/api(?:\/v1)?\/inquiry\/(accept|reject)\/(?<id>[^/]+)\/?$/i,
    params: z.object({
      id: UUID_SCHEMA,
    }).strict(),
    query: z.object({
      token: NON_EMPTY_STRING,
    }).strict(),
  },
  {
    method: "GET",
    pattern: /^\/api(?:\/v1)?\/inquiry\/slots\/by-date\/?$/i,
    query: z.object({
      date: DATE_ONLY_SCHEMA,
      userTimezone: NON_EMPTY_STRING.optional(),
      slotMinutes: z.coerce.number().int().min(15).max(1440).optional(),
    }).strict(),
  },
  {
    method: "POST",
    pattern: /^\/api(?:\/v1)?\/chatbot\/message\/?$/i,
    body: z.object({
      sessionId: UUID_SCHEMA,
      message: NON_EMPTY_STRING,
    }).strict(),
  },
  {
    method: "GET",
    pattern: /^\/api(?:\/v1)?\/chatbot\/session\/(?<sessionId>[^/]+)\/?$/i,
    params: z.object({
      sessionId: UUID_SCHEMA,
    }).strict(),
  },
  {
    method: "POST",
    pattern: /^\/api(?:\/v1)?\/cloud\/aws\/verify-connection\/?$/i,
    body: z.object({
      accountId: AWS_ACCOUNT_ID_SCHEMA,
      roleName: NON_EMPTY_STRING,
      bucketPrefix: SAFE_STRING.optional(),
      region: AWS_REGION_SCHEMA,
    }).strict(),
  },
  {
    method: "POST",
    pattern: /^\/api(?:\/v1)?\/cloud\/aws\/connect\/?$/i,
    body: z.object({
      accountId: AWS_ACCOUNT_ID_SCHEMA,
      roleName: NON_EMPTY_STRING,
      bucketPrefix: SAFE_STRING.optional(),
      region: AWS_REGION_SCHEMA,
    }).strict(),
  },
  {
    method: "POST",
    pattern: /^\/api(?:\/v1)?\/cloud\/aws\/files\/?$/i,
    body: z.object({
      accountId: AWS_ACCOUNT_ID_SCHEMA,
      roleName: NON_EMPTY_STRING,
      bucketPrefix: SAFE_STRING.optional(),
      region: AWS_REGION_SCHEMA,
      path: SAFE_STRING.optional(),
    }).strict(),
  },
  {
    method: "POST",
    pattern: /^\/api(?:\/v1)?\/cloud\/aws\/ingest\/?$/i,
    body: z.object({
      accountId: AWS_ACCOUNT_ID_SCHEMA,
      roleName: NON_EMPTY_STRING,
      bucketPrefix: SAFE_STRING.optional(),
      region: AWS_REGION_SCHEMA,
      filePath: NON_EMPTY_STRING,
    }).strict(),
  },
  {
    method: "POST",
    pattern: /^(?:\/internal|\/api(?:\/v1)?\/internal)\/cloud-account-credentials\/?$/i,
    body: z.object({
      clientId: UUID_SCHEMA.optional(),
      accountId: AWS_ACCOUNT_ID_SCHEMA,
      accessKey: NON_EMPTY_STRING,
      secretAccessKey: NON_EMPTY_STRING,
      region: AWS_REGION_SCHEMA,
    }).strict(),
  },
  {
    method: "POST",
    pattern: /^\/api(?:\/v1)?\/etl\/s3-ingest\/?$/i,
    body: S3_INGEST_SCHEMA,
  },
  {
    method: "PUT",
    pattern:
      /^\/api(?:\/v1)?\/(?:dashboard\/)?governance\/accounts\/(?<accountId>[^/]+)\/owner\/?$/i,
    params: z.object({
      accountId: NON_EMPTY_STRING,
    }).strict(),
    body: z.object({
      owner: NON_EMPTY_STRING,
      uploadid: z.union([NON_EMPTY_STRING, z.array(NON_EMPTY_STRING)]).optional(),
      uploadId: z.union([NON_EMPTY_STRING, z.array(NON_EMPTY_STRING)]).optional(),
      uploadIds: z.union([NON_EMPTY_STRING, z.array(NON_EMPTY_STRING)]).optional(),
      uploadids: z.union([NON_EMPTY_STRING, z.array(NON_EMPTY_STRING)]).optional(),
    }).strict(),
  },
];

function resolveSchemas(req) {
  const method = String(req.method || "").toUpperCase();
  const path = String(req.path || "");
  let matchedRule = null;
  let matchedPath = null;

  for (const rule of REQUEST_RULES) {
    if (rule.method !== method) continue;
    const match = path.match(rule.pattern);
    if (match) {
      matchedRule = rule;
      matchedPath = match;
      break;
    }
  }

  return {
    matchedPath,
    params: matchedRule?.params || BASE_PARAMS_SCHEMA,
    query: matchedRule?.query || BASE_QUERY_SCHEMA,
    body: matchedRule?.body || BASE_BODY_SCHEMA,
  };
}

function applyParsedInput(req, key, value) {
  if (key === "query") {
    try {
      Object.defineProperty(req, "query", {
        value,
        configurable: true,
        enumerable: true,
        writable: false,
      });
      return;
    } catch {
      const currentQuery = req.query;
      if (isPlainObject(currentQuery)) {
        for (const existingKey of Object.keys(currentQuery)) {
          delete currentQuery[existingKey];
        }
        Object.assign(currentQuery, value);
      }
      return;
    }
  }

  req[key] = value;
}

export function validateRequest(req, _res, next) {
  if (req.method === "OPTIONS") {
    return next();
  }

  try {
    const schemas = resolveSchemas(req);
    const pathParams = schemas.matchedPath?.groups || req.params || {};

    const parsedParams = schemas.params.parse(pathParams);
    const parsedQuery = schemas.query.parse(req.query);
    const parsedBody = schemas.body.parse(req.body);

    applyParsedInput(req, "params", parsedParams);
    applyParsedInput(req, "query", parsedQuery);
    applyParsedInput(req, "body", parsedBody);

    return next();
  } catch {
    return next(new AppError(400, "VALIDATION_ERROR", "Invalid request"));
  }
}
