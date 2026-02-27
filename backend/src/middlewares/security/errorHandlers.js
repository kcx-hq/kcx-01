import AppError from "../../errors/AppError.js";
import logger from "../../lib/logger.js";
import { getIdentityContext } from "../../lib/identityContext.js";

const ERROR_META = {
  400: { code: "VALIDATION_ERROR", message: "Invalid request" },
  401: { code: "UNAUTHENTICATED", message: "Authentication required" },
  403: {
    code: "UNAUTHORIZED",
    message: "You do not have permission to perform this action",
  },
  404: { code: "NOT_FOUND", message: "Not found" },
  409: { code: "CONFLICT", message: "Conflict" },
  429: { code: "RATE_LIMITED", message: "Too many requests" },
  503: { code: "NOT_READY", message: "Service not ready" },
  500: { code: "INTERNAL", message: "Internal server error" },
};

const SENSITIVE_KEY_PATTERN =
  /(authorization|cookie|token|password|secret|apikey|api_key|privatekey|private_key|accesskey|access_key|secretaccesskey|secret_access_key|smtp_pass|mailgun_api_key)/i;

function isObject(value) {
  return value && typeof value === "object" && !Array.isArray(value);
}

function redactValue(value, depth = 0) {
  if (depth > 4) return "[Truncated]";
  if (Array.isArray(value)) {
    return value.map((item) => redactValue(item, depth + 1));
  }
  if (isObject(value)) {
    const output = {};
    for (const [key, item] of Object.entries(value)) {
      output[key] = SENSITIVE_KEY_PATTERN.test(key)
        ? "[REDACTED]"
        : redactValue(item, depth + 1);
    }
    return output;
  }
  if (typeof value === "string" && value.length > 500) {
    return `${value.slice(0, 500)}...[truncated]`;
  }
  return value;
}

function isValidationError(err) {
  return Boolean(
    err?.name === "ZodError" ||
      err?.name === "ValidationError" ||
      err?.isJoi === true ||
      err?.type === "entity.parse.failed" ||
      err?.type === "entity.verify.failed"
  );
}

function resolveStatus(err) {
  if (isValidationError(err)) return 400;

  const candidate = Number(err?.status || err?.statusCode);
  if (Number.isInteger(candidate) && candidate >= 400 && candidate <= 599) {
    return candidate;
  }

  if (err?.name === "SequelizeUniqueConstraintError") return 409;
  if (err?.name === "TokenExpiredError" || err?.name === "JsonWebTokenError") {
    return 401;
  }

  return 500;
}

function normalizeStatus(status) {
  if (ERROR_META[status]) return status;
  if (status === 422) return 400;
  if (status >= 500) return 500;
  if (status >= 400 && status < 500) return status;
  return 500;
}

function resolveErrorMeta(status) {
  if (ERROR_META[status]) return ERROR_META[status];
  if (status >= 500) return ERROR_META[500];
  return { code: "BAD_REQUEST", message: "Invalid request" };
}

export function toErrorEnvelope({ status, requestId }) {
  const normalizedStatus = normalizeStatus(status);
  const meta = resolveErrorMeta(normalizedStatus);

  return {
    status: normalizedStatus,
    body: {
      success: false,
      error: {
        code: meta.code,
        message: meta.message,
      },
      requestId,
    },
  };
}

function isAlreadyStandardizedError(payload) {
  return (
    isObject(payload) &&
    payload.success === false &&
    isObject(payload.error) &&
    typeof payload.error.code === "string" &&
    typeof payload.error.message === "string"
  );
}

export function standardizeErrorResponses(req, res, next) {
  const originalJson = res.json.bind(res);

  res.json = (payload) => {
    const status = Number(res.statusCode) || 200;
    if (status < 400) {
      return originalJson(payload);
    }

    if (isAlreadyStandardizedError(payload)) {
      const normalized = {
        success: false,
        error: {
          code: payload.error.code,
          message: payload.error.message,
        },
        requestId: req.requestId,
      };
      return originalJson(normalized);
    }

    const normalized = toErrorEnvelope({
      status,
      requestId: req.requestId,
    });
    res.status(normalized.status);
    return originalJson(normalized.body);
  };

  next();
}

export function notFoundHandler(req, _res, next) {
  next(new AppError(404, "NOT_FOUND", "Not found"));
}

export function errorHandler(err, req, res, _next) {
  const rawStatus = resolveStatus(err);
  const normalized = toErrorEnvelope({
    status: rawStatus,
    requestId: req.requestId,
  });
  const identity = getIdentityContext(req);

  const logPayload = {
    requestId: req.requestId,
    method: req.method,
    path: req.originalUrl || req.url,
    route: `${req.baseUrl || ""}${req.route?.path || ""}` || undefined,
    status: normalized.status,
    errorName: err?.name,
    errorMessage: err?.message,
    stack: err?.stack,
    errorCode: err?.code,
    appErrorStatus: err?.status,
    causeName: err?.cause?.name,
    causeMessage: err?.cause?.message,
    causeStack: err?.cause?.stack,
    userId: identity.userId,
    clientId: identity.clientId,
    tenantId: identity.tenantId,
    body: redactValue(req.body),
    headers: redactValue(req.headers),
  };

  if (normalized.status >= 500) {
    logger.error(logPayload, "Unhandled error");
  } else {
    logger.warn(logPayload, "Handled error");
  }

  return res.status(normalized.status).json(normalized.body);
}
