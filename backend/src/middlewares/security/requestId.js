import crypto from "crypto";

const REQUEST_ID_HEADER = "x-request-id";
const VALID_REQUEST_ID = /^[a-zA-Z0-9._-]{1,128}$/;

function resolveRequestId(headerValue) {
  const candidate = String(headerValue || "").trim();
  if (candidate && VALID_REQUEST_ID.test(candidate)) {
    return candidate;
  }
  return crypto.randomUUID();
}

export function attachRequestId(req, res, next) {
  const requestId = resolveRequestId(req.get(REQUEST_ID_HEADER));
  req.requestId = requestId;
  res.locals.requestId = requestId;
  res.setHeader(REQUEST_ID_HEADER, requestId);
  next();
}
