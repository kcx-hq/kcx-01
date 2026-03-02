import { decodeUser } from "../decodeUser.js";
import AppError from "../../errors/AppError.js";

const PUBLIC_ROUTE_RULES = [
  { method: "GET", pattern: /^\/healthz\/?$/i },
  { method: "GET", pattern: /^\/readyz\/?$/i },
  { method: "GET", pattern: /^\/api(?:\/v1)?\/inquiry\/slots\/by-date\/?$/i },
  { method: "POST", pattern: /^\/api(?:\/v1)?\/inquiry\/submit\/?$/i },
  { method: "GET", pattern: /^\/api(?:\/v1)?\/inquiry\/review\/[^/]+\/?$/i },
  { method: "POST", pattern: /^\/api(?:\/v1)?\/inquiry\/review\/[^/]+\/decision\/?$/i },
  { method: "POST", pattern: /^\/api(?:\/v1)?\/auth\/login\/?$/i },
  { method: "POST", pattern: /^\/api(?:\/v1)?\/auth\/signin\/?$/i },
  { method: "POST", pattern: /^\/api(?:\/v1)?\/auth\/signup\/?$/i },
  { method: "POST", pattern: /^\/api(?:\/v1)?\/auth\/verify\/?$/i },
  { method: "POST", pattern: /^\/api(?:\/v1)?\/auth\/verify-email\/?$/i },
  { method: "POST", pattern: /^\/api(?:\/v1)?\/auth\/reset\/?$/i },
  { method: "POST", pattern: /^\/api(?:\/v1)?\/auth\/forgot-password\/?$/i },
  { method: "POST", pattern: /^\/api(?:\/v1)?\/auth\/reset\/[^/]+\/?$/i },
  { method: "POST", pattern: /^\/api(?:\/v1)?\/auth\/reset-password\/[^/]+\/?$/i },
  { method: "POST", pattern: /^\/api(?:\/v1)?\/chatbot\/session\/?$/i },
  { method: "GET", pattern: /^\/api(?:\/v1)?\/chatbot\/session\/[^/]+\/?$/i },
  { method: "POST", pattern: /^\/api(?:\/v1)?\/chatbot\/message\/?$/i },
];

const INTERNAL_ROUTE_PATTERN =
  /^(?:\/internal|\/api(?:\/v1)?\/internal)(?:\/|$)/i;
const ADMIN_ROUTE_PATTERN = /^\/api(?:\/v1)?\/admin(?:\/|$)/i;
const INTERNAL_ALLOWED_ROLES = new Set(["admin", "system"]);

function normalizeRole(role) {
  return String(role || "").trim().toLowerCase();
}

function isPublicRoute(method, path) {
  return PUBLIC_ROUTE_RULES.some((rule) => {
    return rule.method === method && rule.pattern.test(path);
  });
}

export function defaultDenyAuth(req, res, next) {
  if (req.method === "OPTIONS") {
    return next();
  }

  // Admin APIs apply their own decodeAdmin/requireAdmin middleware and should not be gated by user-token middleware.
  if (ADMIN_ROUTE_PATTERN.test(req.path)) {
    return next();
  }

  if (isPublicRoute(req.method, req.path)) {
    return next();
  }

  return decodeUser(req, res, next);
}

export function requireInternalRole(req, res, next) {
  if (!INTERNAL_ROUTE_PATTERN.test(req.path)) {
    return next();
  }

  const role = normalizeRole(req.user?.role);
  if (!INTERNAL_ALLOWED_ROLES.has(role)) {
    return next(
      new AppError(
        403,
        "UNAUTHORIZED",
        "You do not have permission to perform this action"
      )
    );
  }

  return next();
}
